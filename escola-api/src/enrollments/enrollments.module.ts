import { Module, forwardRef } from '@nestjs/common';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { WaitlistScheduler } from './waitlist-scheduler.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RoomsModule } from '../rooms/rooms.module';
import { MailModule } from '../mail/mail.module';
import { StudentsModule } from '../students/students.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    PrismaModule,
    RoomsModule,
    MailModule,
    SettingsModule,
    forwardRef(() => StudentsModule),
  ],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService, WaitlistScheduler],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
