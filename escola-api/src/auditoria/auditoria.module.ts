import { Module } from '@nestjs/common';
import { AuditoriaController } from './auditoria.controller';

/**
 * Módulo de leitura do registo de auditoria. O AuditService provém do
 * AuditModule (global).
 */
@Module({
  controllers: [AuditoriaController],
})
export class AuditoriaModule {}
