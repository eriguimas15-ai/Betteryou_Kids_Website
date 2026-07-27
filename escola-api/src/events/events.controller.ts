import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EventRegistrationStatus, Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { EventsService } from './events.service';
import {
  CreateEventDto,
  PublishEventDto,
  RegisterEventDto,
  UpdateEventDto,
  UpdateRegistrationStatusDto,
} from './dto/event.dto';

type RequestUser = { id: string; email: string; role: string };

/** Perfis que gerem eventos/festas. */
const MANAGE_ROLES = [
  Role.ADMIN,
  Role.DIRECAO,
  Role.COORDENACAO,
  Role.COMUNICACAO,
] as const;

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private events: EventsService) {}

  // ─────────────────────────── Público ───────────────────────────
  @Public()
  @Get('public')
  listPublic() {
    return this.events.listPublicUpcoming();
  }

  @Public()
  @Get('public/:id')
  getPublic(@Param('id') id: string) {
    return this.events.getPublicOne(id);
  }

  // ─────────────────────── Portal do encarregado ───────────────────────
  @ApiBearerAuth()
  @Roles(...MANAGE_ROLES, Role.ENCARREGADO)
  @Get('mine/registrations')
  myRegistrations(@CurrentUser() user: RequestUser) {
    return this.events.listMine(user);
  }

  @ApiBearerAuth()
  @Roles(...MANAGE_ROLES, Role.ENCARREGADO)
  @Post(':id/register')
  register(
    @Param('id') id: string,
    @Body() dto: RegisterEventDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.events.register(id, dto, user);
  }

  @ApiBearerAuth()
  @Roles(...MANAGE_ROLES, Role.ENCARREGADO)
  @Delete('registrations/:registrationId/mine')
  cancelMine(
    @Param('registrationId') registrationId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.events.cancelMine(registrationId, user);
  }

  // ─────────────────────────── Staff ───────────────────────────
  @ApiBearerAuth()
  @Roles(...MANAGE_ROLES)
  @Get()
  list() {
    return this.events.listForStaff();
  }

  @ApiBearerAuth()
  @Roles(...MANAGE_ROLES)
  @Post('admin/process-scheduled')
  processScheduled() {
    return this.events.processScheduledEvents();
  }

  @ApiBearerAuth()
  @Roles(...MANAGE_ROLES)
  @Get(':id')
  get(@Param('id') id: string) {
    return this.events.getForStaff(id);
  }

  @ApiBearerAuth()
  @Roles(...MANAGE_ROLES)
  @Post()
  create(@Body() dto: CreateEventDto, @CurrentUser() user: RequestUser) {
    return this.events.create(dto, user);
  }

  @ApiBearerAuth()
  @Roles(...MANAGE_ROLES)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.events.update(id, dto, user);
  }

  @ApiBearerAuth()
  @Roles(...MANAGE_ROLES)
  @Post(':id/publish')
  publish(
    @Param('id') id: string,
    @Body() dto: PublishEventDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.events.publish(id, dto?.publishAt, user);
  }

  @ApiBearerAuth()
  @Roles(...MANAGE_ROLES)
  @Post(':id/archive')
  archive(@Param('id') id: string) {
    return this.events.archive(id);
  }

  @ApiBearerAuth()
  @Roles(...MANAGE_ROLES)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.events.remove(id);
  }

  // ────────────────────────── Inscrições (staff) ──────────────────────────
  @ApiBearerAuth()
  @Roles(...MANAGE_ROLES)
  @Get(':id/registrations')
  registrations(@Param('id') id: string) {
    return this.events.listRegistrations(id);
  }

  @ApiBearerAuth()
  @Roles(...MANAGE_ROLES)
  @Patch('registrations/:registrationId')
  updateRegistration(
    @Param('registrationId') registrationId: string,
    @Body() dto: UpdateRegistrationStatusDto,
  ) {
    return this.events.updateRegistrationStatus(
      registrationId,
      dto.status as EventRegistrationStatus,
    );
  }
}
