import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SmsDeliveryStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Variáveis de ambiente SMS (opcionais):
 * - SMS_PROVIDER: "console" (predefinido) | "http"
 * - SMS_API_URL: URL do gateway HTTP (POST JSON { to, from, body })
 * - SMS_API_KEY: Bearer / API key enviada no header Authorization
 * - SMS_FROM: remetente / shortcode (se o gateway exigir)
 * - SMS_API_TO_FIELD / SMS_API_BODY_FIELD / SMS_API_FROM_FIELD: nomes dos campos no JSON (opcional)
 *
 * Sem credenciais válidas, o envio é SIMULADO (log em consola + SmsLog).
 */
export type SmsSendResult = {
  to: string;
  body: string;
  status: SmsDeliveryStatus;
  provider: string;
  providerResponse: string | null;
};

type RequestUser = { id: string; email: string; role: string };
type SmsEffectiveConfig = {
  provider: string;
  enabled: boolean;
  apiUrl: string | null;
  apiKey: string | null;
  from: string | null;
};

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  private async getEffectiveConfig(): Promise<SmsEffectiveConfig> {
    const envProvider = (this.config.get<string>('SMS_PROVIDER') || 'console')
      .trim()
      .toLowerCase();
    const envUrl = this.config.get<string>('SMS_API_URL')?.trim() || null;
    const envKey = this.config.get<string>('SMS_API_KEY')?.trim() || null;
    const envFrom = this.config.get<string>('SMS_FROM')?.trim() || null;

    const settings = await this.prisma.platformSettings
      .findUnique({
        where: { id: 'default' },
        select: {
          smsEnabled: true,
          smsProvider: true,
          smsApiUrl: true,
          smsFrom: true,
        },
      })
      .catch(() => null);

    const provider = (
      settings?.smsProvider?.trim().toLowerCase() ||
      envProvider ||
      'console'
    ).trim();
    const apiUrl = settings?.smsApiUrl?.trim() || envUrl;
    const apiKey = envKey;
    const from = settings?.smsFrom?.trim() || envFrom;
    const enabled = settings?.smsEnabled ?? false;

    return { provider, enabled, apiUrl, apiKey, from };
  }

  async statusInfo() {
    const cfg = await this.getEffectiveConfig();
    const liveReady =
      cfg.enabled && cfg.provider === 'http' && Boolean(cfg.apiUrl && cfg.apiKey);
    return {
      provider: cfg.provider,
      enabled: cfg.enabled,
      mode: liveReady ? 'live' : 'simulate',
      statusLabel: liveReady ? 'Fornecedor activo' : 'Simulação',
      apiUrlConfigured: Boolean(cfg.apiUrl),
      apiKeyConfigured: Boolean(cfg.apiKey),
      message:
        liveReady
          ? 'Fornecedor SMS activo e pronto a enviar mensagens reais.'
          : 'SMS em simulação. Active o fornecedor e complete a configuração para envio real.',
    };
  }

  private normalizePhone(raw: string): string | null {
    const digits = raw.replace(/[^\d+]/g, '').trim();
    if (digits.replace(/\D/g, '').length < 8) return null;
    return digits;
  }

  private async deliverOne(to: string, body: string): Promise<SmsSendResult> {
    const cfg = await this.getEffectiveConfig();
    const isLive =
      cfg.enabled &&
      cfg.provider === 'http' &&
      Boolean(cfg.apiUrl && cfg.apiKey);
    if (isLive) {
      const url = cfg.apiUrl!;
      const key = cfg.apiKey!;
      const from = cfg.from || undefined;
      const toField =
        this.config.get<string>('SMS_API_TO_FIELD')?.trim() || 'to';
      const bodyField =
        this.config.get<string>('SMS_API_BODY_FIELD')?.trim() || 'body';
      const fromField =
        this.config.get<string>('SMS_API_FROM_FIELD')?.trim() || 'from';
      const payload: Record<string, string> = {
        [toField]: to,
        [bodyField]: body,
      };
      if (from) payload[fromField] = from;
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify(payload),
        });
        const text = await res.text();
        if (!res.ok) {
          return {
            to,
            body,
            status: SmsDeliveryStatus.FALHA,
            provider: 'http',
            providerResponse: `HTTP ${res.status}: ${text.slice(0, 500)}`,
          };
        }
        return {
          to,
          body,
          status: SmsDeliveryStatus.ENVIADO,
          provider: 'http',
          providerResponse: text.slice(0, 1000) || 'OK',
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return {
          to,
          body,
          status: SmsDeliveryStatus.FALHA,
          provider: 'http',
          providerResponse: msg,
        };
      }
    }

    this.logger.log(`[SMS SIMULADO] para=${to} corpo=${body.slice(0, 160)}`);
    return {
      to,
      body,
      status: SmsDeliveryStatus.SIMULADO,
      provider:
        cfg.provider === 'http' && cfg.enabled ? 'console(fallback)' : 'console',
      providerResponse:
        'Simulado — active SMS e configure URL/API key do fornecedor.',
    };
  }

  async sendAndLog(params: {
    to: string;
    body: string;
    communicationId?: string | null;
    unitId?: string | null;
    classGroupId?: string | null;
    createdById?: string | null;
  }) {
    const cfg = await this.getEffectiveConfig();
    const phone = this.normalizePhone(params.to);
    if (!phone) {
      return this.prisma.smsLog.create({
        data: {
          to: params.to,
          body: params.body,
          status: SmsDeliveryStatus.FALHA,
          provider: cfg.provider || 'console',
          providerResponse: 'Número de telefone inválido',
          communicationId: params.communicationId || null,
          unitId: params.unitId || null,
          classGroupId: params.classGroupId || null,
          createdById: params.createdById || null,
        },
      });
    }
    const result = await this.deliverOne(phone, params.body);
    return this.prisma.smsLog.create({
      data: {
        to: result.to,
        body: result.body,
        status: result.status,
        provider: result.provider,
        providerResponse: result.providerResponse,
        communicationId: params.communicationId || null,
        unitId: params.unitId || null,
        classGroupId: params.classGroupId || null,
        createdById: params.createdById || null,
      },
    });
  }

  async resolveGuardianPhones(filters: {
    unitId?: string | null;
    classGroupId?: string | null;
  }): Promise<Array<{ phone: string; label: string }>> {
    const phones = new Map<string, string>();

    if (filters.classGroupId) {
      const turma = await this.prisma.classGroup.findUnique({
        where: { id: filters.classGroupId },
        include: { room: true },
      });
      if (turma?.room) {
        const students = await this.prisma.student.findMany({
          where: { roomId: turma.room.id },
          select: {
            childFullName: true,
            guardianPhone: true,
            guardianAltPhone: true,
          },
        });
        for (const s of students) {
          const primary = this.normalizePhone(s.guardianPhone || '');
          if (primary) phones.set(primary, s.childFullName);
          const alt = this.normalizePhone(s.guardianAltPhone || '');
          if (alt) phones.set(alt, s.childFullName);
        }
      }
    } else if (filters.unitId) {
      const students = await this.prisma.student.findMany({
        where: { unitId: filters.unitId },
        select: {
          childFullName: true,
          guardianPhone: true,
          guardianAltPhone: true,
        },
      });
      for (const s of students) {
        const primary = this.normalizePhone(s.guardianPhone || '');
        if (primary) phones.set(primary, s.childFullName);
        const alt = this.normalizePhone(s.guardianAltPhone || '');
        if (alt) phones.set(alt, s.childFullName);
      }
    }

    return [...phones.entries()].map(([phone, label]) => ({ phone, label }));
  }

  async sendManual(
    dto: {
      body: string;
      unitId?: string | null;
      classGroupId?: string | null;
      to?: string | null;
    },
    user: RequestUser,
  ) {
    const body = dto.body.trim();
    const logs = [];
    if (dto.to?.trim()) {
      logs.push(
        await this.sendAndLog({
          to: dto.to.trim(),
          body,
          unitId: dto.unitId || null,
          classGroupId: dto.classGroupId || null,
          createdById: user.id,
        }),
      );
    } else {
      const recipients = await this.resolveGuardianPhones({
        unitId: dto.unitId,
        classGroupId: dto.classGroupId,
      });
      for (const r of recipients) {
        logs.push(
          await this.sendAndLog({
            to: r.phone,
            body,
            unitId: dto.unitId || null,
            classGroupId: dto.classGroupId || null,
            createdById: user.id,
          }),
        );
      }
    }
    return {
      info: await this.statusInfo(),
      count: logs.length,
      logs,
    };
  }

  async sendForCommunication(
    communicationId: string,
    user: RequestUser,
    bodyOverride?: string | null,
  ) {
    const comm = await this.prisma.communication.findUnique({
      where: { id: communicationId },
    });
    if (!comm) {
      return {
        info: await this.statusInfo(),
        count: 0,
        logs: [],
        error: 'Comunicado não encontrado.',
      };
    }
    const body =
      (bodyOverride?.trim() ||
        `${comm.title}\n\n${comm.body}`.slice(0, 480)).trim();

    let recipients: Array<{ phone: string; label: string }> = [];
    if (comm.audience === 'TURMA' && comm.classGroupId) {
      recipients = await this.resolveGuardianPhones({
        classGroupId: comm.classGroupId,
      });
    } else if (comm.audience === 'UNIDADE' && comm.unitId) {
      recipients = await this.resolveGuardianPhones({ unitId: comm.unitId });
    } else if (comm.audience === 'ENCARREGADO' && comm.targetGuardianEmail) {
      const students = await this.prisma.student.findMany({
        where: { guardianEmail: comm.targetGuardianEmail.toLowerCase() },
        select: {
          childFullName: true,
          guardianPhone: true,
          guardianAltPhone: true,
        },
      });
      const map = new Map<string, string>();
      for (const s of students) {
        const p = this.normalizePhone(s.guardianPhone || '');
        if (p) map.set(p, s.childFullName);
        const a = this.normalizePhone(s.guardianAltPhone || '');
        if (a) map.set(a, s.childFullName);
      }
      recipients = [...map.entries()].map(([phone, label]) => ({ phone, label }));
    } else if (comm.audience === 'ESCOLA' || comm.audience === 'SERVICO') {
      // Escola / serviço: todos os alunos activos (ou filtrados por serviço).
      const students = await this.prisma.student.findMany({
        where:
          comm.audience === 'SERVICO' && comm.serviceId
            ? { serviceId: comm.serviceId }
            : {},
        select: {
          childFullName: true,
          guardianPhone: true,
          guardianAltPhone: true,
        },
      });
      const map = new Map<string, string>();
      for (const s of students) {
        const p = this.normalizePhone(s.guardianPhone || '');
        if (p) map.set(p, s.childFullName);
      }
      recipients = [...map.entries()].map(([phone, label]) => ({ phone, label }));
    }

    const logs = [];
    for (const r of recipients) {
      logs.push(
        await this.sendAndLog({
          to: r.phone,
          body,
          communicationId: comm.id,
          unitId: comm.unitId,
          classGroupId: comm.classGroupId,
          createdById: user.id,
        }),
      );
    }
    return { info: await this.statusInfo(), count: logs.length, logs };
  }

  listLogs(limit = 50) {
    return this.prisma.smsLog.findMany({
      take: Math.min(Math.max(limit, 1), 200),
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        communication: { select: { id: true, title: true } },
        unit: { select: { id: true, name: true } },
        classGroup: { select: { id: true, name: true } },
      },
    });
  }
}
