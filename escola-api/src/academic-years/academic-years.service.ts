import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AcademicYearsService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.academicYear.findMany({ orderBy: { label: 'desc' } });
  }

  async findActive() {
    const year = await this.prisma.academicYear.findFirst({
      where: { active: true },
    });
    if (!year) throw new NotFoundException('Nenhum ano letivo activo');
    return year;
  }

  async create(data: { label: string; active?: boolean }) {
    if (data.active) {
      await this.prisma.academicYear.updateMany({ data: { active: false } });
    }
    return this.prisma.academicYear.create({
      data: { label: data.label, active: data.active ?? false },
    });
  }

  async update(id: string, data: { label?: string; active?: boolean }) {
    if (data.active) {
      await this.prisma.academicYear.updateMany({ data: { active: false } });
    }
    return this.prisma.academicYear.update({ where: { id }, data });
  }
}
