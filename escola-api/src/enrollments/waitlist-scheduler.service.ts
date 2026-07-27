import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EnrollmentsService } from './enrollments.service';

/**
 * Executa periodicamente o mesmo processamento do endpoint manual
 * POST /enrollments/waitlist/process-expired: expira prazos NOTIFICADO
 * vencidos, liberta a reserva e avança o próximo candidato elegível.
 */
@Injectable()
export class WaitlistScheduler {
  private readonly logger = new Logger(WaitlistScheduler.name);
  private running = false;

  constructor(private readonly enrollments: EnrollmentsService) {}

  // A cada 15 minutos (segundo minuto hora dia mês dia-da-semana).
  @Cron('0 */15 * * * *', { name: 'waitlist-process-expired' })
  async handleExpiredWaitlist() {
    if (this.running) {
      this.logger.warn(
        'Execução anterior ainda em curso; a saltar este ciclo.',
      );
      return;
    }

    this.running = true;
    try {
      const result = await this.enrollments.processExpiredWaitlist();
      this.logger.log(
        `Processamento da lista de espera concluído: ${result.processed} prazo(s) expirado(s).`,
      );
    } catch (error) {
      this.logger.error(
        'Falha ao processar prazos expirados da lista de espera.',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.running = false;
    }
  }
}
