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
import { Role } from '@prisma/client';
import { Type, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { RoomsService } from './rooms.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

class CreateRoomDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  unitId: string;

  @IsString()
  serviceId: string;

  @IsString()
  academicYearId: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  capacity: number;

  @IsOptional()
  @IsString()
  levelLabel?: string;

  @IsOptional()
  @IsString()
  ageLabel?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  minAgeYears?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxAgeYears?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  enrolledCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  renewalReserved?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  enrollmentReserved?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

class UpdateRoomDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  unitId?: string;

  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsOptional()
  @IsString()
  academicYearId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  capacity?: number;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  levelLabel?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  ageLabel?: string | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsNumber()
  @Type(() => Number)
  minAgeYears?: number | null;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsNumber()
  @Type(() => Number)
  maxAgeYears?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  enrolledCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  renewalReserved?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  enrollmentReserved?: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === true || value === 'true' || value === 1 || value === '1') {
      return true;
    }
    if (value === false || value === 'false' || value === 0 || value === '0') {
      return false;
    }
    return value;
  })
  active?: boolean;
}

class SetRoomActiveDto {
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === true || value === 'true' || value === 1 || value === '1') {
      return true;
    }
    if (value === false || value === 'false' || value === 0 || value === '0') {
      return false;
    }
    return value;
  })
  active: boolean;
}

@ApiTags('rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private rooms: RoomsService) {}

  @Public()
  @Get()
  list(
    @Query('unitId') unitId?: string,
    @Query('serviceId') serviceId?: string,
    @Query('academicYearId') academicYearId?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.rooms.findAll({
      unitId,
      serviceId,
      academicYearId,
      includeInactive: includeInactive === 'true',
    });
  }

  @Public()
  @Get('for-enrollment')
  forEnrollment(
    @Query('unitName') unitName: string,
    @Query('serviceName') serviceName: string,
    @Query('yearLabel') yearLabel: string,
    @Query('birthDate') birthDate?: string,
    @Query('levelLabel') levelLabel?: string,
  ) {
    return this.rooms.listForEnrollment({
      unitName,
      serviceName,
      yearLabel,
      birthDate,
      levelLabel,
    });
  }

  @Public()
  @Get('availability')
  availability(
    @Query('unitName') unitName: string,
    @Query('serviceName') serviceName: string,
    @Query('yearLabel') yearLabel: string,
    @Query('birthDate') birthDate?: string,
  ) {
    return this.rooms.getAvailability(
      unitName,
      serviceName,
      yearLabel,
      birthDate,
    );
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO)
  @Post()
  create(@Body() dto: CreateRoomDto) {
    return this.rooms.create(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO)
  @Patch(':id/active')
  setActive(@Param('id') id: string, @Body() dto: SetRoomActiveDto) {
    return this.rooms.update(id, { active: dto.active });
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRoomDto) {
    return this.rooms.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rooms.remove(id);
  }
}
