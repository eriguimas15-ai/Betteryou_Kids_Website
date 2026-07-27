import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { AcademicoController } from './academico.controller';
import { AcademicoService } from './academico.service';
import { PeriodosBoletinsService } from './periodos-boletins.service';
import { BoletimPdfService } from './boletim-pdf.service';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [AcademicoController],
  providers: [AcademicoService, PeriodosBoletinsService, BoletimPdfService],
  exports: [AcademicoService, PeriodosBoletinsService],
})
export class AcademicoModule {}
