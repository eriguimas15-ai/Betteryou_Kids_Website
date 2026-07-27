import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BehaviorType, ReportCardStatus, Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AcademicoService } from './academico.service';
import { PeriodosBoletinsService } from './periodos-boletins.service';
import {
  CreateAssessmentDto,
  CreateLessonSummaryDto,
  CreateScheduleEntryDto,
  UpdateAssessmentDto,
  UpdateLessonSummaryDto,
  UpdateScheduleEntryDto,
} from './dto/academico.dto';
import {
  CreateBehaviorRecordDto,
  CreateNonTeachingActivityDto,
  CreateStudentQualificationDto,
  UpdateBehaviorRecordDto,
  UpdateNonTeachingActivityDto,
  UpdateStudentQualificationDto,
} from './dto/academico-extra.dto';
import {
  CreateAssessmentPeriodDto,
  GenerateReportCardsDto,
  PublishReportCardDto,
  UpdateAssessmentPeriodDto,
  UpdateReportCardDto,
} from './dto/periodos-boletins.dto';

type RequestUser = { id: string; email: string; role: string };

const STAFF_ROLES = [
  Role.ADMIN,
  Role.DIRECAO,
  Role.COORDENACAO,
  Role.PROFESSOR,
] as const;

const READ_ROLES = [
  Role.ADMIN,
  Role.DIRECAO,
  Role.COORDENACAO,
  Role.PROFESSOR,
  Role.ENCARREGADO,
] as const;

const PERIOD_MANAGE_ROLES = [
  Role.ADMIN,
  Role.DIRECAO,
  Role.COORDENACAO,
  Role.PROFESSOR,
] as const;

@ApiTags('academico')
@ApiBearerAuth()
@Controller('academico')
export class AcademicoController {
  constructor(
    private academico: AcademicoService,
    private periodosBoletins: PeriodosBoletinsService,
  ) {}

  /** Turmas disponíveis para gestão académica. */
  @Roles(...STAFF_ROLES)
  @Get('turmas')
  listTurmas() {
    return this.academico.listTurmas();
  }

  // -------------------------- Sumários --------------------------

  @Roles(...STAFF_ROLES)
  @Get('sumarios/turma/:classGroupId')
  listSummaries(@Param('classGroupId') classGroupId: string) {
    return this.academico.listSummaries(classGroupId);
  }

  @Roles(...READ_ROLES)
  @Get('sumarios/aluno/:studentId')
  studentSummaries(
    @Param('studentId') studentId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.academico.getStudentSummaries(studentId, user);
  }

  @Roles(...STAFF_ROLES)
  @Post('sumarios')
  createSummary(
    @Body() dto: CreateLessonSummaryDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.academico.createSummary(dto, user);
  }

  @Roles(...STAFF_ROLES)
  @Patch('sumarios/:id')
  updateSummary(
    @Param('id') id: string,
    @Body() dto: UpdateLessonSummaryDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.academico.updateSummary(id, dto, user);
  }

  @Roles(...STAFF_ROLES)
  @Delete('sumarios/:id')
  removeSummary(@Param('id') id: string) {
    return this.academico.removeSummary(id);
  }

  // ------------------------- Avaliações -------------------------

  @Roles(...STAFF_ROLES)
  @Get('avaliacoes/turma/:classGroupId')
  listAssessments(@Param('classGroupId') classGroupId: string) {
    return this.academico.listAssessments(classGroupId);
  }

  @Roles(...READ_ROLES)
  @Get('avaliacoes/aluno/:studentId')
  studentAssessments(
    @Param('studentId') studentId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.academico.getStudentAssessments(studentId, user);
  }

  @Roles(...STAFF_ROLES)
  @Post('avaliacoes')
  createAssessment(
    @Body() dto: CreateAssessmentDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.academico.createAssessment(dto, user);
  }

  @Roles(...STAFF_ROLES)
  @Patch('avaliacoes/:id')
  updateAssessment(
    @Param('id') id: string,
    @Body() dto: UpdateAssessmentDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.academico.updateAssessment(id, dto, user);
  }

  @Roles(...STAFF_ROLES)
  @Delete('avaliacoes/:id')
  removeAssessment(@Param('id') id: string) {
    return this.academico.removeAssessment(id);
  }

  // -------------------------- Horários --------------------------

  @Roles(...STAFF_ROLES)
  @Get('horarios/turma/:classGroupId')
  listSchedule(@Param('classGroupId') classGroupId: string) {
    return this.academico.listSchedule(classGroupId);
  }

