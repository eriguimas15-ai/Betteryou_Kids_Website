import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  findAll(activeOnly = true) {
    return this.prisma.unit.findMany({
      where: activeOnly ? { active: true } : undefined,
      include: {
        services: {
          include: { service: true },
          where: activeOnly ? { active: true } : undefined,
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: {
        services: { include: { service: true } },
        rooms: { include: { service: true, academicYear: true } },
      },
    });
    if (!unit) throw new NotFoundException('Unidade não encontrada');
    return unit;
  }

  create(data: { name: string; address?: string }) {
    return this.prisma.unit.create({ data });
  }

  update(
    id: string,
    data: { name?: string; address?: string; active?: boolean },
  ) {
    return this.prisma.unit.update({ where: { id }, data });
  }

  async setService(unitId: string, serviceId: string, active: boolean) {
    return this.prisma.unitService.upsert({
      where: { unitId_serviceId: { unitId, serviceId } },
      create: { unitId, serviceId, active },
      update: { active },
      include: { service: true, unit: true },
    });
  }
}
