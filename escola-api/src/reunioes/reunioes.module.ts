import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ReunioesController } from './reunioes.controller';
import { ReunioesService } from './reunioes.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReunioesController],
  providers: [ReunioesService],
  exports: [ReunioesService],
})
export class ReunioesModule {}
