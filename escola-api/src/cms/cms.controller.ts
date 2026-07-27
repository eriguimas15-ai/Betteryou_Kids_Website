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
import { ContentStatus, Role } from '@prisma/client';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { CmsService } from './cms.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

class SectionDto {
  @IsString()
  key: string;

  @IsString()
  label: string;

  @IsString()
  value: string;

  @IsOptional()
  @IsString()
  mediaId?: string;
}

class UpsertPageDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionDto)
  sections: SectionDto[];
}

class PublishDto {
  @IsOptional()
  @IsString()
  publishAt?: string | null;
}

class CreateAlbumDto {
  @IsString()
  @MinLength(2)
  title: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

class UpdateAlbumDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;
}

class CreateGalleryItemDto {
  @IsString()
  mediaId: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

class UpdateGalleryItemDto {
  @IsOptional()
  @IsString()
  title?: string | null;

  @IsOptional()
  @IsString()
  caption?: string | null;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsString()
  mediaId?: string;
}

class UpdateMediaDto {
  @IsOptional()
  @IsString()
  altText?: string | null;

  @IsOptional()
  @IsString()
  category?: string | null;
}

class CreateTestimonialDto {
  @IsString()
  @MinLength(2)
  authorName: string;

  @IsString()
  @MinLength(2)
  text: string;

  @IsOptional()
  @IsString()
  unitName?: string;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

class UpdateTestimonialDto {
  @IsOptional()
  @IsString()
  authorName?: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsString()
  unitName?: string | null;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsEnum(ContentStatus)
  status?: ContentStatus;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

// Papéis com acesso ao módulo de conteúdo (edição).
const EDITOR_ROLES = [Role.ADMIN, Role.COMUNICACAO, Role.DIRECAO] as const;
// Papéis que aprovam/publicam (aprovação editorial).
const APPROVER_ROLES = [Role.ADMIN, Role.DIRECAO] as const;

@ApiTags('cms')
@Controller('cms')
export class CmsController {
  constructor(private cms: CmsService) {}

  // ─────────────────────────── Páginas ───────────────────────────
  @Public()
  @Get('pages')
  listPublished() {
    return this.cms.listPages(true);
  }

  @Public()
  @Get('pages/:slug')
  getPublished(@Param('slug') slug: string) {
    return this.cms.getPage(slug, true);
  }

  @ApiBearerAuth()
  @Roles(...EDITOR_ROLES)
  @Get('admin/pages')
  listAll() {
    return this.cms.listPages(false);
  }

  @ApiBearerAuth()
  @Roles(...EDITOR_ROLES)
  @Get('admin/pages/:slug')
  getAdmin(@Param('slug') slug: string) {
    return this.cms.getPage(slug, false);
  }

  @ApiBearerAuth()
  @Roles(...EDITOR_ROLES)
  @Post('admin/pages/:slug')
  upsert(
    @Param('slug') slug: string,
    @Body() dto: UpsertPageDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.cms.upsertPage(slug, dto, user.id);
  }

  /** Comunicação submete a página para revisão editorial. */
  @ApiBearerAuth()
  @Roles(...EDITOR_ROLES)
  @Patch('admin/pages/:slug/submit')
  submitPage(@Param('slug') slug: string) {
    return this.cms.submitPage(slug);
  }

  /** Direção/Admin aprova e publica (opcionalmente agenda) a página. */
  @ApiBearerAuth()
  @Roles(...APPROVER_ROLES)
  @Patch('admin/pages/:slug/publish')
  publish(@Param('slug') slug: string, @Body() dto: PublishDto) {
    return this.cms.publishPage(slug, dto?.publishAt);
  }

  @ApiBearerAuth()
  @Roles(...APPROVER_ROLES)
  @Patch('admin/pages/:slug/archive')
  archivePage(@Param('slug') slug: string) {
    return this.cms.archivePage(slug);
  }

  @ApiBearerAuth()
  @Roles(...EDITOR_ROLES)
  @Delete('admin/pages/:slug')
  removePage(@Param('slug') slug: string) {
    return this.cms.removePage(slug);
  }

  // ────────────────── Job: promover conteúdo agendado ──────────────────
  @ApiBearerAuth()
  @Roles(...APPROVER_ROLES)
  @Post('admin/process-scheduled')
  processScheduled() {
    return this.cms.processScheduledContent();
  }

  // ─────────────────────── Biblioteca de media ───────────────────────
  @ApiBearerAuth()
  @Roles(...EDITOR_ROLES)
  @Post('admin/media')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        altText: { type: 'string' },
        category: { type: 'string' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: uploadDir,
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @Body('altText') altText: string,
    @Body('category') category: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.cms.saveMedia(file, altText, category, user.id);
  }

  @ApiBearerAuth()
  @Roles(...EDITOR_ROLES)
  @Get('admin/media')
  listMedia(@Query('category') category?: string) {
    return this.cms.listMedia(category);
  }

