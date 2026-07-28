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
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { EnrollmentStatus, Role } from '@prisma/client';
import { diskStorage } from 'multer';
import { createReadStream } from 'fs';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import type { Response } from 'express';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  ENROLLMENT_DOC_LIMITS,
  multerUploadFilter,
  uniqueSafeFilename,
} from '../common/upload-security';

const docsDir = join(process.env.UPLOAD_DIR || './uploads', 'documents');
if (!existsSync(docsDir)) mkdirSync(docsDir, { recursive: true });

@ApiTags('enrollments')
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private enrollments: EnrollmentsService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
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
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO, Role.ENCARREGADO)
  @Get('mine')
  listMine(
    @CurrentUser()
    user: { id: string; email: string; role: string },
  ) {
    return this.enrollments.listMine(user);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO)
  @Get('waitlist')
  waitlist() {
    return this.enrollments.listWaitlist();
  }

  /** Job/cron: processa prazos expirados, liberta reservas e avança a fila. */
  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO)
  @Post('waitlist/process-expired')
  processExpired() {
    return this.enrollments.processExpiredWaitlist();
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
  confirm(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    return this.enrollments.confirm(id, user);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.DIRECAO, Role.COORDENACAO)
  @Patch(':id/reject')
  reject(
    @Param('id') id: string,
    @CurrentUser() user: { id: string; email: string; role: string },
  ) {
    return this.enrollments.reject(id, user);
  }

  /**
   * Upload de documentos da candidatura.
   * Público com uploadToken (emitido no create) OU JWT com ownership/staff.
   */
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @Post(':id/documents')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        type: { type: 'string' },
        uploadToken: { type: 'string' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: docsDir,
        filename: (_req, file, cb) => {
          try {
            cb(null, uniqueSafeFilename(file.originalname));
          } catch (err) {
            cb(err instanceof Error ? err : new Error('Ficheiro inválido'), '');
          }
        },
      }),
      fileFilter: multerUploadFilter,
      limits: ENROLLMENT_DOC_LIMITS,
    }),
  )
  uploadDocument(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: string,
    @Body('uploadToken') uploadToken: string,
    @CurrentUser()
    user: { id: string; email: string; role: string } | null,
  ) {
    return this.enrollments.addDocument(id, file, type, {
      uploadToken,
      user: user ?? undefined,
    });
  }

  /**
   * Lista documentos: JWT (staff/encarregado) ou uploadToken da candidatura.
   */
  @Public()
  @Get(':id/documents')
  listDocuments(
    @Param('id') id: string,
    @Query('uploadToken') uploadToken: string | undefined,
    @CurrentUser()
    user: { id: string; email: string; role: string } | null,
  ) {
    return this.enrollments.listDocumentsAuthorized(id, {
      uploadToken,
      user: user ?? undefined,
    });
  }

  /** Download autenticado de documento sensível (não servir via /uploads estático). */
  @ApiBearerAuth()
  @Roles(
    Role.ADMIN,
    Role.DIRECAO,
    Role.COORDENACAO,
    Role.COMUNICACAO,
    Role.ENCARREGADO,
  )
  @Get(':id/documents/:documentId/file')
  async downloadDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @CurrentUser()
    user: { id: string; email: string; role: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const doc = await this.enrollments.getDocumentFileForUser(
      id,
      documentId,
      user,
    );
    res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(doc.fileName)}`,
    );
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'private, no-store');
    return new StreamableFile(createReadStream(doc.absolutePath));
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
  @Roles(
    Role.ADMIN,
    Role.DIRECAO,
    Role.COORDENACAO,
    Role.COMUNICACAO,
    Role.ENCARREGADO,
  )
  @Get(':id')
  get(
    @Param('id') id: string,
    @CurrentUser()
    user: { id: string; email: string; role: string },
  ) {
    return this.enrollments.findOneForUser(id, user);
  }
}
