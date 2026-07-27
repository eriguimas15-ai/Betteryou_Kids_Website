import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

const SETTINGS_ID = 'default';
export const DEFAULT_WAITLIST_RESPONSE_HOURS = 48;
export const DEFAULT_WAITLIST_DEADLINE_ENABLED = true;

@Injectable()
export class SettingsService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async get() {
    const settings = await this.ensureExists();
    const apiKeyFromEnv = this.config.get<string>('SMS_API_KEY')?.trim();
    return {
      ...settings,
      smsApiKeyConfigured: Boolean(apiKeyFromEnv),
    };
  }

  async getWaitlistResponseHours(): Promise<number> {
    const settings = await this.ensureExists();
    return settings.waitlistResponseHours;
  }

  async isWaitlistDeadlineEnabled(): Promise<boolean> {
    const settings = await this.ensureExists();
    return settings.waitlistDeadlineEnabled;
  }

  async update(data: {
    waitlistResponseHours?: number;
    waitlistDeadlineEnabled?: boolean;
    smsEnabled?: boolean;
    smsProvider?: string;
    smsApiUrl?: string | null;
    smsFrom?: string | null;
  }) {
    if (data.waitlistResponseHours !== undefined) {
      const hours = Number(data.waitlistResponseHours);
      if (!Number.isInteger(hours) || hours < 1 || hours > 24 * 30) {
        throw new BadRequestException(
          'O prazo de resposta deve ser um número inteiro entre 1 e 720 horas.',
        );
      }
    }
    if (data.smsProvider !== undefined) {
      const provider = String(data.smsProvider).trim().toLowerCase();
      if (!['console', 'http'].includes(provider)) {
        throw new BadRequestException(
          'Fornecedor SMS inválido. Use "console" ou "http".',
        );
      }
      data.smsProvider = provider;
    }

    await this.ensureExists();
    const updated = await this.prisma.platformSettings.update({
      where: { id: SETTINGS_ID },
      data: {
        ...(data.waitlistResponseHours !== undefined
          ? { waitlistResponseHours: data.waitlistResponseHours }
          : {}),
        ...(data.waitlistDeadlineEnabled !== undefined
          ? { waitlistDeadlineEnabled: data.waitlistDeadlineEnabled }
          : {}),
        ...(data.smsEnabled !== undefined ? { smsEnabled: data.smsEnabled } : {}),
        ...(data.smsProvider !== undefined
          ? { smsProvider: data.smsProvider }
          : {}),
        ...(data.smsApiUrl !== undefined
          ? { smsApiUrl: data.smsApiUrl?.trim() || null }
          : {}),
        ...(data.smsFrom !== undefined ? { smsFrom: data.smsFrom?.trim() || null } : {}),
      },
    });
    const apiKeyFromEnv = this.config.get<string>('SMS_API_KEY')?.trim();
    return {
      ...updated,
      smsApiKeyConfigured: Boolean(apiKeyFromEnv),
    };
  }

  private async ensureExists() {
    const existing = await this.prisma.platformSettings.findUnique({
      where: { id: SETTINGS_ID },
    });
    if (existing) return existing;
    return this.prisma.platformSettings.create({
      data: {
        id: SETTINGS_ID,
        waitlistResponseHours: DEFAULT_WAITLIST_RESPONSE_HOURS,
        waitlistDeadlineEnabled: DEFAULT_WAITLIST_DEADLINE_ENABLED,
        smsEnabled: false,
        smsProvider: 'console',
      },
    });
  }
}