  @ApiBearerAuth()
  @Roles(...EDITOR_ROLES)
  @Patch('admin/media/:id')
  updateMedia(@Param('id') id: string, @Body() dto: UpdateMediaDto) {
    return this.cms.updateMedia(id, dto);
  }

  @ApiBearerAuth()
  @Roles(...EDITOR_ROLES)
  @Delete('admin/media/:id')
  removeMedia(@Param('id') id: string) {
    return this.cms.removeMedia(id);
  }

  // ───────────────────────────── Galeria ─────────────────────────────
  @Public()
  @Get('gallery')
  galleryPublic() {
    return this.cms.listGalleryPublic();
  }

  @ApiBearerAuth()
  @Roles(...EDITOR_ROLES)
  @Get('admin/gallery')
  galleryAdmin() {
    return this.cms.listGalleryAdmin();
  }

  @ApiBearerAuth()
  @Roles(...EDITOR_ROLES)
  @Post('admin/gallery')
  createAlbum(@Body() dto: CreateAlbumDto) {
    return this.cms.createAlbum(dto);
  }

  @ApiBearerAuth()
  @Roles(...EDITOR_ROLES)
  @Patch('admin/gallery/:id')
  updateAlbum(@Param('id') id: string, @Body() dto: UpdateAlbumDto) {
    return this.cms.updateAlbum(id, dto);
  }

  @ApiBearerAuth()
  @Roles(...EDITOR_ROLES)
  @Delete('admin/gallery/:id')
  removeAlbum(@Param('id') id: string) {
    return this.cms.removeAlbum(id);
  }

  @ApiBearerAuth()
  @Roles(...EDITOR_ROLES)
  @Patch('admin/gallery/:id/submit')
  submitAlbum(@Param('id') id: string) {
    return this.cms.submitAlbum(id);
  }

  @ApiBearerAuth()
  @Roles(...APPROVER_ROLES)
  @Patch('admin/gallery/:id/publish')
  publishAlbum(@Param('id') id: string, @Body() dto: PublishDto) {
    return this.cms.publishAlbum(id, dto?.publishAt);
  }

  @ApiBearerAuth()
  @Roles(...APPROVER_ROLES)
  @Patch('admin/gallery/:id/archive')
  archiveAlbum(@Param('id') id: string) {
    return this.cms.archiveAlbum(id);
  }

  @ApiBearerAuth()
  @Roles(...EDITOR_ROLES)
  @Post('admin/gallery/:id/items')
  addGalleryItem(
    @Param('id') id: string,
    @Body() dto: CreateGalleryItemDto,
  ) {
    return this.cms.addGalleryItem(id, dto);
  }

  @ApiBearerAuth()
  @Roles(...EDITOR_ROLES)
  @Patch('admin/gallery/items/:itemId')
  updateGalleryItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateGalleryItemDto,
  ) {
    return this.cms.updateGalleryItem(itemId, dto);
  }

  @ApiBearerAuth()
  @Roles(...EDITOR_ROLES)
  @Delete('admin/gallery/items/:itemId')
  removeGalleryItem(@Param('itemId') itemId: string) {
    return this.cms.removeGalleryItem(itemId);
  }

  // ──────────────────────────── Depoimentos ────────────────────────────
  @Public()
  @Get('testimonials')
  testimonials() {
    return this.cms.listTestimonials(true);
  }

  @ApiBearerAuth()
  @Roles(...EDITOR_ROLES)
  @Get('admin/testimonials')
  adminTestimonials() {
    return this.cms.listTestimonials(false);
  }

  @ApiBearerAuth()
  @Roles(...EDITOR_ROLES)
  @Post('admin/testimonials')
  createTestimonial(@Body() dto: CreateTestimonialDto) {
    return this.cms.createTestimonial(dto);
  }

  @ApiBearerAuth()
  @Roles(...EDITOR_ROLES)
  @Patch('admin/testimonials/:id')
  updateTestimonial(
    @Param('id') id: string,
    @Body() dto: UpdateTestimonialDto,
  ) {
    return this.cms.updateTestimonial(id, dto);
  }

  @ApiBearerAuth()
  @Roles(...EDITOR_ROLES)
  @Patch('admin/testimonials/:id/submit')
  submitTestimonial(@Param('id') id: string) {
    return this.cms.submitTestimonial(id);
  }

  @ApiBearerAuth()
  @Roles(...APPROVER_ROLES)
  @Patch('admin/testimonials/:id/publish')
  publishTestimonial(@Param('id') id: string, @Body() dto: PublishDto) {
    return this.cms.publishTestimonial(id, dto?.publishAt);
  }

  @ApiBearerAuth()
  @Roles(...EDITOR_ROLES)
  @Delete('admin/testimonials/:id')
  removeTestimonial(@Param('id') id: string) {
    return this.cms.removeTestimonial(id);
  }
}
