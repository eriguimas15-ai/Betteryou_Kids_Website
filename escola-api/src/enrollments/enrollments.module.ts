import { Module, forwardRef } from '@nestjs/common';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentsService } from './enrollments.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RoomsModule } from '../rooms/rooms.module';
import { MailModule } from '../mail/mail.module';
import { StudentsModule } from '../students/students.module';

@Module({
  imports: [
    PrismaModule,
    RoomsModule,
    MailModule,
    forwardRef(() => StudentsModule),
  ],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
