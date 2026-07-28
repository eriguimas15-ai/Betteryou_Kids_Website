import { IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

/** Refresh/logout: token no corpo (Swagger/testes) ou no cookie HttpOnly. */
export class RefreshTokenDto {
  @IsOptional()
  @ValidateIf((_, v) => v !== undefined && v !== null && v !== '')
  @IsString()
  @MinLength(20)
  refreshToken?: string;
}
