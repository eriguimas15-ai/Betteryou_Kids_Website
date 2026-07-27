import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SmsService } from './sms.service';
import {
  SendSmsFromCommunicationDto,
  SendSmsManualDto,
} from './dto/sms.dto';

type RequestUser = { id: string; email: string; role: string };

const MANAGE_ROLES = [
  Role.ADMIN,
  Role.DIRECAO,
  Role.COORDENACAO,
  Role.COMUNICACAO,
] as const;

@ApiTags('sms')
@ApiBearerAuth()
@Controller('sms')
export class SmsController {
  constructor(private sms: SmsService) {}

  @Roles(...MANAGE_ROLES)
  @Get('status')
  status() {
    return this.sms.statusInfo();
  }

  @Roles(...MANAGE_ROLES)
  @Get('logs')
  logs(@Query('limit') limit?: string) {
    return this.sms.listLogs(limit ? Number(limit) : 50);
  }

  @Roles(...MANAGE_ROLES)
  @Post('send')
  sendManual(@Body() dto: SendSmsManualDto, @CurrentUser() user: RequestUser) {
    return this.sms.sendManual(dto, user);
  }

  @Roles(...MANAGE_ROLES)
  @Post('communication/:id')
  sendFromCommunication(
    @Param('id') id: string,
    @Body() dto: SendSmsFromCommunicationDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.sms.sendForCommunication(id, user, dto.bodyOverride);
  }
}
