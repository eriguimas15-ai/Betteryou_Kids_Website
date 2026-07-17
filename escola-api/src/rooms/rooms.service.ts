import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ageInYears, roomMatchesAge } from '../common/utils/age';

@Injectable()
export class RoomsService {
  constructor(private prisma: PrismaService) {}

  findAll(filters: {
    unitId?: string;
    serviceId?: string;
    academicYearId?: string;
    includeInactive?: boolean;
  }) {
    return this.prisma.room
      .findMany({
        where: {
          ...(filters.includeInactive ? {} : { active: true }),
          ...(filters.unitId ? { unitId: filters.unitId } : {}),
          ...(filters.serviceId ? { serviceId: filters.serviceId } : {}),
          ...(filters.academicYearId
            ? { academicYearId: filters.academicYearId }
            : {}),
        },
        include: {
          unit: true,
          service: true,
          academicYear: true,
        },
        orderBy: [
          { service: { name: 'asc' } },
          { levelLabel: 'asc' },
          { minAgeYears: 'asc' },
          { name: 'asc' },
        ],
      })
      .then((rooms) =>
        rooms.map((room) => ({
          ...room,
          availableVacancies: this.calcVacancies(room),
        })),
      );
  }

  async listForEnrollment(params: {
    unitName: string;
    serviceName: string;
    yearLabel: string;
    birthDate?: string;
    levelLabel?: string;
  }) {
    const rooms = await this.prisma.room.findMany({
      where: {
        active: true,
        unit: { name: params.unitName },
        service: { name: params.serviceName },
        academicYear: { label: params.yearLabel },
        ...(params.levelLabel ? { levelLabel: params.levelLabel } : {}),
      },
      include: { unit: true, service: true, academicYear: true },
      orderBy: [{ levelLabel: 'asc' }, { minAgeYears: 'asc' }, { name: 'asc' }],
    });

    const ageYears = params.birthDate
      ? ageInYears(new Date(params.birthDate))
      : null;

    const levels = [
      ...new Set(
        rooms.map((r) => r.levelLabel).filter((l): l is string => !!l),
      ),
    ];

    return {
      childAgeYears: ageYears,
      levels,
      rooms: rooms.map((room) => {
        const availableVacancies = this.calcVacancies(room);
        const ageEligible =
          ageYears == null ? true : roomMatchesAge(room, ageYears);
        return {
          id: room.id,
          name: room.name,
          levelLabel: room.levelLabel,
          ageLabel: room.ageLabel,
          minAgeYears: room.minAgeYears,
          maxAgeYears: room.maxAgeYears,
          capacity: room.capacity,
          enrolledCount: room.enrolledCount,
          renewalReserved: room.renewalReserved,
          enrollmentReserved: room.enrollmentReserved,
          availableVacancies,
          ageEligible,
          canEnroll: ageEligible && availableVacancies > 0,
          unit: room.unit.name,
          service: room.service.name,
        };
      }),
    };
  }

  /** @deprecated Prefer listForEnrollment */
  async getAvailability(
    unitName: string,
    serviceName: string,
    yearLabel: string,
    birthDate?: string,
  ) {
    const result = await this.listForEnrollment({
      unitName,
      serviceName,
      yearLabel,
      birthDate,
    });
    const eligible = result.rooms.filter((r) => r.ageEligible);
    const withVacancy = eligible.find((r) => r.availableVacancies > 0);
    const room = withVacancy || eligible[0] || result.rooms[0] || null;
    return {
      ...result,
      room,
      availableVacancies: room?.availableVacancies ?? 0,
      canEnroll: !!room?.canEnroll,
      message: room
        ? undefined
        : 'Nenhuma sala activa para esta combinação',
    };
  }

  calcVacancies(room: {
    capacity: number;
    enrolledCount: number;
    renewalReserved: number;
    enrollmentReserved: number;
  }) {
    return Math.max(
      0,
      room.capacity -
        room.enrolledCount -
        room.renewalReserved -
        room.enrollmentReserved,
    );
  }

  create(data: {
    name: string;
    unitId: string;
    serviceId: string;
    academicYearId: string;
    capacity: number;
    levelLabel?: string;
    ageLabel?: string;
    minAgeYears?: number;
    maxAgeYears?: number;
    enrolledCount?: number;
    renewalReserved?: number;
    enrollmentReserved?: number;
    active?: boolean;
  }) {
    return this.prisma.room.create({
      data: {
        ...data,
        ageLabel:
          data.ageLabel ||
          (data.minAgeYears != null && data.maxAgeYears != null
            ? `${data.minAgeYears} a ${data.maxAgeYears} anos`
            : data.ageLabel),
      },
      include: { unit: true, service: true, academicYear: true },
    });
  }

  update(
    id: string,
    data: {
      name?: string;
      unitId?: string;
      serviceId?: string;
      academicYearId?: string;
      capacity?: number;
      levelLabel?: string | null;
      ageLabel?: string | null;
      minAgeYears?: number | null;
      maxAgeYears?: number | null;
      enrolledCount?: number;
      renewalReserved?: number;
      enrollmentReserved?: number;
      active?: boolean;
    },
  ) {
    return this.prisma.room.update({
      where: { id },
      data,
      include: { unit: true, service: true, academicYear: true },
    });
  }

  async remove(id: string) {
    const room = await this.getOrThrow(id);
    return this.prisma.room.update({
      where: { id: room.id },
      data: { active: false },
    });
  }

  async getOrThrow(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
      include: { unit: true, service: true, academicYear: true },
    });
    if (!room) throw new NotFoundException('Sala não encontrada');
    return room;
  }

  async assertRoomForEnrollment(
    roomId: string,
    unitId: string,
    serviceId: string,
    academicYearId: string,
    birthDate: Date,
  ) {
    const room = await this.prisma.room.findUnique({ where: { id: roomId } });
    if (!room || !room.active) {
      throw new BadRequestException('Sala inválida ou desactivada');
    }
    if (
      room.unitId !== unitId ||
      room.serviceId !== serviceId ||
      room.academicYearId !== academicYearId
    ) {
      throw new BadRequestException(
        'A sala não corresponde à unidade/serviço/ano seleccionados',
      );
    }
    const age = ageInYears(birthDate);
    if (!roomMatchesAge(room, age)) {
      throw new BadRequestException(
        `A idade da criança (${age.toFixed(1)} anos) não é elegível para esta sala`,
      );
    }
    return room;
  }
}
