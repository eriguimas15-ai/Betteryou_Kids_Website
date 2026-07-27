import { Injectable } from '@nestjs/common';
import {
  AttendanceStatus,
  BehaviorType,
  EnrollmentStatus,
  InvoiceStatus,
  PeiStatus,
  Prisma,
  ReportCardStatus,
  SubstitutionStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RoomsService } from '../rooms/rooms.service';

/** Mês de referência actual no formato "AAAA-MM". */
function currentReferenceMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function percentage(part: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.round((part / total) * 1000) / 10;
}

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private rooms: RoomsService,
  ) {}

  /**
   * Painel executivo: KPIs agregados de ocupação, admissões e financeiro,
   * com filtro opcional por unidade.
   */
  async executivo(unitId?: string) {
    const unitFilter = unitId && unitId !== 'all' ? unitId : undefined;
    const currentMonth = currentReferenceMonth();

    const roomWhere: Prisma.RoomWhereInput = { active: true };
    if (unitFilter) roomWhere.unitId = unitFilter;

    const enrollmentBase: Prisma.EnrollmentWhereInput = unitFilter
      ? { unitId: unitFilter }
      : {};

    const studentUnitFilter: Prisma.StudentWhereInput = unitFilter
      ? { unitId: unitFilter }
      : {};

    // Faturas: quando há filtro por unidade, restringe pelo aluno.
    const invoiceUnitWhere: Prisma.InvoiceWhereInput = unitFilter
      ? { student: { unitId: unitFilter } }
      : {};

    const [
      units,
      rooms,
      alunosMatriculados,
      candidaturasPendentes,
      listaEspera,
      renovacoesPendentes,
      renewalReservedAgg,
    ] = await Promise.all([
      this.prisma.unit.findMany({
        where: unitFilter ? { id: unitFilter } : { active: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.room.findMany({
        where: roomWhere,
        include: { unit: true, service: true },
      }),
      this.prisma.enrollment.count({
        where: { ...enrollmentBase, status: EnrollmentStatus.CONFIRMADA },
      }),
      this.prisma.enrollment.count({
        where: {
          ...enrollmentBase,
          status: EnrollmentStatus.PENDENTE_VALIDACAO,
        },
      }),
      this.prisma.waitlistEntry.count({
        where: {
          status: { in: ['AGUARDAR', 'NOTIFICADO'] },
          ...(unitFilter
            ? { enrollment: { unitId: unitFilter } }
            : {}),
        },
      }),
      this.prisma.renewal.count({
        where: {
          status: 'PENDENTE',
          ...(unitFilter ? { unitId: unitFilter } : {}),
        },
      }),
      this.prisma.room.aggregate({
        where: roomWhere,
        _sum: { renewalReserved: true },
      }),
    ]);

    // ── Ocupação por unidade e por serviço ─────────────────────────────
    const byUnitMap = new Map<
      string,
      { unit: string; capacity: number; enrolled: number; available: number }
    >();
    const byServiceMap = new Map<
      string,
      { service: string; capacity: number; enrolled: number; available: number }
    >();
    let totalCapacity = 0;
    let totalEnrolled = 0;
    let totalAvailable = 0;

    for (const room of rooms) {
      const available = this.rooms.calcVacancies(room);
      totalCapacity += room.capacity;
      totalEnrolled += room.enrolledCount;
      totalAvailable += available;

      const u = byUnitMap.get(room.unitId) ?? {
        unit: room.unit.name,
        capacity: 0,
        enrolled: 0,
        available: 0,
      };
      u.capacity += room.capacity;
      u.enrolled += room.enrolledCount;
      u.available += available;
      byUnitMap.set(room.unitId, u);

      const s = byServiceMap.get(room.serviceId) ?? {
        service: room.service.name,
        capacity: 0,
        enrolled: 0,
        available: 0,
      };
      s.capacity += room.capacity;
      s.enrolled += room.enrolledCount;
      s.available += available;
      byServiceMap.set(room.serviceId, s);
    }

    const occupancyRate =
      totalCapacity > 0
        ? Math.round((totalEnrolled / totalCapacity) * 1000) / 10
        : 0;

    // ── Financeiro ─────────────────────────────────────────────────────
    const [
      invoicesAll,
      invoicesMonth,
      paymentsAllAgg,
      paymentsMonth,
    ] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { ...invoiceUnitWhere, status: { not: InvoiceStatus.ANULADO } },
        select: {
          amountAkz: true,
          status: true,
          payments: { select: { amountAkz: true } },
        },
      }),
      this.prisma.invoice.findMany({
        where: {
          ...invoiceUnitWhere,
          status: { not: InvoiceStatus.ANULADO },
          referenceMonth: currentMonth,
        },
        select: {
          amountAkz: true,
          payments: { select: { amountAkz: true } },
        },
      }),
      this.prisma.payment.aggregate({
        _sum: { amountAkz: true },
        where: unitFilter
          ? { invoice: { student: { unitId: unitFilter } } }
          : {},
      }),
      this.prisma.payment.findMany({
        where: {
          invoice: {
            referenceMonth: currentMonth,
            ...(unitFilter ? { student: { unitId: unitFilter } } : {}),
          },
        },
        select: { amountAkz: true },
      }),
    ]);

    const sumBilled = (rows: { amountAkz: number }[]) =>
      rows.reduce((acc, r) => acc + r.amountAkz, 0);

    const billedTotal = sumBilled(invoicesAll);
    const receivedTotal = paymentsAllAgg._sum.amountAkz ?? 0;
    let outstandingTotal = 0;
    for (const inv of invoicesAll) {
      const paid = inv.payments.reduce((acc, p) => acc + p.amountAkz, 0);
      outstandingTotal += Math.max(inv.amountAkz - paid, 0);
    }

    const billedMonth = sumBilled(invoicesMonth);
    const receivedMonth = paymentsMonth.reduce((acc, p) => acc + p.amountAkz, 0);
    let outstandingMonth = 0;
    for (const inv of invoicesMonth) {
      const paid = inv.payments.reduce((acc, p) => acc + p.amountAkz, 0);
      outstandingMonth += Math.max(inv.amountAkz - paid, 0);
    }

    const collectionRate = (billed: number, received: number) =>
      billed > 0 ? Math.round((received / billed) * 1000) / 10 : 0;

    // ── Actividade recente ─────────────────────────────────────────────
    const [recentEnrollments, recentPayments, recentComms] = await Promise.all([
      this.prisma.enrollment.findMany({
        where: enrollmentBase,
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          childFullName: true,
          status: true,
          createdAt: true,
          unit: { select: { name: true } },
          service: { select: { name: true } },
        },
      }),
      this.prisma.payment.findMany({
        where: unitFilter
          ? { invoice: { student: { unitId: unitFilter } } }
          : {},
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: {
          id: true,
          amountAkz: true,
          paidAt: true,
          createdAt: true,
          invoice: {
            select: {
              referenceMonth: true,
              student: { select: { childFullName: true } },
            },
          },
        },
      }),
      this.prisma.communication.findMany({
        where: {
          status: 'PUBLICADO',
          ...(unitFilter ? { unitId: unitFilter } : {}),
        },
        orderBy: { publishedAt: 'desc' },
        take: 6,
        select: {
          id: true,
          title: true,
          audience: true,
          publishedAt: true,
        },
      }),
    ]);

    return {
      units,
      filterUnitId: unitFilter ?? null,
      referenceMonth: currentMonth,
      ocupacao: {
        totalCapacity,
        totalEnrolled,
        totalAvailable,
        occupancyRate,
        porUnidade: [...byUnitMap.values()].sort((a, b) =>
          a.unit.localeCompare(b.unit),
        ),
        porServico: [...byServiceMap.values()].sort((a, b) =>
          a.service.localeCompare(b.service),
        ),
      },
      admissoes: {
        alunosMatriculados,
        candidaturasPendentes,
        listaEspera,
        renovacoesPendentes,
        renovacoesReservadas: renewalReservedAgg._sum.renewalReserved ?? 0,
      },
      financeiro: {
        acumulado: {
          faturadoAkz: billedTotal,
          recebidoAkz: receivedTotal,
          emDividaAkz: outstandingTotal,
          taxaCobranca: collectionRate(billedTotal, receivedTotal),
        },
        mesActual: {
          faturadoAkz: billedMonth,
          recebidoAkz: receivedMonth,
          emDividaAkz: outstandingMonth,
          taxaCobranca: collectionRate(billedMonth, receivedMonth),
        },
      },
      actividadeRecente: {
        inscricoes: recentEnrollments.map((e) => ({
          id: e.id,
          childFullName: e.childFullName,
          status: e.status,
          unit: e.unit.name,
          service: e.service.name,
          createdAt: e.createdAt,
        })),
        pagamentos: recentPayments.map((p) => ({
          id: p.id,
          amountAkz: p.amountAkz,
          paidAt: p.paidAt,
          createdAt: p.createdAt,
          childFullName: p.invoice.student?.childFullName ?? '—',
          referenceMonth: p.invoice.referenceMonth,
        })),
        comunicados: recentComms.map((c) => ({
          id: c.id,
          title: c.title,
          audience: c.audience,
          publishedAt: c.publishedAt,
        })),
      },
    };
  }

  /**
   * Monitorização académica: cobertura de avaliações/sumários,
   * assiduidade, NEE/PEI e incidentes de comportamento.
   */
  async academico(unitId?: string, academicYearId?: string) {
    const unitFilter = unitId && unitId !== 'all' ? unitId : undefined;

    const activeYear =
      academicYearId
        ? await this.prisma.academicYear.findUnique({
            where: { id: academicYearId },
            select: { id: true, label: true, active: true },
          })
        : await this.prisma.academicYear.findFirst({
            where: { active: true },
            select: { id: true, label: true, active: true },
          });

    const yearId = activeYear?.id;

    const units = await this.prisma.unit.findMany({
      where: unitFilter ? { id: unitFilter } : { active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    const years = await this.prisma.academicYear.findMany({
      select: { id: true, label: true, active: true },
      orderBy: { label: 'desc' },
    });

    const turmaWhere: Prisma.ClassGroupWhereInput = { active: true };
    if (yearId) turmaWhere.academicYearId = yearId;
    if (unitFilter) turmaWhere.room = { unitId: unitFilter };

    const studentWhere: Prisma.StudentWhereInput = {};
    if (yearId) studentWhere.academicYearId = yearId;
    if (unitFilter) studentWhere.unitId = unitFilter;

    const turmas = await this.prisma.classGroup.findMany({
      where: turmaWhere,
      include: {
        room: {
          include: {
            unit: { select: { id: true, name: true } },
            service: { select: { id: true, name: true } },
          },
        },
        academicYear: { select: { id: true, label: true } },
      },
      orderBy: [{ name: 'asc' }],
    });

    const students = await this.prisma.student.findMany({
      where: studentWhere,
      select: {
        id: true,
        roomId: true,
        academicYearId: true,
        unitId: true,
      },
    });

    const studentIds = students.map((s) => s.id);
    const turmaIds = turmas.map((t) => t.id);

    const [
      attendanceRows,
      assessmentGroups,
      summaryGroups,
      neeActive,
      peiOpen,
      behaviorIncidents,
    ] = await Promise.all([
      turmaIds.length
        ? this.prisma.attendance.groupBy({
            by: ['classGroupId', 'status'],
            where: { classGroupId: { in: turmaIds } },
            _count: { _all: true },
          })
        : Promise.resolve(
            [] as Array<{
              classGroupId: string;
              status: AttendanceStatus;
              _count: { _all: number };
            }>,
          ),
      studentIds.length
        ? this.prisma.assessment.groupBy({
            by: ['studentId'],
            where: {
              studentId: { in: studentIds },
              ...(turmaIds.length ? { classGroupId: { in: turmaIds } } : {}),
            },
            _count: { _all: true },
          })
        : Promise.resolve(
            [] as Array<{ studentId: string; _count: { _all: number } }>,
          ),
      turmaIds.length
        ? this.prisma.lessonSummary.groupBy({
            by: ['classGroupId'],
            where: { classGroupId: { in: turmaIds } },
            _count: { _all: true },
          })
        : Promise.resolve(
            [] as Array<{ classGroupId: string; _count: { _all: number } }>,
          ),
      studentIds.length
        ? this.prisma.neeProfile.count({
            where: { active: true, studentId: { in: studentIds } },
          })
        : Promise.resolve(0),
      studentIds.length
        ? this.prisma.peiPlan.count({
            where: {
              status: { in: [PeiStatus.ACTIVO, PeiStatus.EM_REVISAO] },
              studentId: { in: studentIds },
              ...(yearId ? { academicYearId: yearId } : {}),
            },
          })
        : Promise.resolve(0),
      studentIds.length
        ? this.prisma.behaviorRecord.count({
            where: {
              type: BehaviorType.INCIDENTE,
              studentId: { in: studentIds },
            },
          })
        : Promise.resolve(0),
    ]);

    const assessedStudentIds = new Set(
      assessmentGroups.map((g) => g.studentId),
    );
    const summariesByTurma = new Map(
      summaryGroups.map((g) => [g.classGroupId, g._count._all]),
    );

    const attendanceByTurma = new Map<
      string,
      { presentLike: number; total: number }
    >();
    for (const row of attendanceRows) {
      const bucket = attendanceByTurma.get(row.classGroupId) ?? {
        presentLike: 0,
        total: 0,
      };
      bucket.total += row._count._all;
      if (
        row.status === AttendanceStatus.PRESENTE ||
        row.status === AttendanceStatus.ATRASO
      ) {
        bucket.presentLike += row._count._all;
      }
      attendanceByTurma.set(row.classGroupId, bucket);
    }

    const byTurma = turmas.map((turma) => {
      const turmaStudents = students.filter(
        (s) =>
          s.roomId === turma.roomId &&
          s.academicYearId === turma.academicYearId,
      );
      const studentCount = turmaStudents.length;
      const withAssessments = turmaStudents.filter((s) =>
        assessedStudentIds.has(s.id),
      ).length;
      const att = attendanceByTurma.get(turma.id);
      const attendanceRate =
        att && att.total > 0
          ? Math.round((att.presentLike / att.total) * 1000) / 10
          : null;
      const assessmentCoverage =
        studentCount > 0
          ? Math.round((withAssessments / studentCount) * 1000) / 10
          : null;
      const lessonSummaries = summariesByTurma.get(turma.id) ?? 0;

      return {
        classGroupId: turma.id,
        name: turma.name,
        unit: turma.room.unit.name,
        unitId: turma.room.unit.id,
        service: turma.room.service.name,
        academicYear: turma.academicYear.label,
        studentCount,
        attendanceRate,
        attendanceRecords: att?.total ?? 0,
        assessmentCoverage,
        studentsWithAssessments: withAssessments,
        lessonSummaries,
      };
    });

    const byUnitMap = new Map<
      string,
      {
        unitId: string;
        unit: string;
        studentCount: number;
        attendancePresent: number;
        attendanceTotal: number;
        studentsWithAssessments: number;
        lessonSummaries: number;
        turmas: number;
      }
    >();

    for (const row of byTurma) {
      const u = byUnitMap.get(row.unitId) ?? {
        unitId: row.unitId,
        unit: row.unit,
        studentCount: 0,
        attendancePresent: 0,
        attendanceTotal: 0,
        studentsWithAssessments: 0,
        lessonSummaries: 0,
        turmas: 0,
      };
      u.studentCount += row.studentCount;
      u.studentsWithAssessments += row.studentsWithAssessments;
      u.lessonSummaries += row.lessonSummaries;
      u.turmas += 1;
      const att = attendanceByTurma.get(row.classGroupId);
      if (att) {
        u.attendancePresent += att.presentLike;
        u.attendanceTotal += att.total;
      }
      byUnitMap.set(row.unitId, u);
    }

    const byUnit = [...byUnitMap.values()].map((u) => ({
      unitId: u.unitId,
      unit: u.unit,
      turmas: u.turmas,
      studentCount: u.studentCount,
      attendanceRate:
        u.attendanceTotal > 0
          ? Math.round((u.attendancePresent / u.attendanceTotal) * 1000) / 10
          : null,
      assessmentCoverage:
        u.studentCount > 0
          ? Math.round((u.studentsWithAssessments / u.studentCount) * 1000) / 10
          : null,
      lessonSummaries: u.lessonSummaries,
    }));

    const totalStudents = students.length;
    const totalWithAssessments = assessedStudentIds.size;
    let presentLike = 0;
    let attendanceTotal = 0;
    for (const att of attendanceByTurma.values()) {
      presentLike += att.presentLike;
      attendanceTotal += att.total;
    }
    const totalSummaries = summaryGroups.reduce(
      (sum, g) => sum + g._count._all,
      0,
    );

    return {
      units,
      years,
      filterUnitId: unitFilter ?? null,
      academicYear: activeYear,
      kpis: {
        alunos: totalStudents,
        turmas: turmas.length,
        taxaAssiduidade:
          attendanceTotal > 0
            ? Math.round((presentLike / attendanceTotal) * 1000) / 10
            : null,
        coberturaAvaliacoes:
          totalStudents > 0
            ? Math.round((totalWithAssessments / totalStudents) * 1000) / 10
            : null,
        sumariosRegistados: totalSummaries,
        neeActivos: neeActive,
        peiAbertos: peiOpen,
        incidentesComportamento: behaviorIncidents,
      },
      porUnidade: byUnit.sort((a, b) => a.unit.localeCompare(b.unit)),
      porTurma: byTurma,
    };
  }

  /**
   * Painel pedagógico estratégico: tendências e cobertura pedagógica
   * por unidade, ano lectivo e período.
   */
  async pedagogico(unitId?: string, academicYearId?: string, periodId?: string) {
    const unitFilter = unitId && unitId !== 'all' ? unitId : undefined;

    const years = await this.prisma.academicYear.findMany({
      select: { id: true, label: true, active: true },
      orderBy: { label: 'desc' },
    });
    const activeYear =
      academicYearId
        ? await this.prisma.academicYear.findUnique({
            where: { id: academicYearId },
            select: { id: true, label: true, active: true },
          })
        : await this.prisma.academicYear.findFirst({
            where: { active: true },
            select: { id: true, label: true, active: true },
          });

    const yearId = activeYear?.id;
    const periods = await this.prisma.assessmentPeriod.findMany({
      where: {
        ...(yearId ? { academicYearId: yearId } : {}),
        ...(unitFilter
          ? {
              OR: [{ unitId: null }, { unitId: unitFilter }],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        academicYearId: true,
        unitId: true,
      },
      orderBy: [{ startDate: 'asc' }, { name: 'asc' }],
    });

    const selectedPeriod =
      periodId && periodId !== 'all'
        ? periods.find((p) => p.id === periodId) ??
          (await this.prisma.assessmentPeriod.findUnique({
            where: { id: periodId },
            select: {
              id: true,
              name: true,
              startDate: true,
              endDate: true,
              academicYearId: true,
              unitId: true,
            },
          }))
        : null;

    const periodDateFilter: Prisma.DateTimeFilter | undefined = selectedPeriod
      ? { gte: selectedPeriod.startDate, lte: selectedPeriod.endDate }
      : undefined;

    const units = await this.prisma.unit.findMany({
      where: unitFilter ? { id: unitFilter } : { active: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    const turmaWhere: Prisma.ClassGroupWhereInput = { active: true };
    if (yearId) turmaWhere.academicYearId = yearId;
    if (unitFilter) turmaWhere.room = { unitId: unitFilter };

    const studentWhere: Prisma.StudentWhereInput = {};
    if (yearId) studentWhere.academicYearId = yearId;
    if (unitFilter) studentWhere.unitId = unitFilter;

    const turmas = await this.prisma.classGroup.findMany({
      where: turmaWhere,
      select: {
        id: true,
        name: true,
        roomId: true,
        room: {
          select: {
            unit: { select: { id: true, name: true } },
            service: { select: { name: true } },
          },
        },
      },
      orderBy: [{ name: 'asc' }],
    });

    const students = await this.prisma.student.findMany({
      where: studentWhere,
      select: { id: true, roomId: true },
    });
    const studentIds = students.map((s) => s.id);
    const turmaIds = turmas.map((t) => t.id);

    const [
      attendanceRows,
      assessments,
      reportCards,
      activeNeeCount,
      peiPlans,
      behaviorRows,
      substitutions,
    ] = await Promise.all([
      turmaIds.length
        ? this.prisma.attendance.groupBy({
            by: ['classGroupId', 'status'],
            where: {
              classGroupId: { in: turmaIds },
              ...(periodDateFilter ? { date: periodDateFilter } : {}),
            },
            _count: { _all: true },
          })
        : Promise.resolve(
            [] as Array<{
              classGroupId: string;
              status: AttendanceStatus;
              _count: { _all: number };
            }>,
          ),
      studentIds.length
        ? this.prisma.assessment.findMany({
            where: {
              studentId: { in: studentIds },
              ...(periodDateFilter ? { date: periodDateFilter } : {}),
              ...(selectedPeriod
                ? { periodId: selectedPeriod.id }
                : yearId
                  ? { period: { academicYearId: yearId } }
                  : {}),
              ...(turmaIds.length ? { classGroupId: { in: turmaIds } } : {}),
            },
            select: {
              gradeType: true,
              gradeValue: true,
              gradeLabel: true,
            },
          })
        : Promise.resolve(
            [] as Array<{
              gradeType: 'NUMERICA' | 'QUALITATIVA';
              gradeValue: number | null;
              gradeLabel: string | null;
            }>,
          ),
      studentIds.length
        ? this.prisma.reportCard.findMany({
            where: {
              studentId: { in: studentIds },
              ...(selectedPeriod
                ? { periodId: selectedPeriod.id }
                : yearId
                  ? { period: { academicYearId: yearId } }
                  : {}),
            },
            select: { status: true },
          })
        : Promise.resolve([] as Array<{ status: ReportCardStatus }>),
      studentIds.length
        ? this.prisma.neeProfile.count({
            where: { active: true, studentId: { in: studentIds } },
          })
        : Promise.resolve(0),
      studentIds.length
        ? this.prisma.peiPlan.findMany({
            where: {
              studentId: { in: studentIds },
              status: { in: [PeiStatus.ACTIVO, PeiStatus.EM_REVISAO] },
              ...(yearId ? { academicYearId: yearId } : {}),
            },
            select: { id: true, reviewDate: true },
          })
        : Promise.resolve([] as Array<{ id: string; reviewDate: Date | null }>),
      studentIds.length
        ? this.prisma.behaviorRecord.findMany({
            where: {
              studentId: { in: studentIds },
              ...(periodDateFilter ? { date: periodDateFilter } : {}),
              type: { in: [BehaviorType.POSITIVO, BehaviorType.INCIDENTE] },
            },
            select: { date: true, type: true },
          })
        : Promise.resolve([] as Array<{ date: Date; type: BehaviorType }>),
      turmaIds.length
        ? this.prisma.substitution.findMany({
            where: {
              classGroupId: { in: turmaIds },
              ...(periodDateFilter ? { date: periodDateFilter } : {}),
              status: { not: SubstitutionStatus.CANCELADA },
            },
            select: {
              classGroupId: true,
              classGroup: { select: { name: true } },
              date: true,
            },
          })
        : Promise.resolve(
            [] as Array<{
              classGroupId: string;
              classGroup: { name: string };
              date: Date;
            }>,
          ),
    ]);

    const attendanceByTurma = new Map<
      string,
      { presentLike: number; total: number }
    >();
    for (const row of attendanceRows) {
      const bucket = attendanceByTurma.get(row.classGroupId) ?? {
        presentLike: 0,
        total: 0,
      };
      bucket.total += row._count._all;
      if (
        row.status === AttendanceStatus.PRESENTE ||
        row.status === AttendanceStatus.ATRASO
      ) {
        bucket.presentLike += row._count._all;
      }
      attendanceByTurma.set(row.classGroupId, bucket);
    }

    const attendanceTrendByTurma = turmas
      .map((turma) => {
        const att = attendanceByTurma.get(turma.id);
        const attendanceRate = percentage(att?.presentLike ?? 0, att?.total ?? 0);
        return {
          classGroupId: turma.id,
          turma: turma.name,
          unit: turma.room.unit.name,
          service: turma.room.service.name,
          attendanceRate,
          attendanceRecords: att?.total ?? 0,
        };
      })
      .sort((a, b) => (b.attendanceRate ?? -1) - (a.attendanceRate ?? -1));

    const numericBands = [
      { key: '0-9', min: 0, max: 9.99 },
      { key: '10-13', min: 10, max: 13.99 },
      { key: '14-17', min: 14, max: 17.99 },
      { key: '18-20', min: 18, max: 20.1 },
    ] as const;
    const numericDistribution = numericBands.map((b) => ({ band: b.key, count: 0 }));
    const qualitativeMap = new Map<string, number>();

    for (const a of assessments) {
      if (a.gradeType === 'NUMERICA' && a.gradeValue != null) {
        const band = numericBands.find(
          (b) => a.gradeValue >= b.min && a.gradeValue <= b.max,
        );
        if (band) {
          const index = numericDistribution.findIndex((x) => x.band === band.key);
          if (index >= 0) numericDistribution[index].count += 1;
        }
      }
      if (a.gradeType === 'QUALITATIVA') {
        const label = (a.gradeLabel || 'Sem classificação').trim();
        qualitativeMap.set(label, (qualitativeMap.get(label) ?? 0) + 1);
      }
    }

    const reportCardsTotal = reportCards.length;
    const reportCardsPublished = reportCards.filter(
      (r) => r.status === ReportCardStatus.PUBLICADO,
    ).length;

    const now = new Date();
    const peiWithReviewDate = peiPlans.filter((p) => !!p.reviewDate);
    const peiOnTime = peiWithReviewDate.filter(
      (p) => (p.reviewDate as Date).getTime() >= now.getTime(),
    ).length;

    const behaviorByMonthMap = new Map<
      string,
      { month: string; positivos: number; incidentes: number }
    >();
    for (const row of behaviorRows) {
      const key = monthKey(row.date);
      const bucket = behaviorByMonthMap.get(key) ?? {
        month: key,
        positivos: 0,
        incidentes: 0,
      };
      if (row.type === BehaviorType.POSITIVO) bucket.positivos += 1;
      if (row.type === BehaviorType.INCIDENTE) bucket.incidentes += 1;
      behaviorByMonthMap.set(key, bucket);
    }
    const behaviorTrend = [...behaviorByMonthMap.values()].sort((a, b) =>
      a.month.localeCompare(b.month),
    );

    const substitutionByClassMap = new Map<
      string,
      { classGroupId: string; turma: string; count: number }
    >();
    for (const row of substitutions) {
      const bucket = substitutionByClassMap.get(row.classGroupId) ?? {
        classGroupId: row.classGroupId,
        turma: row.classGroup.name,
        count: 0,
      };
      bucket.count += 1;
      substitutionByClassMap.set(row.classGroupId, bucket);
    }

    const substitutionsByClass = [...substitutionByClassMap.values()].sort(
      (a, b) => b.count - a.count,
    );

    return {
      units,
      years,
      periods: periods.map((p) => ({
        id: p.id,
        name: p.name,
        startDate: p.startDate,
        endDate: p.endDate,
        academicYearId: p.academicYearId,
        unitId: p.unitId,
      })),
      filterUnitId: unitFilter ?? null,
      academicYear: activeYear,
      period: selectedPeriod
        ? {
            id: selectedPeriod.id,
            name: selectedPeriod.name,
            startDate: selectedPeriod.startDate,
            endDate: selectedPeriod.endDate,
          }
        : null,
      kpis: {
        turmas: turmas.length,
        alunos: students.length,
        neeActivos: activeNeeCount,
        peiActivos: peiPlans.length,
        peiRevisaoEmDia:
          peiWithReviewDate.length > 0
            ? Math.round((peiOnTime / peiWithReviewDate.length) * 1000) / 10
            : null,
        boletinsPublicados: reportCardsPublished,
        boletinsTotal: reportCardsTotal,
        coberturaPublicacaoBoletins: percentage(
          reportCardsPublished,
          reportCardsTotal,
        ),
        substituicoesTotal: substitutions.length,
        turmasComSubstituicoes: substitutionsByClass.length,
      },
      attendanceTrendByTurma,
      assessmentDistribution: {
        total: assessments.length,
        numericBands: numericDistribution,
        qualitativeCounts: [...qualitativeMap.entries()]
          .map(([label, count]) => ({ label, count }))
          .sort((a, b) => b.count - a.count),
      },
      behaviorTrend,
      substitutions: {
        total: substitutions.length,
        affectedClasses: substitutionsByClass.length,
        byClass: substitutionsByClass,
      },
    };
  }
}
