import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PeiStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePeiPlanDto,
  CreatePeiReviewDto,
  UpdateNeeProfileDto,
  UpdatePeiPlanDto,
  UpsertNeeProfileDto,
} from './dto/nee.dto';

type RequestUser = { id: string; email: string; role: string };

const STAFF_ROLES: string[] = [
  Role.ADMIN,
  Role.DIRECAO,
  Role.COORDENACAO,
  Role.PROFESSOR,
];

const planInclude = {
  student: {
    select: {
      id: true,
      childFullName: true,
      guardianEmail: true,
      guardianUserId: true,
      unitId: true,
      unit: { select: { id: true, name: true } },
      service: { select: { id: true, name: true } },
      room: { select: { id: true, name: true } },
      academicYear: { select: { id: true, label: true } },
    },
  },
  academicYear: { select: { id: true, label: true } },
  neeProfile: {
    select: {
      id: true,
      active: true,
      diagnosisSummary: true,
      notes: true,
      identifiedAt: true,
    },
  },
  createdBy: { select: { id: true, name: true, email: true } },
  reviews: {
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ date: 'desc' as const }, { createdAt: 'desc' as const }],
  },
};

function parseDateOnly(value: string): Date {
  const raw = value.length === 10 ? `${value}T12:00:00` : value;
  return new Date(raw);
}

@Injectable()
export class NeeService {
  constructor(private prisma: PrismaService) {}

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

  private async ensureNeeProfile(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    return this.prisma.neeProfile.upsert({
      where: { studentId },
      update: { active: true },
      create: {
        studentId,
        active: true,
        identifiedAt: new Date(),
      },
    });
  }

