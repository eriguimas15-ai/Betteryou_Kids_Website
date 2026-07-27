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
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CommunicationsService } from './communications.service';
import {
  CreateCommunicationDto,
  PublishCommunicationDto,
  UpdateCommunicationDto,
} from './dto/communication.dto';

type RequestUser = { id: string; email: string; role: string };

const STAFF_ROLES = [
  Role.ADMIN,
  Role.DIRECAO,
  Role.COORDENACAO,
  Role.COMUNICACAO,
  Role.PROFESSOR,
] as const;

@ApiTags('communications')
@ApiBearerAuth()
@Controller('communications')
export class CommunicationsController {
  constructor(private communications: CommunicationsService) {}

  /** Comunicados dirigidos ao encarregado autenticado (com estado de leitura). */
  @Roles(
    Role.ADMIN,
    Role.DIRECAO,
    Role.COORDENACAO,
    Role.COMUNICACAO,
    Role.ENCARREGADO,
  )
  @Get('mine')
  listMine(@CurrentUser() user: RequestUser) {
    return this.communications.listForMe(user);
  }

  /** Marca um comunicado como lido. */
  @Roles(
    Role.ADMIN,
    Role.DIRECAO,
    Role.COORDENACAO,
    Role.COMUNICACAO,
    Role.ENCARREGADO,
  )
  @Post(':id/read')
  markRead(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.communications.markRead(id, user);
  }

  /** Lista de comunicados para o staff. */
  @Roles(...STAFF_ROLES)
  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.communications.listForStaff(user);
  }

  @Roles(...STAFF_ROLES)
  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.communications.getForStaff(id, user);
  }

  @Roles(...STAFF_ROLES)
  @Post()
  create(@Body() dto: CreateCommunicationDto, @CurrentUser() user: RequestUser) {
    return this.communications.create(dto, user);
  }

  @Roles(...STAFF_ROLES)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCommunicationDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.communications.update(id, dto, user);
  }

  @Roles(...STAFF_ROLES)
  @Post(':id/publish')
  publish(
    @Param('id') id: string,
    @Body() dto: PublishCommunicationDto = {},
    @CurrentUser() user: RequestUser,
  ) {
    return this.communications.setPublished(id, true, user, {
      sendEmail: !!dto?.sendEmail,
    });
  }

  @Roles(...STAFF_ROLES)
  @Post(':id/unpublish')
  unpublish(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.communications.setPublished(id, false, user);
  }

  @Roles(...STAFF_ROLES)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.communications.remove(id, user);
  }
}
