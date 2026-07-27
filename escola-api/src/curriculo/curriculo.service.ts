import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCurriculumAreaDto,
  CreateCurriculumObjectiveDto,
  CreateCurriculumPlanDto,
  UpdateCurriculumAreaDto,
  UpdateCurriculumObjectiveDto,
  UpdateCurriculumPlanDto,
} from './dto/curriculo.dto';
import {
  CreateSchoolManualDto,
  UpdateSchoolManualDto,
} from './dto/manuais.dto';

type RequestUser = { id: string; email: string; role: string };

const planInclude = {
  service: { select: { id: true, name: true } },
  academicYear: { select: { id: true, label: true } },
  unit: { select: { id: true, name: true } },
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
  areas: {
    orderBy: [{ sortOrder: 'asc' as const }, { name: 'asc' as const }],
    include: {
      objectives: {
        orderBy: [{ sortOrder: 'asc' as const }, { title: 'asc' as const }],
      },
    },
  },
};

const manualInclude = {
  service: { select: { id: true, name: true } },
  academicYear: { select: { id: true, label: true } },
  unit: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
} as const;

@Injectable()
export class CurriculoService {
  constructor(private prisma: PrismaService) {}

  list(filters: {
    serviceId?: string;
    academicYearId?: string;
    unitId?: string;
    classGroupId?: string;
    activeOnly?: boolean;
  }) {
    const where: Prisma.CurriculumPlanWhereInput = {};
    if (filters.serviceId) where.serviceId = filters.serviceId;
    if (filters.academicYearId) where.academicYearId = filters.academicYearId;
    if (filters.unitId) where.unitId = filters.unitId;
    if (filters.classGroupId) where.classGroupId = filters.classGroupId;
    if (filters.activeOnly) where.active = true;
    return this.prisma.curriculumPlan.findMany({
      where,
      include: planInclude,
      orderBy: [{ name: 'asc' }],
    });
  }

  async get(id: string) {
    const plan = await this.prisma.curriculumPlan.findUnique({
      where: { id },
      include: planInclude,
    });
    if (!plan) throw new NotFoundException('Plano curricular não encontrado.');
    return plan;
  }

  private async assertRefs(dto: {
    serviceId?: string | null;
    academicYearId?: string | null;
    unitId?: string | null;
    classGroupId?: string | null;
  }) {
    if (dto.serviceId) {
      const service = await this.prisma.serviceOffering.findUnique({
        where: { id: dto.serviceId },
      });
      if (!service) throw new BadRequestException('Serviço inválido.');
    }
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
    if (dto.classGroupId) {
      const turma = await this.prisma.classGroup.findUnique({
        where: { id: dto.classGroupId },
      });
      if (!turma) throw new BadRequestException('Turma inválida.');
    }
  }

