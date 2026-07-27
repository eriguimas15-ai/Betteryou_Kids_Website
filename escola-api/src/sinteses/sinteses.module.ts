import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SintesesController } from './sinteses.controller';
import { SintesesService } from './sinteses.service';

@Module({
  imports: [PrismaModule],
  controllers: [SintesesController],
  providers: [SintesesService],
  exports: [SintesesService],
})
export class SintesesModule {}
