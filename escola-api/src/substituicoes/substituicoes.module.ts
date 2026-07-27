import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SubstituicoesController } from './substituicoes.controller';
import { SubstituicoesService } from './substituicoes.service';

@Module({
  imports: [PrismaModule],
  controllers: [SubstituicoesController],
  providers: [SubstituicoesService],
  exports: [SubstituicoesService],
})
export class SubstituicoesModule {}
