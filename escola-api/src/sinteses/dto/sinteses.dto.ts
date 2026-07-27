import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { DescriptiveReportStatus } from '@prisma/client';

export class CreateDescriptiveReportDto {
  @IsString()
  studentId: string;

  @IsOptional()
  @IsString()
  academicYearId?: string | null;

  @IsString()
  @MinLength(2)
  periodLabel: string;

  @IsOptional()
  @IsString()
  areaFocus?: string | null;

  @IsString()
  @MinLength(2)
  body: string;

  @IsOptional()
  @IsEnum(DescriptiveReportStatus)
  status?: DescriptiveReportStatus;
}

export class UpdateDescriptiveReportDto {
  @IsOptional()
  @IsString()
  academicYearId?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(2)
  periodLabel?: string;

  @IsOptional()
  @IsString()
  areaFocus?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(2)
  body?: string;

  @IsOptional()
  @IsEnum(DescriptiveReportStatus)
  status?: DescriptiveReportStatus;
}
