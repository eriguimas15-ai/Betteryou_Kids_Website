import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  FeeKind,
  FeeProgram,
  InvoiceStatus,
  Prisma,
  Role,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit/audit.service';
import {
  CreateFeePlanDto,
  CreateInvoiceDto,
  CreatePaymentDto,
  GenerateInvoicesDto,
  SetStudentProgramDto,
  UpdateFeePlanDto,
  UpdateInvoiceDto,
} from './dto/financeiro.dto';

type RequestUser = { id: string; email: string; role: string };

const STAFF_ROLES: string[] = [Role.ADMIN, Role.DIRECAO];

/** Desconto de irmãos sobre a mensalidade (fonte: tabela BY Kids 2026/27). */
const SIBLING_DISCOUNT_SECOND_PCT = 10;
const SIBLING_DISCOUNT_OTHERS_PCT = 5;

/** Percentagem de desconto aplicável por ordem do irmão (0 = primeiro). */
function siblingDiscountPct(rank: number): number {
  if (rank <= 0) return 0;
  if (rank === 1) return SIBLING_DISCOUNT_SECOND_PCT;
  return SIBLING_DISCOUNT_OTHERS_PCT;
}

function applyDiscount(amount: number, pct: number): number {
  if (pct <= 0) return amount;
  return Math.round((amount * (100 - pct)) / 100);
}

const feePlanInclude = {
  unit: { select: { id: true, name: true } },
  service: { select: { id: true, name: true } },
  academicYear: { select: { id: true, label: true } },
} as const;

const invoiceInclude = {
  student: { select: { id: true, childFullName: true, guardianEmail: true } },
  feePlan: { select: { id: true, name: true } },
  payments: { orderBy: { paidAt: 'desc' } },
} as const satisfies Prisma.InvoiceInclude;

/** Converte uma data "AAAA-MM-DD" (dia) em Date UTC. */
function parseDateOnly(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) throw new BadRequestException('Data inválida');
  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('Data inválida');
  }
  return date;
}

/** Rótulo legível de um mês "AAAA-MM", ex.: "Mensalidade 2026-09". */
function defaultInvoiceDescription(referenceMonth: string): string {
  return `Mensalidade ${referenceMonth}`;
}

