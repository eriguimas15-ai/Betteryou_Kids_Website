import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { BehaviorType } from '@prisma/client';

// -------------------- Actividades não lectivas --------------------

export class CreateNonTeachingActivityDto {
  @IsDateString()
  date: string;

  @IsString()
  @MinLength(1)
  teacherName: string;

  @IsOptional()
  @IsString()
  teacherUserId?: string | null;

  @IsOptional()
  @IsString()
  classGroupId?: string | null;

  @IsString()
  @MinLength(1)
  type: string;

  @IsString()
  @MinLength(1)
  description: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class UpdateNonTeachingActivityDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  teacherName?: string;

  @IsOptional()
  @IsString()
  teacherUserId?: string | null;

  @IsOptional()
  @IsString()
  classGroupId?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  type?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}

// ------------------------- Comportamento --------------------------

export class CreateBehaviorRecordDto {
  @IsString()
  studentId: string;

  @IsDateString()
  date: string;

  @IsEnum(BehaviorType)
  type: BehaviorType;

  @IsString()
  @MinLength(1)
  description: string;

  @IsOptional()
  @IsBoolean()
  visibleToGuardian?: boolean;
}

export class UpdateBehaviorRecordDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsEnum(BehaviorType)
  type?: BehaviorType;

  @IsOptional()
  @IsString()
  @MinLength(1)
  description?: string;

  @IsOptional()
  @IsBoolean()
  visibleToGuardian?: boolean;
}

// ------------------------- Habilitações ---------------------------

export class CreateStudentQualificationDto {
  @IsString()
  studentId: string;

  @IsString()
  @MinLength(1)
  title: string;

  @IsDateString()
  issuedAt: string;

  @IsOptional()
  @IsString()
  issuer?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsString()
  documentUrl?: string | null;

  @IsOptional()
  @IsString()
  academicYearId?: string | null;
}

export class UpdateStudentQualificationDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsDateString()
  issuedAt?: string;

  @IsOptional()
  @IsString()
  issuer?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsString()
  documentUrl?: string | null;

  @IsOptional()
  @IsString()
  academicYearId?: string | null;
}
