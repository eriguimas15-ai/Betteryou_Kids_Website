import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AssessmentGradeType,
  Prisma,
  ReportCardStatus,
  Role,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { BoletimPdfService } from './boletim-pdf.service';
import {
  CreateAssessmentPeriodDto,
  GenerateReportCardsDto,
  UpdateAssessmentPeriodDto,
  UpdateReportCardDto,
} from './dto/periodos-boletins.dto';

type RequestUser = { id: string; email: string; role: string };

const STAFF_ROLES: string[] = [
  Role.ADMIN,
  Role.DIRECAO,
  Role.COORDENACAO,
  Role.PROFESSOR,
];

function parseDateOnly(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) throw new BadRequestException('Data inválida');
  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('Data inválida');
  }
  return date;
}

const periodInclude = {
  academicYear: { select: { id: true, label: true, active: true } },
  unit: { select: { id: true, name: true } },
  _count: { select: { assessments: true, reportCards: true } },
} as const;

const reportCardInclude = {
  student: {
    select: {
      id: true,
      childFullName: true,
      guardianFullName: true,
      guardianEmail: true,
      guardianUserId: true,
      unit: { select: { id: true, name: true } },
      service: { select: { id: true, name: true } },
      room: { select: { id: true, name: true } },
      academicYear: { select: { id: true, label: true } },
    },
  },
  period: {
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      academicYear: { select: { id: true, label: true } },
      unit: { select: { id: true, name: true } },
    },
  },
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
  author: { select: { id: true, name: true } },
  lines: {
    orderBy: [{ sortOrder: 'asc' as const }, { subject: 'asc' as const }],
  },
} satisfies Prisma.ReportCardInclude;

@Injectable()
export class PeriodosBoletinsService {
  private readonly logger = new Logger(PeriodosBoletinsService.name);

  constructor(
    private prisma: PrismaService,
    private mail: MailService,
    private config: ConfigService,
    private boletimPdf: BoletimPdfService,
  ) {}

  private assertStaff(user: RequestUser) {
    if (!STAFF_ROLES.includes(user.role)) {
      throw new ForbiddenException('Sem permissão.');
    }
  }

  private assertCanAccessStudent(
    student: { guardianUserId: string | null; guardianEmail: string },
    user: RequestUser,
  ) {
    if (STAFF_ROLES.includes(user.role)) return;
    const emailMatch =
      student.guardianEmail.toLowerCase() === user.email.toLowerCase();
    const userMatch = student.guardianUserId === user.id;
    if (!emailMatch && !userMatch) {
      throw new ForbiddenException('Sem acesso aos dados deste aluno');
    }
  }

  // --------------------------- Períodos ---------------------------

  listPeriods(filters?: {
    academicYearId?: string;
    unitId?: string;
  }) {
    const where: Prisma.AssessmentPeriodWhereInput = {};
    if (filters?.academicYearId) where.academicYearId = filters.academicYearId;
    if (filters?.unitId) {
      where.OR = [{ unitId: filters.unitId }, { unitId: null }];
    }
    return this.prisma.assessmentPeriod.findMany({
      where,
      include: periodInclude,
      orderBy: [
        { academicYearId: 'desc' },
        { sortOrder: 'asc' },
        { startDate: 'asc' },
      ],
    });
  }

  async getPeriod(id: string) {
    const period = await this.prisma.assessmentPeriod.findUnique({
      where: { id },
      include: periodInclude,
    });
    if (!period) throw new NotFoundException('Período não encontrado.');
    return period;
  }

  async createPeriod(dto: CreateAssessmentPeriodDto) {
    const year = await this.prisma.academicYear.findUnique({
      where: { id: dto.academicYearId },
    });
    if (!year) throw new BadRequestException('Ano lectivo inválido.');
    if (dto.unitId) {
      const unit = await this.prisma.unit.findUnique({
        where: { id: dto.unitId },
      });
      if (!unit) throw new BadRequestException('Unidade inválida.');
    }
    const startDate = parseDateOnly(dto.startDate);
    const endDate = parseDateOnly(dto.endDate);
    if (endDate < startDate) {
      throw new BadRequestException(
        'A data de fim deve ser igual ou posterior à de início.',
      );
    }
    return this.prisma.assessmentPeriod.create({
      data: {
        name: dto.name.trim(),
        academicYearId: dto.academicYearId,
        unitId: dto.unitId?.trim() || null,
        startDate,
        endDate,
        sortOrder: dto.sortOrder ?? 0,
      },
      include: periodInclude,
    });
  }

