import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { StudentsService } from './students.service';
import {
  EmergencyContactDto,
  GuardianDto,
} from '../enrollments/dto/create-enrollment.dto';

class UpdateFichaDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  childFullName?: string;

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

@ApiTags('students')
@ApiBearerAuth()
@Controller('students')
export class StudentsController {
  constructor(private students: StudentsService) {}

  @Roles(
    Role.ADMIN,
    Role.DIRECAO,
    Role.COORDENACAO,
    Role.ENCARREGADO,
    Role.COMUNICACAO,
  )
  @Get()
  list(
    @CurrentUser()
    user: { id: string; email: string; role: string },
  ) {
    return this.students.listMine(user);
  }

  @Roles(
    Role.ADMIN,
    Role.DIRECAO,
    Role.COORDENACAO,
    Role.ENCARREGADO,
    Role.COMUNICACAO,
  )
  @Get(':id')
  get(
    @Param('id') id: string,
    @CurrentUser()
    user: { id: string; email: string; role: string },
  ) {
    return this.students.getOne(id, user);
  }

  @Roles(
    Role.ADMIN,
    Role.DIRECAO,
    Role.COORDENACAO,
    Role.ENCARREGADO,
  )
  @Patch(':id/ficha')
  updateFicha(
    @Param('id') id: string,
    @CurrentUser()
    user: { id: string; email: string; role: string },
    @Body() dto: UpdateFichaDto,
  ) {
    return this.students.updateFicha(id, user, dto);
  }
}
