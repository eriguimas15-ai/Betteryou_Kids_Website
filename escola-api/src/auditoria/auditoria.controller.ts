import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { AuditService } from '../common/audit/audit.service';

/** Perfis com acesso ao registo de auditoria (dados sensíveis). */
const AUDIT_ROLES = [Role.ADMIN, Role.DIRECAO] as const;

@ApiTags('auditoria')
@ApiBearerAuth()
@Controller('auditoria')
export class AuditoriaController {
  constructor(private audit: AuditService) {}

  @Roles(...AUDIT_ROLES)
  @Get()
  list(
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.audit.list({
      userId,
      action,
      entity,
      from,
      to,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }

  @Roles(...AUDIT_ROLES)
  @Get('actions')
  actions() {
    return this.audit.distinctActions();
  }
}
