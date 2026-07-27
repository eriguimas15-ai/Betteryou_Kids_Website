import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import {
  FeeKind,
  FeeProgram,
  InvoiceStatus,
  PaymentMethod,
} from '@prisma/client';

const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

// ----------------------------- Planos de propina -----------------------------

export class CreateFeePlanDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsEnum(FeeKind)
  kind?: FeeKind;

  @IsInt()
  @Min(0)
  amountAkz: number;

  @IsOptional()
  @IsString()
  unitId?: string | null;

  @IsOptional()
  @IsString()
  serviceId?: string | null;

  @IsOptional()
  @IsEnum(FeeProgram)
  program?: FeeProgram | null;

  @IsOptional()
  @IsString()
  academicYearId?: string | null;
}

export class UpdateFeePlanDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsEnum(FeeKind)
  kind?: FeeKind;

  @IsOptional()
  @IsInt()
  @Min(0)
  amountAkz?: number;

  @IsOptional()
  @IsString()
  unitId?: string | null;

  @IsOptional()
  @IsString()
  serviceId?: string | null;

  @IsOptional()
  @IsEnum(FeeProgram)
  program?: FeeProgram | null;

  @IsOptional()
  @IsString()
  academicYearId?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

// ----------------------------- Faturas / mensalidades -----------------------------

export class CreateInvoiceDto {
  @IsString()
  studentId: string;

  @IsOptional()
  @IsString()
  feePlanId?: string | null;

  @Matches(MONTH_REGEX, { message: 'Mês de referência inválido (AAAA-MM)' })
  referenceMonth: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  amountAkz?: number;

  @IsString()
  dueDate: string;

  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class UpdateInvoiceDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  amountAkz?: number;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @IsOptional()
  @IsString()
  notes?: string | null;
}

export class GenerateInvoicesDto {
  @Matches(MONTH_REGEX, { message: 'Mês de referência inválido (AAAA-MM)' })
  referenceMonth: string;

  @IsString()
  dueDate: string;

  /**
   * Modo de valor:
   * - feePlanId → usa o valor do plano (fatura o serviço do plano).
   * - amountAkz → valor fixo para todos.
   * - nenhum → resolve automaticamente a propina por serviço + programa
   *   de cada aluno (kind = PROPINA).
   */
  @IsOptional()
  @IsString()
  feePlanId?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  amountAkz?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  studentIds?: string[];

  /** Aplicar desconto de irmãos (2.º 10%, seguintes 5%). Predefinição: true. */
  @IsOptional()
  @IsBoolean()
  applySiblingDiscount?: boolean;
}

export class SetStudentProgramDto {
  @IsOptional()
  @IsEnum(FeeProgram)
  program?: FeeProgram | null;
}

// ----------------------------- Pagamentos -----------------------------

export class CreatePaymentDto {
  @IsInt()
  @Min(1)
  amountAkz: number;

  @IsString()
  paidAt: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsString()
  reference?: string | null;

  @IsOptional()
  @IsString()
  receiptRef?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;
}
