import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EnrollmentStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RoomsService } from '../rooms/rooms.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(
    private prisma: PrismaService,
    private rooms: RoomsService,
  ) {}

  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO)
  @Get('overview')
  async overview() {
    const [
      enrolled,
      pending,
      waitlist,
      rooms,
      renewalsPending,
    ] = await Promise.all([
      this.prisma.enrollment.count({
        where: { status: EnrollmentStatus.CONFIRMADA },
      }),
      this.prisma.enrollment.count({
        where: { status: EnrollmentStatus.PENDENTE_VALIDACAO },
      }),
      this.prisma.waitlistEntry.count({
        where: { status: { in: ['AGUARDAR', 'NOTIFICADO'] } },
      }),
      this.prisma.room.findMany({
        where: { active: true },
        include: { unit: true, service: true },
      }),
      this.prisma.room.aggregate({
        _sum: { renewalReserved: true },
      }),
    ]);

    const availableVacancies = rooms.reduce(
      (sum, room) => sum + this.rooms.calcVacancies(room),
      0,
    );

    return {
      stats: {
        alunosMatriculados: enrolled,
        vagasDisponiveis: availableVacancies,
        renovacoesPendentes: renewalsPending._sum.renewalReserved ?? 0,
        listaEspera: waitlist,
        candidaturasPendentes: pending,
      },
      rooms: rooms.map((room) => ({
        id: room.id,
        name: room.name,
        unit: room.unit.name,
        service: room.service.name,
        capacity: room.capacity,
        enrolled: room.enrolledCount,
        reserved: room.renewalReserved + room.enrollmentReserved,
        available: this.rooms.calcVacancies(room),
      })),
    };
  }
}
