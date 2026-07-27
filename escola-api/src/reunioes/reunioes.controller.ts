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
import { MeetingStatus, MeetingType, Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ReunioesService } from './reunioes.service';
import {
  CreateMeetingDto,
  UpdateMeetingDto,
  UpsertMeetingMinutesDto,
} from './dto/reunioes.dto';

type RequestUser = { id: string; email: string; role: string };

const STAFF_ROLES = [
  Role.ADMIN,
  Role.DIRECAO,
  Role.COORDENACAO,
  Role.PROFESSOR,
] as const;

const MANAGE_ROLES = [Role.ADMIN, Role.DIRECAO, Role.COORDENACAO] as const;

@ApiTags('reunioes')
@ApiBearerAuth()
@Controller('reunioes')
export class ReunioesController {
  constructor(private reunioes: ReunioesService) {}

  @Roles(
    Role.ADMIN,
    Role.DIRECAO,
    Role.COORDENACAO,
    Role.PROFESSOR,
    Role.ENCARREGADO,
  )
  @Get('mine')
  listMine(@CurrentUser() user: RequestUser) {
    return this.reunioes.listMineForGuardian(user);
  }

  @Roles(...STAFF_ROLES)
  @Get()
  list(
    @Query('unitId') unitId?: string,
    @Query('classGroupId') classGroupId?: string,
    @Query('type') type?: MeetingType,
    @Query('status') status?: MeetingStatus,
  ) {
    return this.reunioes.list({
      unitId: unitId || undefined,
      classGroupId: classGroupId || undefined,
      type: type || undefined,
      status: status || undefined,
    });
  }

  @Roles(...STAFF_ROLES)
  @Get(':id')
  get(@Param('id') id: string) {
    return this.reunioes.get(id);
  }

  @Roles(...MANAGE_ROLES)
  @Post()
  create(@Body() dto: CreateMeetingDto, @CurrentUser() user: RequestUser) {
    return this.reunioes.create(dto, user);
  }

  @Roles(...MANAGE_ROLES)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMeetingDto) {
    return this.reunioes.update(id, dto);
  }

  @Roles(...MANAGE_ROLES)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reunioes.remove(id);
  }

  @Roles(...MANAGE_ROLES)
  @Post(':id/acta')
  upsertMinutes(
    @Param('id') id: string,
    @Body() dto: UpsertMeetingMinutesDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.reunioes.upsertMinutes(id, dto, user);
  }

  @Roles(...MANAGE_ROLES)
  @Post(':id/acta/publish')
  publishMinutes(@Param('id') id: string) {
    return this.reunioes.publishMinutes(id, true);
  }

  @Roles(...MANAGE_ROLES)
  @Post(':id/acta/unpublish')
  unpublishMinutes(@Param('id') id: string) {
    return this.reunioes.publishMinutes(id, false);
  }

  @Roles(...STAFF_ROLES)
  @Get(':id/acta/print')
  printable(@Param('id') id: string) {
    return this.reunioes.printableMinutes(id);
  }
}