  async createPlan(dto: CreateCurriculumPlanDto) {
    await this.assertRefs(dto);
    return this.prisma.curriculumPlan.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        serviceId: dto.serviceId,
        academicYearId: dto.academicYearId || null,
        unitId: dto.unitId || null,
        levelLabel: dto.levelLabel?.trim() || null,
        classGroupId: dto.classGroupId || null,
        active: dto.active ?? true,
      },
      include: planInclude,
    });
  }

  async updatePlan(id: string, dto: UpdateCurriculumPlanDto) {
    const existing = await this.prisma.curriculumPlan.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Plano curricular não encontrado.');
    await this.assertRefs({
      serviceId: dto.serviceId ?? existing.serviceId,
      academicYearId:
        dto.academicYearId === undefined
          ? existing.academicYearId
          : dto.academicYearId,
      unitId: dto.unitId === undefined ? existing.unitId : dto.unitId,
      classGroupId:
        dto.classGroupId === undefined
          ? existing.classGroupId
          : dto.classGroupId,
    });
    return this.prisma.curriculumPlan.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
        ...(dto.serviceId !== undefined ? { serviceId: dto.serviceId } : {}),
        ...(dto.academicYearId !== undefined
          ? { academicYearId: dto.academicYearId || null }
          : {}),
        ...(dto.unitId !== undefined ? { unitId: dto.unitId || null } : {}),
        ...(dto.levelLabel !== undefined
          ? { levelLabel: dto.levelLabel?.trim() || null }
          : {}),
        ...(dto.classGroupId !== undefined
          ? { classGroupId: dto.classGroupId || null }
          : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
      include: planInclude,
    });
  }

  async removePlan(id: string) {
    const existing = await this.prisma.curriculumPlan.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Plano curricular não encontrado.');
    await this.prisma.curriculumPlan.delete({ where: { id } });
    return { ok: true, id };
  }

  async createArea(dto: CreateCurriculumAreaDto) {
    const plan = await this.prisma.curriculumPlan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan) throw new BadRequestException('Plano curricular inválido.');
    return this.prisma.curriculumArea.create({
      data: {
        planId: dto.planId,
        name: dto.name.trim(),
        code: dto.code?.trim() || null,
        description: dto.description?.trim() || null,
        sortOrder: dto.sortOrder ?? 0,
      },
      include: {
        objectives: {
          orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
        },
      },
    });
  }

  async updateArea(id: string, dto: UpdateCurriculumAreaDto) {
    const existing = await this.prisma.curriculumArea.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Área curricular não encontrada.');
    return this.prisma.curriculumArea.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.code !== undefined ? { code: dto.code?.trim() || null } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
      include: {
        objectives: {
          orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
        },
      },
    });
  }

  async removeArea(id: string) {
    const existing = await this.prisma.curriculumArea.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Área curricular não encontrada.');
    await this.prisma.curriculumArea.delete({ where: { id } });
    return { ok: true, id };
  }

  async createObjective(dto: CreateCurriculumObjectiveDto) {
    const area = await this.prisma.curriculumArea.findUnique({
      where: { id: dto.areaId },
    });
    if (!area) throw new BadRequestException('Área curricular inválida.');
    return this.prisma.curriculumObjective.create({
      data: {
        areaId: dto.areaId,
        title: dto.title.trim(),
        code: dto.code?.trim() || null,
        description: dto.description?.trim() || null,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updateObjective(id: string, dto: UpdateCurriculumObjectiveDto) {
    const existing = await this.prisma.curriculumObjective.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Objectivo curricular não encontrado.');
    }
    return this.prisma.curriculumObjective.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.code !== undefined ? { code: dto.code?.trim() || null } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    });
  }

  async removeObjective(id: string) {
    const existing = await this.prisma.curriculumObjective.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Objectivo curricular não encontrado.');
    }
    await this.prisma.curriculumObjective.delete({ where: { id } });
    return { ok: true, id };
  }

  /** Planos activos do serviço / turma dos filhos do encarregado. */
  async listMine(user: RequestUser) {
    const students = await this.prisma.student.findMany({
      where: {
        OR: [
          { guardianUserId: user.id },
          { guardianEmail: user.email.toLowerCase() },
        ],
      },
      select: {
        id: true,
        childFullName: true,
        serviceId: true,
        unitId: true,
        roomId: true,
        academicYearId: true,
        service: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
        academicYear: { select: { id: true, label: true } },
      },
    });
    if (students.length === 0) return [];

    const serviceIds = [...new Set(students.map((s) => s.serviceId))];
    const plans = await this.prisma.curriculumPlan.findMany({
      where: {
        active: true,
        serviceId: { in: serviceIds },
      },
      include: planInclude,
      orderBy: [{ name: 'asc' }],
    });

    return students.map((student) => ({
      student: {
        id: student.id,
        childFullName: student.childFullName,
        service: student.service,
        unit: student.unit,
        academicYear: student.academicYear,
      },
      plans: plans.filter((plan) => {
        if (plan.serviceId !== student.serviceId) return false;
        if (plan.unitId && plan.unitId !== student.unitId) return false;
        if (
          plan.academicYearId &&
          plan.academicYearId !== student.academicYearId
        ) {
          return false;
        }
        return true;
      }),
    }));
  }

  // ------------------------- Manuais -------------------------

  listManuals(filters: {
    serviceId?: string;
    academicYearId?: string;
    unitId?: string;
    activeOnly?: boolean;
  }) {
    const where: Prisma.SchoolManualWhereInput = {};
    if (filters.serviceId) where.serviceId = filters.serviceId;
    if (filters.academicYearId) where.academicYearId = filters.academicYearId;
    if (filters.unitId) where.unitId = filters.unitId;
    if (filters.activeOnly) where.active = true;
    return this.prisma.schoolManual.findMany({
      where,
      include: manualInclude,
      orderBy: [{ title: 'asc' }],
    });
  }

  async listMyManuals(user: RequestUser) {
    const students = await this.prisma.student.findMany({
      where: {
        OR: [
          { guardianUserId: user.id },
          { guardianEmail: user.email.toLowerCase() },
        ],
      },
      select: {
        id: true,
        childFullName: true,
        serviceId: true,
        unitId: true,
        academicYearId: true,
        service: { select: { id: true, name: true } },
      },
    });
    if (students.length === 0) return [];
    const serviceIds = [...new Set(students.map((s) => s.serviceId))];
    const manuals = await this.prisma.schoolManual.findMany({
      where: {
        active: true,
        OR: [
          { serviceId: { in: serviceIds } },
          { serviceId: null },
        ],
      },
      include: manualInclude,
      orderBy: [{ title: 'asc' }],
    });
    return students.map((student) => ({
      student: {
        id: student.id,
        childFullName: student.childFullName,
        service: student.service,
      },
      manuals: manuals.filter((m) => {
        if (m.serviceId && m.serviceId !== student.serviceId) return false;
        if (m.unitId && m.unitId !== student.unitId) return false;
        if (
          m.academicYearId &&
          m.academicYearId !== student.academicYearId
        ) {
          return false;
        }
        return true;
      }),
    }));
  }

  async createManual(dto: CreateSchoolManualDto, user: RequestUser) {
    await this.assertRefs({
      serviceId: dto.serviceId,
      academicYearId: dto.academicYearId,
      unitId: dto.unitId,
    });
    return this.prisma.schoolManual.create({
      data: {
        title: dto.title.trim(),
        subjectArea: dto.subjectArea?.trim() || null,
        serviceId: dto.serviceId || null,
        publisher: dto.publisher?.trim() || null,
        academicYearId: dto.academicYearId || null,
        unitId: dto.unitId || null,
        mediaUrl: dto.mediaUrl?.trim() || null,
        active: dto.active ?? true,
        notes: dto.notes?.trim() || null,
        createdById: user.id,
      },
      include: manualInclude,
    });
  }

  async updateManual(id: string, dto: UpdateSchoolManualDto) {
    const existing = await this.prisma.schoolManual.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Manual escolar não encontrado.');
    await this.assertRefs({
      serviceId:
        dto.serviceId === undefined ? existing.serviceId : dto.serviceId,
      academicYearId:
        dto.academicYearId === undefined
          ? existing.academicYearId
          : dto.academicYearId,
      unitId: dto.unitId === undefined ? existing.unitId : dto.unitId,
    });
    return this.prisma.schoolManual.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.subjectArea !== undefined
          ? { subjectArea: dto.subjectArea?.trim() || null }
          : {}),
        ...(dto.serviceId !== undefined
          ? { serviceId: dto.serviceId || null }
          : {}),
        ...(dto.publisher !== undefined
          ? { publisher: dto.publisher?.trim() || null }
          : {}),
        ...(dto.academicYearId !== undefined
          ? { academicYearId: dto.academicYearId || null }
          : {}),
        ...(dto.unitId !== undefined ? { unitId: dto.unitId || null } : {}),
        ...(dto.mediaUrl !== undefined
          ? { mediaUrl: dto.mediaUrl?.trim() || null }
          : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes?.trim() || null } : {}),
      },
      include: manualInclude,
    });
  }

  async removeManual(id: string) {
    const existing = await this.prisma.schoolManual.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Manual escolar não encontrado.');
    await this.prisma.schoolManual.delete({ where: { id } });
    return { ok: true, id };
  }
}
