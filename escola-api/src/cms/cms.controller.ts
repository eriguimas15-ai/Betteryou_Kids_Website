import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ContentStatus, Role } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
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

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });

@ApiTags('cms')
@Controller('cms')
export class CmsController {
  constructor(private cms: CmsService) {}

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
  @Roles(Role.ADMIN, Role.COMUNICACAO, Role.DIRECAO)
  @Get('admin/pages')
  listAll() {
    return this.cms.listPages(false);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.COMUNICACAO, Role.DIRECAO)
  @Get('admin/pages/:slug')
  getAdmin(@Param('slug') slug: string) {
    return this.cms.getPage(slug, false);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.COMUNICACAO, Role.DIRECAO)
  @Post('admin/pages/:slug')
  upsert(
    @Param('slug') slug: string,
    @Body() dto: UpsertPageDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.cms.upsertPage(slug, dto, user.id);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.COMUNICACAO, Role.DIRECAO)
  @Patch('admin/pages/:slug/publish')
  publish(@Param('slug') slug: string) {
    return this.cms.publishPage(slug);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.COMUNICACAO, Role.DIRECAO)
  @Post('admin/media')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        altText: { type: 'string' },
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
    @CurrentUser() user: { id: string },
  ) {
    return this.cms.saveMedia(file, altText, user.id);
  }

  @Public()
  @Get('testimonials')
  testimonials() {
    return this.cms.listTestimonials(true);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.COMUNICACAO, Role.DIRECAO)
  @Get('admin/testimonials')
  adminTestimonials() {
    return this.cms.listTestimonials(false);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.COMUNICACAO, Role.DIRECAO)
  @Post('admin/testimonials')
  createTestimonial(
    @Body()
    body: {
      authorName: string;
      text: string;
      unitName?: string;
      featured?: boolean;
      status?: ContentStatus;
    },
  ) {
    return this.cms.createTestimonial(body);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.COMUNICACAO, Role.DIRECAO)
  @Patch('admin/testimonials/:id')
  updateTestimonial(
    @Param('id') id: string,
    @Body()
    body: {
      authorName?: string;
      text?: string;
      unitName?: string | null;
      featured?: boolean;
      status?: ContentStatus;
    },
  ) {
    return this.cms.updateTestimonial(id, body);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN, Role.COMUNICACAO, Role.DIRECAO)
  @Delete('admin/testimonials/:id')
  removeTestimonial(@Param('id') id: string) {
    return this.cms.removeTestimonial(id);
  }
}
