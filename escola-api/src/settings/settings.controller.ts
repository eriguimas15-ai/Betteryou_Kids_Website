import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SettingsService } from './settings.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

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

class UpdateAdmissionFormConfigDto {
  @IsObject()
  config: Record<string, unknown>;
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

  @Public()
  @Get('admission-form')
  getAdmissionFormPublic() {
    return this.settings.getAdmissionFormConfig();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO, Role.COMUNICACAO)
  @Get('admission-form/admin')
  getAdmissionFormAdmin() {
    return this.settings.getAdmissionFormConfig();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO, Role.COMUNICACAO)
  @Patch('admission-form')
  updateAdmissionForm(@Body() dto: UpdateAdmissionFormConfigDto) {
    return this.settings.updateAdmissionFormConfig(dto.config);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO, Role.COMUNICACAO)
  @Post('admission-form/reset')
  resetAdmissionForm() {
    return this.settings.resetAdmissionFormConfig();
  }
}
