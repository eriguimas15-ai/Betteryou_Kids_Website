import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EnrollmentStatus, Role, WaitlistStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RoomsService } from '../rooms/rooms.service';
import { MailService } from '../mail/mail.service';
import { StudentsService } from '../students/students.service';
import { SettingsService } from '../settings/settings.service';
import { AuditService } from '../common/audit/audit.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import {
  assertSharedFormComplete,
  primaryPersonFields,
} from '../common/person-form';
import { unitNameCandidates } from '../units/units.service';

type RequestUser = { id: string; email: string; role: string };

@Injectable()
export class EnrollmentsService {
  constructor(
    private prisma: PrismaService,
    private rooms: RoomsService,
    private mail: MailService,
    private students: StudentsService,
    private settings: SettingsService,
    private audit: AuditService,
  ) {}

  async create(dto: CreateEnrollmentDto) {
    assertSharedFormComplete(dto);
    const person = primaryPersonFields(dto);

    const year = await this.prisma.academicYear.findUnique({
      where: { label: dto.yearLabel },
    });
    if (!year) throw new BadRequestException('Ano letivo inválido');

    const unit = await this.prisma.unit.findFirst({
      where: {
        active: true,
        name: { in: unitNameCandidates(dto.unitName) },
      },
    });
    if (!unit) {
      throw new BadRequestException('Unidade inválida');
    }

    const service = await this.prisma.serviceOffering.findUnique({
      where: { name: dto.serviceName },
    });
    if (!service || !service.active) {
      throw new BadRequestException('Serviço inválido');
    }

    const unitService = await this.prisma.unitService.findUnique({
      where: {
        unitId_serviceId: { unitId: unit.id, serviceId: service.id },
      },
    });
    if (!unitService?.active) {
      throw new BadRequestException(
        'Este serviço não está disponível nesta unidade',
      );
    }

    const birthDate = new Date(dto.childBirthDate);
    const personData = {
      childFullName: dto.childFullName.trim(),
      childBirthDate: birthDate,
      childSex: dto.childSex,
      childBirthPlace: dto.childBirthPlace?.trim() || null,
      childNationality: dto.childNationality.trim(),
      childAddress: dto.childAddress?.trim() || null,
      ...person.flat,
      guardians: person.guardians,
      emergencyContacts: person.emergencies,
      activities: person.activities,
    };

    // Sem sala escolhida → lista de espera directa
    if (!dto.roomId) {
      const enrollment = await this.prisma.enrollment.create({
        data: {
          roomId: null,
          academicYearId: year.id,
          unitId: unit.id,
          serviceId: service.id,
          ...personData,
          status: EnrollmentStatus.LISTA_ESPERA,
        },
      });

      await this.prisma.waitlistEntry.create({
        data: {
          enrollmentId: enrollment.id,
          roomId: null,
          academicYearId: year.id,
          status: WaitlistStatus.AGUARDAR,
        },
      });

      await this.mail.sendEnrollmentReceived({
        to: person.flat.guardianEmail,
        guardianName: person.flat.guardianFullName,
        childName: dto.childFullName,
        unitName: unit.name,
        serviceName: service.name,
        roomName: undefined,
        yearLabel: year.label,
        statusLabel: 'Lista de espera (sem sala disponível)',
        vacanciesNote: 'Não há salas disponíveis para esta selecção.',
        summaryLines: this.summaryLines(dto, person),
      });

      return {
        id: enrollment.id,
        estado: 'lista_espera' as const,
        status: EnrollmentStatus.LISTA_ESPERA,
        vagas_disponiveis: 0,
        message:
          'Não existem salas disponíveis. A candidatura foi adicionada à lista de espera. Enviámos um email com o estado.',
      };
    }

    const room = await this.rooms.assertRoomForEnrollment(
      dto.roomId,
      unit.id,
      service.id,
      year.id,
      birthDate,
    );

    const result = await this.prisma.$transaction(async (tx) => {
      const locked = await tx.room.findUnique({ where: { id: room.id } });
      if (!locked) throw new BadRequestException('Sala inválida');

      const vacancies = this.rooms.calcVacancies(locked);
      const status =
        vacancies > 0
          ? EnrollmentStatus.PENDENTE_VALIDACAO
          : EnrollmentStatus.LISTA_ESPERA;

      const enrollment = await tx.enrollment.create({
        data: {
          roomId: locked.id,
          academicYearId: year.id,
          unitId: unit.id,
          serviceId: service.id,
          ...personData,
          status,
        },
      });

      if (status === EnrollmentStatus.PENDENTE_VALIDACAO) {
        await tx.room.update({
          where: { id: locked.id },
          data: { enrollmentReserved: { increment: 1 } },
        });
      }

      if (status === EnrollmentStatus.LISTA_ESPERA) {
        await tx.waitlistEntry.create({
          data: {
            enrollmentId: enrollment.id,
            roomId: locked.id,
            academicYearId: year.id,
            status: WaitlistStatus.AGUARDAR,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          action: 'ENROLLMENT_CREATED',
          entity: 'Enrollment',
          entityId: enrollment.id,
          metadata: {
            status,
            unit: unit.name,
            service: service.name,
            year: year.label,
            room: locked.name,
          },
        },
      });

      return {
        id: enrollment.id,
        estado:
          status === EnrollmentStatus.PENDENTE_VALIDACAO
            ? ('pendente_validacao' as const)
            : ('lista_espera' as const),
        status,
        vagas_disponiveis: Math.max(
          0,
          vacancies - (status === EnrollmentStatus.PENDENTE_VALIDACAO ? 1 : 0),
        ),
        room: {
          id: locked.id,
          name: locked.name,
          capacity: locked.capacity,
          levelLabel: locked.levelLabel,
          ageLabel: locked.ageLabel,
        },
        message:
          status === EnrollmentStatus.PENDENTE_VALIDACAO
            ? 'Candidatura registada. A vaga ficou reservada para validação. Enviámos um email de confirmação.'
            : 'Não existem vagas disponíveis nesta sala. A candidatura foi adicionada automaticamente à lista de espera. Enviámos um email com o estado.',
        enrollment,
        locked,
      };
    });

    const statusLabel =
      result.estado === 'pendente_validacao'
        ? 'Vaga reservada — pendente de validação'
        : 'Lista de espera (sem vaga disponível)';

    await this.mail.sendEnrollmentReceived({
      to: person.flat.guardianEmail,
      guardianName: person.flat.guardianFullName,
      childName: dto.childFullName,
      unitName: unit.name,
      serviceName: service.name,
      roomName: result.room.name,
      yearLabel: year.label,
      statusLabel,
      vacanciesNote:
        result.estado === 'lista_espera'
          ? 'Neste momento a sala seleccionada não tem vagas.'
          : `Vagas restantes após reserva: ${result.vagas_disponiveis}.`,
      summaryLines: this.summaryLines(dto, person),
    });

    const { enrollment: _e, locked: _l, ...publicResult } = result;
    return publicResult;
  }

  private summaryLines(
    dto: CreateEnrollmentDto,
    person: ReturnType<typeof primaryPersonFields>,
  ) {
    return [
      `Telefone: ${person.flat.guardianPhone}`,
      `Email: ${person.flat.guardianEmail}`,
      `Parentesco: ${person.flat.guardianRelationship}`,
      `Data de nascimento: ${dto.childBirthDate}`,
      `Sexo: ${dto.childSex}`,
      `Nacionalidade: ${dto.childNationality}`,
      `Encarregados: ${person.guardians.length}`,
      `Contactos de emergência: ${person.emergencies.length}`,
      person.activities.length
        ? `Actividades: ${person.activities.join(', ')}`
        : 'Actividades: nenhuma',
    ];
  }

  findAll(status?: EnrollmentStatus) {
    return this.prisma.enrollment.findMany({
      where: status ? { status } : undefined,
      include: {
        unit: true,
        service: true,
        academicYear: true,
        room: true,
        waitlistEntry: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Inscrições do encarregado autenticado (por email do guardião). */
  listMine(user: { id: string; email: string; role: string }) {
    return this.prisma.enrollment.findMany({
      where: { guardianEmail: user.email.toLowerCase() },
      include: {
        unit: true,
        service: true,
        academicYear: true,
        room: true,
        waitlistEntry: true,
        documents: {
          select: {
            id: true,
            type: true,
            fileName: true,
            filePath: true,
            mimeType: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        student: {
          select: { id: true, profileStatus: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: {
        unit: true,
        service: true,
        academicYear: true,
        room: true,
        waitlistEntry: true,
        documents: true,
      },
    });
    if (!enrollment) throw new NotFoundException('Inscrição não encontrada');
    return enrollment;
  }

  listWaitlist() {
    return this.prisma.waitlistEntry.findMany({
      where: {
        status: {
          in: [
            WaitlistStatus.AGUARDAR,
            WaitlistStatus.NOTIFICADO,
            WaitlistStatus.EXPIRADO,
          ],
        },
      },
      include: {
        enrollment: {
          include: { unit: true, service: true },
        },
        room: true,
        academicYear: true,
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  }

  /**
   * Notifica candidato: reserva vaga (enrollmentReserved++), define prazo
   * configurável (waitlistResponseHours), passa inscrição para
   * PENDENTE_VALIDACAO e envia email.
   */
  async notifyWaitlist(id: string) {
    const entry = await this.prisma.waitlistEntry.findUnique({
      where: { id },
      include: {
        enrollment: {
          include: { unit: true, service: true },
        },
        room: true,
      },
    });
    if (!entry) throw new NotFoundException('Entrada não encontrada');

    if (entry.status === WaitlistStatus.NOTIFICADO) {
      throw new BadRequestException(
        'Esta candidatura já foi notificada e tem uma vaga reservada.',
      );
    }
    if (entry.status !== WaitlistStatus.AGUARDAR) {
      throw new BadRequestException(
        'Só é possível notificar candidaturas a aguardar na lista de espera.',
      );
    }
    if (!entry.roomId) {
      throw new BadRequestException(
        'Atribua uma sala à candidatura antes de notificar e reservar a vaga.',
      );
    }

    const responseHours = await this.settings.getWaitlistResponseHours();
    const deadlineEnabled = await this.settings.isWaitlistDeadlineEnabled();
    const deadline = deadlineEnabled
      ? new Date(Date.now() + responseHours * 60 * 60 * 1000)
      : null;

    const updated = await this.prisma.$transaction(async (tx) => {
      const locked = await tx.room.findUnique({ where: { id: entry.roomId! } });
      if (!locked) {
        throw new BadRequestException('Sala inválida');
      }
      if (this.rooms.calcVacancies(locked) <= 0) {
        throw new BadRequestException(
          'Não há vagas disponíveis nesta sala para reservar.',
        );
      }

      await tx.room.update({
        where: { id: locked.id },
        data: { enrollmentReserved: { increment: 1 } },
      });

      await tx.enrollment.update({
        where: { id: entry.enrollmentId },
        data: { status: EnrollmentStatus.PENDENTE_VALIDACAO },
      });

      const waitlist = await tx.waitlistEntry.update({
        where: { id },
        data: {
          status: WaitlistStatus.NOTIFICADO,
          notifiedAt: new Date(),
          responseDeadline: deadline,
        },
        include: {
          enrollment: {
            include: { unit: true, service: true },
          },
          room: true,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'WAITLIST_NOTIFIED',
          entity: 'WaitlistEntry',
          entityId: id,
          metadata: {
            roomId: locked.id,
            enrollmentId: entry.enrollmentId,
            responseDeadline: deadline ? deadline.toISOString() : null,
            responseHours,
            deadlineEnabled,
            reserved: true,
          },
        },
      });

      return waitlist;
    });

    await this.mail.sendWaitlistNotified({
      to: updated.enrollment.guardianEmail,
      guardianName: updated.enrollment.guardianFullName,
      childName: updated.enrollment.childFullName,
      unitName: updated.enrollment.unit.name,
      serviceName: updated.enrollment.service.name,
      roomName: updated.room?.name,
      deadline: deadline ? deadline.toLocaleString('pt-PT') : null,
      responseHours,
    });

    return updated;
  }

  /**
   * Processa prazos de resposta expirados: liberta reserva,
   * marca EXPIRADO/EXPIRADA e avança o próximo candidato elegível na sala.
   * Destinado a cron / chamada manual admin.
   */
  async processExpiredWaitlist() {
    const deadlineEnabled = await this.settings.isWaitlistDeadlineEnabled();
    if (!deadlineEnabled) {
      return {
        processed: 0,
        results: [],
        message:
          'O prazo de resposta está desactivado — as reservas não expiram automaticamente.',
      };
    }

    const now = new Date();
    const expired = await this.prisma.waitlistEntry.findMany({
      where: {
        status: WaitlistStatus.NOTIFICADO,
        responseDeadline: { lt: now },
      },
      include: {
        enrollment: {
          include: { unit: true, service: true, academicYear: true },
        },
        room: true,
      },
      orderBy: { responseDeadline: 'asc' },
    });

    const results: Array<{
      waitlistId: string;
      enrollmentId: string;
      roomId: string | null;
      advancedToId: string | null;
      advancedError?: string;
    }> = [];

    for (const entry of expired) {
      const roomId = entry.roomId;
      const didExpire = await this.prisma.$transaction(async (tx) => {
        const current = await tx.waitlistEntry.findUnique({
          where: { id: entry.id },
          include: { enrollment: true },
        });
        if (
          !current ||
          current.status !== WaitlistStatus.NOTIFICADO ||
          !current.responseDeadline ||
          current.responseDeadline >= now
        ) {
          return false;
        }

        const heldSeat =
          current.enrollment.status === EnrollmentStatus.PENDENTE_VALIDACAO &&
          !!current.roomId;

        if (heldSeat && current.roomId) {
          await tx.room.update({
            where: { id: current.roomId },
            data: { enrollmentReserved: { decrement: 1 } },
          });
        }

        await tx.waitlistEntry.update({
          where: { id: current.id },
          data: { status: WaitlistStatus.EXPIRADO },
        });

        await tx.enrollment.update({
          where: { id: current.enrollmentId },
          data: { status: EnrollmentStatus.EXPIRADA },
        });

        await tx.auditLog.create({
          data: {
            action: 'WAITLIST_EXPIRED',
            entity: 'WaitlistEntry',
            entityId: current.id,
            metadata: {
              enrollmentId: current.enrollmentId,
              roomId: current.roomId,
              releasedReservation: heldSeat,
            },
          },
        });

        return true;
      });

      if (!didExpire) continue;

      await this.mail.sendWaitlistExpired({
        to: entry.enrollment.guardianEmail,
        guardianName: entry.enrollment.guardianFullName,
        childName: entry.enrollment.childFullName,
        unitName: entry.enrollment.unit.name,
        serviceName: entry.enrollment.service.name,
        roomName: entry.room?.name,
        responseHours:
          entry.notifiedAt && entry.responseDeadline
            ? Math.max(
                1,
                Math.round(
                  (entry.responseDeadline.getTime() -
                    entry.notifiedAt.getTime()) /
                    (60 * 60 * 1000),
                ),
              )
            : undefined,
      });

      let advancedToId: string | null = null;
      let advancedError: string | undefined;

      if (roomId) {
        const next = await this.prisma.waitlistEntry.findFirst({
          where: {
            roomId,
            status: WaitlistStatus.AGUARDAR,
          },
          orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
        });
        if (next) {
          try {
            await this.notifyWaitlist(next.id);
            advancedToId = next.id;
          } catch (error) {
            advancedError =
              error instanceof Error
                ? error.message
                : 'Não foi possível avançar o próximo candidato.';
          }
        }
      }

      results.push({
        waitlistId: entry.id,
        enrollmentId: entry.enrollmentId,
        roomId,
        advancedToId,
        advancedError,
      });
    }

    return {
      processed: results.length,
      results,
      message:
        results.length === 0
          ? 'Não há prazos expirados para processar.'
          : `Processados ${results.length} prazo(s) expirado(s).`,
    };
  }

  async confirm(id: string, user?: RequestUser) {
    const enrollment = await this.findOne(id);
    if (enrollment.status === EnrollmentStatus.CONFIRMADA) {
      return enrollment;
    }
    if (enrollment.status === EnrollmentStatus.EXPIRADA) {
      throw new BadRequestException(
        'Esta inscrição expirou. Não é possível confirmar.',
      );
    }

    const waitlist = enrollment.waitlistEntry;
    const deadlineEnabled = await this.settings.isWaitlistDeadlineEnabled();
    if (
      deadlineEnabled &&
      waitlist?.status === WaitlistStatus.NOTIFICADO &&
      waitlist.responseDeadline &&
      waitlist.responseDeadline < new Date()
    ) {
      const hours = await this.settings.getWaitlistResponseHours();
      throw new BadRequestException(
        `O prazo de resposta de ${hours}h expirou. Processe os prazos expirados para libertar a vaga.`,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (
        enrollment.status === EnrollmentStatus.PENDENTE_VALIDACAO &&
        enrollment.roomId
      ) {
        await tx.room.update({
          where: { id: enrollment.roomId },
          data: {
            enrollmentReserved: { decrement: 1 },
            enrolledCount: { increment: 1 },
          },
        });
        if (waitlist) {
          await tx.waitlistEntry.update({
            where: { id: waitlist.id },
            data: { status: WaitlistStatus.CONFIRMADO },
          });
        }
      } else if (
        enrollment.status === EnrollmentStatus.LISTA_ESPERA &&
        enrollment.roomId
      ) {
        const room = await tx.room.findUnique({
          where: { id: enrollment.roomId },
        });
        if (!room || this.rooms.calcVacancies(room) <= 0) {
          throw new BadRequestException(
            'Não há vagas nesta sala para confirmar a inscrição',
          );
        }
        await tx.room.update({
          where: { id: enrollment.roomId },
          data: { enrolledCount: { increment: 1 } },
        });
        if (waitlist) {
          await tx.waitlistEntry.update({
            where: { id: waitlist.id },
            data: { status: WaitlistStatus.CONFIRMADO },
          });
        }
      } else if (waitlist) {
        await tx.waitlistEntry.update({
          where: { id: waitlist.id },
          data: { status: WaitlistStatus.CONFIRMADO },
        });
      }

      return tx.enrollment.update({
        where: { id },
        data: { status: EnrollmentStatus.CONFIRMADA },
        include: {
          unit: true,
          service: true,
          academicYear: true,
          room: true,
        },
      });
    });

    await this.mail.sendEnrollmentDecided({
      to: updated.guardianEmail,
      guardianName: updated.guardianFullName,
      childName: updated.childFullName,
      unitName: updated.unit.name,
      serviceName: updated.service.name,
      roomName: updated.room?.name,
      yearLabel: updated.academicYear.label,
      statusLabel: 'Confirmada',
      vacanciesNote: '',
      summaryLines: [],
      decision:
        'Inscrição confirmada / matrícula aceite. Complete a ficha do aluno na plataforma.',
    });

    await this.students.createFromEnrollment(updated.id);

    await this.audit.record({
      userId: user?.id,
      action: 'ENROLLMENT_CONFIRMED',
      entity: 'Enrollment',
      entityId: id,
      metadata: {
        childFullName: updated.childFullName,
        unit: updated.unit.name,
        service: updated.service.name,
      },
    });

    return updated;
  }

  async reject(id: string, user?: RequestUser) {
    const enrollment = await this.findOne(id);
    if (enrollment.status === EnrollmentStatus.CANCELADA) {
      return enrollment;
    }

    const roomIdForAdvance =
      enrollment.waitlistEntry?.status === WaitlistStatus.NOTIFICADO
        ? enrollment.roomId
        : null;

    const updated = await this.prisma.$transaction(async (tx) => {
      if (
        enrollment.status === EnrollmentStatus.PENDENTE_VALIDACAO &&
        enrollment.roomId
      ) {
        await tx.room.update({
          where: { id: enrollment.roomId },
          data: { enrollmentReserved: { decrement: 1 } },
        });
      }
      if (enrollment.waitlistEntry) {
        await tx.waitlistEntry.update({
          where: { id: enrollment.waitlistEntry.id },
          data: { status: WaitlistStatus.CANCELADO },
        });
      }
      return tx.enrollment.update({
        where: { id },
        data: { status: EnrollmentStatus.CANCELADA },
        include: {
          unit: true,
          service: true,
          academicYear: true,
          room: true,
        },
      });
    });

    await this.mail.sendEnrollmentDecided({
      to: updated.guardianEmail,
      guardianName: updated.guardianFullName,
      childName: updated.childFullName,
      unitName: updated.unit.name,
      serviceName: updated.service.name,
      roomName: updated.room?.name,
      yearLabel: updated.academicYear.label,
      statusLabel: 'Cancelada',
      vacanciesNote: '',
      summaryLines: [],
      decision: 'Inscrição não aceite / cancelada pela gestão',
    });

    // Rejeição de vaga reservada via lista de espera → avançar próximo
    if (roomIdForAdvance) {
      const next = await this.prisma.waitlistEntry.findFirst({
        where: {
          roomId: roomIdForAdvance,
          status: WaitlistStatus.AGUARDAR,
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      });
      if (next) {
        try {
          await this.notifyWaitlist(next.id);
        } catch {
          // Sem vaga ou erro — próximo permanece a aguardar
        }
      }
    }

    await this.audit.record({
      userId: user?.id,
      action: 'ENROLLMENT_REJECTED',
      entity: 'Enrollment',
      entityId: id,
      metadata: {
        childFullName: updated.childFullName,
        unit: updated.unit.name,
        service: updated.service.name,
      },
    });

    return updated;
  }

  async remove(id: string) {
    const enrollment = await this.findOne(id);

    await this.prisma.$transaction(async (tx) => {
      if (
        enrollment.status === EnrollmentStatus.PENDENTE_VALIDACAO &&
        enrollment.roomId
      ) {
        await tx.room.update({
          where: { id: enrollment.roomId },
          data: { enrollmentReserved: { decrement: 1 } },
        });
      }
      if (
        enrollment.status === EnrollmentStatus.CONFIRMADA &&
        enrollment.roomId
      ) {
        await tx.room.update({
          where: { id: enrollment.roomId },
          data: { enrolledCount: { decrement: 1 } },
        });
      }
      if (enrollment.waitlistEntry) {
        await tx.waitlistEntry.delete({
          where: { id: enrollment.waitlistEntry.id },
        });
      }
      await tx.enrollmentDocument.deleteMany({
        where: { enrollmentId: id },
      });
      await tx.enrollment.delete({ where: { id } });
    });

    return { ok: true, id };
  }

  listDocuments(enrollmentId: string) {
    return this.prisma.enrollmentDocument.findMany({
      where: { enrollmentId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listDocumentsForUser(
    enrollmentId: string,
    user: { id: string; email: string; role: string },
  ) {
    await this.assertCanAccessEnrollment(enrollmentId, user);
    return this.listDocuments(enrollmentId);
  }

  async findOneForUser(
    id: string,
    user: { id: string; email: string; role: string },
  ) {
    const enrollment = await this.findOne(id);
    this.assertEnrollmentOwnership(enrollment, user);
    return enrollment;
  }

  private isStaff(role: string) {
    return (
      role === Role.ADMIN ||
      role === Role.DIRECAO ||
      role === Role.COORDENACAO ||
      role === Role.COMUNICACAO
    );
  }

  private assertEnrollmentOwnership(
    enrollment: { guardianEmail: string },
    user: { email: string; role: string },
  ) {
    if (this.isStaff(user.role)) return;
    if (enrollment.guardianEmail.toLowerCase() !== user.email.toLowerCase()) {
      throw new ForbiddenException('Sem acesso a esta inscrição');
    }
  }

  private async assertCanAccessEnrollment(
    enrollmentId: string,
    user: { email: string; role: string },
  ) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: { id: true, guardianEmail: true },
    });
    if (!enrollment) throw new NotFoundException('Inscrição não encontrada');
    this.assertEnrollmentOwnership(enrollment, user);
    return enrollment;
  }

  async addDocument(
    enrollmentId: string,
    file: Express.Multer.File,
    type: string,
  ) {
    await this.findOne(enrollmentId);
    if (!file) throw new BadRequestException('Ficheiro em falta');

    return this.prisma.enrollmentDocument.create({
      data: {
        enrollmentId,
        type: (type || 'outro').trim() || 'outro',
        fileName: file.originalname,
        filePath: file.path.replace(/\\/g, '/'),
        mimeType: file.mimetype,
      },
    });
  }

  async removeDocument(enrollmentId: string, documentId: string) {
    const doc = await this.prisma.enrollmentDocument.findFirst({
      where: { id: documentId, enrollmentId },
    });
    if (!doc) throw new NotFoundException('Documento não encontrado');
    await this.prisma.enrollmentDocument.delete({ where: { id: documentId } });
    return { ok: true };
  }
}
