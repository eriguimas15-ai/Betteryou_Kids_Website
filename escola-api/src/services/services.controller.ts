import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';
import { ServicesService } from './services.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

class CreateServiceDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}

class UpdateServiceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private services: ServicesService) {}

  @Public()
  @Get()
  list() {
    return this.services.findAll();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO)
  @Post()
  create(@Body() dto: CreateServiceDto) {
    return this.services.create(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.services.update(id, dto);
  }
}
