import { IsOptional, IsString, MinLength } from 'class-validator';

export class SendSmsManualDto {
  @IsString()
  @MinLength(5)
  body: string;

  @IsOptional()
  @IsString()
  unitId?: string | null;

  @IsOptional()
  @IsString()
  classGroupId?: string | null;

  /** Número único (opcional se unitId/classGroupId forem usados). */
  @IsOptional()
  @IsString()
  to?: string | null;
}

export class SendSmsFromCommunicationDto {
  @IsOptional()
  @IsString()
  bodyOverride?: string | null;
}
