import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SubstitutionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateSubstitutionDto,
  UpdateSubstitutionDto,
} from './dto/substituicoes.dto';

type RequestUser = { id: string; email: string; role: string };

const substitutionInclude = {
  classGroup: {
    select: {
      id: true,
      name: true,
      teacherName: true,
      room: {
        select: {
          name: true,
          unit: { select: { id: true, name: true } },
          service: { select: { id: true, name: true } },
        },
      },
      academicYear: { select: { id: true, label: true } },
    },
  },
  substituteUser: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true, email: true } },
} as const;

@Injectable()
export class SubstituicoesService {
  constructor(private prisma: PrismaService) {}

  list(filters: {
    classGroupId?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: SubstitutionStatus;
    unitId?: string;
  }) {
    const where: Prisma.SubstitutionWhereInput = {};
    if (filters.classGroupId) where.classGroupId = filters.classGroupId;
    if (filters.status) where.status = filters.status;
    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.date.lte = new Date(filters.dateTo);
    }
    if (filters.unitId) {
      where.classGroup = { room: { unitId: filters.unitId } };
    }
    return this.prisma.substitution.findMany({
      where,
      include: substitutionInclude,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async get(id: string) {
    const item = await this.prisma.substitution.findUnique({
      where: { id },
      include: substitutionInclude,
    });
    if (!item) throw new NotFoundException('Substituição não encontrada.');
    return item;
  }

  private async resolveClassGroup(classGroupId: string) {
    const turma = await this.prisma.classGroup.findUnique({
      where: { id: classGroupId },
    });
    if (!turma) throw new BadRequestException('Turma inválida.');
    return turma;
  }

  async create(dto: CreateSubstitutionDto, user: RequestUser) {
    const turma = await this.resolveClassGroup(dto.classGroupId);
    if (dto.substituteUserId) {
      const subUser = await this.prisma.user.findUnique({
        where: { id: dto.substituteUserId },
      });
      if (!subUser) throw new BadRequestException('Utilizador substituto inválido.');
    }
    const absent =
      dto.absentTeacher?.trim() ||
      turma.teacherName?.trim() ||
      'Educador(a) titular';
    return this.prisma.substitution.create({
      data: {
        date: new Date(dto.date),
        classGroupId: dto.classGroupId,
        absentTeacher: absent,
        substituteTeacher: dto.substituteTeacher.trim(),
        substituteUserId: dto.substituteUserId || null,
        reason: dto.reason?.trim() || null,
        notes: dto.notes?.trim() || null,
        status: dto.status ?? SubstitutionStatus.PLANEADA,
        createdById: user.id,
      },
      include: substitutionInclude,
    });
  }

  async update(id: string, dto: UpdateSubstitutionDto) {
    const existing = await this.prisma.substitution.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Substituição não encontrada.');
    if (dto.classGroupId) await this.resolveClassGroup(dto.classGroupId);
    if (dto.substituteUserId) {
      const subUser = await this.prisma.user.findUnique({
        where: { id: dto.substituteUserId },
      });
      if (!subUser) throw new BadRequestException('Utilizador substituto inválido.');
    }
    return this.prisma.substitution.update({
      where: { id },
      data: {
        ...(dto.date !== undefined ? { date: new Date(dto.date) } : {}),
        ...(dto.classGroupId !== undefined
          ? { classGroupId: dto.classGroupId }
          : {}),
        ...(dto.absentTeacher !== undefined
          ? { absentTeacher: dto.absentTeacher.trim() }
          : {}),
        ...(dto.substituteTeacher !== undefined
          ? { substituteTeacher: dto.substituteTeacher.trim() }
          : {}),
        ...(dto.substituteUserId !== undefined
          ? { substituteUserId: dto.substituteUserId || null }
          : {}),
        ...(dto.reason !== undefined
          ? { reason: dto.reason?.trim() || null }
          : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes?.trim() || null } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
      },
      include: substitutionInclude,
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.substitution.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Substituição não encontrada.');
    await this.prisma.substitution.delete({ where: { id } });
    return { ok: true, id };
  }
}
