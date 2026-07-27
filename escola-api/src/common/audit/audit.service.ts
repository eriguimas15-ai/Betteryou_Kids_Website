import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Dados mínimos do actor (utilizador autenticado) para o registo de auditoria. */
export type AuditActor = { id?: string | null } | null | undefined;

export type RecordAuditParams = {
  /** Utilizador que despoletou a acção (null = sistema/anónimo). */
  actor?: AuditActor;
  /** Identificador directo do utilizador (alternativa a actor). */
  userId?: string | null;
  /** Verbo/acção, ex.: 'INVOICE_CREATED', 'LOGIN'. */
  action: string;
  /** Entidade afectada, ex.: 'Invoice', 'User'. */
  entity: string;
  /** Identificador da entidade afectada (opcional). */
  entityId?: string | null;
  /** Metadados adicionais em JSON (opcional). */
  metadata?: Prisma.InputJsonValue | null;
};

export type AuditListFilters = {
  userId?: string;
  action?: string;
  entity?: string;
  /** Data inicial inclusiva (ISO ou AAAA-MM-DD). */
  from?: string;
  /** Data final inclusiva (ISO ou AAAA-MM-DD). */
  to?: string;
  page?: number;
  pageSize?: number;
};

/**
 * Serviço reutilizável de auditoria. O registo nunca deve interromper o fluxo
 * de negócio: qualquer falha é apenas registada nos logs da aplicação.
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  /** Regista uma entrada de auditoria de forma resiliente (não lança). */
  async record(params: RecordAuditParams): Promise<void> {
    const userId = params.userId ?? params.actor?.id ?? null;
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId ?? null,
          metadata: params.metadata ?? Prisma.JsonNull,
        },
      });
    } catch (error) {
      this.logger.warn(
        `Falha ao registar auditoria (${params.action}/${params.entity}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /** Converte "AAAA-MM-DD" ou ISO num Date; devolve null se inválido. */
  private parseDate(value?: string, endOfDay = false): Date | null {
    if (!value) return null;
    const dayOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
    const iso = dayOnly
      ? `${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`
      : value;
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  /** Lista entradas de auditoria com filtros e paginação. */
  async list(filters: AuditListFilters) {
    const where: Prisma.AuditLogWhereInput = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = { contains: filters.action };
    if (filters.entity) where.entity = filters.entity;

    const from = this.parseDate(filters.from);
    const to = this.parseDate(filters.to, true);
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = from;
      if (to) where.createdAt.lte = to;
    }

    const page = Math.max(1, Math.floor(filters.page ?? 1));
    const pageSize = Math.min(200, Math.max(1, Math.floor(filters.pageSize ?? 50)));

    const [total, items] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      pageCount: Math.max(1, Math.ceil(total / pageSize)),
    };
  }

  /** Acções distintas registadas (para preencher filtros na UI). */
  async distinctActions(): Promise<string[]> {
    const rows = await this.prisma.auditLog.findMany({
      distinct: ['action'],
      select: { action: true },
      orderBy: { action: 'asc' },
      take: 200,
    });
    return rows.map((r) => r.action);
  }
}
