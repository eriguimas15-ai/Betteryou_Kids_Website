import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { SubstitutionStatus } from '@prisma/client';

export class CreateSubstitutionDto {
  @IsDateString()
  date: string;

  @IsString()
  classGroupId: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  absentTeacher?: string;

  @IsString()
  @MinLength(2)
  substituteTeacher: string;

  @IsOptional()
  @IsString()
  substituteUserId?: string | null;

  @IsOptional()
  @IsString()
  reason?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsEnum(SubstitutionStatus)
  status?: SubstitutionStatus;
}

export class UpdateSubstitutionDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  classGroupId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  absentTeacher?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  substituteTeacher?: string;

  @IsOptional()
  @IsString()
  substituteUserId?: string | null;

  @IsOptional()
  @IsString()
  reason?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsEnum(SubstitutionStatus)
  status?: SubstitutionStatus;
}
