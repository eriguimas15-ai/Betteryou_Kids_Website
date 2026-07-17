import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RoomsModule } from '../rooms/rooms.module';

@Module({
  imports: [PrismaModule, RoomsModule],
  controllers: [DashboardController],
})
export class DashboardModule {}
