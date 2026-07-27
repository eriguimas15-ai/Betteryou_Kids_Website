import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { SettingsService } from './settings.service';
import { Roles } from '../common/decorators/roles.decorator';

class UpdateSettingsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(720)
  waitlistResponseHours?: number;

  @IsOptional()
  @IsBoolean()
  waitlistDeadlineEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  smsEnabled?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(['console', 'http'])
  smsProvider?: string;

  @IsOptional()
  @IsString()
  smsApiUrl?: string | null;

  @IsOptional()
  @IsString()
  smsFrom?: string | null;
}

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private settings: SettingsService) {}

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO)
  @Get()
  get() {
    return this.settings.get();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO)
  @Patch()
  update(@Body() dto: UpdateSettingsDto) {
    return this.settings.update(dto);
  }
}
