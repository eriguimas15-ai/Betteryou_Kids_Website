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

export class GuardianDto {
  @IsString()
  @MinLength(2)
  fullName: string;

  @IsOptional()
  @IsString()
  idNumber?: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  altPhone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  profession?: string;

  @IsOptional()
  @IsString()
  relationship?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

export class EmergencyContactDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  relation?: string;
}

export class CreateEnrollmentDto {
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

  @IsDateString()
  childBirthDate: string;

  @IsString()
  childSex: string;

  @IsOptional()
  @IsString()
  childBirthPlace?: string;

  @IsString()
  childNationality: string;

  @IsOptional()
  @IsString()
  childAddress?: string;

  /** Legado / principal — usado se `guardians` não for enviado. */
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
