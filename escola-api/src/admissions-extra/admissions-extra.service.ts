import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JobStatus, RenewalStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StudentsService } from '../students/students.service';
import { RoomsService } from '../rooms/rooms.service';
import {
  assertSharedFormComplete,
  primaryPersonFields,
  type GuardianInput,
  type EmergencyInput,
} from '../common/person-form';

@Injectable()
export class RenewalsService {
  constructor(
    private prisma: PrismaService,
    private students: StudentsService,
    private rooms: RoomsService,
  ) {}

  list(status?: RenewalStatus) {
    return this.prisma.renewal.findMany({
      where: status ? { status } : undefined,
      include: {
        unit: true,
        service: true,
        academicYear: true,
        room: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: {
    yearLabel: string;
    unitName: string;
    serviceName: string;
    roomId?: string;
    childFullName: string;
    childBirthDate?: string;
    childSex?: string;
    childBirthPlace?: string;
    childNationality?: string;
    childAddress?: string;
    guardianFullName?: string;
    guardianIdNumber?: string;
    guardianPhone?: string;
    guardianAltPhone?: string;
    guardianEmail?: string;
    guardianProfession?: string;
    guardianRelationship?: string;
    guardianAddress?: string;
    emergencyName?: string;
    emergencyPhone?: string;
    emergencyRelation?: string;
    allergies?: string;
    medication?: string;
    foodRestrictions?: string;
    medicalNotes?: string;
    previousYearLabel?: string;
    notes?: string;
    guardians?: GuardianInput[];
    emergencyContacts?: EmergencyInput[];
    activities?: string[];
  }) {
    assertSharedFormComplete(data);
    const person = primaryPersonFields(data);

    const year = await this.prisma.academicYear.findUnique({
      where: { label: data.yearLabel },
    });
    if (!year) throw new BadRequestException('Ano letivo inválido');

    const unit = await this.prisma.unit.findUnique({
      where: { name: data.unitName },
    });
    if (!unit) throw new BadRequestException('Unidade inválida');

    const service = await this.prisma.serviceOffering.findUnique({
      where: { name: data.serviceName },
    });
    if (!service) throw new BadRequestException('Serviço inválido');

    let roomId: string | null = data.roomId || null;
    let status: RenewalStatus = RenewalStatus.PENDENTE;

    if (roomId) {
      const room = await this.prisma.room.findUnique({ where: { id: roomId } });
      if (!room || !room.active) {
        throw new BadRequestException('Sala inválida');
      }
      if (this.rooms.calcVacancies(room) <= 0) {
        status = RenewalStatus.LISTA_ESPERA;
      }
    } else {
      status = RenewalStatus.LISTA_ESPERA;
    }

    const birthDate = data.childBirthDate
      ? new Date(data.childBirthDate)
      : null;

    const renewal = await this.prisma.renewal.create({
      data: {
        academicYearId: year.id,
        unitId: unit.id,
        serviceId: service.id,
        roomId,
        childFullName: data.childFullName.trim(),
        childBirthDate: birthDate,
        childSex: data.childSex || null,
        childBirthPlace: data.childBirthPlace || null,
        childNationality: data.childNationality || null,
        childAddress: data.childAddress || null,
        ...person.flat,
        guardians: person.guardians,
        emergencyContacts: person.emergencies,
        activities: person.activities,
        previousYearLabel: data.previousYearLabel || null,
        notes: data.notes || null,
        status,
      },
      include: {
        unit: true,
        service: true,
        academicYear: true,
        room: true,
      },
    });

    return {
      ...renewal,
      estado:
        status === RenewalStatus.LISTA_ESPERA
          ? ('lista_espera' as const)
          : ('pendente' as const),
      message:
        status === RenewalStatus.LISTA_ESPERA
          ? 'Não há vaga disponível. O pedido de renovação entrou na lista de espera.'
          : 'Pedido de renovação submetido com sucesso. A equipa irá validar.',
    };
  }

  async setStatus(id: string, status: RenewalStatus) {
    const renewal = await this.prisma.renewal.findUnique({ where: { id } });
    if (!renewal) throw new NotFoundException('Renovação não encontrada');

    if (status === RenewalStatus.CONFIRMADA && renewal.roomId) {
      const room = await this.prisma.room.findUnique({
        where: { id: renewal.roomId },
      });
      if (!room || this.rooms.calcVacancies(room) <= 0) {
        throw new BadRequestException(
          'Não há vagas nesta sala para confirmar a renovação',
        );
      }
      await this.prisma.room.update({
        where: { id: renewal.roomId },
        data: { renewalReserved: { increment: 1 } },
      });
    }

    const updated = await this.prisma.renewal.update({
      where: { id },
      data: { status },
      include: {
        unit: true,
        service: true,
        academicYear: true,
        room: true,
      },
    });

    if (status === RenewalStatus.CONFIRMADA) {
      await this.students.createFromRenewal(updated.id);
    }

    return updated;
  }

  async remove(id: string) {
    await this.prisma.renewal.delete({ where: { id } });
    return { ok: true };
  }
}

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  listPublic() {
    return this.prisma.jobOpening.findMany({
      where: { status: JobStatus.PUBLICADA },
      orderBy: { publishedAt: 'desc' },
    });
  }

  listAll() {
    return this.prisma.jobOpening.findMany({
      orderBy: { updatedAt: 'desc' },
    });
  }

  create(data: {
    title: string;
    department?: string;
    location?: string;
    description: string;
    requirements?: string;
    status?: JobStatus;
  }) {
    const status = data.status || JobStatus.RASCUNHO;
    return this.prisma.jobOpening.create({
      data: {
        title: data.title.trim(),
        department: data.department?.trim() || null,
        location: data.location?.trim() || null,
        description: data.description.trim(),
        requirements: data.requirements?.trim() || null,
        status,
        publishedAt: status === JobStatus.PUBLICADA ? new Date() : null,
      },
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      department?: string | null;
      location?: string | null;
      description?: string;
      requirements?: string | null;
      status?: JobStatus;
    },
  ) {
    const current = await this.prisma.jobOpening.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Vaga não encontrada');

    const status = data.status ?? current.status;
    return this.prisma.jobOpening.update({
      where: { id },
      data: {
        ...(data.title != null ? { title: data.title.trim() } : {}),
        ...(data.department !== undefined
          ? { department: data.department }
          : {}),
        ...(data.location !== undefined ? { location: data.location } : {}),
        ...(data.description != null
          ? { description: data.description.trim() }
          : {}),
        ...(data.requirements !== undefined
          ? { requirements: data.requirements }
          : {}),
        status,
        publishedAt:
          status === JobStatus.PUBLICADA
            ? current.publishedAt || new Date()
            : null,
      },
    });
  }

  async remove(id: string) {
    await this.prisma.jobOpening.delete({ where: { id } });
    return { ok: true };
  }
}

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  listPublic(serviceName?: string) {
    const trimmed = serviceName?.trim();
    if (trimmed) {
      return this.prisma.activityServiceOffering
        .findMany({
          where: {
            active: true,
            activity: { active: true },
            service: { name: trimmed, active: true },
          },
          include: {
            activity: true,
            service: { select: { id: true, name: true } },
          },
          orderBy: [
            { activity: { sortOrder: 'asc' } },
            { activity: { name: 'asc' } },
          ],
        })
        .then((rows) =>
          rows.map((row) => ({
            id: row.activity.id,
            name: row.activity.name,
            category: row.activity.category,
            description: row.activity.description,
            active: row.activity.active,
            sortOrder: row.activity.sortOrder,
            pricing: row.pricing,
            priceAkz: row.priceAkz,
            serviceName: row.service.name,
          })),
        );
    }

    return this.prisma.activityOffering.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        services: {
          where: { active: true },
          include: { service: { select: { id: true, name: true } } },
        },
      },
    });
  }

  listAll() {
    return this.prisma.activityOffering.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        services: {
          include: { service: { select: { id: true, name: true } } },
          orderBy: { service: { name: 'asc' } },
        },
      },
    });
  }
}