  @Roles(...READ_ROLES)
  @Get('horarios/aluno/:studentId')
  studentSchedule(
    @Param('studentId') studentId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.academico.getStudentSchedule(studentId, user);
  }

  @Roles(...STAFF_ROLES)
  @Post('horarios')
  createScheduleEntry(@Body() dto: CreateScheduleEntryDto) {
    return this.academico.createScheduleEntry(dto);
  }

  @Roles(...STAFF_ROLES)
  @Patch('horarios/:id')
  updateScheduleEntry(
    @Param('id') id: string,
    @Body() dto: UpdateScheduleEntryDto,
  ) {
    return this.academico.updateScheduleEntry(id, dto);
  }

  @Roles(...STAFF_ROLES)
  @Delete('horarios/:id')
  removeScheduleEntry(@Param('id') id: string) {
    return this.academico.removeScheduleEntry(id);
  }

  // ---------------- Actividades não lectivas ----------------

  @Roles(...STAFF_ROLES)
  @Get('nle')
  listNle(
    @Query('classGroupId') classGroupId?: string,
    @Query('teacherUserId') teacherUserId?: string,
  ) {
    return this.academico.listNonTeachingActivities({
      classGroupId: classGroupId || undefined,
      teacherUserId: teacherUserId || undefined,
    });
  }

  @Roles(...STAFF_ROLES)
  @Post('nle')
  createNle(
    @Body() dto: CreateNonTeachingActivityDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.academico.createNonTeachingActivity(dto, user);
  }

  @Roles(...STAFF_ROLES)
  @Patch('nle/:id')
  updateNle(
    @Param('id') id: string,
    @Body() dto: UpdateNonTeachingActivityDto,
  ) {
    return this.academico.updateNonTeachingActivity(id, dto);
  }

  @Roles(...STAFF_ROLES)
  @Delete('nle/:id')
  removeNle(@Param('id') id: string) {
    return this.academico.removeNonTeachingActivity(id);
  }

  // -------------------- Comportamento ---------------------

  @Roles(
    Role.ADMIN,
    Role.DIRECAO,
    Role.COORDENACAO,
    Role.PROFESSOR,
    Role.ENCARREGADO,
  )
  @Get('comportamento/mine')
  listMyBehavior(@CurrentUser() user: RequestUser) {
    return this.academico.listMyBehaviorRecords(user);
  }

  @Roles(...STAFF_ROLES)
  @Get('comportamento')
  listBehavior(
    @Query('studentId') studentId?: string,
    @Query('type') type?: BehaviorType,
    @Query('unitId') unitId?: string,
  ) {
    return this.academico.listBehaviorRecords({
      studentId: studentId || undefined,
      type: type || undefined,
      unitId: unitId || undefined,
    });
  }

  @Roles(...STAFF_ROLES)
  @Post('comportamento')
  createBehavior(
    @Body() dto: CreateBehaviorRecordDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.academico.createBehaviorRecord(dto, user);
  }

  @Roles(...STAFF_ROLES)
  @Patch('comportamento/:id')
  updateBehavior(
    @Param('id') id: string,
    @Body() dto: UpdateBehaviorRecordDto,
  ) {
    return this.academico.updateBehaviorRecord(id, dto);
  }

  @Roles(...STAFF_ROLES)
  @Delete('comportamento/:id')
  removeBehavior(@Param('id') id: string) {
    return this.academico.removeBehaviorRecord(id);
  }

  // -------------------- Habilitações ----------------------

  @Roles(
    Role.ADMIN,
    Role.DIRECAO,
    Role.COORDENACAO,
    Role.PROFESSOR,
    Role.ENCARREGADO,
  )
  @Get('habilitacoes/mine')
  listMyQualifications(@CurrentUser() user: RequestUser) {
    return this.academico.listMyQualifications(user);
  }

  @Roles(...STAFF_ROLES)
  @Get('habilitacoes')
  listQualifications(
    @Query('studentId') studentId?: string,
    @Query('unitId') unitId?: string,
  ) {
    return this.academico.listQualifications({
      studentId: studentId || undefined,
      unitId: unitId || undefined,
    });
  }

  @Roles(...STAFF_ROLES)
  @Post('habilitacoes')
  createQualification(
    @Body() dto: CreateStudentQualificationDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.academico.createQualification(dto, user);
  }

