import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';
import { AcademicYearsService } from './academic-years.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

class CreateYearDto {
  @IsString()
  @MinLength(4)
  label: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

class UpdateYearDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

@ApiTags('academic-years')
@Controller('academic-years')
export class AcademicYearsController {
  constructor(private years: AcademicYearsService) {}

  @Public()
  @Get()
  list() {
    return this.years.findAll();
  }

  @Public()
  @Get('active')
  active() {
    return this.years.findActive();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO)
  @Post()
  create(@Body() dto: CreateYearDto) {
    return this.years.create(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateYearDto) {
    return this.years.update(id, dto);
  }
}
