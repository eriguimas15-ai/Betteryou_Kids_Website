import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AssessmentGradeType, BehaviorType, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateAssessmentDto,
  CreateLessonSummaryDto,
  CreateScheduleEntryDto,
  UpdateAssessmentDto,
  UpdateLessonSummaryDto,
  UpdateScheduleEntryDto,
} from './dto/academico.dto';
import {
  CreateBehaviorRecordDto,
  CreateNonTeachingActivityDto,
  CreateStudentQualificationDto,
  UpdateBehaviorRecordDto,
  UpdateNonTeachingActivityDto,
  UpdateStudentQualificationDto,
} from './dto/academico-extra.dto';

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

const classGroupInclude = {
  room: { include: { unit: true, service: true } },
  academicYear: true,
} as const;

const summaryInclude = {
  author: { select: { id: true, name: true } },
  classGroup: { include: classGroupInclude },
} as const;

const assessmentInclude = {
  author: { select: { id: true, name: true } },
  classGroup: { include: classGroupInclude },
  student: { select: { id: true, childFullName: true } },
  period: {
    select: { id: true, name: true, startDate: true, endDate: true },
  },
} as const;

const nleInclude = {
  classGroup: {
    select: {
      id: true,
      name: true,
      teacherName: true,
      room: {
        select: {
          name: true,
          unit: { select: { name: true } },
          service: { select: { name: true } },
        },
      },
    },
  },
  teacherUser: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true } },
} as const;

const behaviorInclude = {
  student: {
    select: {
      id: true,
      childFullName: true,
      guardianUserId: true,
      guardianEmail: true,
      unit: { select: { id: true, name: true } },
      service: { select: { id: true, name: true } },
      room: { select: { id: true, name: true } },
      academicYear: { select: { id: true, label: true } },
    },
  },
  author: { select: { id: true, name: true } },
} as const;

const qualificationInclude = {
  student: {
    select: {
      id: true,
      childFullName: true,
      guardianUserId: true,
      guardianEmail: true,
      unit: { select: { id: true, name: true } },
      service: { select: { id: true, name: true } },
      room: { select: { id: true, name: true } },
      academicYear: { select: { id: true, label: true } },
    },
  },
  academicYear: { select: { id: true, label: true } },
  createdBy: { select: { id: true, name: true } },
} as const;

@Injectable()
export class AcademicoService {
  constructor(private prisma: PrismaService) {}

  // --------------------------- Turmas ---------------------------

  /** Turmas activas disponíveis (inclui contagem de alunos por sala/ano). */
  async listTurmas() {
    const classes = await this.prisma.classGroup.findMany({
      where: { active: true },
      include: classGroupInclude,
      orderBy: [{ academicYearId: 'desc' }, { name: 'asc' }],
    });

    return Promise.all(
      classes.map(async (turma) => {
        const studentCount = await this.prisma.student.count({
          where: {
            roomId: turma.roomId,
            academicYearId: turma.academicYearId,
          },
        });
        return { ...turma, studentCount };
      }),
    );
  }

  private async getTurmaOrThrow(classGroupId: string) {
    const turma = await this.prisma.classGroup.findUnique({
      where: { id: classGroupId },
      include: classGroupInclude,
    });
    if (!turma) throw new NotFoundException('Turma não encontrada');
    return turma;
  }