  @Roles(...STAFF_ROLES)
  @Patch('habilitacoes/:id')
  updateQualification(
    @Param('id') id: string,
    @Body() dto: UpdateStudentQualificationDto,
  ) {
    return this.academico.updateQualification(id, dto);
  }

  @Roles(...STAFF_ROLES)
  @Delete('habilitacoes/:id')
  removeQualification(@Param('id') id: string) {
    return this.academico.removeQualification(id);
  }

  // -------------------- Períodos / Boletins ----------------------

  @Roles(...STAFF_ROLES)
  @Get('periodos')
  listPeriods(
    @Query('academicYearId') academicYearId?: string,
    @Query('unitId') unitId?: string,
  ) {
    return this.periodosBoletins.listPeriods({
      academicYearId: academicYearId || undefined,
      unitId: unitId || undefined,
    });
  }

  @Roles(...STAFF_ROLES)
  @Get('periodos/:id')
  getPeriod(@Param('id') id: string) {
    return this.periodosBoletins.getPeriod(id);
  }

  @Roles(...PERIOD_MANAGE_ROLES)
  @Post('periodos')
  createPeriod(@Body() dto: CreateAssessmentPeriodDto) {
    return this.periodosBoletins.createPeriod(dto);
  }

  @Roles(...PERIOD_MANAGE_ROLES)
  @Patch('periodos/:id')
  updatePeriod(
    @Param('id') id: string,
    @Body() dto: UpdateAssessmentPeriodDto,
  ) {
    return this.periodosBoletins.updatePeriod(id, dto);
  }

  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO)
  @Delete('periodos/:id')
  removePeriod(@Param('id') id: string) {
    return this.periodosBoletins.removePeriod(id);
  }

  @Roles(
    Role.ADMIN,
    Role.DIRECAO,
    Role.COORDENACAO,
    Role.PROFESSOR,
    Role.ENCARREGADO,
  )
  @Get('boletins/mine')
  listMyReportCards(@CurrentUser() user: RequestUser) {
    return this.periodosBoletins.listMine(user);
  }

  @Roles(...READ_ROLES)
  @Get('boletins/aluno/:studentId')
  studentReportCards(
    @Param('studentId') studentId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.periodosBoletins.getStudentReportCards(studentId, user);
  }

  @Roles(...STAFF_ROLES)
  @Get('boletins')
  listReportCards(
    @Query('periodId') periodId?: string,
    @Query('classGroupId') classGroupId?: string,
    @Query('studentId') studentId?: string,
    @Query('status') status?: ReportCardStatus,
  ) {
    return this.periodosBoletins.listReportCards({
      periodId: periodId || undefined,
      classGroupId: classGroupId || undefined,
      studentId: studentId || undefined,
      status: status || undefined,
    });
  }

  @Roles(
    Role.ADMIN,
    Role.DIRECAO,
    Role.COORDENACAO,
    Role.PROFESSOR,
    Role.ENCARREGADO,
  )
  @Get('boletins/:id/pdf')
  async reportCardPdf(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Res() res: Response,
  ) {
    const { buffer, filename } = await this.periodosBoletins.getReportCardPdf(
      id,
      user,
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length.toString(),
    });
    res.end(buffer);
  }

  @Roles(...STAFF_ROLES)
  @Get('boletins/:id')
  getReportCard(@Param('id') id: string) {
    return this.periodosBoletins.getReportCard(id);
  }

  @Roles(...STAFF_ROLES)
  @Post('boletins/gerar')
  generateReportCards(
    @Body() dto: GenerateReportCardsDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.periodosBoletins.generateReportCards(dto, user);
  }

  @Roles(...STAFF_ROLES)
  @Patch('boletins/:id')
  updateReportCard(
    @Param('id') id: string,
    @Body() dto: UpdateReportCardDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.periodosBoletins.updateReportCard(id, dto, user);
  }

  @Roles(...STAFF_ROLES)
  @Post('boletins/:id/publish')
  publishReportCard(
    @Param('id') id: string,
    @Body() dto: PublishReportCardDto = {},
    @CurrentUser() user: RequestUser,
  ) {
    return this.periodosBoletins.setReportCardPublished(id, true, user, {
      sendEmail: dto?.sendEmail !== false,
    });
  }

  @Roles(...STAFF_ROLES)
  @Post('boletins/:id/unpublish')
  unpublishReportCard(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.periodosBoletins.setReportCardPublished(id, false, user);
  }

  @Roles(...STAFF_ROLES)
  @Delete('boletins/:id')
  removeReportCard(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.periodosBoletins.removeReportCard(id, user);
  }
}
