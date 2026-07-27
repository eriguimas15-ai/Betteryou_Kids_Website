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
import { Role, SubstitutionStatus } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SubstituicoesService } from './substituicoes.service';
import {
  CreateSubstitutionDto,
  UpdateSubstitutionDto,
} from './dto/substituicoes.dto';

type RequestUser = { id: string; email: string; role: string };

const STAFF_ROLES = [
  Role.ADMIN,
  Role.DIRECAO,
  Role.COORDENACAO,
  Role.PROFESSOR,
] as const;

const MANAGE_ROLES = [Role.ADMIN, Role.DIRECAO, Role.COORDENACAO] as const;

@ApiTags('substituicoes')
@ApiBearerAuth()
@Controller('substituicoes')
export class SubstituicoesController {
  constructor(private substituicoes: SubstituicoesService) {}

  @Roles(...STAFF_ROLES)
  @Get()
  list(
    @Query('classGroupId') classGroupId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('status') status?: SubstitutionStatus,
    @Query('unitId') unitId?: string,
  ) {
    return this.substituicoes.list({
      classGroupId: classGroupId || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      status: status || undefined,
      unitId: unitId || undefined,
    });
  }

  @Roles(...STAFF_ROLES)
  @Get(':id')
  get(@Param('id') id: string) {
    return this.substituicoes.get(id);
  }

  @Roles(...MANAGE_ROLES)
  @Post()
  create(
    @Body() dto: CreateSubstitutionDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.substituicoes.create(dto, user);
  }

  @Roles(...MANAGE_ROLES)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSubstitutionDto) {
    return this.substituicoes.update(id, dto);
  }

  @Roles(...MANAGE_ROLES)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.substituicoes.remove(id);
  }
}
