import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
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
import { AttendanceModule } from './attendance/attendance.module';
import { CommunicationsModule } from './communications/communications.module';
import { AcademicoModule } from './academico/academico.module';
import { EventsModule } from './events/events.module';
import { FinanceiroModule } from './financeiro/financeiro.module';
import { RelatoriosModule } from './relatorios/relatorios.module';
import { SettingsModule } from './settings/settings.module';
import { AuditModule } from './common/audit/audit.module';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { BackupsModule } from './backups/backups.module';
import { NeeModule } from './nee/nee.module';
import { CurriculoModule } from './curriculo/curriculo.module';
import { SintesesModule } from './sinteses/sinteses.module';
import { SubstituicoesModule } from './substituicoes/substituicoes.module';
import { SmsModule } from './sms/sms.module';
import { ReunioesModule } from './reunioes/reunioes.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    UnitsModule,
    ServicesModule,
    AcademicYearsModule,
    RoomsModule,
    ClassesModule,
    AttendanceModule,
    CommunicationsModule,
    AcademicoModule,
    NeeModule,
    CurriculoModule,
    SintesesModule,
    SubstituicoesModule,
    SmsModule,
    ReunioesModule,
    EventsModule,
    FinanceiroModule,
    RelatoriosModule,
    EnrollmentsModule,
    AdmissionsExtraModule,
    StudentsModule,
    CmsModule,
    DashboardModule,
    MailModule,
    SettingsModule,
    AuditoriaModule,
    BackupsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