  /** Lista perfis NEE (staff). */
  async listProfiles(filters: {
    unitId?: string;
    activeOnly?: boolean;
  }) {
    return this.prisma.neeProfile.findMany({
      where: {
        ...(filters.activeOnly ? { active: true } : {}),
        ...(filters.unitId
          ? { student: { unitId: filters.unitId } }
          : {}),
      },
      include: {
        student: {
          select: {
            id: true,
            childFullName: true,
            unit: { select: { id: true, name: true } },
            service: { select: { id: true, name: true } },
            room: { select: { id: true, name: true } },
            academicYear: { select: { id: true, label: true } },
          },
        },
        _count: { select: { peiPlans: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /** Marca/actualiza o aluno como NEE. */
  async upsertProfile(dto: UpsertNeeProfileDto, _user: RequestUser) {
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
      select: { id: true },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');

    return this.prisma.neeProfile.upsert({
      where: { studentId: dto.studentId },
      update: {
        ...(dto.active !== undefined ? { active: dto.active } : {}),
        ...(dto.diagnosisSummary !== undefined
          ? { diagnosisSummary: dto.diagnosisSummary?.trim() || null }
          : {}),
        ...(dto.notes !== undefined
          ? { notes: dto.notes?.trim() || null }
          : {}),
        ...(dto.identifiedAt !== undefined
          ? {
              identifiedAt: dto.identifiedAt
                ? parseDateOnly(dto.identifiedAt)
                : null,
            }
          : {}),
      },
      create: {
        studentId: dto.studentId,
        active: dto.active ?? true,
        diagnosisSummary: dto.diagnosisSummary?.trim() || null,
        notes: dto.notes?.trim() || null,
        identifiedAt: dto.identifiedAt
          ? parseDateOnly(dto.identifiedAt)
          : new Date(),
      },
      include: {
        student: {
          select: {
            id: true,
            childFullName: true,
            unit: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  async updateProfile(id: string, dto: UpdateNeeProfileDto) {
    const existing = await this.prisma.neeProfile.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Perfil NEE não encontrado');

    return this.prisma.neeProfile.update({
      where: { id },
      data: {
        ...(dto.active !== undefined ? { active: dto.active } : {}),
        ...(dto.diagnosisSummary !== undefined
          ? { diagnosisSummary: dto.diagnosisSummary?.trim() || null }
          : {}),
        ...(dto.notes !== undefined
          ? { notes: dto.notes?.trim() || null }
          : {}),
        ...(dto.identifiedAt !== undefined
          ? {
              identifiedAt: dto.identifiedAt
                ? parseDateOnly(dto.identifiedAt)
                : null,
            }
          : {}),
      },
      include: {
        student: {
          select: {
            id: true,
            childFullName: true,
            unit: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  /** Lista PEIs com filtros (staff). */
  async listPlans(filters: {
    unitId?: string;
    studentId?: string;
    academicYearId?: string;
    status?: PeiStatus;
    neeOnly?: boolean;
  }) {
    const where: Prisma.PeiPlanWhereInput = {
      ...(filters.studentId ? { studentId: filters.studentId } : {}),
      ...(filters.academicYearId
        ? { academicYearId: filters.academicYearId }
        : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.unitId || filters.neeOnly
        ? {
            student: {
              ...(filters.unitId ? { unitId: filters.unitId } : {}),
              ...(filters.neeOnly
                ? { neeProfile: { is: { active: true } } }
                : {}),
            },
          }
        : {}),
    };

    return this.prisma.peiPlan.findMany({
      where,
      include: planInclude,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getPlan(id: string) {
    const plan = await this.prisma.peiPlan.findUnique({
      where: { id },
      include: planInclude,
    });
    if (!plan) throw new NotFoundException('PEI não encontrado');
    return plan;
  }

  async createPlan(dto: CreatePeiPlanDto, user: RequestUser) {
    const profile = await this.ensureNeeProfile(dto.studentId);

    if (dto.academicYearId) {
      const year = await this.prisma.academicYear.findUnique({
        where: { id: dto.academicYearId },
      });
      if (!year) throw new NotFoundException('Ano lectivo não encontrado');
    }

    return this.prisma.peiPlan.create({
      data: {
        studentId: dto.studentId,
        neeProfileId: profile.id,
        academicYearId: dto.academicYearId || null,
        status: dto.status ?? PeiStatus.RASCUNHO,
        title: dto.title?.trim() || null,
        objectives: dto.objectives.trim(),
        strategies: dto.strategies?.trim() || null,
        supports: dto.supports?.trim() || null,
        guardianSummary: dto.guardianSummary?.trim() || null,
        responsibleTeacher: dto.responsibleTeacher?.trim() || null,
        coordinatorNotes: dto.coordinatorNotes?.trim() || null,
        reviewDate: dto.reviewDate ? parseDateOnly(dto.reviewDate) : null,
        createdById: user.id,
      },
      include: planInclude,
    });
  }

  async updatePlan(id: string, dto: UpdatePeiPlanDto) {
    const existing = await this.prisma.peiPlan.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('PEI não encontrado');

    if (dto.academicYearId) {
      const year = await this.prisma.academicYear.findUnique({
        where: { id: dto.academicYearId },
      });
      if (!year) throw new NotFoundException('Ano lectivo não encontrado');
    }

    return this.prisma.peiPlan.update({
      where: { id },
      data: {
        ...(dto.academicYearId !== undefined
          ? { academicYearId: dto.academicYearId || null }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.title !== undefined
          ? { title: dto.title?.trim() || null }
          : {}),
        ...(dto.objectives !== undefined
          ? { objectives: dto.objectives.trim() }
          : {}),
        ...(dto.strategies !== undefined
          ? { strategies: dto.strategies?.trim() || null }
          : {}),
        ...(dto.supports !== undefined
          ? { supports: dto.supports?.trim() || null }
          : {}),
        ...(dto.guardianSummary !== undefined
          ? { guardianSummary: dto.guardianSummary?.trim() || null }
          : {}),
        ...(dto.responsibleTeacher !== undefined
          ? { responsibleTeacher: dto.responsibleTeacher?.trim() || null }
          : {}),
        ...(dto.coordinatorNotes !== undefined
          ? { coordinatorNotes: dto.coordinatorNotes?.trim() || null }
          : {}),
        ...(dto.reviewDate !== undefined
          ? {
              reviewDate: dto.reviewDate
                ? parseDateOnly(dto.reviewDate)
                : null,
            }
          : {}),
      },
      include: planInclude,
    });
  }

  async removePlan(id: string) {
    const existing = await this.prisma.peiPlan.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('PEI não encontrado');
    await this.prisma.peiPlan.delete({ where: { id } });
    return { ok: true, id };
  }

  async addReview(peiPlanId: string, dto: CreatePeiReviewDto, user: RequestUser) {
    const plan = await this.prisma.peiPlan.findUnique({
      where: { id: peiPlanId },
    });
    if (!plan) throw new NotFoundException('PEI não encontrado');

    await this.prisma.peiReview.create({
      data: {
        peiPlanId,
        date: parseDateOnly(dto.date),
        notes: dto.notes.trim(),
        authorId: user.id,
      },
    });

    return this.getPlan(peiPlanId);
  }

  async removeReview(id: string) {
    const existing = await this.prisma.peiReview.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Registo de acompanhamento não encontrado');
    await this.prisma.peiReview.delete({ where: { id } });
    return { ok: true, id };
  }

  /**
   * Resumo dos PEIs activos dos filhos do encarregado autenticado.
   * Omite notas internas da coordenação e diagnóstico staff-only.
   */
  async listMine(user: RequestUser) {
    const students = await this.prisma.student.findMany({
      where: {
        OR: [
          { guardianUserId: user.id },
          { guardianEmail: user.email },
        ],
      },
      select: {
        id: true,
        childFullName: true,
        guardianEmail: true,
        guardianUserId: true,
        unit: { select: { id: true, name: true } },
        room: { select: { id: true, name: true } },
        academicYear: { select: { id: true, label: true } },
        neeProfile: {
          select: { id: true, active: true },
        },
      },
    });

    const mine = students.filter((s) => {
      try {
        this.assertCanAccessStudent(s, user);
        return true;
      } catch {
        return false;
      }
    });

    if (mine.length === 0) return [];

    const plans = await this.prisma.peiPlan.findMany({
      where: {
        studentId: { in: mine.map((s) => s.id) },
        status: { in: [PeiStatus.ACTIVO, PeiStatus.EM_REVISAO] },
      },
      include: {
        academicYear: { select: { id: true, label: true } },
        reviews: {
          select: { id: true, date: true, notes: true },
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
          take: 3,
        },
      },
      orderBy: [{ reviewDate: 'asc' }, { updatedAt: 'desc' }],
    });

    return plans.map((plan) => {
      const student = mine.find((s) => s.id === plan.studentId)!;
      return {
        id: plan.id,
        status: plan.status,
        title: plan.title,
        objectives: plan.objectives,
        strategies: plan.strategies,
        supports: plan.supports,
        summary:
          plan.guardianSummary?.trim() ||
          plan.objectives.slice(0, 400) +
            (plan.objectives.length > 400 ? '…' : ''),
        responsibleTeacher: plan.responsibleTeacher,
        reviewDate: plan.reviewDate,
        academicYear: plan.academicYear,
        recentReviews: plan.reviews,
        student: {
          id: student.id,
          childFullName: student.childFullName,
          unit: student.unit,
          room: student.room,
          academicYear: student.academicYear,
          hasNee: student.neeProfile?.active ?? false,
        },
      };
    });
  }
}
