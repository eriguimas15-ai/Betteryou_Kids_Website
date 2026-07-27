import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditService } from './audit.service';

/**
 * Módulo global de auditoria — disponibiliza o AuditService a toda a aplicação
 * sem necessidade de o importar em cada módulo.
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
