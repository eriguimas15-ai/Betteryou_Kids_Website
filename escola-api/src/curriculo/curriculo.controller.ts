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
import { CurriculoService } from './curriculo.service';
import {
  CreateCurriculumAreaDto,
  CreateCurriculumObjectiveDto,
  CreateCurriculumPlanDto,
  UpdateCurriculumAreaDto,
  UpdateCurriculumObjectiveDto,
  UpdateCurriculumPlanDto,
} from './dto/curriculo.dto';
import {
  CreateSchoolManualDto,
  UpdateSchoolManualDto,
} from './dto/manuais.dto';

type RequestUser = { id: string; email: string; role: string };

const STAFF_ROLES = [
  Role.ADMIN,
  Role.DIRECAO,
  Role.COORDENACAO,
  Role.PROFESSOR,
] as const;

const MANAGE_ROLES = [Role.ADMIN, Role.DIRECAO, Role.COORDENACAO] as const;

@ApiTags('curriculo')
@ApiBearerAuth()
@Controller('curriculo')
export class CurriculoController {
  constructor(private curriculo: CurriculoService) {}

  @Roles(
    Role.ADMIN,
    Role.DIRECAO,
    Role.COORDENACAO,
    Role.PROFESSOR,
    Role.ENCARREGADO,
  )
  @Get('mine')
  listMine(@CurrentUser() user: RequestUser) {
    return this.curriculo.listMine(user);
  }

  @Roles(
    Role.ADMIN,
    Role.DIRECAO,
    Role.COORDENACAO,
    Role.PROFESSOR,
    Role.ENCARREGADO,
  )
  @Get('manuais/mine')
  listMyManuals(@CurrentUser() user: RequestUser) {
    return this.curriculo.listMyManuals(user);
  }

  @Roles(...STAFF_ROLES)
  @Get('manuais')
  listManuals(
    @Query('serviceId') serviceId?: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('unitId') unitId?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.curriculo.listManuals({
      serviceId: serviceId || undefined,
      academicYearId: academicYearId || undefined,
      unitId: unitId || undefined,
      activeOnly: activeOnly === '1' || activeOnly === 'true',
    });
  }

  @Roles(...MANAGE_ROLES)
  @Post('manuais')
  createManual(
    @Body() dto: CreateSchoolManualDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.curriculo.createManual(dto, user);
  }

  @Roles(...MANAGE_ROLES)
  @Patch('manuais/:id')
  updateManual(@Param('id') id: string, @Body() dto: UpdateSchoolManualDto) {
    return this.curriculo.updateManual(id, dto);
  }

  @Roles(...MANAGE_ROLES)
  @Delete('manuais/:id')
  removeManual(@Param('id') id: string) {
    return this.curriculo.removeManual(id);
  }

  @Roles(...STAFF_ROLES)
  @Get('plans')
  list(
    @Query('serviceId') serviceId?: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('unitId') unitId?: string,
    @Query('classGroupId') classGroupId?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.curriculo.list({
      serviceId: serviceId || undefined,
      academicYearId: academicYearId || undefined,
      unitId: unitId || undefined,
      classGroupId: classGroupId || undefined,
      activeOnly: activeOnly === '1' || activeOnly === 'true',
    });
  }

  @Roles(...STAFF_ROLES)
  @Get('plans/:id')
  get(@Param('id') id: string) {
    return this.curriculo.get(id);
  }

  @Roles(...MANAGE_ROLES)
  @Post('plans')
  createPlan(@Body() dto: CreateCurriculumPlanDto) {
    return this.curriculo.createPlan(dto);
  }

  @Roles(...MANAGE_ROLES)
  @Patch('plans/:id')
  updatePlan(@Param('id') id: string, @Body() dto: UpdateCurriculumPlanDto) {
    return this.curriculo.updatePlan(id, dto);
  }

  @Roles(...MANAGE_ROLES)
  @Delete('plans/:id')
  removePlan(@Param('id') id: string) {
    return this.curriculo.removePlan(id);
  }

  @Roles(...MANAGE_ROLES)
  @Post('areas')
  createArea(@Body() dto: CreateCurriculumAreaDto) {
    return this.curriculo.createArea(dto);
  }

  @Roles(...MANAGE_ROLES)
  @Patch('areas/:id')
  updateArea(@Param('id') id: string, @Body() dto: UpdateCurriculumAreaDto) {
    return this.curriculo.updateArea(id, dto);
  }

  @Roles(...MANAGE_ROLES)
  @Delete('areas/:id')
  removeArea(@Param('id') id: string) {
    return this.curriculo.removeArea(id);
  }

  @Roles(...MANAGE_ROLES)
  @Post('objectives')
  createObjective(@Body() dto: CreateCurriculumObjectiveDto) {
    return this.curriculo.createObjective(dto);
  }

  @Roles(...MANAGE_ROLES)
  @Patch('objectives/:id')
  updateObjective(
    @Param('id') id: string,
    @Body() dto: UpdateCurriculumObjectiveDto,
  ) {
    return this.curriculo.updateObjective(id, dto);
  }

  @Roles(...MANAGE_ROLES)
  @Delete('objectives/:id')
  removeObjective(@Param('id') id: string) {
    return this.curriculo.removeObjective(id);
  }
}
