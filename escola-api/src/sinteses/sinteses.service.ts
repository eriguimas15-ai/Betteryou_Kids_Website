import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DescriptiveReportStatus,
  Prisma,
  Role,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDescriptiveReportDto,
  UpdateDescriptiveReportDto,
} from './dto/sinteses.dto';

type RequestUser = { id: string; email: string; role: string };

const reportInclude = {
  student: {
    select: {
      id: true,
      childFullName: true,
      guardianUserId: true,
      guardianEmail: true,
      unitId: true,
      unit: { select: { id: true, name: true } },
      service: { select: { id: true, name: true } },
      room: { select: { id: true, name: true } },
      academicYear: { select: { id: true, label: true } },
    },
  },
  academicYear: { select: { id: true, label: true } },
  author: { select: { id: true, name: true, email: true } },
} as const;

@Injectable()
export class SintesesService {
  constructor(private prisma: PrismaService) {}

  list(filters: {
    unitId?: string;
    studentId?: string;
    academicYearId?: string;
    status?: DescriptiveReportStatus;
  }) {
    const where: Prisma.DescriptiveReportWhereInput = {};
    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.academicYearId) where.academicYearId = filters.academicYearId;
    if (filters.status) where.status = filters.status;
    if (filters.unitId) {
      where.student = { unitId: filters.unitId };
    }
    return this.prisma.descriptiveReport.findMany({
      where,
      include: reportInclude,
      orderBy: [{ updatedAt: 'desc' }],
    });
  }

  async get(id: string) {
    const report = await this.prisma.descriptiveReport.findUnique({
      where: { id },
      include: reportInclude,
    });
    if (!report) throw new NotFoundException('Síntese descritiva não encontrada.');
    return report;
  }

  async listMine(user: RequestUser) {
    const where: Prisma.DescriptiveReportWhereInput = {
      status: DescriptiveReportStatus.PUBLICADO,
      student: {
        OR: [
          { guardianUserId: user.id },
          { guardianEmail: user.email.toLowerCase() },
        ],
      },
    };
    return this.prisma.descriptiveReport.findMany({
      where,
      include: reportInclude,
      orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  private async assertStudent(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new BadRequestException('Aluno inválido.');
    return student;
  }

  async create(dto: CreateDescriptiveReportDto, user: RequestUser) {
    await this.assertStudent(dto.studentId);
    if (dto.academicYearId) {
      const year = await this.prisma.academicYear.findUnique({
        where: { id: dto.academicYearId },
      });
      if (!year) throw new BadRequestException('Ano lectivo inválido.');
    }
    const status = dto.status ?? DescriptiveReportStatus.RASCUNHO;
    return this.prisma.descriptiveReport.create({
      data: {
        studentId: dto.studentId,
        academicYearId: dto.academicYearId || null,
        periodLabel: dto.periodLabel.trim(),
        areaFocus: dto.areaFocus?.trim() || null,
        body: dto.body.trim(),
        status,
        authorId: user.id,
        publishedAt:
          status === DescriptiveReportStatus.PUBLICADO ? new Date() : null,
      },
      include: reportInclude,
    });
  }

  async update(id: string, dto: UpdateDescriptiveReportDto) {
    const existing = await this.prisma.descriptiveReport.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Síntese descritiva não encontrada.');
    if (dto.academicYearId) {
      const year = await this.prisma.academicYear.findUnique({
        where: { id: dto.academicYearId },
      });
      if (!year) throw new BadRequestException('Ano lectivo inválido.');
    }
    const nextStatus = dto.status ?? existing.status;
    const publishedAt =
      nextStatus === DescriptiveReportStatus.PUBLICADO
        ? existing.publishedAt ?? new Date()
        : null;
    return this.prisma.descriptiveReport.update({
      where: { id },
      data: {
        ...(dto.academicYearId !== undefined
          ? { academicYearId: dto.academicYearId || null }
          : {}),
        ...(dto.periodLabel !== undefined
          ? { periodLabel: dto.periodLabel.trim() }
          : {}),
        ...(dto.areaFocus !== undefined
          ? { areaFocus: dto.areaFocus?.trim() || null }
          : {}),
        ...(dto.body !== undefined ? { body: dto.body.trim() } : {}),
        status: nextStatus,
        publishedAt,
      },
      include: reportInclude,
    });
  }

  async setPublished(id: string, published: boolean) {
    const existing = await this.prisma.descriptiveReport.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Síntese descritiva não encontrada.');
    return this.prisma.descriptiveReport.update({
      where: { id },
      data: {
        status: published
          ? DescriptiveReportStatus.PUBLICADO
          : DescriptiveReportStatus.RASCUNHO,
        publishedAt: published ? existing.publishedAt ?? new Date() : null,
      },
      include: reportInclude,
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.descriptiveReport.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Síntese descritiva não encontrada.');
    await this.prisma.descriptiveReport.delete({ where: { id } });
    return { ok: true, id };
  }

  async assertGuardianCanRead(id: string, user: RequestUser) {
    const report = await this.get(id);
    if (report.status !== DescriptiveReportStatus.PUBLICADO) {
      throw new ForbiddenException('Síntese ainda não publicada.');
    }
    const owns =
      report.student.guardianUserId === user.id ||
      report.student.guardianEmail?.toLowerCase() === user.email.toLowerCase() ||
      user.role === Role.ADMIN ||
      user.role === Role.DIRECAO ||
      user.role === Role.COORDENACAO ||
      user.role === Role.PROFESSOR;
    if (!owns) throw new ForbiddenException('Sem acesso a esta síntese.');
    return report;
  }
}
