import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { ContentStatus, EventType } from '@prisma/client';

export class CreateEventDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsString()
  @MinLength(2)
  description: string;

  @IsEnum(EventType)
  type: EventType;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @IsString()
  startAt: string;

  @IsOptional()
  @IsString()
  endAt?: string | null;

  @IsOptional()
  @IsString()
  location?: string | null;

  @IsOptional()
  @IsString()
  unitId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceAkz?: number | null;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;

  @IsOptional()
  @IsString()
  publishAt?: string | null;
}

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  description?: string;

  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @IsOptional()
  @IsString()
  startAt?: string;

  @IsOptional()
  @IsString()
  endAt?: string | null;

  @IsOptional()
  @IsString()
  location?: string | null;

  @IsOptional()
  @IsString()
  unitId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  capacity?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceAkz?: number | null;

  @IsOptional()
  @IsString()
  imageUrl?: string | null;
}

export class PublishEventDto {
  @IsOptional()
  @IsString()
  publishAt?: string | null;
}

export class RegisterEventDto {
  @IsOptional()
  @IsString()
  studentId?: string | null;

  @IsOptional()
  @IsString()
  childName?: string;

  @IsOptional()
  @IsString()
  guardianName?: string;

  @IsOptional()
  @IsEmail()
  guardianEmail?: string;

  @IsOptional()
  @IsString()
  guardianPhone?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  attendees?: number;

  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class UpdateRegistrationStatusDto {
  @IsEnum(['INSCRITO', 'LISTA_ESPERA', 'CANCELADO'])
  status: 'INSCRITO' | 'LISTA_ESPERA' | 'CANCELADO';
}
