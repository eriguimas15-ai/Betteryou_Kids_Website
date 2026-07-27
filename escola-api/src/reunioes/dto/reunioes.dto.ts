import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { MeetingMinutesStatus, MeetingStatus, MeetingType } from '@prisma/client';

export class CreateMeetingDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsDateString()
  dateTime: string;

  @IsOptional()
  @IsEnum(MeetingType)
  type?: MeetingType;

  @IsOptional()
  @IsString()
  participantsNotes?: string | null;

  @IsOptional()
  @IsString()
  unitId?: string | null;

  @IsOptional()
  @IsString()
  classGroupId?: string | null;

  @IsOptional()
  @IsEnum(MeetingStatus)
  status?: MeetingStatus;

  @IsOptional()
  @IsBoolean()
  visibleToGuardians?: boolean;

  @IsOptional()
  @IsString()
  location?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class UpdateMeetingDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  title?: string;

  @IsOptional()
  @IsDateString()
  dateTime?: string;

  @IsOptional()
  @IsEnum(MeetingType)
  type?: MeetingType;

  @IsOptional()
  @IsString()
  participantsNotes?: string | null;

  @IsOptional()
  @IsString()
  unitId?: string | null;

  @IsOptional()
  @IsString()
  classGroupId?: string | null;

  @IsOptional()
  @IsEnum(MeetingStatus)
  status?: MeetingStatus;

  @IsOptional()
  @IsBoolean()
  visibleToGuardians?: boolean;

  @IsOptional()
  @IsString()
  location?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class UpsertMeetingMinutesDto {
  @IsString()
  @MinLength(2)
  content: string;

  @IsOptional()
  @IsEnum(MeetingMinutesStatus)
  status?: MeetingMinutesStatus;
}
