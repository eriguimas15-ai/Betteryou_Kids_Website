import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UnitsModule } from './units/units.module';
import { ServicesModule } from './services/services.module';
import { AcademicYearsModule } from './academic-years/academic-years.module';
import { RoomsModule } from './rooms/rooms.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { StudentsModule } from './students/students.module';
import { CmsModule } from './cms/cms.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { MailModule } from './mail/mail.module';
import { UsersModule } from './users/users.module';
import { AdmissionsExtraModule } from './admissions-extra/admissions-extra.module';
import { ClassesModule } from './classes/classes.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    UnitsModule,
    ServicesModule,
    AcademicYearsModule,
    RoomsModule,
    ClassesModule,
    EnrollmentsModule,
    AdmissionsExtraModule,
    StudentsModule,
    CmsModule,
    DashboardModule,
    MailModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
