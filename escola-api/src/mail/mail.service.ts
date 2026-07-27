import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

function formatHoursLabel(hours: number): string {
  if (hours === 1) return '1 hora';
  if (hours % 24 === 0) {
    const days = hours / 24;
    return days === 1 ? '1 dia' : `${days} dias`;
  }
  return `${hours} horas`;
}

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
    deadline?: string | null;
    responseHours: number;
  }) {
    const windowLabel = formatHoursLabel(payload.responseHours);
    const hasDeadline = !!payload.deadline;
    const subject = `Vaga reservada — lista de espera (${payload.childName})`;
    const body = [
      `Olá ${payload.guardianName},`,
      '',
      'Há disponibilidade para a inscrição em lista de espera na BetterYou Kids.',
      hasDeadline
        ? `A vaga ficou reservada durante ${windowLabel}.`
        : 'A vaga ficou reservada sem limite de tempo.',
      '',
      `Criança: ${payload.childName}`,
      `Unidade: ${payload.unitName}`,
      `Serviço: ${payload.serviceName}`,
      `Sala: ${payload.roomName || 'A definir'}`,
      hasDeadline
        ? `Prazo de resposta: ${payload.deadline}`
        : 'Prazo de resposta: sem limite de tempo.',
      '',
      hasDeadline
        ? 'Contacte a secretaria da unidade dentro deste prazo para confirmar a vaga.'
        : 'Contacte a secretaria da unidade para confirmar a vaga.',
      ...(hasDeadline
        ? [
            'Se não houver resposta até ao prazo, a reserva expira e a vaga será oferecida ao próximo candidato.',
          ]
        : []),
      '',
      'BetterYou Kids',
    ].join('\n');

    return this.send(payload.to, subject, body);
  }

  async sendWaitlistExpired(payload: {
    to: string;
    guardianName: string;
    childName: string;
    unitName: string;
    serviceName: string;
    roomName?: string | null;
    responseHours?: number;
  }) {
    const windowLabel = payload.responseHours
      ? formatHoursLabel(payload.responseHours)
      : null;
    const subject = `Prazo expirado — lista de espera (${payload.childName})`;
    const body = [
      `Olá ${payload.guardianName},`,
      '',
      windowLabel
        ? `O prazo de ${windowLabel} para confirmar a vaga reservada terminou.`
        : 'O prazo para confirmar a vaga reservada terminou.',
      'A reserva foi libertada e a candidatura passou ao estado expirado.',
      '',
      `Criança: ${payload.childName}`,
      `Unidade: ${payload.unitName}`,
      `Serviço: ${payload.serviceName}`,
      `Sala: ${payload.roomName || 'A definir'}`,
      '',
      'Se ainda tiver interesse, contacte a secretaria da unidade.',
      '',
      'BetterYou Kids',
    ].join('\n');

    return this.send(payload.to, subject, body);
  }

  async sendCommunicationEmail(payload: {
    to: string;
    guardianName?: string | null;
    title: string;
    body: string;
    audienceLabel?: string | null;
  }) {
    const greeting = payload.guardianName?.trim()
      ? `Olá ${payload.guardianName.trim()},`
      : 'Olá,';
    const subject = `Comunicado — ${payload.title}`;
    const text = [
      greeting,
      '',
      'Recebeu um novo comunicado da BetterYou Kids.',
      payload.audienceLabel ? `Destinatários: ${payload.audienceLabel}` : null,
      '',
      payload.title,
      '',
      payload.body,
      '',
      'Pode consultar este e outros comunicados no portal do encarregado.',
      '',
      'BetterYou Kids',
    ]
      .filter((line) => line !== null)
      .join('\n');

    return this.send(payload.to, subject, text);
  }

  async sendReportCardPublishedEmail(payload: {
    to: string;
    guardianName?: string | null;
    childName: string;
    periodName: string;
    classGroupName: string;
    unitName?: string | null;
    lineCount: number;
    overallComment?: string | null;
    portalUrl?: string | null;
    attachment?: { filename: string; content: Buffer };
  }) {
    const greeting = payload.guardianName?.trim()
      ? `Olá ${payload.guardianName.trim()},`
      : 'Olá,';
    const subject = `Boletim publicado — ${payload.childName} (${payload.periodName})`;
    const summaryLines = [
      `Aluno: ${payload.childName}`,
      `Período: ${payload.periodName}`,
      `Turma: ${payload.classGroupName}`,
      payload.unitName ? `Unidade: ${payload.unitName}` : null,
      `Avaliações registadas: ${payload.lineCount}`,
    ].filter((line): line is string => !!line);

    const portalHint = payload.portalUrl
      ? `${payload.portalUrl}/platform`
      : 'o portal do encarregado';

    const text = [
      greeting,
      '',
      'Foi publicado um novo boletim de avaliação na BetterYou Kids.',
      '',
      ...summaryLines,
      '',
      payload.overallComment?.trim()
        ? `Comentário geral: ${payload.overallComment.trim()}`
        : null,
      '',
      payload.attachment
        ? 'O boletim em PDF segue em anexo a este email.'
        : 'O boletim está disponível para consulta e transferência no portal.',
      !payload.attachment
        ? `Aceda a ${portalHint} e utilize «Transferir PDF» na secção Boletins.`
        : null,
      '',
      `Consulte também em ${portalHint}.`,
      '',
      'BetterYou Kids',
    ]
      .filter((line) => line !== null)
      .join('\n');

    return this.send(payload.to, subject, text, {
      attachments: payload.attachment
        ? [
            {
              filename: payload.attachment.filename,
              content: payload.attachment.content,
            },
          ]
        : undefined,
    });
  }

  private async send(
    to: string,
    subject: string,
    text: string,
    options?: {
      attachments?: Array<{ filename: string; content: Buffer }>;
    },
  ) {
    const from = this.config.get(
      'SMTP_FROM',
      'BetterYou Kids <noreply@betteryoukids.com>',
    );
    try {
      if (!this.transporter) {
        this.logger.warn(`Email (sem SMTP): ${subject} → ${to}`);
        return { queued: false };
      }
      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        text,
        attachments: options?.attachments,
      });
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