@Injectable()
export class FinanceiroService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  private assertStaff(user: RequestUser) {
    if (!STAFF_ROLES.includes(user.role)) {
      throw new ForbiddenException('Sem permissão para a área financeira.');
    }
  }

  private assertCanAccessGuardianData(
    owner: { guardianUserId: string | null; guardianEmail: string },
    user: RequestUser,
  ) {
    if (STAFF_ROLES.includes(user.role)) return;
    const emailMatch =
      owner.guardianEmail.toLowerCase() === user.email.toLowerCase();
    const userMatch = owner.guardianUserId === user.id;
    if (!emailMatch && !userMatch) {
      throw new ForbiddenException('Sem acesso aos dados deste aluno.');
    }
  }

  // ─────────────────────────── Planos de propina ───────────────────────────

  listFeePlans() {
    return this.prisma.feePlan.findMany({
      include: feePlanInclude,
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    });
  }

  private async validateUnit(unitId?: string | null) {
    if (!unitId) return null;
    const unit = await this.prisma.unit.findUnique({ where: { id: unitId } });
    if (!unit) throw new BadRequestException('Unidade inválida.');
    return unit.id;
  }

  private async validateService(serviceId?: string | null) {
    if (!serviceId) return null;
    const service = await this.prisma.serviceOffering.findUnique({
      where: { id: serviceId },
    });
    if (!service) throw new BadRequestException('Serviço inválido.');
    return service.id;
  }

  private async validateAcademicYear(academicYearId?: string | null) {
    if (!academicYearId) return null;
    const year = await this.prisma.academicYear.findUnique({
      where: { id: academicYearId },
    });
    if (!year) throw new BadRequestException('Ano letivo inválido.');
    return year.id;
  }

  async createFeePlan(dto: CreateFeePlanDto, user?: RequestUser) {
    const plan = await this.prisma.feePlan.create({
      data: {
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        kind: dto.kind ?? FeeKind.PROPINA,
        amountAkz: dto.amountAkz,
        unitId: await this.validateUnit(dto.unitId),
        serviceId: await this.validateService(dto.serviceId),
        program: dto.program ?? null,
        academicYearId: await this.validateAcademicYear(dto.academicYearId),
      },
      include: feePlanInclude,
    });
    await this.audit.record({
      userId: user?.id,
      action: 'FEE_PLAN_CREATED',
      entity: 'FeePlan',
      entityId: plan.id,
      metadata: { name: plan.name, kind: plan.kind, amountAkz: plan.amountAkz },
    });
    return plan;
  }

  async updateFeePlan(id: string, dto: UpdateFeePlanDto, user?: RequestUser) {
    const existing = await this.prisma.feePlan.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Plano não encontrado.');
    await this.audit.record({
      userId: user?.id,
      action: 'FEE_PLAN_UPDATED',
      entity: 'FeePlan',
      entityId: id,
      metadata: { changes: { ...dto } },
    });
    return this.prisma.feePlan.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description?.trim() || null }
          : {}),
        ...(dto.kind !== undefined ? { kind: dto.kind } : {}),
        ...(dto.amountAkz !== undefined ? { amountAkz: dto.amountAkz } : {}),
        ...(dto.unitId !== undefined
          ? { unitId: await this.validateUnit(dto.unitId) }
          : {}),
        ...(dto.serviceId !== undefined
          ? { serviceId: await this.validateService(dto.serviceId) }
          : {}),
        ...(dto.program !== undefined ? { program: dto.program ?? null } : {}),
        ...(dto.academicYearId !== undefined
          ? {
              academicYearId: await this.validateAcademicYear(
                dto.academicYearId,
              ),
            }
          : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
      include: feePlanInclude,
    });
  }

  async removeFeePlan(id: string, user?: RequestUser) {
    const existing = await this.prisma.feePlan.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Plano não encontrado.');
    await this.prisma.feePlan.delete({ where: { id } });
    await this.audit.record({
      userId: user?.id,
      action: 'FEE_PLAN_DELETED',
      entity: 'FeePlan',
      entityId: id,
      metadata: { name: existing.name },
    });
    return { ok: true, id };
  }

  // ─────────────────────────── Faturas / mensalidades ───────────────────────────

  listInvoices(filters: {
    studentId?: string;
    status?: string;
    referenceMonth?: string;
  }) {
    const where: Prisma.InvoiceWhereInput = {};
    if (filters.studentId) where.studentId = filters.studentId;
    if (filters.referenceMonth) where.referenceMonth = filters.referenceMonth;
    if (
      filters.status &&
      (Object.values(InvoiceStatus) as string[]).includes(filters.status)
    ) {
      where.status = filters.status as InvoiceStatus;
    }
    return this.prisma.invoice.findMany({
      where,
      include: invoiceInclude,
      orderBy: [{ referenceMonth: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getInvoice(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: invoiceInclude,
    });
    if (!invoice) throw new NotFoundException('Fatura não encontrada.');
    return invoice;
  }

  private async getStudentOrThrow(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new BadRequestException('Aluno inválido.');
    return student;
  }

  async createInvoice(dto: CreateInvoiceDto, user: RequestUser) {
    const student = await this.getStudentOrThrow(dto.studentId);
    let amount = dto.amountAkz;
    if (dto.feePlanId) {
      const plan = await this.prisma.feePlan.findUnique({
        where: { id: dto.feePlanId },
      });
      if (!plan) throw new BadRequestException('Plano inválido.');
      if (amount === undefined) amount = plan.amountAkz;
    }
    if (amount === undefined) {
      throw new BadRequestException('Indique o valor ou o plano de propina.');
    }
    const existing = await this.prisma.invoice.findUnique({
      where: {
        studentId_referenceMonth: {
          studentId: dto.studentId,
          referenceMonth: dto.referenceMonth,
        },
      },
    });
    if (existing) {
      throw new BadRequestException(
        'Já existe uma fatura para este aluno neste mês.',
      );
    }
    const invoice = await this.prisma.invoice.create({
      data: {
        studentId: dto.studentId,
        feePlanId: dto.feePlanId || null,
        referenceMonth: dto.referenceMonth,
        description:
          dto.description?.trim() ||
          defaultInvoiceDescription(dto.referenceMonth),
        amountAkz: amount,
        dueDate: parseDateOnly(dto.dueDate),
        guardianEmail: student.guardianEmail.toLowerCase(),
        notes: dto.notes?.trim() || null,
        createdById: user.id,
      },
      include: invoiceInclude,
    });
    await this.audit.record({
      userId: user.id,
      action: 'INVOICE_CREATED',
      entity: 'Invoice',
      entityId: invoice.id,
      metadata: {
        studentId: dto.studentId,
        referenceMonth: dto.referenceMonth,
        amountAkz: amount,
      },
    });
    return invoice;
  }

  async generateInvoices(dto: GenerateInvoicesDto, user: RequestUser) {
    const dueDate = parseDateOnly(dto.dueDate);
    const applyDiscounts = dto.applySiblingDiscount !== false;

    // Modo de valor: plano fixo, valor fixo ou resolução automática.
    let planFilterServiceId: string | null = null;
    let flatAmount: number | undefined;
    let flatPlanId: string | null = null;
    // Auto: propina por unidade+serviço+programa, com fallback por serviço+programa.
    let unitProgramMap: Map<string, { id: string; amountAkz: number }> | null =
      null;
    let fallbackProgramMap: Map<
      string,
      { id: string; amountAkz: number }
    > | null = null;

    if (dto.feePlanId) {
      const plan = await this.prisma.feePlan.findUnique({
        where: { id: dto.feePlanId },
      });
      if (!plan) throw new BadRequestException('Plano inválido.');
      flatAmount = plan.amountAkz;
      flatPlanId = plan.id;
      planFilterServiceId = plan.serviceId;
    } else if (dto.amountAkz !== undefined) {
      flatAmount = dto.amountAkz;
    } else {
      // Resolução automática: mapas por unidade+serviço+programa e por serviço+programa.
      const propinas = await this.prisma.feePlan.findMany({
        where: {
          kind: FeeKind.PROPINA,
          active: true,
          serviceId: { not: null },
          program: { not: null },
        },
        select: {
          id: true,
          amountAkz: true,
          unitId: true,
          serviceId: true,
          program: true,
        },
      });
      unitProgramMap = new Map();
      fallbackProgramMap = new Map();
      for (const p of propinas) {
        const entry = { id: p.id, amountAkz: p.amountAkz };
        if (p.unitId) {
          unitProgramMap.set(`${p.unitId}|${p.serviceId}|${p.program}`, entry);
        }
        // Primeiro plano encontrado por serviço+programa serve de recurso.
        const fk = `${p.serviceId}|${p.program}`;
        if (!fallbackProgramMap.has(fk)) fallbackProgramMap.set(fk, entry);
      }
    }

    const studentWhere: Prisma.StudentWhereInput = {};
    if (dto.studentIds && dto.studentIds.length > 0) {
      studentWhere.id = { in: dto.studentIds };
    } else if (planFilterServiceId) {
      studentWhere.serviceId = planFilterServiceId;
    }
    const students = await this.prisma.student.findMany({
      where: studentWhere,
      select: {
        id: true,
        guardianEmail: true,
        unitId: true,
        serviceId: true,
        program: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    if (students.length === 0) {
      throw new BadRequestException(
        'Sem alunos elegíveis para gerar mensalidades.',
      );
    }

    const existing = await this.prisma.invoice.findMany({
      where: {
        referenceMonth: dto.referenceMonth,
        studentId: { in: students.map((s) => s.id) },
      },
      select: { studentId: true },
    });
    const alreadyBilled = new Set(existing.map((e) => e.studentId));

    // Resolver valor-base e plano por aluno; contabilizar quem não resolve.
    let skippedNoPlan = 0;
    let resolvedByFallback = 0;
    const resolved: Array<{
      studentId: string;
      guardianEmail: string;
      baseAmount: number;
      feePlanId: string | null;
    }> = [];
    for (const s of students) {
      if (alreadyBilled.has(s.id)) continue;
      let baseAmount = flatAmount;
      let feePlanId = flatPlanId;
      if (unitProgramMap && fallbackProgramMap) {
        if (!s.program) {
          skippedNoPlan += 1;
          continue;
        }
        // 1.º: propina da unidade do aluno; 2.º: recurso por serviço+programa.
        let match = s.unitId
          ? unitProgramMap.get(`${s.unitId}|${s.serviceId}|${s.program}`)
          : undefined;
        if (!match) {
          match = fallbackProgramMap.get(`${s.serviceId}|${s.program}`);
          if (match) resolvedByFallback += 1;
        }
        if (!match) {
          skippedNoPlan += 1;
          continue;
        }
        baseAmount = match.amountAkz;
        feePlanId = match.id;
      }
      if (baseAmount === undefined) {
        throw new BadRequestException(
          'Indique um plano, um valor ou configure as propinas por programa.',
        );
      }
      resolved.push({
        studentId: s.id,
        guardianEmail: s.guardianEmail.toLowerCase(),
        baseAmount,
        feePlanId,
      });
    }

    // Ordem de irmãos por encarregado (para o desconto de família).
    const rankByGuardian = new Map<string, number>();
    const data = resolved.map((r) => {
      const rank = rankByGuardian.get(r.guardianEmail) ?? 0;
      rankByGuardian.set(r.guardianEmail, rank + 1);
      const pct = applyDiscounts ? siblingDiscountPct(rank) : 0;
      const amountAkz = applyDiscount(r.baseAmount, pct);
      const base =
        dto.description?.trim() ||
        defaultInvoiceDescription(dto.referenceMonth);
      const description =
        pct > 0 ? `${base} (desconto irmão ${pct}%)` : base;
      return {
        studentId: r.studentId,
        feePlanId: r.feePlanId,
        referenceMonth: dto.referenceMonth,
        description,
        amountAkz,
        dueDate,
        guardianEmail: r.guardianEmail,
        createdById: user.id,
      };
    });

    if (data.length > 0) {
      await this.prisma.invoice.createMany({ data });
    }

    return {
      created: data.length,
      skipped: alreadyBilled.size,
      skippedNoPlan,
      resolvedByFallback,
      total: students.length,
      message:
        data.length > 0
          ? `${data.length} mensalidade(s) geradas para ${dto.referenceMonth}.` +
            (resolvedByFallback > 0
              ? ` ${resolvedByFallback} sem propina da unidade (usado recurso por serviço).`
              : '') +
            (skippedNoPlan > 0
              ? ` ${skippedNoPlan} aluno(s) sem propina/programa por resolver.`
              : '')
          : 'Nenhuma mensalidade gerada (já existiam ou sem propina/programa).',
    };
  }

  async updateInvoice(id: string, dto: UpdateInvoiceDto) {
    const existing = await this.prisma.invoice.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Fatura não encontrada.');
    return this.prisma.invoice.update({
      where: { id },
      data: {
        ...(dto.description !== undefined
          ? { description: dto.description.trim() }
          : {}),
        ...(dto.amountAkz !== undefined ? { amountAkz: dto.amountAkz } : {}),
        ...(dto.dueDate !== undefined
          ? { dueDate: parseDateOnly(dto.dueDate) }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.notes !== undefined
          ? { notes: dto.notes?.trim() || null }
          : {}),
      },
      include: invoiceInclude,
    });
  }

  async cancelInvoice(id: string, user?: RequestUser) {
    const existing = await this.prisma.invoice.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Fatura não encontrada.');
    const updated = await this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.ANULADO },
      include: invoiceInclude,
    });
    await this.audit.record({
      userId: user?.id,
      action: 'INVOICE_CANCELLED',
      entity: 'Invoice',
      entityId: id,
      metadata: {
        studentId: existing.studentId,
        referenceMonth: existing.referenceMonth,
        amountAkz: existing.amountAkz,
      },
    });
    return updated;
  }

  async removeInvoice(id: string) {
    const existing = await this.prisma.invoice.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Fatura não encontrada.');
    await this.prisma.invoice.delete({ where: { id } });
    return { ok: true, id };
  }

  // ─────────────────────────── Pagamentos ───────────────────────────

  listPayments(invoiceId: string) {
    return this.prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { paidAt: 'desc' },
    });
  }

  /** Regista um pagamento e atualiza o estado da fatura conforme o saldo. */
  async createPayment(invoiceId: string, dto: CreatePaymentDto, user: RequestUser) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });
    if (!invoice) throw new NotFoundException('Fatura não encontrada.');
    if (invoice.status === InvoiceStatus.ANULADO) {
      throw new BadRequestException('Fatura anulada não pode receber pagamentos.');
    }

    const payment = await this.prisma.payment.create({
      data: {
        invoiceId,
        amountAkz: dto.amountAkz,
        paidAt: parseDateOnly(dto.paidAt),
        method: dto.method ?? undefined,
        reference: dto.reference?.trim() || null,
        receiptRef: dto.receiptRef?.trim() || null,
        notes: dto.notes?.trim() || null,
        recordedById: user.id,
      },
    });

    const paidTotal =
      invoice.payments.reduce((sum, p) => sum + p.amountAkz, 0) + dto.amountAkz;
    if (paidTotal >= invoice.amountAkz && invoice.status !== InvoiceStatus.PAGO) {
      await this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: InvoiceStatus.PAGO },
      });
    }

    await this.audit.record({
      userId: user.id,
      action: 'PAYMENT_CREATED',
      entity: 'Payment',
      entityId: payment.id,
      metadata: {
        invoiceId,
        amountAkz: dto.amountAkz,
        method: payment.method,
      },
    });

    return this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: invoiceInclude,
    });
  }

  // ─────────────────────────── Visão geral / saldos ───────────────────────────

  async overview() {
    const [byStatus, students, overdue] = await Promise.all([
      this.prisma.invoice.groupBy({
        by: ['status'],
        _sum: { amountAkz: true },
        _count: { _all: true },
      }),
      this.prisma.student.count(),
      this.prisma.invoice.count({
        where: {
          status: { in: [InvoiceStatus.PENDENTE, InvoiceStatus.VENCIDO] },
        },
      }),
    ]);
    const paymentsAgg = await this.prisma.payment.aggregate({
      _sum: { amountAkz: true },
    });
    const summary: Record<
      string,
      { count: number; amountAkz: number }
    > = {};
    for (const row of byStatus) {
      summary[row.status] = {
        count: row._count._all,
        amountAkz: row._sum.amountAkz ?? 0,
      };
    }
    return {
      studentsCount: students,
      outstandingCount: overdue,
      totalReceivedAkz: paymentsAgg._sum.amountAkz ?? 0,
      byStatus: summary,
    };
  }

  /** Alunos com totais de faturação/pagamento (para gestão de saldos). */
  async studentsWithBalance() {
    const students = await this.prisma.student.findMany({
      orderBy: { childFullName: 'asc' },
      select: {
        id: true,
        childFullName: true,
        guardianFullName: true,
        guardianEmail: true,
        serviceId: true,
        program: true,
        service: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
        invoices: {
          select: {
            amountAkz: true,
            status: true,
            payments: { select: { amountAkz: true } },
          },
        },
      },
    });
    return students.map((s) => {
      let billed = 0;
      let paid = 0;
      let outstanding = 0;
      for (const inv of s.invoices) {
        if (inv.status === InvoiceStatus.ANULADO) continue;
        const invPaid = inv.payments.reduce((sum, p) => sum + p.amountAkz, 0);
        billed += inv.amountAkz;
        paid += invPaid;
        outstanding += Math.max(inv.amountAkz - invPaid, 0);
      }
      return {
        id: s.id,
        childFullName: s.childFullName,
        guardianFullName: s.guardianFullName,
        guardianEmail: s.guardianEmail,
        serviceId: s.serviceId,
        program: s.program,
        service: s.service,
        unit: s.unit,
        invoiceCount: s.invoices.length,
        billedAkz: billed,
        paidAkz: paid,
        outstandingAkz: outstanding,
      };
    });
  }

  /** Define/actualiza o programa/tempo de um aluno (resolve a propina). */
  async setStudentProgram(studentId: string, dto: SetStudentProgramDto) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado.');
    return this.prisma.student.update({
      where: { id: studentId },
      data: { program: (dto.program ?? null) as FeeProgram | null },
      select: { id: true, childFullName: true, program: true },
    });
  }

  // ─────────────────────── Portal do encarregado ───────────────────────

  /** Faturas dos filhos do encarregado autenticado (leitura). */
  async myInvoices(user: RequestUser) {
    const students = await this.prisma.student.findMany({
      where: {
        OR: [
          { guardianUserId: user.id },
          { guardianEmail: { equals: user.email.toLowerCase() } },
        ],
      },
      select: { id: true },
    });
    if (students.length === 0) return [];
    return this.prisma.invoice.findMany({
      where: { studentId: { in: students.map((s) => s.id) } },
      include: invoiceInclude,
      orderBy: [{ referenceMonth: 'desc' }, { createdAt: 'desc' }],
    });
  }

  // ─────────────────── Job: marcar faturas vencidas ───────────────────

  async processOverdue() {
    const now = new Date();
    const result = await this.prisma.invoice.updateMany({
      where: { status: InvoiceStatus.PENDENTE, dueDate: { lt: now } },
      data: { status: InvoiceStatus.VENCIDO },
    });
    return {
      processed: result.count,
      message:
        result.count > 0
          ? `${result.count} fatura(s) marcadas como vencidas.`
          : 'Sem faturas vencidas por actualizar.',
    };
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleOverdueCron() {
    await this.processOverdue();
  }
}
