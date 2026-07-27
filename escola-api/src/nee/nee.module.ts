import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NeeController } from './nee.controller';
import { NeeService } from './nee.service';

@Module({
  imports: [PrismaModule],
  controllers: [NeeController],
  providers: [NeeService],
  exports: [NeeService],
})
export class NeeModule {}