  private studentsOfTurma(turma: { roomId: string; academicYearId: string }) {
    return this.prisma.student.findMany({
      where: {
        roomId: turma.roomId,
        academicYearId: turma.academicYearId,
      },
      orderBy: { childFullName: 'asc' },
    });
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

  /** IDs das turmas de um aluno (por sala + ano lectivo). */
  private async turmaIdsForStudent(student: {
    roomId: string | null;
    academicYearId: string;
  }): Promise<string[]> {
    if (!student.roomId) return [];
    const turmas = await this.prisma.classGroup.findMany({
      where: {
        roomId: student.roomId,
        academicYearId: student.academicYearId,
      },
      select: { id: true },
    });
    return turmas.map((t) => t.id);
  }

  // -------------------------- Sumários --------------------------

  async listSummaries(classGroupId: string) {
    await this.getTurmaOrThrow(classGroupId);
    return this.prisma.lessonSummary.findMany({
      where: { classGroupId },
      include: summaryInclude,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createSummary(dto: CreateLessonSummaryDto, user: RequestUser) {
    await this.getTurmaOrThrow(dto.classGroupId);
    return this.prisma.lessonSummary.create({
      data: {
        classGroupId: dto.classGroupId,
        date: parseDateOnly(dto.date),
        subject: dto.subject.trim(),
        topic: dto.topic?.trim() || null,
        description: dto.description.trim(),
        homework: dto.homework?.trim() || null,
        authorId: user.id,
      },
      include: summaryInclude,
    });
  }

  async updateSummary(
    id: string,
    dto: UpdateLessonSummaryDto,
    _user: RequestUser,
  ) {
    const existing = await this.prisma.lessonSummary.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Sumário não encontrado');
    return this.prisma.lessonSummary.update({
      where: { id },
      data: {
        ...(dto.date !== undefined ? { date: parseDateOnly(dto.date) } : {}),
        ...(dto.subject !== undefined ? { subject: dto.subject.trim() } : {}),
        ...(dto.topic !== undefined ? { topic: dto.topic?.trim() || null } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() }
          : {}),
        ...(dto.homework !== undefined
          ? { homework: dto.homework?.trim() || null }
          : {}),
      },
      include: summaryInclude,
    });
  }

  async removeSummary(id: string) {
    const existing = await this.prisma.lessonSummary.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Sumário não encontrado');
    await this.prisma.lessonSummary.delete({ where: { id } });
    return { ok: true, id };
  }

  /** Sumários da turma do aluno (encarregado só vê os seus). */
  async getStudentSummaries(studentId: string, user: RequestUser) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        guardianUserId: true,
        guardianEmail: true,
        roomId: true,
        academicYearId: true,
      },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');
    this.assertCanAccessStudent(student, user);
    const turmaIds = await this.turmaIdsForStudent(student);
    if (turmaIds.length === 0) return [];
    return this.prisma.lessonSummary.findMany({
      where: { classGroupId: { in: turmaIds } },
      include: summaryInclude,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }

  // ------------------------- Avaliações -------------------------

  async listAssessments(classGroupId: string) {
    await this.getTurmaOrThrow(classGroupId);
    return this.prisma.assessment.findMany({
      where: { classGroupId },
      include: assessmentInclude,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }

  private normalizeGrade(dto: {
    gradeType?: AssessmentGradeType;
    gradeValue?: number | null;
    gradeLabel?: string | null;
  }): { gradeValue: number | null; gradeLabel: string | null } {
    if (dto.gradeType === AssessmentGradeType.NUMERICA) {
      if (dto.gradeValue === undefined || dto.gradeValue === null) {
        throw new BadRequestException('Indique a nota (numérica).');
      }
      return { gradeValue: dto.gradeValue, gradeLabel: null };
    }
    // QUALITATIVA
    const label = dto.gradeLabel?.trim();
    if (!label) {
      throw new BadRequestException('Indique a classificação (qualitativa).');
    }
    return { gradeValue: null, gradeLabel: label };
  }

  async createAssessment(dto: CreateAssessmentDto, user: RequestUser) {
    const turma = await this.getTurmaOrThrow(dto.classGroupId);
    const students = await this.studentsOfTurma(turma);
    if (!students.some((s) => s.id === dto.studentId)) {
      throw new BadRequestException('O aluno não pertence a esta turma');
    }
    const grade = this.normalizeGrade(dto);
    if (dto.periodId) {
      const period = await this.prisma.assessmentPeriod.findUnique({
        where: { id: dto.periodId },
      });
      if (!period) throw new BadRequestException('Período inválido.');
    }
    return this.prisma.assessment.create({
      data: {
        studentId: dto.studentId,
        classGroupId: dto.classGroupId,
        periodId: dto.periodId?.trim() || null,
        title: dto.title.trim(),
        subject: dto.subject.trim(),
        date: parseDateOnly(dto.date),
        gradeType: dto.gradeType,
        gradeValue: grade.gradeValue,
        gradeLabel: grade.gradeLabel,
        note: dto.note?.trim() || null,
        authorId: user.id,
      },
      include: assessmentInclude,
    });
  }

  async updateAssessment(
    id: string,
    dto: UpdateAssessmentDto,
    _user: RequestUser,
  ) {
    const existing = await this.prisma.assessment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Avaliação não encontrada');

    const gradeType = dto.gradeType ?? existing.gradeType;
    const grade = this.normalizeGrade({
      gradeType,
      gradeValue:
        dto.gradeValue !== undefined ? dto.gradeValue : existing.gradeValue,
      gradeLabel:
        dto.gradeLabel !== undefined ? dto.gradeLabel : existing.gradeLabel,
    });

    if (dto.periodId) {
      const period = await this.prisma.assessmentPeriod.findUnique({
        where: { id: dto.periodId },
      });
      if (!period) throw new BadRequestException('Período inválido.');
    }

    return this.prisma.assessment.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.subject !== undefined ? { subject: dto.subject.trim() } : {}),
        ...(dto.date !== undefined ? { date: parseDateOnly(dto.date) } : {}),
        gradeType,
        gradeValue: grade.gradeValue,
        gradeLabel: grade.gradeLabel,
        ...(dto.note !== undefined ? { note: dto.note?.trim() || null } : {}),
        ...(dto.periodId !== undefined
          ? { periodId: dto.periodId?.trim() || null }
          : {}),
      },
      include: assessmentInclude,
    });
  }

  async removeAssessment(id: string) {
    const existing = await this.prisma.assessment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Avaliação não encontrada');
    await this.prisma.assessment.delete({ where: { id } });
    return { ok: true, id };
  }

  /** Avaliações de um aluno (encarregado só vê as suas). */
  async getStudentAssessments(studentId: string, user: RequestUser) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, guardianUserId: true, guardianEmail: true },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');
    this.assertCanAccessStudent(student, user);
    return this.prisma.assessment.findMany({
      where: { studentId },
      include: assessmentInclude,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }

  // -------------------------- Horários --------------------------

  async listSchedule(classGroupId: string) {
    await this.getTurmaOrThrow(classGroupId);
    return this.prisma.scheduleEntry.findMany({
      where: { classGroupId },
      orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
    });
  }

  private assertTimeOrder(startTime: string, endTime: string) {
    if (endTime <= startTime) {
      throw new BadRequestException(
        'A hora de fim deve ser posterior à hora de início.',
      );
    }
  }

  async createScheduleEntry(dto: CreateScheduleEntryDto) {
    await this.getTurmaOrThrow(dto.classGroupId);
    this.assertTimeOrder(dto.startTime, dto.endTime);
    return this.prisma.scheduleEntry.create({
      data: {
        classGroupId: dto.classGroupId,
        weekday: dto.weekday,
        startTime: dto.startTime,
        endTime: dto.endTime,
        subject: dto.subject.trim(),
        room: dto.room?.trim() || null,
      },
    });
  }

  async updateScheduleEntry(id: string, dto: UpdateScheduleEntryDto) {
    const existing = await this.prisma.scheduleEntry.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Entrada de horário não encontrada');
    const startTime = dto.startTime ?? existing.startTime;
    const endTime = dto.endTime ?? existing.endTime;
    this.assertTimeOrder(startTime, endTime);
    return this.prisma.scheduleEntry.update({
      where: { id },
      data: {
        ...(dto.weekday !== undefined ? { weekday: dto.weekday } : {}),
        ...(dto.startTime !== undefined ? { startTime: dto.startTime } : {}),
        ...(dto.endTime !== undefined ? { endTime: dto.endTime } : {}),
        ...(dto.subject !== undefined ? { subject: dto.subject.trim() } : {}),
        ...(dto.room !== undefined ? { room: dto.room?.trim() || null } : {}),
      },
    });
  }

  async removeScheduleEntry(id: string) {
    const existing = await this.prisma.scheduleEntry.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Entrada de horário não encontrada');
    await this.prisma.scheduleEntry.delete({ where: { id } });
    return { ok: true, id };
  }

  /** Horário da turma do aluno (encarregado só vê o seu). */
  async getStudentSchedule(studentId: string, user: RequestUser) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        guardianUserId: true,
        guardianEmail: true,
        roomId: true,
        academicYearId: true,
      },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');
    this.assertCanAccessStudent(student, user);
    const turmaIds = await this.turmaIdsForStudent(student);
    if (turmaIds.length === 0) return [];
    return this.prisma.scheduleEntry.findMany({
      where: { classGroupId: { in: turmaIds } },
      orderBy: [{ weekday: 'asc' }, { startTime: 'asc' }],
    });
  }

  // ---------------- Actividades não lectivas ----------------

  listNonTeachingActivities(filters: {
    classGroupId?: string;
    teacherUserId?: string;
  }) {
    const where: Prisma.NonTeachingActivityWhereInput = {};
    if (filters.classGroupId) where.classGroupId = filters.classGroupId;
    if (filters.teacherUserId) where.teacherUserId = filters.teacherUserId;
    return this.prisma.nonTeachingActivity.findMany({
      where,
      include: nleInclude,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async createNonTeachingActivity(
    dto: CreateNonTeachingActivityDto,
    user: RequestUser,
  ) {
    if (dto.classGroupId) await this.getTurmaOrThrow(dto.classGroupId);
    return this.prisma.nonTeachingActivity.create({
      data: {
        date: parseDateOnly(dto.date),
        teacherName: dto.teacherName.trim(),
        teacherUserId: dto.teacherUserId || user.id,
        classGroupId: dto.classGroupId || null,
        type: dto.type.trim(),
        description: dto.description.trim(),
        durationMinutes: dto.durationMinutes ?? null,
        notes: dto.notes?.trim() || null,
        createdById: user.id,
      },
      include: nleInclude,
    });
  }

  async updateNonTeachingActivity(
    id: string,
    dto: UpdateNonTeachingActivityDto,
  ) {
    const existing = await this.prisma.nonTeachingActivity.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Actividade não lectiva não encontrada.');
    }
    if (dto.classGroupId) await this.getTurmaOrThrow(dto.classGroupId);
    return this.prisma.nonTeachingActivity.update({
      where: { id },
      data: {
        ...(dto.date !== undefined ? { date: parseDateOnly(dto.date) } : {}),
        ...(dto.teacherName !== undefined
          ? { teacherName: dto.teacherName.trim() }
          : {}),
        ...(dto.teacherUserId !== undefined
          ? { teacherUserId: dto.teacherUserId || null }
          : {}),
        ...(dto.classGroupId !== undefined
          ? { classGroupId: dto.classGroupId || null }
          : {}),
        ...(dto.type !== undefined ? { type: dto.type.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() }
          : {}),
        ...(dto.durationMinutes !== undefined
          ? { durationMinutes: dto.durationMinutes ?? null }
          : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes?.trim() || null } : {}),
      },
      include: nleInclude,
    });
  }

  async removeNonTeachingActivity(id: string) {
    const existing = await this.prisma.nonTeachingActivity.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Actividade não lectiva não encontrada.');
    }
    await this.prisma.nonTeachingActivity.delete({ where: { id } });
    return { ok: true, id };
  }

  // -------------------- Comportamento ---------------------

  listBehaviorRecords(filters: {
    studentId?: string;
    type?: BehaviorType;
    unitId?: string;
  }) {
    const where: Prisma.BehaviorRecordWhereInput = {};
    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.type) where.type = filters.type;
    if (filters.unitId) where.student = { unitId: filters.unitId };
    return this.prisma.behaviorRecord.findMany({
      where,
      include: behaviorInclude,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async listMyBehaviorRecords(user: RequestUser) {
    return this.prisma.behaviorRecord.findMany({
      where: {
        visibleToGuardian: true,
        student: {
          OR: [
            { guardianUserId: user.id },
            { guardianEmail: user.email.toLowerCase() },
          ],
        },
      },
      include: behaviorInclude,
      orderBy: [{ date: 'desc' }],
    });
  }

  async createBehaviorRecord(dto: CreateBehaviorRecordDto, user: RequestUser) {
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
    });
    if (!student) throw new BadRequestException('Aluno inválido.');
    return this.prisma.behaviorRecord.create({
      data: {
        studentId: dto.studentId,
        date: parseDateOnly(dto.date),
        type: dto.type,
        description: dto.description.trim(),
        visibleToGuardian: dto.visibleToGuardian ?? false,
        authorId: user.id,
      },
      include: behaviorInclude,
    });
  }

  async updateBehaviorRecord(id: string, dto: UpdateBehaviorRecordDto) {
    const existing = await this.prisma.behaviorRecord.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Registo de comportamento não encontrado.');
    }
    return this.prisma.behaviorRecord.update({
      where: { id },
      data: {
        ...(dto.date !== undefined ? { date: parseDateOnly(dto.date) } : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() }
          : {}),
        ...(dto.visibleToGuardian !== undefined
          ? { visibleToGuardian: dto.visibleToGuardian }
          : {}),
      },
      include: behaviorInclude,
    });
  }

  async removeBehaviorRecord(id: string) {
    const existing = await this.prisma.behaviorRecord.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Registo de comportamento não encontrado.');
    }
    await this.prisma.behaviorRecord.delete({ where: { id } });
    return { ok: true, id };
  }

  // -------------------- Habilitações ----------------------

  listQualifications(filters: { studentId?: string; unitId?: string }) {
    const where: Prisma.StudentQualificationWhereInput = {};
    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.unitId) where.student = { unitId: filters.unitId };
    return this.prisma.studentQualification.findMany({
      where,
      include: qualificationInclude,
      orderBy: [{ issuedAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async listMyQualifications(user: RequestUser) {
    return this.prisma.studentQualification.findMany({
      where: {
        student: {
          OR: [
            { guardianUserId: user.id },
            { guardianEmail: user.email.toLowerCase() },
          ],
        },
      },
      include: qualificationInclude,
      orderBy: [{ issuedAt: 'desc' }],
    });
  }

  async createQualification(
    dto: CreateStudentQualificationDto,
    user: RequestUser,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
    });
    if (!student) throw new BadRequestException('Aluno inválido.');
    if (dto.academicYearId) {
      const year = await this.prisma.academicYear.findUnique({
        where: { id: dto.academicYearId },
      });
      if (!year) throw new BadRequestException('Ano lectivo inválido.');
    }
    return this.prisma.studentQualification.create({
      data: {
        studentId: dto.studentId,
        title: dto.title.trim(),
        issuedAt: parseDateOnly(dto.issuedAt),
        issuer: dto.issuer?.trim() || null,
        notes: dto.notes?.trim() || null,
        documentUrl: dto.documentUrl?.trim() || null,
        academicYearId: dto.academicYearId || null,
        createdById: user.id,
      },
      include: qualificationInclude,
    });
  }

  async updateQualification(id: string, dto: UpdateStudentQualificationDto) {
    const existing = await this.prisma.studentQualification.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Habilitação não encontrada.');
    }
    if (dto.academicYearId) {
      const year = await this.prisma.academicYear.findUnique({
        where: { id: dto.academicYearId },
      });
      if (!year) throw new BadRequestException('Ano lectivo inválido.');
    }
    return this.prisma.studentQualification.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.issuedAt !== undefined
          ? { issuedAt: parseDateOnly(dto.issuedAt) }
          : {}),
        ...(dto.issuer !== undefined
          ? { issuer: dto.issuer?.trim() || null }
          : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes?.trim() || null } : {}),
        ...(dto.documentUrl !== undefined
          ? { documentUrl: dto.documentUrl?.trim() || null }
          : {}),
        ...(dto.academicYearId !== undefined
          ? { academicYearId: dto.academicYearId || null }
          : {}),
      },
      include: qualificationInclude,
    });
  }

  async removeQualification(id: string) {
    const existing = await this.prisma.studentQualification.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Habilitação não encontrada.');
    }
    await this.prisma.studentQualification.delete({ where: { id } });
    return { ok: true, id };
  }
}
