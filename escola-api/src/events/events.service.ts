import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ContentStatus,
  EventRegistrationStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import {
  CreateEventDto,
  RegisterEventDto,
  UpdateEventDto,
} from './dto/event.dto';

type RequestUser = { id: string; email: string; role: string };

const eventInclude = {
  author: { select: { id: true, name: true, email: true } },
  unit: { select: { id: true, name: true } },
  _count: { select: { registrations: true } },
} as const;

/** Converte um valor recebido em Date (ou null). */
function parseDate(value?: string | null): Date | null {
  if (value == null || value === '') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('Data inválida');
  }
  return date;
}

/**
 * Determina publishAt/publishedAt ao publicar/agendar (igual ao CMS).
 * - Sem data ou data no passado → publica já.
 * - Data futura → agenda (publishedAt null até o job promover).
 */
function resolvePublishTiming(publishAt: Date | null) {
  const now = new Date();
  if (!publishAt || publishAt <= now) {
    return { publishAt, publishedAt: now };
  }
  return { publishAt, publishedAt: null as Date | null };
}

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // ─────────────────────────── Staff ───────────────────────────
  listForStaff() {
    return this.prisma.event.findMany({
      include: eventInclude,
      orderBy: [{ startAt: 'desc' }],
    });
  }

  async getForStaff(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: eventInclude,
    });
    if (!event) throw new NotFoundException('Evento não encontrado.');
    return event;
  }

  private async validateUnit(unitId?: string | null) {
    if (!unitId) return null;
    const unit = await this.prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) throw new BadRequestException('Unidade inválida.');
    return unit.id;
  }

  async create(dto: CreateEventDto, user: RequestUser) {
    const startAt = parseDate(dto.startAt);
    if (!startAt) throw new BadRequestException('Indique a data de início.');
    const endAt = parseDate(dto.endAt);
    if (endAt && endAt < startAt) {
      throw new BadRequestException('A data de fim é anterior ao início.');
    }
    const status = dto.status ?? ContentStatus.RASCUNHO;
    const timing =
      status === ContentStatus.PUBLICADO
        ? resolvePublishTiming(parseDate(dto.publishAt))
        : { publishAt: parseDate(dto.publishAt), publishedAt: null };
    return this.prisma.event.create({
      data: {
        title: dto.title.trim(),
        description: dto.description.trim(),
        type: dto.type,
        status,
        startAt,
        endAt,
        location: dto.location?.trim() || null,
        unitId: await this.validateUnit(dto.unitId),
        capacity: dto.capacity ?? null,
        priceAkz: dto.priceAkz ?? null,
        imageUrl: dto.imageUrl?.trim() || null,
        authorId: user.id,
        publishAt: timing.publishAt,
        publishedAt: timing.publishedAt,
      },
      include: eventInclude,
    });
  }

  async update(id: string, dto: UpdateEventDto, user: RequestUser) {
    const existing = await this.prisma.event.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Evento não encontrado.');

    const startAt =
      dto.startAt !== undefined ? parseDate(dto.startAt) : existing.startAt;
    if (!startAt) throw new BadRequestException('Indique a data de início.');
    const endAt =
      dto.endAt !== undefined ? parseDate(dto.endAt) : existing.endAt;
    if (endAt && endAt < startAt) {
      throw new BadRequestException('A data de fim é anterior ao início.');
    }

    return this.prisma.event.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description.trim() }
          : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.startAt !== undefined ? { startAt } : {}),
        ...(dto.endAt !== undefined ? { endAt } : {}),
        ...(dto.location !== undefined
          ? { location: dto.location?.trim() || null }
          : {}),
        ...(dto.unitId !== undefined
          ? { unitId: await this.validateUnit(dto.unitId) }
          : {}),
        ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
        ...(dto.priceAkz !== undefined ? { priceAkz: dto.priceAkz } : {}),
        ...(dto.imageUrl !== undefined
          ? { imageUrl: dto.imageUrl?.trim() || null }
          : {}),
      },
      include: eventInclude,
    });
  }

  async publish(id: string, publishAt?: string | null, user?: RequestUser) {
    const existing = await this.prisma.event.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Evento não encontrado.');
    const timing = resolvePublishTiming(parseDate(publishAt));
    const updated = await this.prisma.event.update({
      where: { id },
      data: {
        status: ContentStatus.PUBLICADO,
        publishAt: timing.publishAt,
        publishedAt: timing.publishedAt,
      },
      include: eventInclude,
    });
    await this.audit.record({
      userId: user?.id,
      action: 'EVENT_PUBLISHED',
      entity: 'Event',
      entityId: id,
      metadata: {
        title: existing.title,
        scheduled: !!timing.publishAt && !timing.publishedAt,
      },
    });
    return updated;
  }

  async archive(id: string) {
    const existing = await this.prisma.event.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Evento não encontrado.');
    return this.prisma.event.update({
      where: { id },
      data: { status: ContentStatus.ARQUIVADO },
      include: eventInclude,
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.event.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Evento não encontrado.');
    await this.prisma.event.delete({ where: { id } });
    return { ok: true, id };
  }

  // ─────────────────────────── Público ───────────────────────────
  /** Filtro de visibilidade pública: publicado e dentro da janela de agendamento. */
  private publicVisibleWhere(now: Date): Prisma.EventWhereInput {
    return {
      status: ContentStatus.PUBLICADO,
      OR: [{ publishAt: null }, { publishAt: { lte: now } }],
    };
  }

  /** Eventos publicados e futuros (ou a decorrer). */
  async listPublicUpcoming() {
    const now = new Date();
    const events = await this.prisma.event.findMany({
      where: {
        AND: [
          this.publicVisibleWhere(now),
          {
            OR: [{ endAt: { gte: now } }, { endAt: null, startAt: { gte: now } }],
          },
        ],
      },
      include: {
        unit: { select: { id: true, name: true } },
        _count: { select: { registrations: true } },
      },
      orderBy: [{ startAt: 'asc' }],
    });
    return events.map((event) => this.toPublic(event));
  }

  async getPublicOne(id: string) {
    const now = new Date();
    const event = await this.prisma.event.findFirst({
      where: { AND: [{ id }, this.publicVisibleWhere(now)] },
      include: {
        unit: { select: { id: true, name: true } },
        _count: { select: { registrations: true } },
      },
    });
    if (!event) throw new NotFoundException('Evento não encontrado.');
    return this.toPublic(event);
  }

  private toPublic(event: {
    id: string;
    title: string;
    description: string;
    type: string;
    startAt: Date;
    endAt: Date | null;
    location: string | null;
    capacity: number | null;
    priceAkz: number | null;
    imageUrl: string | null;
    unit: { id: string; name: string } | null;
    _count: { registrations: number };
  }) {
    const remaining =
      event.capacity != null
        ? Math.max(0, event.capacity - event._count.registrations)
        : null;
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      type: event.type,
      startAt: event.startAt,
      endAt: event.endAt,
      location: event.location,
      capacity: event.capacity,
      priceAkz: event.priceAkz,
      imageUrl: event.imageUrl,
      unit: event.unit,
      registrationsCount: event._count.registrations,
      spotsRemaining: remaining,
      isFull: remaining != null && remaining <= 0,
    };
  }

  // ────────────────────────── Inscrições ──────────────────────────
  listRegistrations(eventId: string) {
    return this.prisma.eventRegistration.findMany({
      where: { eventId },
      include: {
        student: { select: { id: true, childFullName: true } },
        guardianUser: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ createdAt: 'asc' }],
    });
  }

  async updateRegistrationStatus(
    registrationId: string,
    status: EventRegistrationStatus,
  ) {
    const existing = await this.prisma.eventRegistration.findUnique({
      where: { id: registrationId },
    });
    if (!existing) throw new NotFoundException('Inscrição não encontrada.');
    return this.prisma.eventRegistration.update({
      where: { id: registrationId },
      data: { status },
    });
  }

  /** Encarregado inscreve-se (ou uma criança sua) num evento publicado. */
  async register(eventId: string, dto: RegisterEventDto, user: RequestUser) {
    const now = new Date();
    const event = await this.prisma.event.findFirst({
      where: { AND: [{ id: eventId }, this.publicVisibleWhere(now)] },
      include: { _count: { select: { registrations: true } } },
    });
    if (!event) throw new NotFoundException('Evento não encontrado.');

    let childName = dto.childName?.trim() || '';
    if (dto.studentId) {
      const student = await this.prisma.student.findUnique({
        where: { id: dto.studentId },
      });
      if (!student) throw new BadRequestException('Aluno inválido.');
      const owns =
        student.guardianUserId === user.id ||
        student.guardianEmail.toLowerCase() === user.email.toLowerCase();
      if (!owns) {
        throw new ForbiddenException('Sem permissão para este aluno.');
      }
      childName = student.childFullName;
    }
    if (!childName) {
      throw new BadRequestException('Indique o nome da criança.');
    }

    const activeCount = await this.prisma.eventRegistration.count({
      where: { eventId, status: EventRegistrationStatus.INSCRITO },
    });
    const full = event.capacity != null && activeCount >= event.capacity;
    const status = full
      ? EventRegistrationStatus.LISTA_ESPERA
      : EventRegistrationStatus.INSCRITO;

    return this.prisma.eventRegistration.upsert({
      where: {
        eventId_guardianEmail: {
          eventId,
          guardianEmail: user.email.toLowerCase(),
        },
      },
      update: {
        childName,
        guardianName: dto.guardianName?.trim() || user.email,
        guardianPhone: dto.guardianPhone?.trim() || null,
        attendees: dto.attendees ?? 1,
        notes: dto.notes?.trim() || null,
        studentId: dto.studentId || null,
        guardianUserId: user.id,
        status,
      },
      create: {
        eventId,
        guardianUserId: user.id,
        studentId: dto.studentId || null,
        childName,
        guardianName: dto.guardianName?.trim() || user.email,
        guardianEmail: user.email.toLowerCase(),
        guardianPhone: dto.guardianPhone?.trim() || null,
        attendees: dto.attendees ?? 1,
        notes: dto.notes?.trim() || null,
        status,
      },
    });
  }

  /** Inscrições do encarregado autenticado (com dados do evento). */
  async listMine(user: RequestUser) {
    return this.prisma.eventRegistration.findMany({
      where: {
        OR: [
          { guardianUserId: user.id },
          { guardianEmail: user.email.toLowerCase() },
        ],
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            type: true,
            startAt: true,
            endAt: true,
            location: true,
            unit: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  /** Encarregado cancela a sua própria inscrição. */
  async cancelMine(registrationId: string, user: RequestUser) {
    const existing = await this.prisma.eventRegistration.findUnique({
      where: { id: registrationId },
    });
    if (!existing) throw new NotFoundException('Inscrição não encontrada.');
    const owns =
      existing.guardianUserId === user.id ||
      existing.guardianEmail.toLowerCase() === user.email.toLowerCase();
    if (!owns) throw new ForbiddenException('Sem permissão.');
    await this.prisma.eventRegistration.update({
      where: { id: registrationId },
      data: { status: EventRegistrationStatus.CANCELADO },
    });
    return { ok: true, id: registrationId };
  }

  // ────────────────── Job: promover eventos agendados ──────────────────
  async processScheduledEvents() {
    const now = new Date();
    const result = await this.prisma.event.updateMany({
      where: {
        status: ContentStatus.PUBLICADO,
        publishAt: { lte: now },
        publishedAt: null,
      },
      data: { publishedAt: now },
    });
    return {
      processed: result.count,
      message:
        result.count > 0
          ? `${result.count} evento(s) agendado(s) promovido(s) para público.`
          : 'Sem eventos agendados por promover.',
    };
  }
}
