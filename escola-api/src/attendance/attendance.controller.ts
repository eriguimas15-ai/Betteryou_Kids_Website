import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AttendanceService } from './attendance.service';
import { SaveAttendanceDto } from './dto/save-attendance.dto';

type RequestUser = { id: string; email: string; role: string };

@ApiTags('attendance')
@ApiBearerAuth()
@Controller('attendance')
export class AttendanceController {
  constructor(private attendance: AttendanceService) {}

  /** Turmas disponíveis para registo de presenças. */
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO, Role.PROFESSOR)
  @Get('turmas')
  listTurmas() {
    return this.attendance.listTurmas();
  }

  /** Presenças de uma turma numa data (para registo/edição pelo staff). */
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO, Role.PROFESSOR)
  @Get('turma/:classGroupId')
  getTurma(
    @Param('classGroupId') classGroupId: string,
    @Query('date') date?: string,
  ) {
    if (!date) throw new BadRequestException('Indique a data (date).');
    return this.attendance.getTurmaAttendance(classGroupId, date);
  }

  /** Guarda (cria/actualiza) as presenças da turma para uma data. */
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO, Role.PROFESSOR)
  @Post('turma/:classGroupId')
  saveTurma(
    @Param('classGroupId') classGroupId: string,
    @Body() dto: SaveAttendanceDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.attendance.saveTurmaAttendance(classGroupId, dto, user);
  }

  /** Histórico de presenças de um aluno (encarregado só vê os seus). */
  @Roles(
    Role.ADMIN,
    Role.DIRECAO,
    Role.COORDENACAO,
    Role.PROFESSOR,
    Role.ENCARREGADO,
  )
  @Get('aluno/:studentId')
  getStudent(
    @Param('studentId') studentId: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.attendance.getStudentAttendance(studentId, user);
  }
}
