import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import {
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';

class CreateClassDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsString()
  roomId: string;

  @IsString()
  academicYearId: string;

  @IsOptional()
  @IsString()
  teacherName?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

class UpdateClassDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  roomId?: string;

  @IsOptional()
  @IsString()
  teacherName?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  list(academicYearId?: string) {
    return this.prisma.classGroup.findMany({
      where: academicYearId ? { academicYearId } : undefined,
      include: {
        room: { include: { unit: true, service: true } },
        academicYear: true,
      },
      orderBy: [{ academicYearId: 'asc' }, { name: 'asc' }],
    });
  }

  async create(data: CreateClassDto) {
    const room = await this.prisma.room.findUnique({
      where: { id: data.roomId },
    });
    if (!room || !room.active) {
      throw new BadRequestException('Sala inválida');
    }
    if (room.academicYearId !== data.academicYearId) {
      throw new BadRequestException(
        'A sala não pertence ao ano letivo seleccionado',
      );
    }
    return this.prisma.classGroup.create({
      data: {
        name: data.name.trim(),
        roomId: data.roomId,
        academicYearId: data.academicYearId,
        teacherName: data.teacherName?.trim() || null,
        notes: data.notes?.trim() || null,
        active: data.active ?? true,
      },
      include: {
        room: { include: { unit: true, service: true } },
        academicYear: true,
      },
    });
  }

  async update(id: string, data: UpdateClassDto) {
    const current = await this.prisma.classGroup.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Turma não encontrada');

    if (data.roomId) {
      const room = await this.prisma.room.findUnique({
        where: { id: data.roomId },
      });
      if (!room) throw new BadRequestException('Sala inválida');
    }

    return this.prisma.classGroup.update({
      where: { id },
      data: {
        ...(data.name != null ? { name: data.name.trim() } : {}),
        ...(data.roomId != null ? { roomId: data.roomId } : {}),
        ...(data.teacherName !== undefined
          ? { teacherName: data.teacherName }
          : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
      },
      include: {
        room: { include: { unit: true, service: true } },
        academicYear: true,
      },
    });
  }

  async remove(id: string) {
    await this.prisma.classGroup.delete({ where: { id } });
    return { ok: true };
  }
}

@ApiTags('classes')
@ApiBearerAuth()
@Controller('classes')
export class ClassesController {
  constructor(private classes: ClassesService) {}

  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO)
  @Get()
  list(@Query('academicYearId') academicYearId?: string) {
    return this.classes.list(academicYearId);
  }

  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO)
  @Post()
  create(@Body() dto: CreateClassDto) {
    return this.classes.create(dto);
  }

  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClassDto) {
    return this.classes.update(id, dto);
  }

  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.classes.remove(id);
  }
}

@Module({
  imports: [PrismaModule],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}
