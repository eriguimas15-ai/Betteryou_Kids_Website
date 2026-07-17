import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UnitsService } from './units.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

class CreateUnitDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  address?: string;
}

class UpdateUnitDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

class ToggleServiceDto {
  @IsString()
  serviceId: string;

  @IsBoolean()
  active: boolean;
}

@ApiTags('units')
@Controller('units')
export class UnitsController {
  constructor(private units: UnitsService) {}

  @Public()
  @Get()
  list(@Query('activeOnly') activeOnly?: string) {
    return this.units.findAll(activeOnly !== 'false');
  }

  @Public()
  @Get(':id')
  get(@Param('id') id: string) {
    return this.units.findOne(id);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO)
  @Post()
  create(@Body() dto: CreateUnitDto) {
    return this.units.create(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUnitDto) {
    return this.units.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO)
  @Post(':id/services')
  toggleService(@Param('id') id: string, @Body() dto: ToggleServiceDto) {
    return this.units.setService(id, dto.serviceId, dto.active);
  }
}
