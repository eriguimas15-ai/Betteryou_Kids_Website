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
import { DescriptiveReportStatus, Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SintesesService } from './sinteses.service';
import {
  CreateDescriptiveReportDto,
  UpdateDescriptiveReportDto,
} from './dto/sinteses.dto';

type RequestUser = { id: string; email: string; role: string };

const STAFF_ROLES = [
  Role.ADMIN,
  Role.DIRECAO,
  Role.COORDENACAO,
  Role.PROFESSOR,
] as const;

@ApiTags('sinteses')
@ApiBearerAuth()
@Controller('sinteses')
export class SintesesController {
  constructor(private sinteses: SintesesService) {}

  @Roles(
    Role.ADMIN,
    Role.DIRECAO,
    Role.COORDENACAO,
    Role.PROFESSOR,
    Role.ENCARREGADO,
  )
  @Get('mine')
  listMine(@CurrentUser() user: RequestUser) {
    return this.sinteses.listMine(user);
  }

  @Roles(...STAFF_ROLES)
  @Get()
  list(
    @Query('unitId') unitId?: string,
    @Query('studentId') studentId?: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('status') status?: DescriptiveReportStatus,
  ) {
    return this.sinteses.list({
      unitId: unitId || undefined,
      studentId: studentId || undefined,
      academicYearId: academicYearId || undefined,
      status: status || undefined,
    });
  }

  @Roles(...STAFF_ROLES)
  @Get(':id')
  get(@Param('id') id: string) {
    return this.sinteses.get(id);
  }

  @Roles(...STAFF_ROLES)
  @Post()
  create(
    @Body() dto: CreateDescriptiveReportDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.sinteses.create(dto, user);
  }

  @Roles(...STAFF_ROLES)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDescriptiveReportDto) {
    return this.sinteses.update(id, dto);
  }

  @Roles(...STAFF_ROLES)
  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.sinteses.setPublished(id, true);
  }

  @Roles(...STAFF_ROLES)
  @Post(':id/unpublish')
  unpublish(@Param('id') id: string) {
    return this.sinteses.setPublished(id, false);
  }

  @Roles(...STAFF_ROLES)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sinteses.remove(id);
  }
}
