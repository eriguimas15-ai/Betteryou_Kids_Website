import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FinanceiroService } from './financeiro.service';
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

/** Perfis que gerem a área financeira. */
const STAFF_ROLES = [Role.ADMIN, Role.DIRECAO] as const;

@ApiTags('financeiro')
@ApiBearerAuth()
@Controller('financeiro')
export class FinanceiroController {
  constructor(private financeiro: FinanceiroService) {}

  // ─────────────────────── Portal do encarregado ───────────────────────

  @Roles(...STAFF_ROLES, Role.ENCARREGADO)
  @Get('mine/invoices')
  myInvoices(@CurrentUser() user: RequestUser) {
    return this.financeiro.myInvoices(user);
  }

  // ─────────────────────────── Planos de propina ───────────────────────────

  @Roles(...STAFF_ROLES)
  @Get('fee-plans')
  listFeePlans() {
    return this.financeiro.listFeePlans();
  }

  @Roles(...STAFF_ROLES)
  @Post('fee-plans')
  createFeePlan(@Body() dto: CreateFeePlanDto, @CurrentUser() user: RequestUser) {
    return this.financeiro.createFeePlan(dto, user);
  }

  @Roles(...STAFF_ROLES)
  @Patch('fee-plans/:id')
  updateFeePlan(
    @Param('id') id: string,
    @Body() dto: UpdateFeePlanDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.financeiro.updateFeePlan(id, dto, user);
  }

  @Roles(...STAFF_ROLES)
  @Delete('fee-plans/:id')
  removeFeePlan(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.financeiro.removeFeePlan(id, user);
  }

  // ─────────────────────────── Visão geral / saldos ───────────────────────────

  @Roles(...STAFF_ROLES)
  @Get('overview')
  overview() {
    return this.financeiro.overview();
  }

  @Roles(...STAFF_ROLES)
  @Get('students')
  studentsWithBalance() {
    return this.financeiro.studentsWithBalance();
  }

  @Roles(...STAFF_ROLES)
  @Patch('students/:id/program')
  setStudentProgram(
    @Param('id') id: string,
    @Body() dto: SetStudentProgramDto,
  ) {
    return this.financeiro.setStudentProgram(id, dto);
  }

  // ─────────────────────────── Faturas / mensalidades ───────────────────────────

  @Roles(...STAFF_ROLES)
  @Get('invoices')
  listInvoices(
    @Query('studentId') studentId?: string,
    @Query('status') status?: string,
    @Query('month') referenceMonth?: string,
  ) {
    return this.financeiro.listInvoices({ studentId, status, referenceMonth });
  }

  @Roles(...STAFF_ROLES)
  @Post('invoices')
  createInvoice(@Body() dto: CreateInvoiceDto, @CurrentUser() user: RequestUser) {
    return this.financeiro.createInvoice(dto, user);
  }

  @Roles(...STAFF_ROLES)
  @Post('invoices/generate')
  generateInvoices(
    @Body() dto: GenerateInvoicesDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.financeiro.generateInvoices(dto, user);
  }

  @Roles(...STAFF_ROLES)
  @Post('invoices/process-overdue')
  processOverdue() {
    return this.financeiro.processOverdue();
  }

  @Roles(...STAFF_ROLES)
  @Get('invoices/:id')
  getInvoice(@Param('id') id: string) {
    return this.financeiro.getInvoice(id);
  }

  @Roles(...STAFF_ROLES)
  @Patch('invoices/:id')
  updateInvoice(@Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.financeiro.updateInvoice(id, dto);
  }

  @Roles(...STAFF_ROLES)
  @Post('invoices/:id/cancel')
  cancelInvoice(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.financeiro.cancelInvoice(id, user);
  }

  @Roles(...STAFF_ROLES)
  @Delete('invoices/:id')
  removeInvoice(@Param('id') id: string) {
    return this.financeiro.removeInvoice(id);
  }

  // ─────────────────────────── Pagamentos ───────────────────────────

  @Roles(...STAFF_ROLES)
  @Get('invoices/:id/payments')
  listPayments(@Param('id') id: string) {
    return this.financeiro.listPayments(id);
  }

  @Roles(...STAFF_ROLES)
  @Post('invoices/:id/payments')
  createPayment(
    @Param('id') id: string,
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.financeiro.createPayment(id, dto, user);
  }
}
