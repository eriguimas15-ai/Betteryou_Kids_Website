import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { EnrollmentStatus, Role } from '@prisma/client';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';

const docsDir = join(process.env.UPLOAD_DIR || './uploads', 'documents');
if (!existsSync(docsDir)) mkdirSync(docsDir, { recursive: true });

@ApiTags('enrollments')
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private enrollments: EnrollmentsService) {}

  @Public()
  @Post()
  create(@Body() dto: CreateEnrollmentDto) {
    return this.enrollments.create(dto);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO, Role.COMUNICACAO)
  @Get()
  list(@Query('status') status?: EnrollmentStatus) {
    return this.enrollments.findAll(status);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO)
  @Get('waitlist')
  waitlist() {
    return this.enrollments.listWaitlist();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO)
  @Post('waitlist/:id/notify')
  notify(@Param('id') id: string) {
    return this.enrollments.notifyWaitlist(id);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO)
  @Patch(':id/confirm')
  confirm(@Param('id') id: string) {
    return this.enrollments.confirm(id);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO)
  @Patch(':id/reject')
  reject(@Param('id') id: string) {
    return this.enrollments.reject(id);
  }

  @Public()
  @Post(':id/documents')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        type: { type: 'string' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: docsDir,
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 8 * 1024 * 1024 },
    }),
  )
  uploadDocument(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: string,
  ) {
    return this.enrollments.addDocument(id, file, type);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO, Role.COMUNICACAO)
  @Get(':id/documents')
  listDocuments(@Param('id') id: string) {
    return this.enrollments.listDocuments(id);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO)
  @Delete(':id/documents/:documentId')
  removeDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
  ) {
    return this.enrollments.removeDocument(id, documentId);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO, Role.COMUNICACAO)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.enrollments.remove(id);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO, Role.COMUNICACAO)
  @Get(':id')
  get(@Param('id') id: string) {
    return this.enrollments.findOne(id);
  }
}
