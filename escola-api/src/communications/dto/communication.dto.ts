import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { CommunicationAudience, CommunicationStatus } from '@prisma/client';

export class CreateCommunicationDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsString()
  @MinLength(2)
  body: string;

  @IsEnum(CommunicationAudience)
  audience: CommunicationAudience;

  @IsOptional()
  @IsEnum(CommunicationStatus)
  status?: CommunicationStatus;

  @IsOptional()
  @IsString()
  unitId?: string;

  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsOptional()
  @IsString()
  classGroupId?: string;

  @IsOptional()
  @IsString()
  targetUserId?: string;

  @IsOptional()
  @IsEmail()
  targetGuardianEmail?: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  /** Se true e status=PUBLICADO, tenta enviar email aos destinatários. */
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;
}

export class UpdateCommunicationDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  body?: string;

  @IsOptional()
  @IsEnum(CommunicationAudience)
  audience?: CommunicationAudience;

  @IsOptional()
  @IsEnum(CommunicationStatus)
  status?: CommunicationStatus;

  @IsOptional()
  @IsString()
  unitId?: string | null;

  @IsOptional()
  @IsString()
  serviceId?: string | null;

  @IsOptional()
  @IsString()
  classGroupId?: string | null;

  @IsOptional()
  @IsString()
  targetUserId?: string | null;

  @IsOptional()
  @IsEmail()
  targetGuardianEmail?: string | null;

  @IsOptional()
  @IsString()
  attachmentUrl?: string | null;

  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;
}

export class PublishCommunicationDto {
  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;
}
