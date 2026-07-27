import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MeetingMinutesStatus,
  MeetingStatus,
  MeetingType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateMeetingDto,
  UpdateMeetingDto,
  UpsertMeetingMinutesDto,
} from './dto/reunioes.dto';

type RequestUser = { id: string; email: string; role: string };

const meetingInclude = {
  unit: { select: { id: true, name: true } },
  classGroup: {
    select: {
      id: true,
      name: true,
      room: {
        select: {
          name: true,
          unit: { select: { name: true } },
          service: { select: { name: true } },
        },
      },
    },
  },
  createdBy: { select: { id: true, name: true } },
  minutes: {
    include: {
      author: { select: { id: true, name: true } },
    },
  },
} as const;

@Injectable()
export class ReunioesService {
  constructor(private prisma: PrismaService) {}

  list(filters: {
    unitId?: string;
    classGroupId?: string;
    type?: MeetingType;
    status?: MeetingStatus;
  }) {
    const where: Prisma.MeetingWhereInput = {};
    if (filters.unitId) where.unitId = filters.unitId;
    if (filters.classGroupId) where.classGroupId = filters.classGroupId;
    if (filters.type) where.type = filters.type;
    if (filters.status) where.status = filters.status;
    return this.prisma.meeting.findMany({
      where,
      include: meetingInclude,
      orderBy: [{ dateTime: 'desc' }],
    });
  }

  /** Agenda do portal: reuniões visíveis aos encarregados. */
  listMineForGuardian(user: RequestUser) {
    return this.prisma.meeting.findMany({
      where: {
        visibleToGuardians: true,
        status: { not: MeetingStatus.CANCELADA },
        dateTime: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      include: {
        unit: { select: { id: true, name: true } },
        classGroup: { select: { id: true, name: true } },
      },
      orderBy: [{ dateTime: 'asc' }],
      take: 40,
    });
  }

  async get(id: string) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
      include: meetingInclude,
    });
    if (!meeting) throw new NotFoundException('Reunião não encontrada.');
    return meeting;
  }

  private async assertRefs(dto: {
    unitId?: string | null;
    classGroupId?: string | null;
  }) {
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

  async create(dto: CreateMeetingDto, user: RequestUser) {
    await this.assertRefs(dto);
    return this.prisma.meeting.create({
      data: {
        title: dto.title.trim(),
        dateTime: new Date(dto.dateTime),
        type: dto.type ?? MeetingType.PEDAGOGICA,
        participantsNotes: dto.participantsNotes?.trim() || null,
        unitId: dto.unitId || null,
        classGroupId: dto.classGroupId || null,
        status: dto.status ?? MeetingStatus.AGENDADA,
        visibleToGuardians: dto.visibleToGuardians ?? false,
        location: dto.location?.trim() || null,
        notes: dto.notes?.trim() || null,
        createdById: user.id,
      },
      include: meetingInclude,
    });
  }

  async update(id: string, dto: UpdateMeetingDto) {
    const existing = await this.prisma.meeting.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Reunião não encontrada.');
    await this.assertRefs({
      unitId: dto.unitId === undefined ? existing.unitId : dto.unitId,
      classGroupId:
        dto.classGroupId === undefined
          ? existing.classGroupId
          : dto.classGroupId,
    });
    return this.prisma.meeting.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.dateTime !== undefined
          ? { dateTime: new Date(dto.dateTime) }
          : {}),
        ...(dto.type !== undefined ? { type: dto.type } : {}),
        ...(dto.participantsNotes !== undefined
          ? { participantsNotes: dto.participantsNotes?.trim() || null }
          : {}),
        ...(dto.unitId !== undefined ? { unitId: dto.unitId || null } : {}),
        ...(dto.classGroupId !== undefined
          ? { classGroupId: dto.classGroupId || null }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.visibleToGuardians !== undefined
          ? { visibleToGuardians: dto.visibleToGuardians }
          : {}),
        ...(dto.location !== undefined
          ? { location: dto.location?.trim() || null }
          : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes?.trim() || null } : {}),
      },
      include: meetingInclude,
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.meeting.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Reunião não encontrada.');
    await this.prisma.meeting.delete({ where: { id } });
    return { ok: true, id };
  }

  async upsertMinutes(
    meetingId: string,
    dto: UpsertMeetingMinutesDto,
    user: RequestUser,
  ) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { minutes: true },
    });
    if (!meeting) throw new NotFoundException('Reunião não encontrada.');
    const status = dto.status ?? MeetingMinutesStatus.RASCUNHO;
    const publishedAt =
      status === MeetingMinutesStatus.PUBLICADA ? new Date() : null;

    if (meeting.minutes) {
      return this.prisma.meetingMinutes.update({
        where: { id: meeting.minutes.id },
        data: {
          content: dto.content.trim(),
          status,
          publishedAt:
            status === MeetingMinutesStatus.PUBLICADA
              ? meeting.minutes.publishedAt ?? new Date()
              : null,
          authorId: user.id,
        },
        include: {
          author: { select: { id: true, name: true } },
          meeting: { select: { id: true, title: true, dateTime: true } },
        },
      });
    }

    return this.prisma.meetingMinutes.create({
      data: {
        meetingId,
        content: dto.content.trim(),
        status,
        publishedAt,
        authorId: user.id,
      },
      include: {
        author: { select: { id: true, name: true } },
        meeting: { select: { id: true, title: true, dateTime: true } },
      },
    });
  }

  async publishMinutes(meetingId: string, publish: boolean) {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { minutes: true },
    });
    if (!meeting) throw new NotFoundException('Reunião não encontrada.');
    if (!meeting.minutes) {
      throw new BadRequestException('Esta reunião ainda não tem acta.');
    }
    return this.prisma.meetingMinutes.update({
      where: { id: meeting.minutes.id },
      data: {
        status: publish
          ? MeetingMinutesStatus.PUBLICADA
          : MeetingMinutesStatus.RASCUNHO,
        publishedAt: publish ? new Date() : null,
      },
      include: {
        author: { select: { id: true, name: true } },
        meeting: { select: { id: true, title: true, dateTime: true } },
      },
    });
  }

  /** Texto imprimível da acta (MVP em vez de PDF). */
  async printableMinutes(meetingId: string) {
    const meeting = await this.get(meetingId);
    if (!meeting.minutes) {
      throw new NotFoundException('Acta não encontrada para esta reunião.');
    }
    const lines = [
      `ACTA — ${meeting.title}`,
      `Data: ${meeting.dateTime.toISOString()}`,
      `Tipo: ${meeting.type}`,
      `Estado da reunião: ${meeting.status}`,
      meeting.unit ? `Unidade: ${meeting.unit.name}` : null,
      meeting.classGroup ? `Turma: ${meeting.classGroup.name}` : null,
      meeting.location ? `Local: ${meeting.location}` : null,
      meeting.participantsNotes
        ? `Participantes: ${meeting.participantsNotes}`
        : null,
      '',
      '--- Conteúdo ---',
      meeting.minutes.content,
      '',
      `Estado da acta: ${meeting.minutes.status}`,
      meeting.minutes.author
        ? `Autor: ${meeting.minutes.author.name}`
        : null,
      meeting.minutes.publishedAt
        ? `Publicada em: ${meeting.minutes.publishedAt.toISOString()}`
        : null,
    ].filter(Boolean);
    return {
      meetingId,
      title: meeting.title,
      text: lines.join('\n'),
      status: meeting.minutes.status,
    };
  }
}
