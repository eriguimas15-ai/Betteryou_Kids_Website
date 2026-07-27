import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import type { Response } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { RelatoriosService } from './relatorios.service';

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Perfis com acesso a relatórios financeiros (dados sensíveis). */
const FINANCE_ROLES = [Role.ADMIN, Role.DIRECAO] as const;
/** Perfis com acesso a relatórios operacionais (matrículas/espera). */
const OPERATIONAL_ROLES = [Role.ADMIN, Role.DIRECAO, Role.COORDENACAO] as const;

@ApiTags('relatorios')
@ApiBearerAuth()
@Controller('relatorios')
export class RelatoriosController {
  constructor(private relatorios: RelatoriosService) {}

  private sendFile(
    res: Response,
    buffer: Buffer,
    mime: string,
    filename: string,
  ) {
    res.set({
      'Content-Type': mime,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length.toString(),
    });
    res.end(buffer);
  }

  // ─────────────────────────── Financeiro ───────────────────────────

  @Roles(...FINANCE_ROLES)
  @Get('financeiro/mapa.xlsx')
  async mapaPropinas(@Res() res: Response, @Query('month') month?: string) {
    const buffer = await this.relatorios.mapaPropinasXlsx(month);
    const suffix = month ? `-${month}` : '';
    this.sendFile(res, buffer, XLSX_MIME, `mapa-propinas${suffix}.xlsx`);
  }

  @Roles(...FINANCE_ROLES)
  @Get('financeiro/faturacao.xlsx')
  async faturacao(
    @Res() res: Response,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const buffer = await this.relatorios.faturacaoXlsx(from, to);
    this.sendFile(res, buffer, XLSX_MIME, 'faturacao-pagamentos.xlsx');
  }

  @Roles(...FINANCE_ROLES)
  @Get('financeiro/mapa.pdf')
  async mapaFinanceiroPdf(
    @Res() res: Response,
    @Query('month') month?: string,
  ) {
    const buffer = await this.relatorios.mapaFinanceiroPdf(month);
    const suffix = month ? `-${month}` : '';
    this.sendFile(
      res,
      buffer,
      'application/pdf',
      `mapa-financeiro${suffix}.pdf`,
    );
  }

  // ─────────────────────────── Operacional ───────────────────────────

  @Roles(...OPERATIONAL_ROLES)
  @Get('matriculas.xlsx')
  async matriculas(@Res() res: Response) {
    const buffer = await this.relatorios.matriculasXlsx();
    this.sendFile(res, buffer, XLSX_MIME, 'matriculas-lista-espera.xlsx');
  }

  // ─────────────────────────── Recibos ───────────────────────────

  @Roles(...FINANCE_ROLES)
  @Get('pagamentos/:id/recibo.pdf')
  async recibo(@Res() res: Response, @Param('id') id: string) {
    const { buffer, filename } = await this.relatorios.reciboPdf(id);
    this.sendFile(res, buffer, 'application/pdf', filename);
  }
}
