import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { AssessmentGradeType } from '@prisma/client';

// ----------------------------- Sumários -----------------------------

export class CreateLessonSummaryDto {
  @IsString()
  classGroupId: string;

  @IsDateString()
  date: string;

  @IsString()
  @MinLength(1)
  subject: string;

  @IsOptional()
  @IsString()
  topic?: string;

  @IsString()
  @MinLength(1)
  description: string;

  @IsOptional()
  @IsString()
  homework?: string;
}

export class UpdateLessonSummaryDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  subject?: string;

  @IsOptional()
  @IsString()
  topic?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;

  @IsOptional()
  @IsString()
  homework?: string | null;
}

// ---------------------------- Avaliações ----------------------------

export class CreateAssessmentDto {
  @IsString()
  studentId: string;

  @IsString()
  classGroupId: string;

  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(1)
  subject: string;

  @IsDateString()
  date: string;

  @IsEnum(AssessmentGradeType)
  gradeType: AssessmentGradeType;

  @IsOptional()
  @IsNumber()
  gradeValue?: number | null;

  @IsOptional()
  @IsString()
  gradeLabel?: string | null;

  @IsOptional()
  @IsString()
  note?: string | null;

  @IsOptional()
  @IsString()
  periodId?: string | null;
}

export class UpdateAssessmentDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  subject?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsEnum(AssessmentGradeType)
  gradeType?: AssessmentGradeType;

  @IsOptional()
  @IsNumber()
  gradeValue?: number | null;

  @IsOptional()
  @IsString()
  gradeLabel?: string | null;

  @IsOptional()
  @IsString()
  note?: string | null;

  @IsOptional()
  @IsString()
  periodId?: string | null;
}

// ----------------------------- Horários -----------------------------

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateScheduleEntryDto {
  @IsString()
  classGroupId: string;

  @IsInt()
  @Min(1)
  @Max(7)
  weekday: number;

  @Matches(TIME_REGEX, { message: 'Hora de início inválida (HH:MM)' })
  startTime: string;

  @Matches(TIME_REGEX, { message: 'Hora de fim inválida (HH:MM)' })
  endTime: string;

  @IsString()
  @MinLength(1)
  subject: string;

  @IsOptional()
  @IsString()
  room?: string | null;
}

export class UpdateScheduleEntryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  weekday?: number;

  @IsOptional()
  @Matches(TIME_REGEX, { message: 'Hora de início inválida (HH:MM)' })
  startTime?: string;

  @IsOptional()
  @Matches(TIME_REGEX, { message: 'Hora de fim inválida (HH:MM)' })
  endTime?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  subject?: string;

  @IsOptional()
  @IsString()
  room?: string | null;
}
