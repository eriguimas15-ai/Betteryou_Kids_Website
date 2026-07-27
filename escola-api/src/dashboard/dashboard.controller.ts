import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EnrollmentStatus, Role } from '@prisma/client';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RoomsService } from '../rooms/rooms.service';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(
    private prisma: PrismaService,
    private rooms: RoomsService,
    private dashboard: DashboardService,
  ) {}

  /** Painel executivo (KPIs agregados) — ADMIN/DIRECAO. */
  @Roles(Role.ADMIN, Role.DIRECAO)
  @Get('executivo')
  executivo(@Query('unitId') unitId?: string) {
    return this.dashboard.executivo(unitId);
  }

  /** Monitorização académica — ADMIN/DIRECAO/COORDENACAO. */
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO)
  @Get('academico')
  academico(
    @Query('unitId') unitId?: string,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.dashboard.academico(unitId, academicYearId);
  }

  /** Relatório estratégico pedagógico — ADMIN/DIRECAO/COORDENACAO. */
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO)
  @Get('pedagogico')
  pedagogico(
    @Query('unitId') unitId?: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('periodId') periodId?: string,
  ) {
    return this.dashboard.pedagogico(unitId, academicYearId, periodId);
  }

  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO)
  @Get('pedagogico/export.csv')
  async pedagogicoCsv(
    @Res() res: Response,
    @Query('unitId') unitId?: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('periodId') periodId?: string,
  ) {
    const data = await this.dashboard.pedagogico(unitId, academicYearId, periodId);
    const rows: string[] = [];
    const esc = (value: string | number | null | undefined) =>
      `"${String(value ?? '').replace(/"/g, '""')}"`;

    rows.push(
      [
        'Turma',
        'Unidade',
        'Serviço',
        'Assiduidade (%)',
        'Registos de assiduidade',
      ].join(','),
    );
    for (const row of data.attendanceTrendByTurma) {
      rows.push(
        [
          esc(row.turma),
          esc(row.unit),
          esc(row.service),
          esc(row.attendanceRate ?? '—'),
          esc(row.attendanceRecords),
        ].join(','),
      );
    }

    rows.push('');
    rows.push(['Indicador', 'Valor'].join(','));
    rows.push(['Turmas', esc(data.kpis.turmas)].join(','));
    rows.push(['Alunos', esc(data.kpis.alunos)].join(','));
    rows.push(['NEE activos', esc(data.kpis.neeActivos)].join(','));
    rows.push(['PEI activos', esc(data.kpis.peiActivos)].join(','));
    rows.push([
      'PEI revisão em dia (%)',
      esc(data.kpis.peiRevisaoEmDia ?? '—'),
    ].join(','));
    rows.push([
      'Cobertura boletins publicados (%)',
      esc(data.kpis.coberturaPublicacaoBoletins ?? '—'),
    ].join(','));
    rows.push(['Substituições totais', esc(data.kpis.substituicoesTotal)].join(','));

    const buffer = Buffer.from(rows.join('\n'), 'utf-8');
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="pedagogico-estrategico.csv"',
      'Content-Length': buffer.length.toString(),
    });
    res.end(buffer);
  }

  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO)
  @Get('overview')
  async overview() {
    const [
      enrolled,
      pending,
      waitlist,
      rooms,
      renewalsPending,
    ] = await Promise.all([
      this.prisma.enrollment.count({
        where: { status: EnrollmentStatus.CONFIRMADA },
      }),
      this.prisma.enrollment.count({
        where: { status: EnrollmentStatus.PENDENTE_VALIDACAO },
      }),
      this.prisma.waitlistEntry.count({
        where: { status: { in: ['AGUARDAR', 'NOTIFICADO'] } },
      }),
      this.prisma.room.findMany({
        where: { active: true },
        include: { unit: true, service: true },
      }),
      this.prisma.room.aggregate({
        _sum: { renewalReserved: true },
      }),
    ]);

    const availableVacancies = rooms.reduce(
      (sum, room) => sum + this.rooms.calcVacancies(room),
      0,
    );

    return {
      stats: {
        alunosMatriculados: enrolled,
        vagasDisponiveis: availableVacancies,
        renovacoesPendentes: renewalsPending._sum.renewalReserved ?? 0,
        listaEspera: waitlist,
        candidaturasPendentes: pending,
      },
      rooms: rooms.map((room) => ({
        id: room.id,
        name: room.name,
        unit: room.unit.name,
        service: room.service.name,
        capacity: room.capacity,
        enrolled: room.enrolledCount,
        reserved: room.renewalReserved + room.enrollmentReserved,
        available: this.rooms.calcVacancies(room),
      })),
    };
  }
}
