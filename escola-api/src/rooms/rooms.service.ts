import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ageInYears, roomMatchesAge } from '../common/utils/age';
import { unitNameCandidates } from '../units/units.service';

export type RoomDependencies = {
  roomId: string;
  roomName: string;
  classGroups: { count: number; names: string[] };
  enrollments: number;
  renewals: number;
  students: number;
  waitlistEntries: number;
  hasAssociations: boolean;
};

export type RoomDeleteResult = {
  room: {
    id: string;
    name: string;
    unitId: string;
    serviceId: string;
    academicYearId: string;
    active: boolean;
    unit: { id: string; name: string };
    service: { id: string; name: string };
    academicYear: { id: string; label: string };
  };
  cleared: {
    classGroups: { count: number; names: string[] };
    enrollments: number;
    renewals: number;
    students: number;
    waitlistEntries: number;
  };
};

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
        unit: { name: { in: unitNameCandidates(params.unitName) } },
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

  /**
   * Lista o que está associado à sala (turmas, inscrições, etc.) para o
   * diálogo de confirmação no admin antes de eliminar.
   */
  async getDependencies(id: string): Promise<RoomDependencies> {
    const room = await this.getOrThrow(id);
    const [classGroups, enrollments, renewals, students, waitlistEntries] =
      await Promise.all([
        this.prisma.classGroup.findMany({
          where: { roomId: room.id },
          select: { name: true },
          orderBy: { name: 'asc' },
        }),
        this.prisma.enrollment.count({ where: { roomId: room.id } }),
        this.prisma.renewal.count({ where: { roomId: room.id } }),
        this.prisma.student.count({ where: { roomId: room.id } }),
        this.prisma.waitlistEntry.count({ where: { roomId: room.id } }),
      ]);

    const names = classGroups.map((g) => g.name);
    const hasAssociations =
      names.length > 0 ||
      enrollments > 0 ||
      renewals > 0 ||
      students > 0 ||
      waitlistEntries > 0;

    return {
      roomId: room.id,
      roomName: room.name,
      classGroups: { count: names.length, names },
      enrollments,
      renewals,
      students,
      waitlistEntries,
      hasAssociations,
    };
  }

  /**
   * Remove definitivamente uma sala. Em transacção:
   * 1) desassocia FKs opcionais (Enrollment, WaitlistEntry, Student, Renewal);
   * 2) elimina a sala — ClassGroup tem onDelete: Cascade, pelo que as turmas
   *    (e presenças/sumários/avaliações/horários em cascata) são removidas.
   * A desactivação sem perda de histórico continua disponível via
   * PATCH /rooms/:id/active.
   */
  async remove(id: string): Promise<RoomDeleteResult> {
    const deps = await this.getDependencies(id);

    return this.prisma.$transaction(async (tx) => {
      const [enrollments, waitlistEntries, students, renewals] =
        await Promise.all([
          tx.enrollment.updateMany({
            where: { roomId: deps.roomId },
            data: { roomId: null },
          }),
          tx.waitlistEntry.updateMany({
            where: { roomId: deps.roomId },
            data: { roomId: null },
          }),
          tx.student.updateMany({
            where: { roomId: deps.roomId },
            data: { roomId: null },
          }),
          tx.renewal.updateMany({
            where: { roomId: deps.roomId },
            data: { roomId: null },
          }),
        ]);

      const room = await tx.room.delete({
        where: { id: deps.roomId },
        include: { unit: true, service: true, academicYear: true },
      });

      return {
        room,
        cleared: {
          classGroups: deps.classGroups,
          enrollments: enrollments.count,
          renewals: renewals.count,
          students: students.count,
          waitlistEntries: waitlistEntries.count,
        },
      };
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
