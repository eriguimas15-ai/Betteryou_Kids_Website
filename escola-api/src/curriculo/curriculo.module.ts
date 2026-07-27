import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CurriculoController } from './curriculo.controller';
import { CurriculoService } from './curriculo.service';

@Module({
  imports: [PrismaModule],
  controllers: [CurriculoController],
  providers: [CurriculoService],
  exports: [CurriculoService],
})
export class CurriculoModule {}