  async updatePeriod(id: string, dto: UpdateAssessmentPeriodDto) {
    const existing = await this.prisma.assessmentPeriod.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Período não encontrado.');
    if (dto.academicYearId) {
      const year = await this.prisma.academicYear.findUnique({
        where: { id: dto.academicYearId },
      });
      if (!year) throw new BadRequestException('Ano lectivo inválido.');
    }
    if (dto.unitId) {
      const unit = await this.prisma.unit.findUnique({
        where: { id: dto.unitId },
      });
      if (!unit) throw new BadRequestException('Unidade inválida.');
    }
    const startDate =
      dto.startDate !== undefined
        ? parseDateOnly(dto.startDate)
        : existing.startDate;
    const endDate =
      dto.endDate !== undefined ? parseDateOnly(dto.endDate) : existing.endDate;
    if (endDate < startDate) {
      throw new BadRequestException(
        'A data de fim deve ser igual ou posterior à de início.',
      );
    }
    return this.prisma.assessmentPeriod.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.academicYearId !== undefined
          ? { academicYearId: dto.academicYearId }
          : {}),
        ...(dto.unitId !== undefined
          ? { unitId: dto.unitId?.trim() || null }
          : {}),
        ...(dto.startDate !== undefined ? { startDate } : {}),
        ...(dto.endDate !== undefined ? { endDate } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
      include: periodInclude,
    });
  }

  async removePeriod(id: string) {
    const existing = await this.prisma.assessmentPeriod.findUnique({
      where: { id },
      include: { _count: { select: { reportCards: true } } },
    });
    if (!existing) throw new NotFoundException('Período não encontrado.');
    if (existing._count.reportCards > 0) {
      throw new BadRequestException(
        'Não é possível remover um período com boletins associados.',
      );
    }
    await this.prisma.assessmentPeriod.delete({ where: { id } });
    return { ok: true, id };
  }

  // --------------------------- Boletins ---------------------------

  listReportCards(filters?: {
    periodId?: string;
    classGroupId?: string;
    studentId?: string;
    status?: ReportCardStatus;
  }) {
    const where: Prisma.ReportCardWhereInput = {};
    if (filters?.periodId) where.periodId = filters.periodId;
    if (filters?.classGroupId) where.classGroupId = filters.classGroupId;
    if (filters?.studentId) where.studentId = filters.studentId;
    if (filters?.status) where.status = filters.status;
    return this.prisma.reportCard.findMany({
      where,
      include: reportCardInclude,
      orderBy: [{ updatedAt: 'desc' }],
    });
  }

  async getReportCard(id: string) {
    const card = await this.prisma.reportCard.findUnique({
      where: { id },
      include: reportCardInclude,
    });
    if (!card) throw new NotFoundException('Boletim não encontrado.');
    return card;
  }

  async generateReportCards(dto: GenerateReportCardsDto, user: RequestUser) {
    this.assertStaff(user);
    const period = await this.prisma.assessmentPeriod.findUnique({
      where: { id: dto.periodId },
    });
    if (!period) throw new BadRequestException('Período inválido.');

    const turma = await this.prisma.classGroup.findUnique({
      where: { id: dto.classGroupId },
      include: { room: true },
    });
    if (!turma) throw new BadRequestException('Turma inválida.');
    if (turma.academicYearId !== period.academicYearId) {
      throw new BadRequestException(
        'A turma e o período pertencem a anos lectivos diferentes.',
      );
    }
    if (period.unitId && turma.room.unitId !== period.unitId) {
      throw new BadRequestException(
        'A turma não pertence à unidade deste período.',
      );
    }

    const students = await this.prisma.student.findMany({
      where: {
        roomId: turma.roomId,
        academicYearId: turma.academicYearId,
      },
      orderBy: { childFullName: 'asc' },
    });

    const created: string[] = [];
    const updated: string[] = [];
    const skipped: string[] = [];

    for (const student of students) {
      const existing = await this.prisma.reportCard.findUnique({
        where: {
          studentId_periodId_classGroupId: {
            studentId: student.id,
            periodId: period.id,
            classGroupId: turma.id,
          },
        },
      });

      if (existing?.status === ReportCardStatus.PUBLICADO) {
        skipped.push(student.id);
        continue;
      }
      if (existing && !dto.overwriteDraft) {
        skipped.push(student.id);
        continue;
      }

      const lines = await this.buildLinesForStudent(
        student.id,
        period,
        turma.id,
      );

      if (existing) {
        await this.prisma.reportCardLine.deleteMany({
          where: { reportCardId: existing.id },
        });
        await this.prisma.reportCard.update({
          where: { id: existing.id },
          data: {
            authorId: user.id,
            lines: {
              create: lines.map((line, idx) => ({
                ...line,
                sortOrder: line.sortOrder ?? idx,
              })),
            },
          },
        });
        updated.push(existing.id);
      } else {
        const card = await this.prisma.reportCard.create({
          data: {
            studentId: student.id,
            periodId: period.id,
            classGroupId: turma.id,
            authorId: user.id,
            status: ReportCardStatus.RASCUNHO,
            lines: {
              create: lines.map((line, idx) => ({
                ...line,
                sortOrder: line.sortOrder ?? idx,
              })),
            },
          },
        });
        created.push(card.id);
      }
    }

    const cards = await this.listReportCards({
      periodId: period.id,
      classGroupId: turma.id,
    });

    return {
      created: created.length,
      updated: updated.length,
      skipped: skipped.length,
      cards,
    };
  }

  private async buildLinesForStudent(
    studentId: string,
    period: {
      id: string;
      name: string;
      startDate: Date;
      endDate: Date;
      academicYearId: string;
    },
    classGroupId: string,
  ) {
    const assessments = await this.prisma.assessment.findMany({
      where: {
        studentId,
        classGroupId,
        OR: [
          { periodId: period.id },
          {
            periodId: null,
            date: { gte: period.startDate, lte: period.endDate },
          },
        ],
      },
      orderBy: [{ subject: 'asc' }, { date: 'asc' }],
    });

    const sinteses = await this.prisma.descriptiveReport.findMany({
      where: {
        studentId,
        academicYearId: period.academicYearId,
        OR: [
          { periodLabel: { contains: period.name } },
          { periodLabel: period.name },
        ],
      },
      orderBy: [{ periodLabel: 'asc' }, { createdAt: 'asc' }],
    });

    const lines: Array<{
      subject: string;
      title: string;
      gradeType: AssessmentGradeType | null;
      gradeValue: number | null;
      gradeLabel: string | null;
      comment: string | null;
      sourceType: string;
      sourceId: string;
      sortOrder: number;
    }> = [];

    let order = 0;
    for (const a of assessments) {
      lines.push({
        subject: a.subject,
        title: a.title,
        gradeType: a.gradeType,
        gradeValue: a.gradeValue,
        gradeLabel: a.gradeLabel,
        comment: a.note,
        sourceType: 'AVALIACAO',
        sourceId: a.id,
        sortOrder: order++,
      });
    }
    for (const s of sinteses) {
      lines.push({
        subject: s.areaFocus?.trim() || 'Síntese descritiva',
        title: s.periodLabel,
        gradeType: null,
        gradeValue: null,
        gradeLabel: null,
        comment: s.body,
        sourceType: 'SINTESE',
        sourceId: s.id,
        sortOrder: order++,
      });
    }
    return lines;
  }

  async updateReportCard(id: string, dto: UpdateReportCardDto, user: RequestUser) {
    this.assertStaff(user);
    const existing = await this.prisma.reportCard.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Boletim não encontrado.');
    if (
      existing.status === ReportCardStatus.PUBLICADO &&
      dto.status !== ReportCardStatus.RASCUNHO &&
      dto.lines
    ) {
      throw new BadRequestException(
        'Repor o boletim a rascunho antes de editar as linhas.',
      );
    }

    if (dto.lines) {
      await this.prisma.reportCardLine.deleteMany({
        where: { reportCardId: id },
      });
    }

    const nextStatus = dto.status ?? existing.status;
    const publishedAt =
      nextStatus === ReportCardStatus.PUBLICADO
        ? existing.publishedAt ?? new Date()
        : nextStatus === ReportCardStatus.RASCUNHO
          ? null
          : existing.publishedAt;

    return this.prisma.reportCard.update({
      where: { id },
      data: {
        ...(dto.overallComment !== undefined
          ? { overallComment: dto.overallComment?.trim() || null }
          : {}),
        status: nextStatus,
        publishedAt,
        authorId: user.id,
        ...(dto.lines
          ? {
              lines: {
                create: dto.lines.map((line, idx) => ({
                  subject: line.subject.trim(),
                  title: line.title.trim(),
                  gradeType: line.gradeType ?? null,
                  gradeValue: line.gradeValue ?? null,
                  gradeLabel: line.gradeLabel?.trim() || null,
                  comment: line.comment?.trim() || null,
                  sourceType: line.sourceType?.trim() || 'MANUAL',
                  sourceId: line.sourceId || null,
                  sortOrder: line.sortOrder ?? idx,
                })),
              },
            }
          : {}),
      },
      include: reportCardInclude,
    });
  }

  async setReportCardPublished(
    id: string,
    published: boolean,
    user: RequestUser,
    options?: { sendEmail?: boolean },
  ) {
    this.assertStaff(user);
    const existing = await this.prisma.reportCard.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Boletim não encontrado.');
    const updated = await this.prisma.reportCard.update({
      where: { id },
      data: {
        status: published
          ? ReportCardStatus.PUBLICADO
          : ReportCardStatus.RASCUNHO,
        publishedAt: published ? existing.publishedAt ?? new Date() : null,
        authorId: user.id,
      },
      include: reportCardInclude,
    });
    if (published && options?.sendEmail) {
      await this.sendEmailForReportCard(updated);
    }
    return updated;
  }

  /** Gera o PDF oficial do boletim (staff ou encarregado com acesso). */
  async getReportCardPdf(id: string, user: RequestUser) {
    const card = await this.getReportCard(id);
    const student = card.student;
    if (!student) throw new NotFoundException('Aluno não encontrado.');
    this.assertCanAccessStudent(
      {
        guardianUserId: student.guardianUserId ?? null,
        guardianEmail: student.guardianEmail,
      },
      user,
    );
    if (
      !STAFF_ROLES.includes(user.role) &&
      card.status !== ReportCardStatus.PUBLICADO
    ) {
      throw new ForbiddenException(
        'O boletim ainda não está publicado para consulta.',
      );
    }
    return this.boletimPdf.generate({
      id: card.id,
      status: card.status,
      overallComment: card.overallComment,
      publishedAt: card.publishedAt,
      student: card.student!,
      period: card.period,
      classGroup: card.classGroup,
      author: card.author,
      lines: card.lines,
    });
  }

  /**
   * Envia email ao encarregado com o boletim publicado.
   * Falhas SMTP são registadas e não revertem a publicação.
   */
  private async sendEmailForReportCard(card: {
    id: string;
    status: ReportCardStatus;
    overallComment: string | null;
    publishedAt: Date | null;
    student: {
      childFullName: string;
      guardianFullName: string;
      guardianEmail: string;
      unit?: { name: string } | null;
      service?: { name: string } | null;
      room?: { name: string } | null;
      academicYear?: { label: string } | null;
    };
    period: {
      name: string;
      startDate: Date;
      endDate: Date;
      academicYear?: { label: string } | null;
      unit?: { name: string } | null;
    };
    classGroup: {
      name: string;
      room?: {
        name: string;
        unit?: { name: string } | null;
        service?: { name: string } | null;
      } | null;
      academicYear?: { label: string } | null;
    };
    author?: { name: string } | null;
    lines: Array<{
      subject: string;
      title: string;
      gradeType: AssessmentGradeType | null;
      gradeValue: number | null;
      gradeLabel: string | null;
      comment: string | null;
      sourceType: string;
    }>;
  }) {
    try {
      const email = card.student.guardianEmail?.trim().toLowerCase();
      if (!email || !email.includes('@')) {
        this.logger.warn(
          `Boletim ${card.id}: sem email de encarregado para notificação.`,
        );
        return { sent: false };
      }

      const { buffer, filename } = await this.boletimPdf.generate({
        id: card.id,
        status: card.status,
        overallComment: card.overallComment,
        publishedAt: card.publishedAt,
        student: card.student,
        period: card.period,
        classGroup: card.classGroup,
        author: card.author,
        lines: card.lines,
      });

      const portalUrl = this.resolvePortalUrl();
      const attachThreshold = 5 * 1024 * 1024;
      const useAttachment = buffer.length <= attachThreshold;

      const result = await this.mail.sendReportCardPublishedEmail({
        to: email,
        guardianName: card.student.guardianFullName,
        childName: card.student.childFullName,
        periodName: card.period.name,
        classGroupName: card.classGroup.name,
        unitName:
          card.period.unit?.name ||
          card.classGroup.room?.unit?.name ||
          card.student.unit?.name ||
          null,
        lineCount: card.lines.length,
        overallComment: card.overallComment,
        portalUrl,
        attachment: useAttachment ? { filename, content: buffer } : undefined,
      });

      if (result.queued) {
        this.logger.log(
          `Boletim ${card.id}: email enviado para ${email}${useAttachment ? ' (com anexo)' : ' (com link)'}.`,
        );
      } else {
        this.logger.warn(
          `Boletim ${card.id}: falha ao enviar email para ${email}.`,
        );
      }
      return { sent: !!result.queued };
    } catch (error) {
      this.logger.error(
        `Boletim ${card.id}: falha ao preparar email — ${
          error instanceof Error ? error.message : error
        }`,
      );
      return { sent: false };
    }
  }

  private resolvePortalUrl(): string | null {
    const explicit = this.config.get<string>('PUBLIC_APP_URL')?.trim();
    if (explicit) return explicit.replace(/\/$/, '');
    const cors = this.config.get<string>('CORS_ORIGIN', '');
    const first = cors
      .split(',')
      .map((v) => v.trim().replace(/^"|"$/g, ''))
      .find(Boolean);
    return first ? first.replace(/\/$/, '') : null;
  }

  async removeReportCard(id: string, user: RequestUser) {
    this.assertStaff(user);
    const existing = await this.prisma.reportCard.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Boletim não encontrado.');
    await this.prisma.reportCard.delete({ where: { id } });
    return { ok: true, id };
  }

  /** Boletins publicados dos educandos do encarregado. */
  async listMine(user: RequestUser) {
    const students = await this.prisma.student.findMany({
      where: {
        OR: [
          { guardianUserId: user.id },
          { guardianEmail: user.email.toLowerCase() },
        ],
      },
      select: { id: true },
    });
    if (students.length === 0) return [];
    return this.prisma.reportCard.findMany({
      where: {
        status: ReportCardStatus.PUBLICADO,
        studentId: { in: students.map((s) => s.id) },
      },
      include: reportCardInclude,
      orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async getStudentReportCards(studentId: string, user: RequestUser) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        guardianUserId: true,
        guardianEmail: true,
      },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');
    this.assertCanAccessStudent(student, user);
    const where: Prisma.ReportCardWhereInput = { studentId };
    if (!STAFF_ROLES.includes(user.role)) {
      where.status = ReportCardStatus.PUBLICADO;
    }
    return this.prisma.reportCard.findMany({
      where,
      include: reportCardInclude,
      orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
    });
  }
}
