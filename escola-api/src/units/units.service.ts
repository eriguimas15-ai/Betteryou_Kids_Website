import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';

/** Nomes alternativos aceites na resolução por nome (legado Gika ↔ Sagrada Família). */
export function unitNameCandidates(name: string): string[] {
  const trimmed = name.trim();
  if (!trimmed) return [];
  const aliases = new Set<string>([trimmed]);
  if (/^gika$/i.test(trimmed) || /sagrada\s*fam[ií]lia/i.test(trimmed)) {
    aliases.add('Gika');
    aliases.add('Sagrada Família');
  }
  return [...aliases];
}

@Injectable()
export class UnitsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

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

  /** Resolve unidade activa pelo nome (aceita aliases legados). */
  async findActiveByName(name: string) {
    const candidates = unitNameCandidates(name);
    if (!candidates.length) return null;
    return this.prisma.unit.findFirst({
      where: { active: true, name: { in: candidates } },
    });
  }

  async create(data: { name: string; address?: string }, actorId?: string) {
    const unit = await this.prisma.unit.create({ data });
    await this.audit.record({
      userId: actorId,
      action: 'UNIT_CREATED',
      entity: 'Unit',
      entityId: unit.id,
      metadata: { name: unit.name },
    });
    return unit;
  }

  async update(
    id: string,
    data: { name?: string; address?: string; active?: boolean },
    actorId?: string,
  ) {
    const unit = await this.prisma.unit.update({ where: { id }, data });
    await this.audit.record({
      userId: actorId,
      action: 'UNIT_UPDATED',
      entity: 'Unit',
      entityId: id,
      metadata: { changes: { ...data } },
    });
    return unit;
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
