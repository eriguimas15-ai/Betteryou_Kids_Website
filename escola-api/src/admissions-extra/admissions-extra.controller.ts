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
import { JobStatus, RenewalStatus, Role } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import {
  ActivitiesService,
  JobsService,
  RenewalsService,
} from './admissions-extra.service';
import {
  EmergencyContactDto,
  GuardianDto,
} from '../enrollments/dto/create-enrollment.dto';
import { ActivityPricing } from '@prisma/client';

class ActivityServiceLinkDto {
  @IsString()
  serviceId: string;

  @IsEnum(ActivityPricing)
  pricing: ActivityPricing;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceAkz?: number | null;
}

class CreateActivityDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  category?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityServiceLinkDto)
  services?: ActivityServiceLinkDto[];
}

class UpdateActivityDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  category?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActivityServiceLinkDto)
  services?: ActivityServiceLinkDto[];
}

class CreateRenewalDto {
  @IsString()
  yearLabel: string;

  @IsString()
  unitName: string;

  @IsString()
  serviceName: string;

  @IsOptional()
  @IsString()
  roomId?: string;

  @IsString()
  @MinLength(2)
  childFullName: string;

  @IsOptional()
  @IsDateString()
  childBirthDate?: string;

  @IsOptional()
  @IsString()
  childSex?: string;

  @IsOptional()
  @IsString()
  childBirthPlace?: string;

  @IsOptional()
  @IsString()
  childNationality?: string;

  @IsOptional()
  @IsString()
  childAddress?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  guardianFullName?: string;

  @IsOptional()
  @IsString()
  guardianIdNumber?: string;

  @IsOptional()
  @IsString()
  guardianPhone?: string;

  @IsOptional()
  @IsString()
  guardianAltPhone?: string;

  @IsOptional()
  @IsEmail()
  guardianEmail?: string;

  @IsOptional()
  @IsString()
  guardianProfession?: string;

  @IsOptional()
  @IsString()
  guardianRelationship?: string;

  @IsOptional()
  @IsString()
  guardianAddress?: string;

  @IsOptional()
  @IsString()
  emergencyName?: string;

  @IsOptional()
  @IsString()
  emergencyPhone?: string;

  @IsOptional()
  @IsString()
  emergencyRelation?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  medication?: string;

  @IsOptional()
  @IsString()
  foodRestrictions?: string;

  @IsOptional()
  @IsString()
  medicalNotes?: string;

  @IsOptional()
  @IsString()
  previousYearLabel?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GuardianDto)
  guardians?: GuardianDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EmergencyContactDto)
  emergencyContacts?: EmergencyContactDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  activities?: string[];
}

class RenewalStatusDto {
  @IsEnum(RenewalStatus)
  status: RenewalStatus;
}

class CreateJobDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;
}

class UpdateJobDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  department?: string | null;

  @IsOptional()
  @IsString()
  location?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @IsOptional()
  @IsString()
  requirements?: string | null;

  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;
}

@ApiTags('renewals')
@Controller('renewals')
export class RenewalsController {
  constructor(private renewals: RenewalsService) {}

  @ApiBearerAuth()
  @Roles(
    Role.ADMIN,
    Role.DIRECAO,
    Role.COORDENACAO,
    Role.ENCARREGADO,
    Role.COMUNICACAO,
  )
  @Post()
  create(@Body() dto: CreateRenewalDto) {
    return this.renewals.create(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO)
  @Get()
  list(@Query('status') status?: RenewalStatus) {
    return this.renewals.list(status);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO)
  @Patch(':id/status')
  setStatus(@Param('id') id: string, @Body() dto: RenewalStatusDto) {
    return this.renewals.setStatus(id, dto.status);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.renewals.remove(id);
  }
}

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private jobs: JobsService) {}

  @Public()
  @Get('public')
  listPublic() {
    return this.jobs.listPublic();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COMUNICACAO)
  @Get()
  listAll() {
    return this.jobs.listAll();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COMUNICACAO)
  @Post()
  create(@Body() dto: CreateJobDto) {
    return this.jobs.create(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COMUNICACAO)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateJobDto) {
    return this.jobs.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COMUNICACAO)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.jobs.remove(id);
  }
}

@ApiTags('activities')
@Controller('activities')
export class ActivitiesController {
  constructor(private activities: ActivitiesService) {}

  @Public()
  @Get('public')
  listPublic(@Query('serviceName') serviceName?: string) {
    return this.activities.listPublic(serviceName);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COMUNICACAO, Role.COORDENACAO)
  @Get()
  listAll() {
    return this.activities.listAll();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO)
  @Post()
  create(@Body() dto: CreateActivityDto) {
    return this.activities.create(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateActivityDto) {
    return this.activities.update(id, dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.activities.remove(id);
  }
}
