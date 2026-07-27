import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CommunicationAudience, CommunicationStatus, Role } from '@prisma/client';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import { MailService } from '../mail/mail.service';
import {
  CreateCommunicationDto,
  UpdateCommunicationDto,
} from './dto/communication.dto';

type RequestUser = { id: string; email: string; role: string };

/** Perfis que podem gerir todos os comunicados. */
const MANAGE_ALL_ROLES: string[] = [
  Role.ADMIN,
  Role.DIRECAO,
  Role.COORDENACAO,
  Role.COMUNICACAO,
];

const communicationInclude = {
  author: { select: { id: true, name: true, email: true } },
  unit: { select: { id: true, name: true } },
  service: { select: { id: true, name: true } },
  classGroup: {
    select: {
      id: true,
      name: true,
      room: {
        select: {
          name: true,
          unit: { select: { name: true } },
          service: { select: { name: true } },
        },
      },
      academicYear: { select: { label: true } },
    },
  },
  _count: { select: { reads: true } },
} as const;

@Injectable()
export class CommunicationsService {
  private readonly logger = new Logger(CommunicationsService.name);

  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private mail: MailService,
  ) {}

  private canManageAll(user: RequestUser) {
    return MANAGE_ALL_ROLES.includes(user.role);
  }

  /**
   * Resolve/valida os campos de segmentação com base no público-alvo,
   * limpando os que não se aplicam.
   */
  private async resolveAudience(
    audience: CommunicationAudience,
    dto: CreateCommunicationDto | UpdateCommunicationDto,
  ): Promise<{
    unitId: string | null;
    serviceId: string | null;
    classGroupId: string | null;
    targetUserId: string | null;
    targetGuardianEmail: string | null;
  }> {
    const cleared = {
      unitId: null as string | null,
      serviceId: null as string | null,
      classGroupId: null as string | null,
      targetUserId: null as string | null,
      targetGuardianEmail: null as string | null,
    };

    switch (audience) {
      case CommunicationAudience.ESCOLA:
        return cleared;
      case CommunicationAudience.UNIDADE: {
        if (!dto.unitId) {
          throw new BadRequestException('Seleccione a unidade de destino.');
        }
        const unit = await this.prisma.unit.findUnique({
          where: { id: dto.unitId },
        });
        if (!unit) throw new BadRequestException('Unidade inválida.');
        return { ...cleared, unitId: unit.id };
      }
      case CommunicationAudience.SERVICO: {
        if (!dto.serviceId) {
          throw new BadRequestException('Seleccione o serviço de destino.');
        }
        const service = await this.prisma.serviceOffering.findUnique({
          where: { id: dto.serviceId },
        });
        if (!service) throw new BadRequestException('Serviço inválido.');
        return { ...cleared, serviceId: service.id };
      }
      case CommunicationAudience.TURMA: {
        if (!dto.classGroupId) {
          throw new BadRequestException('Seleccione a turma de destino.');
        }
        const turma = await this.prisma.classGroup.findUnique({
          where: { id: dto.classGroupId },
        });
        if (!turma) throw new BadRequestException('Turma inválida.');
        return { ...cleared, classGroupId: turma.id };
      }
      case CommunicationAudience.ENCARREGADO: {
        const email = dto.targetGuardianEmail?.trim().toLowerCase() || null;
        let userId = dto.targetUserId || null;
        if (!email && !userId) {
          throw new BadRequestException(
            'Indique o encarregado de destino (email).',
          );
        }
        // Tenta associar a um utilizador existente pelo email.
        if (email && !userId) {
          const guardian = await this.prisma.user.findUnique({
            where: { email },
          });
          userId = guardian?.id || null;
        }
        return { ...cleared, targetUserId: userId, targetGuardianEmail: email };
      }
      default:
        return cleared;
    }
  }

  /** Lista comunicados para o staff (admin vê todos; professor vê os seus). */
  listForStaff(user: RequestUser) {
    const where: Prisma.CommunicationWhereInput = this.canManageAll(user)
      ? {}
      : { authorId: user.id };
    return this.prisma.communication.findMany({
      where,
      include: communicationInclude,
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async getForStaff(id: string, user: RequestUser) {
    const comm = await this.prisma.communication.findUnique({
      where: { id },
      include: communicationInclude,
    });
    if (!comm) throw new NotFoundException('Comunicado não encontrado.');
    this.assertCanManage(comm, user);
    return comm;
  }

  private assertCanManage(
    comm: { authorId: string | null },
    user: RequestUser,
  ) {
    if (this.canManageAll(user)) return;
    if (user.role === Role.PROFESSOR && comm.authorId === user.id) return;
    throw new ForbiddenException('Sem permissão para gerir este comunicado.');
  }

  async create(dto: CreateCommunicationDto, user: RequestUser) {
    const targeting = await this.resolveAudience(dto.audience, dto);
    const status = dto.status ?? CommunicationStatus.RASCUNHO;
    const created = await this.prisma.communication.create({
      data: {
        title: dto.title.trim(),
        body: dto.body.trim(),
        audience: dto.audience,
        status,
        authorId: user.id,
        attachmentUrl: dto.attachmentUrl?.trim() || null,
        publishedAt:
          status === CommunicationStatus.PUBLICADO ? new Date() : null,
        ...targeting,
      },
      include: communicationInclude,
    });
    if (status === CommunicationStatus.PUBLICADO && dto.sendEmail) {
      await this.sendEmailsForCommunication(created);
    }
    return created;
  }

  async update(id: string, dto: UpdateCommunicationDto, user: RequestUser) {
    const existing = await this.prisma.communication.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Comunicado não encontrado.');
    this.assertCanManage(existing, user);

    const audience = dto.audience ?? existing.audience;
    // Recalcula segmentação sempre que muda o público ou os alvos.
    const targeting = await this.resolveAudience(audience, {
      unitId: dto.unitId ?? existing.unitId ?? undefined,
      serviceId: dto.serviceId ?? existing.serviceId ?? undefined,
      classGroupId: dto.classGroupId ?? existing.classGroupId ?? undefined,
      targetUserId: dto.targetUserId ?? existing.targetUserId ?? undefined,
      targetGuardianEmail:
        dto.targetGuardianEmail ?? existing.targetGuardianEmail ?? undefined,
    } as UpdateCommunicationDto);

    const nextStatus = dto.status ?? existing.status;
    const wasPublished = existing.status === CommunicationStatus.PUBLICADO;
    const publishedAt =
      nextStatus === CommunicationStatus.PUBLICADO
        ? existing.publishedAt ?? new Date()
        : existing.status === CommunicationStatus.PUBLICADO
          ? null
          : existing.publishedAt;

    const updated = await this.prisma.communication.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.body !== undefined ? { body: dto.body.trim() } : {}),
        audience,
        status: nextStatus,
        publishedAt,
        ...(dto.attachmentUrl !== undefined
          ? { attachmentUrl: dto.attachmentUrl?.trim() || null }
          : {}),
        ...targeting,
      },
      include: communicationInclude,
    });

    if (
      dto.sendEmail &&
      nextStatus === CommunicationStatus.PUBLICADO &&
      !wasPublished
    ) {
      await this.sendEmailsForCommunication(updated);
    }

    return updated;
  }

  async setPublished(
    id: string,
    published: boolean,
    user: RequestUser,
    options?: { sendEmail?: boolean },
  ) {
    const existing = await this.prisma.communication.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Comunicado não encontrado.');
    this.assertCanManage(existing, user);
    const updated = await this.prisma.communication.update({
      where: { id },
      data: {
        status: published
          ? CommunicationStatus.PUBLICADO
          : CommunicationStatus.RASCUNHO,
        publishedAt: published ? existing.publishedAt ?? new Date() : null,
      },
      include: communicationInclude,
    });
    await this.audit.record({
      userId: user.id,
      action: published ? 'COMMUNICATION_PUBLISHED' : 'COMMUNICATION_UNPUBLISHED',
      entity: 'Communication',
      entityId: id,
      metadata: {
        title: existing.title,
        audience: existing.audience,
        sendEmail: !!options?.sendEmail,
      },
    });
    if (published && options?.sendEmail) {
      await this.sendEmailsForCommunication(updated);
    }
    return updated;
  }

  /**
   * Resolve emails dos encarregados-alvo e envia o comunicado.
   * Falhas SMTP são registadas e não revertem a publicação.
   */
  private async sendEmailsForCommunication(comm: {
    id: string;
    title: string;
    body: string;
    audience: CommunicationAudience;
    unitId: string | null;
    serviceId: string | null;
    classGroupId: string | null;
    targetUserId: string | null;
    targetGuardianEmail: string | null;
    unit?: { name: string } | null;
    service?: { name: string } | null;
    classGroup?: { name: string } | null;
  }) {
    try {
      const recipients = await this.resolveEmailRecipients(comm);
      if (recipients.length === 0) {
        this.logger.warn(
          `Comunicado ${comm.id}: sem destinatários de email para o público ${comm.audience}.`,
        );
        return { sent: 0, failed: 0 };
      }

      const audienceLabel = this.audienceLabel(comm);
      let sent = 0;
      let failed = 0;
      for (const r of recipients) {
        const result = await this.mail.sendCommunicationEmail({
          to: r.email,
          guardianName: r.name,
          title: comm.title,
          body: comm.body,
          audienceLabel,
        });
        if (result.queued) sent += 1;
        else failed += 1;
      }
      this.logger.log(
        `Comunicado ${comm.id}: email — ${sent} enviado(s), ${failed} falha(s)/ignorado(s).`,
      );
      return { sent, failed };
    } catch (error) {
      this.logger.error(
        `Comunicado ${comm.id}: falha ao preparar emails — ${
          error instanceof Error ? error.message : error
        }`,
      );
      return { sent: 0, failed: 0 };
    }
  }

  private audienceLabel(comm: {
    audience: CommunicationAudience;
    unit?: { name: string } | null;
    service?: { name: string } | null;
    classGroup?: { name: string } | null;
  }): string {
    switch (comm.audience) {
      case CommunicationAudience.ESCOLA:
        return 'Toda a escola';
      case CommunicationAudience.UNIDADE:
        return comm.unit?.name ? `Unidade ${comm.unit.name}` : 'Unidade';
      case CommunicationAudience.SERVICO:
        return comm.service?.name ? `Serviço ${comm.service.name}` : 'Serviço';
      case CommunicationAudience.TURMA:
        return comm.classGroup?.name
          ? `Turma ${comm.classGroup.name}`
          : 'Turma';
      case CommunicationAudience.ENCARREGADO:
        return 'Encarregado específico';
      default:
        return 'Comunicado';
    }
  }

  private async resolveEmailRecipients(comm: {
    audience: CommunicationAudience;
    unitId: string | null;
    serviceId: string | null;
    classGroupId: string | null;
    targetUserId: string | null;
    targetGuardianEmail: string | null;
  }): Promise<Array<{ email: string; name: string | null }>> {
    const map = new Map<string, string | null>();

    const addStudentEmails = (
      rows: Array<{
        guardianEmail: string;
        guardianFullName: string;
        guardianUser?: { email: string; name: string } | null;
      }>,
    ) => {
      for (const s of rows) {
        const email = (s.guardianUser?.email || s.guardianEmail || '')
          .trim()
          .toLowerCase();
        if (!email || !email.includes('@')) continue;
        if (!map.has(email)) {
          map.set(email, s.guardianUser?.name || s.guardianFullName || null);
        }
      }
    };

    switch (comm.audience) {
      case CommunicationAudience.ESCOLA: {
        const students = await this.prisma.student.findMany({
          select: {
            guardianEmail: true,
            guardianFullName: true,
            guardianUser: { select: { email: true, name: true } },
          },
        });
        addStudentEmails(students);
        break;
      }
      case CommunicationAudience.UNIDADE: {
        if (!comm.unitId) break;
        const students = await this.prisma.student.findMany({
          where: { unitId: comm.unitId },
          select: {
            guardianEmail: true,
            guardianFullName: true,
            guardianUser: { select: { email: true, name: true } },
          },
        });
        addStudentEmails(students);
        break;
      }
      case CommunicationAudience.SERVICO: {
        if (!comm.serviceId) break;
        const students = await this.prisma.student.findMany({
          where: { serviceId: comm.serviceId },
          select: {
            guardianEmail: true,
            guardianFullName: true,
            guardianUser: { select: { email: true, name: true } },
          },
        });
        addStudentEmails(students);
        break;
      }
      case CommunicationAudience.TURMA: {
        if (!comm.classGroupId) break;
        const turma = await this.prisma.classGroup.findUnique({
          where: { id: comm.classGroupId },
          select: { roomId: true, academicYearId: true },
        });
        if (!turma) break;
        const students = await this.prisma.student.findMany({
          where: {
            roomId: turma.roomId,
            academicYearId: turma.academicYearId,
          },
          select: {
            guardianEmail: true,
            guardianFullName: true,
            guardianUser: { select: { email: true, name: true } },
          },
        });
        addStudentEmails(students);
        break;
      }
      case CommunicationAudience.ENCARREGADO: {
        if (comm.targetUserId) {
          const user = await this.prisma.user.findUnique({
            where: { id: comm.targetUserId },
            select: { email: true, name: true },
          });
          if (user?.email) {
            map.set(user.email.toLowerCase(), user.name);
          }
        }
        if (comm.targetGuardianEmail) {
          const email = comm.targetGuardianEmail.trim().toLowerCase();
          if (email.includes('@') && !map.has(email)) {
            map.set(email, null);
          }
        }
        break;
      }
      default:
        break;
    }

    return [...map.entries()].map(([email, name]) => ({ email, name }));
  }

  async remove(id: string, user: RequestUser) {
    const existing = await this.prisma.communication.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Comunicado não encontrado.');
    this.assertCanManage(existing, user);
    await this.prisma.communication.delete({ where: { id } });
    return { ok: true, id };
  }

  /** Segmentos (unidades/serviços/turmas) do encarregado, via alunos. */
  private async guardianSegments(user: RequestUser) {
    const students = await this.prisma.student.findMany({
      where: {
        OR: [
          { guardianUserId: user.id },
          { guardianEmail: user.email.toLowerCase() },
        ],
      },
      select: {
        unitId: true,
        serviceId: true,
        roomId: true,
        academicYearId: true,
      },
    });

    const unitIds = new Set<string>();
    const serviceIds = new Set<string>();
    const roomYear: Array<{ roomId: string; academicYearId: string }> = [];
    for (const s of students) {
      if (s.unitId) unitIds.add(s.unitId);
      if (s.serviceId) serviceIds.add(s.serviceId);
      if (s.roomId && s.academicYearId) {
        roomYear.push({ roomId: s.roomId, academicYearId: s.academicYearId });
      }
    }

    let classGroupIds: string[] = [];
    if (roomYear.length > 0) {
      const classGroups = await this.prisma.classGroup.findMany({
        where: { OR: roomYear },
        select: { id: true },
      });
      classGroupIds = classGroups.map((c) => c.id);
    }

    return {
      unitIds: [...unitIds],
      serviceIds: [...serviceIds],
      classGroupIds,
    };
  }

  private async visibleWhereForGuardian(
    user: RequestUser,
  ): Promise<Prisma.CommunicationWhereInput> {
    const { unitIds, serviceIds, classGroupIds } =
      await this.guardianSegments(user);

    const or: Prisma.CommunicationWhereInput[] = [
      { audience: CommunicationAudience.ESCOLA },
      {
        audience: CommunicationAudience.ENCARREGADO,
        OR: [
          { targetUserId: user.id },
          { targetGuardianEmail: user.email.toLowerCase() },
        ],
      },
    ];
    if (unitIds.length) {
      or.push({ audience: CommunicationAudience.UNIDADE, unitId: { in: unitIds } });
    }
    if (serviceIds.length) {
      or.push({
        audience: CommunicationAudience.SERVICO,
        serviceId: { in: serviceIds },
      });
    }
    if (classGroupIds.length) {
      or.push({
        audience: CommunicationAudience.TURMA,
        classGroupId: { in: classGroupIds },
      });
    }

    return { status: CommunicationStatus.PUBLICADO, OR: or };
  }

  /** Comunicados publicados dirigidos ao encarregado, com estado de leitura. */
  async listForMe(user: RequestUser) {
    const where = await this.visibleWhereForGuardian(user);
    const rows = await this.prisma.communication.findMany({
      where,
      include: {
        ...communicationInclude,
        reads: { where: { userId: user.id }, select: { readAt: true } },
      },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map((row) => {
      const { reads, ...rest } = row;
      return { ...rest, readAt: reads[0]?.readAt ?? null };
    });
  }

  /** Marca um comunicado como lido pelo encarregado. */
  async markRead(id: string, user: RequestUser) {
    const where = await this.visibleWhereForGuardian(user);
    const visible = await this.prisma.communication.findFirst({
      where: { AND: [{ id }, where] },
      select: { id: true },
    });
    if (!visible) {
      throw new NotFoundException('Comunicado não encontrado.');
    }
    const read = await this.prisma.communicationRead.upsert({
      where: {
        communicationId_userId: { communicationId: id, userId: user.id },
      },
      update: {},
      create: { communicationId: id, userId: user.id },
    });
    return { ok: true, id, readAt: read.readAt };
  }
}
