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
import { PeiStatus, Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { NeeService } from './nee.service';
import {
  CreatePeiPlanDto,
  CreatePeiReviewDto,
  UpdateNeeProfileDto,
  UpdatePeiPlanDto,
  UpsertNeeProfileDto,
} from './dto/nee.dto';

type RequestUser = { id: string; email: string; role: string };

const STAFF_ROLES = [
  Role.ADMIN,
  Role.DIRECAO,
  Role.COORDENACAO,
  Role.PROFESSOR,
] as const;

@ApiTags('nee')
@ApiBearerAuth()
@Controller('nee')
export class NeeController {
  constructor(private nee: NeeService) {}

  /** Resumo dos PEIs activos dos filhos do encarregado. */
  @Roles(
    Role.ADMIN,
    Role.DIRECAO,
    Role.COORDENACAO,
    Role.PROFESSOR,
    Role.ENCARREGADO,
  )
  @Get('mine')
  listMine(@CurrentUser() user: RequestUser) {
    return this.nee.listMine(user);
  }

  /** Lista perfis NEE. */
  @Roles(...STAFF_ROLES)
  @Get('profiles')
  listProfiles(
    @Query('unitId') unitId?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.nee.listProfiles({
      unitId: unitId || undefined,
      activeOnly: activeOnly === '1' || activeOnly === 'true',
    });
  }

  /** Marca/actualiza aluno como NEE. */
  @Roles(...STAFF_ROLES)
  @Post('profiles')
  upsertProfile(
    @Body() dto: UpsertNeeProfileDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.nee.upsertProfile(dto, user);
  }

  @Roles(...STAFF_ROLES)
  @Patch('profiles/:id')
  updateProfile(@Param('id') id: string, @Body() dto: UpdateNeeProfileDto) {
    return this.nee.updateProfile(id, dto);
  }

  /** Lista planos PEI com filtros. */
  @Roles(...STAFF_ROLES)
  @Get('plans')
  listPlans(
    @Query('unitId') unitId?: string,
    @Query('studentId') studentId?: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('status') status?: PeiStatus,
    @Query('neeOnly') neeOnly?: string,
  ) {
    return this.nee.listPlans({
      unitId: unitId || undefined,
      studentId: studentId || undefined,
      academicYearId: academicYearId || undefined,
      status: status || undefined,
      neeOnly: neeOnly === '1' || neeOnly === 'true',
    });
  }

  @Roles(...STAFF_ROLES)
  @Get('plans/:id')
  getPlan(@Param('id') id: string) {
    return this.nee.getPlan(id);
  }

  @Roles(...STAFF_ROLES)
  @Post('plans')
  createPlan(
    @Body() dto: CreatePeiPlanDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.nee.createPlan(dto, user);
  }

  @Roles(...STAFF_ROLES)
  @Patch('plans/:id')
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePeiPlanDto) {
    return this.nee.updatePlan(id, dto);
  }

  @Roles(...STAFF_ROLES)
  @Delete('plans/:id')
  removePlan(@Param('id') id: string) {
    return this.nee.removePlan(id);
  }

  @Roles(...STAFF_ROLES)
  @Post('plans/:id/reviews')
  addReview(
    @Param('id') id: string,
    @Body() dto: CreatePeiReviewDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.nee.addReview(id, dto, user);
  }

  @Roles(...STAFF_ROLES)
  @Delete('reviews/:id')
  removeReview(@Param('id') id: string) {
    return this.nee.removeReview(id);
  }
}
