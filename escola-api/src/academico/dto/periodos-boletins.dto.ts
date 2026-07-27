import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssessmentGradeType, ReportCardStatus } from '@prisma/client';

// ----------------------------- Períodos -----------------------------

export class CreateAssessmentPeriodDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  academicYearId: string;

  @IsOptional()
  @IsString()
  unitId?: string | null;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateAssessmentPeriodDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  academicYearId?: string;

  @IsOptional()
  @IsString()
  unitId?: string | null;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

// ----------------------------- Boletins -----------------------------

export class ReportCardLineInputDto {
  @IsString()
  @MinLength(1)
  subject: string;

  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsEnum(AssessmentGradeType)
  gradeType?: AssessmentGradeType | null;

  @IsOptional()
  @IsNumber()
  gradeValue?: number | null;

  @IsOptional()
  @IsString()
  gradeLabel?: string | null;

  @IsOptional()
  @IsString()
  comment?: string | null;

  @IsOptional()
  @IsString()
  sourceType?: string;

  @IsOptional()
  @IsString()
  sourceId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class GenerateReportCardsDto {
  @IsString()
  periodId: string;

  @IsString()
  classGroupId: string;

  @IsOptional()
  @IsBoolean()
  overwriteDraft?: boolean;
}

export class UpdateReportCardDto {
  @IsOptional()
  @IsString()
  overallComment?: string | null;

  @IsOptional()
  @IsEnum(ReportCardStatus)
  status?: ReportCardStatus;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReportCardLineInputDto)
  lines?: ReportCardLineInputDto[];
}

export class PublishReportCardDto {
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;
}
