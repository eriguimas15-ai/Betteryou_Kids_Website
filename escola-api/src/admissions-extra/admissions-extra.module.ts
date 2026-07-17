import { Module, forwardRef } from '@nestjs/common';
import {
  ActivitiesController,
  JobsController,
  RenewalsController,
} from './admissions-extra.controller';
import {
  ActivitiesService,
  JobsService,
  RenewalsService,
} from './admissions-extra.service';
import { PrismaModule } from '../prisma/prisma.module';
import { RoomsModule } from '../rooms/rooms.module';
import { StudentsModule } from '../students/students.module';

@Module({
  imports: [PrismaModule, RoomsModule, forwardRef(() => StudentsModule)],
  controllers: [RenewalsController, JobsController, ActivitiesController],
  providers: [RenewalsService, JobsService, ActivitiesService],
})
export class AdmissionsExtraModule {}
