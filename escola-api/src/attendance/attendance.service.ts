import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SaveAttendanceDto } from './dto/save-attendance.dto';

type RequestUser = { id: string; email: string; role: string };

const STAFF_ROLES: string[] = [
  Role.ADMIN,
  Role.DIRECAO,
  Role.COORDENACAO,
  Role.PROFESSOR,
];

function parseDateOnly(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) throw new BadRequestException('Data inválida');
  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new BadRequestException('Data inválida');
  return date;
}

const classGroupInclude = {
  room: { include: { unit: true, service: true } },
  academicYear: true,
} as const;

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  /** Turmas activas disponíveis para registo de presenças (inclui contagem de alunos). */
  async listTurmas() {
    const classes = await this.prisma.classGroup.findMany({
      where: { active: true },
      include: classGroupInclude,
      orderBy: [{ academicYearId: 'desc' }, { name: 'asc' }],
    });

    return Promise.all(
      classes.map(async (turma) => {
        const studentCount = await this.prisma.student.count({
          where: {
            roomId: turma.roomId,
            academicYearId: turma.academicYearId,
          },
        });
        return { ...turma, studentCount };
      }),
    );
  }

  private async getTurmaOrThrow(classGroupId: string) {
    const turma = await this.prisma.classGroup.findUnique({
      where: { id: classGroupId },
      include: classGroupInclude,
    });
    if (!turma) throw new NotFoundException('Turma não encontrada');
    return turma;
  }

  private studentsOfTurma(turma: { roomId: string; academicYearId: string }) {
    return this.prisma.student.findMany({
      where: {
        roomId: turma.roomId,
        academicYearId: turma.academicYearId,
      },
      orderBy: { childFullName: 'asc' },
    });
  }

  /** Lista os alunos da turma com a presença já registada (se existir) para a data. */
  async getTurmaAttendance(classGroupId: string, dateStr: string) {
    const turma = await this.getTurmaOrThrow(classGroupId);
    const date = parseDateOnly(dateStr);
    const students = await this.studentsOfTurma(turma);
    const existing = await this.prisma.attendance.findMany({
      where: { classGroupId, date },
    });
    const byStudent = new Map(existing.map((a) => [a.studentId, a]));

    return {
      classGroup: turma,
      date: dateStr.slice(0, 10),
      students: students.map((student) => {
        const record = byStudent.get(student.id);
        return {
          studentId: student.id,
          childFullName: student.childFullName,
          status: record?.status ?? null,
          note: record?.note ?? null,
          recordedAt: record?.updatedAt ?? null,
        };
      }),
    };
  }

  /** Cria/actualiza (upsert) as presenças da turma para uma data. Editável no mesmo dia. */
  async saveTurmaAttendance(
    classGroupId: string,
    dto: SaveAttendanceDto,
    user: RequestUser,
  ) {
    const turma = await this.getTurmaOrThrow(classGroupId);
    const date = parseDateOnly(dto.date);
    const students = await this.studentsOfTurma(turma);
    const validIds = new Set(students.map((s) => s.id));

    for (const record of dto.records) {
      if (!validIds.has(record.studentId)) {
        throw new BadRequestException(
          'Um dos alunos não pertence a esta turma',
        );
      }
    }

    await this.prisma.$transaction(
      dto.records.map((record) =>
        this.prisma.attendance.upsert({
          where: {
            studentId_classGroupId_date: {
              studentId: record.studentId,
              classGroupId,
              date,
            },
          },
          update: {
            status: record.status,
            note: record.note?.trim() || null,
            recordedById: user.id,
          },
          create: {
            studentId: record.studentId,
            classGroupId,
            date,
            status: record.status,
            note: record.note?.trim() || null,
            recordedById: user.id,
          },
        }),
      ),
    );

    return this.getTurmaAttendance(classGroupId, dto.date);
  }

  /** Histórico de presenças de um aluno (encarregado só vê os seus). */
  async getStudentAttendance(studentId: string, user: RequestUser) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, guardianUserId: true, guardianEmail: true },
    });
    if (!student) throw new NotFoundException('Aluno não encontrado');
    this.assertCanAccessStudent(student, user);

    return this.prisma.attendance.findMany({
      where: { studentId },
      include: {
        classGroup: { include: classGroupInclude },
      },
      orderBy: { date: 'desc' },
    });
  }

  private assertCanAccessStudent(
    student: { guardianUserId: string | null; guardianEmail: string },
    user: RequestUser,
  ) {
    if (STAFF_ROLES.includes(user.role)) return;
    const emailMatch =
      student.guardianEmail.toLowerCase() === user.email.toLowerCase();
    const userMatch = student.guardianUserId === user.id;
    if (!emailMatch && !userMatch) {
      throw new ForbiddenException('Sem acesso às presenças deste aluno');
    }
  }
}
