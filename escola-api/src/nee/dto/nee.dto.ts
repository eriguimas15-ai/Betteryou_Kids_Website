import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { PeiStatus } from '@prisma/client';

export class UpsertNeeProfileDto {
  @IsString()
  studentId: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  diagnosisSummary?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsDateString()
  identifiedAt?: string | null;
}

export class UpdateNeeProfileDto {
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsString()
  diagnosisSummary?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsDateString()
  identifiedAt?: string | null;
}

export class CreatePeiPlanDto {
  @IsString()
  studentId: string;

  @IsOptional()
  @IsString()
  academicYearId?: string | null;

  @IsOptional()
  @IsEnum(PeiStatus)
  status?: PeiStatus;

  @IsOptional()
  @IsString()
  title?: string | null;

  @IsString()
  @MinLength(2)
  objectives: string;

  @IsOptional()
  @IsString()
  strategies?: string | null;

  @IsOptional()
  @IsString()
  supports?: string | null;

  @IsOptional()
  @IsString()
  guardianSummary?: string | null;

  @IsOptional()
  @IsString()
  responsibleTeacher?: string | null;

  @IsOptional()
  @IsString()
  coordinatorNotes?: string | null;

  @IsOptional()
  @IsDateString()
  reviewDate?: string | null;
}

export class UpdatePeiPlanDto {
  @IsOptional()
  @IsString()
  academicYearId?: string | null;

  @IsOptional()
  @IsEnum(PeiStatus)
  status?: PeiStatus;

  @IsOptional()
  @IsString()
  title?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(2)
  objectives?: string;

  @IsOptional()
  @IsString()
  strategies?: string | null;

  @IsOptional()
  @IsString()
  supports?: string | null;

  @IsOptional()
  @IsString()
  guardianSummary?: string | null;

  @IsOptional()
  @IsString()
  responsibleTeacher?: string | null;

  @IsOptional()
  @IsString()
  coordinatorNotes?: string | null;

  @IsOptional()
  @IsDateString()
  reviewDate?: string | null;
}

export class CreatePeiReviewDto {
  @IsDateString()
  date: string;

  @IsString()
  @MinLength(2)
  notes: string;
}
