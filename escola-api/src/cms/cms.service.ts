import { Injectable, NotFoundException } from '@nestjs/common';
import { ContentStatus } from '@prisma/client';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CmsService {
  constructor(private prisma: PrismaService) {}

  listPages(publishedOnly: boolean) {
    return this.prisma.contentPage.findMany({
      where: publishedOnly ? { status: ContentStatus.PUBLICADO } : undefined,
      include: { sections: { include: { media: true }, orderBy: { sortOrder: 'asc' } } },
      orderBy: { title: 'asc' },
    });
  }

  async getPage(slug: string, publishedOnly: boolean) {
    const page = await this.prisma.contentPage.findUnique({
      where: { slug },
      include: {
        sections: { include: { media: true }, orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!page) throw new NotFoundException('Página não encontrada');
    if (publishedOnly && page.status !== ContentStatus.PUBLICADO) {
      throw new NotFoundException('Página não publicada');
    }
    return page;
  }

  async upsertPage(
    slug: string,
    data: {
      title: string;
      status?: ContentStatus;
      sections: Array<{
        key: string;
        label: string;
        value: string;
        mediaId?: string;
      }>;
    },
    authorId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const page = await tx.contentPage.upsert({
        where: { slug },
        create: {
          slug,
          title: data.title,
          status: data.status ?? ContentStatus.RASCUNHO,
          authorId,
        },
        update: {
          title: data.title,
          status: data.status,
          authorId,
        },
      });

      for (const [index, section] of data.sections.entries()) {
        await tx.contentSection.upsert({
          where: { pageId_key: { pageId: page.id, key: section.key } },
          create: {
            pageId: page.id,
            key: section.key,
            label: section.label,
            value: section.value,
            mediaId: section.mediaId,
            sortOrder: index,
          },
          update: {
            label: section.label,
            value: section.value,
            mediaId: section.mediaId,
            sortOrder: index,
          },
        });
      }

      return tx.contentPage.findUnique({
        where: { id: page.id },
        include: {
          sections: { include: { media: true }, orderBy: { sortOrder: 'asc' } },
        },
      });
    });
  }

  publishPage(slug: string) {
    return this.prisma.contentPage.update({
      where: { slug },
      data: {
        status: ContentStatus.PUBLICADO,
        publishedAt: new Date(),
      },
      include: { sections: true },
    });
  }

  async saveMedia(
    file: Express.Multer.File,
    altText: string | undefined,
    uploadedById: string,
  ) {
    return this.prisma.mediaAsset.create({
      data: {
        fileName: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        filePath: join(file.destination, file.filename).replace(/\\/g, '/'),
        altText,
        uploadedById,
      },
    });
  }

  listTestimonials(publishedOnly: boolean) {
    return this.prisma.testimonial.findMany({
      where: publishedOnly ? { status: ContentStatus.PUBLICADO } : undefined,
      include: { media: true },
      orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }],
    });
  }

  createTestimonial(data: {
    authorName: string;
    text: string;
    unitName?: string;
    featured?: boolean;
    status?: ContentStatus;
    sortOrder?: number;
  }) {
    return this.prisma.testimonial.create({
      data: {
        authorName: data.authorName.trim(),
        text: data.text.trim(),
        unitName: data.unitName?.trim() || null,
        featured: data.featured ?? false,
        status: data.status ?? ContentStatus.RASCUNHO,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async updateTestimonial(
    id: string,
    data: {
      authorName?: string;
      text?: string;
      unitName?: string | null;
      featured?: boolean;
      status?: ContentStatus;
      sortOrder?: number;
    },
  ) {
    const current = await this.prisma.testimonial.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Depoimento não encontrado');
    return this.prisma.testimonial.update({
      where: { id },
      data: {
        ...(data.authorName != null
          ? { authorName: data.authorName.trim() }
          : {}),
        ...(data.text != null ? { text: data.text.trim() } : {}),
        ...(data.unitName !== undefined ? { unitName: data.unitName } : {}),
        ...(data.featured !== undefined ? { featured: data.featured } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      },
    });
  }

  async removeTestimonial(id: string) {
    await this.prisma.testimonial.delete({ where: { id } });
    return { ok: true };
  }
}
