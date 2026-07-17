import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export type EnrollmentMailPayload = {
  to: string;
  guardianName: string;
  childName: string;
  unitName: string;
  serviceName: string;
  roomName?: string | null;
  yearLabel: string;
  statusLabel: string;
  vacanciesNote: string;
  summaryLines: string[];
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private config: ConfigService) {
    const host = this.config.get<string>('SMTP_HOST', '127.0.0.1');
    const port = Number(this.config.get('SMTP_PORT', 1025));
    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: false,
      ignoreTLS: true,
    });
  }

  async sendEnrollmentReceived(payload: EnrollmentMailPayload) {
    const subject = `Inscrição recebida — ${payload.childName} (${payload.statusLabel})`;
    const body = [
      `Olá ${payload.guardianName},`,
      '',
      'Recebemos a inscrição na BetterYou Kids.',
      '',
      `Criança: ${payload.childName}`,
      `Ano letivo: ${payload.yearLabel}`,
      `Unidade: ${payload.unitName}`,
      `Serviço: ${payload.serviceName}`,
      `Sala: ${payload.roomName || 'A definir'}`,
      `Estado da vaga: ${payload.statusLabel}`,
      payload.vacanciesNote,
      '',
      'Dados submetidos:',
      ...payload.summaryLines.map((l) => `• ${l}`),
      '',
      'A nossa equipa irá analisar a candidatura. Receberá um novo email quando o processo for concluído.',
      '',
      'BetterYou Kids',
    ].join('\n');

    return this.send(payload.to, subject, body);
  }

  async sendEnrollmentDecided(payload: EnrollmentMailPayload & { decision: string }) {
    const subject = `Actualização da inscrição — ${payload.childName}`;
    const body = [
      `Olá ${payload.guardianName},`,
      '',
      `A sua inscrição foi actualizada pela gestão da BetterYou Kids.`,
      '',
      `Criança: ${payload.childName}`,
      `Unidade: ${payload.unitName}`,
      `Serviço: ${payload.serviceName}`,
      `Sala: ${payload.roomName || 'A definir'}`,
      `Estado: ${payload.decision}`,
      '',
      'Se tiver dúvidas, contacte a secretaria da unidade.',
      '',
      'BetterYou Kids',
    ].join('\n');

    return this.send(payload.to, subject, body);
  }

  async sendWaitlistNotified(payload: {
    to: string;
    guardianName: string;
    childName: string;
    unitName: string;
    serviceName: string;
    roomName?: string | null;
    deadline: string;
  }) {
    const subject = `Vaga disponível — lista de espera (${payload.childName})`;
    const body = [
      `Olá ${payload.guardianName},`,
      '',
      'Há disponibilidade para a inscrição em lista de espera na BetterYou Kids.',
      '',
      `Criança: ${payload.childName}`,
      `Unidade: ${payload.unitName}`,
      `Serviço: ${payload.serviceName}`,
      `Sala: ${payload.roomName || 'A definir'}`,
      `Prazo de resposta: ${payload.deadline}`,
      '',
      'Contacte a secretaria da unidade o mais breve possível para confirmar a vaga.',
      '',
      'BetterYou Kids',
    ].join('\n');

    return this.send(payload.to, subject, body);
  }

  private async send(to: string, subject: string, text: string) {
    const from = this.config.get(
      'SMTP_FROM',
      'BetterYou Kids <noreply@betteryoukids.com>',
    );
    try {
      if (!this.transporter) {
        this.logger.warn(`Email (sem SMTP): ${subject} → ${to}`);
        return { queued: false };
      }
      const info = await this.transporter.sendMail({ from, to, subject, text });
      this.logger.log(`Email enviado: ${subject} → ${to} (${info.messageId})`);
      return { queued: true, messageId: info.messageId };
    } catch (error) {
      this.logger.error(
        `Falha ao enviar email para ${to}: ${error instanceof Error ? error.message : error}`,
      );
      return { queued: false, error: true };
    }
  }
}
