import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ContentStatus, Prisma } from '@prisma/client';
import { join } from 'path';
import { PrismaService } from '../prisma/prisma.service';

/** Filtro de visibilidade pública: publicado e dentro da janela de agendamento. */
function publicVisibleWhere(now: Date) {
  return {
    status: ContentStatus.PUBLICADO,
    OR: [{ publishAt: null }, { publishAt: { lte: now } }],
  };
}

/** Converte um valor recebido em Date (ou null) para o campo publishAt. */
function parsePublishAt(value?: string | null): Date | null {
  if (value == null || value === '') return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException('Data de agendamento inválida');
  }
  return date;
}

/**
 * Determina publishAt/publishedAt ao publicar/agendar.
 * - Sem data ou data no passado → publica já (publishedAt = agora).
 * - Data futura → agenda (publishedAt fica null até o job promover).
 */
function resolvePublishTiming(publishAt: Date | null) {
  const now = new Date();
  if (!publishAt || publishAt <= now) {
    return { publishAt, publishedAt: now };
  }
  return { publishAt, publishedAt: null as Date | null };
}

@Injectable()
export class CmsService {
  constructor(private prisma: PrismaService) {}

  // ─────────────────────────── Páginas ───────────────────────────
  listPages(publishedOnly: boolean) {
    return this.prisma.contentPage.findMany({
      where: publishedOnly ? publicVisibleWhere(new Date()) : undefined,
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
    if (publishedOnly) {
      const now = new Date();
      const visible =
        page.status === ContentStatus.PUBLICADO &&
        (!page.publishAt || page.publishAt <= now);
      if (!visible) throw new NotFoundException('Página não publicada');
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

  /** Comunicação submete uma página para revisão editorial. */
  async submitPage(slug: string) {
    await this.getPage(slug, false);
    return this.prisma.contentPage.update({
      where: { slug },
      data: { status: ContentStatus.EM_REVISAO },
      include: { sections: true },
    });
  }

  /** Direção/Admin aprova e publica (ou agenda) uma página. */
  async publishPage(slug: string, publishAt?: string | null) {
    const timing = resolvePublishTiming(parsePublishAt(publishAt));
    return this.prisma.contentPage.update({
      where: { slug },
      data: {
        status: ContentStatus.PUBLICADO,
        publishAt: timing.publishAt,
        publishedAt: timing.publishedAt,
      },
      include: { sections: true },
    });
  }

  archivePage(slug: string) {
    return this.prisma.contentPage.update({
      where: { slug },
      data: { status: ContentStatus.ARQUIVADO },
      include: { sections: true },
    });
  }

  /** Remove uma página e as respectivas secções (cascade). */
  async removePage(slug: string) {
    const page = await this.prisma.contentPage.findUnique({ where: { slug } });
    if (!page) throw new NotFoundException('Página não encontrada');
    await this.prisma.contentPage.delete({ where: { slug } });
    return { ok: true, slug };
  }

  // ─────────────────────── Biblioteca de media ───────────────────────
  async saveMedia(
    file: Express.Multer.File,
    altText: string | undefined,
    category: string | undefined,
    uploadedById: string,
  ) {
    return this.prisma.mediaAsset.create({
      data: {
        fileName: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        filePath: join(file.destination, file.filename).replace(/\\/g, '/'),
        altText,
        category: category?.trim() || null,
        uploadedById,
      },
    });
  }

  listMedia(category?: string) {
    return this.prisma.mediaAsset.findMany({
      where: category ? { category } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateMedia(
    id: string,
    data: { altText?: string | null; category?: string | null },
  ) {
    const current = await this.prisma.mediaAsset.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Ficheiro não encontrado');
    return this.prisma.mediaAsset.update({
      where: { id },
      data: {
        ...(data.altText !== undefined ? { altText: data.altText } : {}),
        ...(data.category !== undefined
          ? { category: data.category?.trim() || null }
          : {}),
      },
    });
  }

  async removeMedia(id: string) {
    const usedInSection = await this.prisma.contentSection.count({
      where: { mediaId: id },
    });
    const usedInGallery = await this.prisma.galleryItem.count({
      where: { mediaId: id },
    });
    const usedInTestimonial = await this.prisma.testimonial.count({
      where: { mediaId: id },
    });
    if (usedInSection + usedInGallery + usedInTestimonial > 0) {
      throw new BadRequestException(
        'Ficheiro em uso. Remova-o das páginas/galeria/depoimentos primeiro.',
      );
    }
    await this.prisma.mediaAsset.delete({ where: { id } });
    return { ok: true };
  }

  // ───────────────────────────── Galeria ─────────────────────────────
  listGalleryPublic() {
    const now = new Date();
    return this.prisma.galleryAlbum.findMany({
      where: publicVisibleWhere(now),
      include: {
        items: { include: { media: true }, orderBy: { sortOrder: 'asc' } },
      },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });
  }

  listGalleryAdmin() {
    return this.prisma.galleryAlbum.findMany({
      include: {
        items: { include: { media: true }, orderBy: { sortOrder: 'asc' } },
      },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
    });
  }

  private slugify(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  async createAlbum(data: {
    title: string;
    slug?: string;
    sortOrder?: number;
  }) {
    const slug = (data.slug?.trim() || this.slugify(data.title)) || 'album';
    const exists = await this.prisma.galleryAlbum.findUnique({
      where: { slug },
    });
    if (exists) throw new BadRequestException('Já existe um álbum com este slug');
    return this.prisma.galleryAlbum.create({
      data: {
        title: data.title.trim(),
        slug,
        sortOrder: data.sortOrder ?? 0,
        status: ContentStatus.RASCUNHO,
      },
      include: { items: { include: { media: true } } },
    });
  }

  async updateAlbum(
    id: string,
    data: {
      title?: string;
      slug?: string;
      sortOrder?: number;
      status?: ContentStatus;
    },
  ) {
    const current = await this.prisma.galleryAlbum.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Álbum não encontrado');
    return this.prisma.galleryAlbum.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title.trim() } : {}),
        ...(data.slug !== undefined
          ? { slug: this.slugify(data.slug) || current.slug }
          : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
      include: {
        items: { include: { media: true }, orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async removeAlbum(id: string) {
    const current = await this.prisma.galleryAlbum.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Álbum não encontrado');
    await this.prisma.galleryAlbum.delete({ where: { id } });
    return { ok: true };
  }

  async submitAlbum(id: string) {
    const current = await this.prisma.galleryAlbum.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Álbum não encontrado');
    return this.prisma.galleryAlbum.update({
      where: { id },
      data: { status: ContentStatus.EM_REVISAO },
      include: {
        items: { include: { media: true }, orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async publishAlbum(id: string, publishAt?: string | null) {
    const current = await this.prisma.galleryAlbum.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Álbum não encontrado');
    const timing = resolvePublishTiming(parsePublishAt(publishAt));
    return this.prisma.galleryAlbum.update({
      where: { id },
      data: {
        status: ContentStatus.PUBLICADO,
        publishAt: timing.publishAt,
        publishedAt: timing.publishedAt,
      },
      include: {
        items: { include: { media: true }, orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async archiveAlbum(id: string) {
    const current = await this.prisma.galleryAlbum.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Álbum não encontrado');
    return this.prisma.galleryAlbum.update({
      where: { id },
      data: { status: ContentStatus.ARQUIVADO },
      include: {
        items: { include: { media: true }, orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async addGalleryItem(
    albumId: string,
    data: { mediaId: string; title?: string; caption?: string; sortOrder?: number },
  ) {
    const album = await this.prisma.galleryAlbum.findUnique({
      where: { id: albumId },
    });
    if (!album) throw new NotFoundException('Álbum não encontrado');
    const media = await this.prisma.mediaAsset.findUnique({
      where: { id: data.mediaId },
    });
    if (!media) throw new NotFoundException('Ficheiro de media não encontrado');
    let sortOrder = data.sortOrder;
    if (sortOrder === undefined) {
      const last = await this.prisma.galleryItem.aggregate({
        where: { albumId },
        _max: { sortOrder: true },
      });
      sortOrder = (last._max.sortOrder ?? -1) + 1;
    }
    return this.prisma.galleryItem.create({
      data: {
        albumId,
        mediaId: data.mediaId,
        title: data.title?.trim() || null,
        caption: data.caption?.trim() || null,
        sortOrder,
      },
      include: { media: true },
    });
  }

  async updateGalleryItem(
    itemId: string,
    data: {
      title?: string | null;
      caption?: string | null;
      sortOrder?: number;
      mediaId?: string;
    },
  ) {
    const current = await this.prisma.galleryItem.findUnique({
      where: { id: itemId },
    });
    if (!current) throw new NotFoundException('Item não encontrado');
    return this.prisma.galleryItem.update({
      where: { id: itemId },
      data: {
        ...(data.title !== undefined
          ? { title: data.title?.trim() || null }
          : {}),
        ...(data.caption !== undefined
          ? { caption: data.caption?.trim() || null }
          : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        ...(data.mediaId !== undefined ? { mediaId: data.mediaId } : {}),
      },
      include: { media: true },
    });
  }

  async removeGalleryItem(itemId: string) {
    const current = await this.prisma.galleryItem.findUnique({
      where: { id: itemId },
    });
    if (!current) throw new NotFoundException('Item não encontrado');
    await this.prisma.galleryItem.delete({ where: { id: itemId } });
    return { ok: true };
  }

  // ──────────────────────────── Depoimentos ────────────────────────────
  listTestimonials(publishedOnly: boolean) {
    return this.prisma.testimonial.findMany({
      where: publishedOnly ? publicVisibleWhere(new Date()) : undefined,
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
    const statusUpdate: Prisma.TestimonialUpdateInput = {};
    if (data.status !== undefined) {
      statusUpdate.status = data.status;
      if (data.status === ContentStatus.PUBLICADO) {
        const timing = resolvePublishTiming(current.publishAt ?? null);
        statusUpdate.publishedAt = current.publishedAt ?? timing.publishedAt;
      }
    }
    return this.prisma.testimonial.update({
      where: { id },
      data: {
        ...(data.authorName != null
          ? { authorName: data.authorName.trim() }
          : {}),
        ...(data.text != null ? { text: data.text.trim() } : {}),
        ...(data.unitName !== undefined
          ? { unitName: data.unitName?.trim() || null }
          : {}),
        ...(data.featured !== undefined ? { featured: data.featured } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
        ...statusUpdate,
      },
    });
  }

  async submitTestimonial(id: string) {
    const current = await this.prisma.testimonial.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Depoimento não encontrado');
    return this.prisma.testimonial.update({
      where: { id },
      data: { status: ContentStatus.EM_REVISAO },
    });
  }

  async publishTestimonial(id: string, publishAt?: string | null) {
    const current = await this.prisma.testimonial.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Depoimento não encontrado');
    const timing = resolvePublishTiming(parsePublishAt(publishAt));
    return this.prisma.testimonial.update({
      where: { id },
      data: {
        status: ContentStatus.PUBLICADO,
        publishAt: timing.publishAt,
        publishedAt: timing.publishedAt,
      },
    });
  }

  async removeTestimonial(id: string) {
    await this.prisma.testimonial.delete({ where: { id } });
    return { ok: true };
  }

  // ────────────────── Job: promover conteúdo agendado ──────────────────
  /**
   * Job/cron: promove conteúdo publicado cujo agendamento (publishAt) já
   * chegou mas ainda não foi marcado como ativo (publishedAt null).
   */
  async processScheduledContent() {
    const now = new Date();
    const dueWhere = {
      status: ContentStatus.PUBLICADO,
      publishAt: { lte: now },
      publishedAt: null,
    };

    const pages = await this.prisma.contentPage.updateMany({
      where: dueWhere,
      data: { publishedAt: now },
    });
    const testimonials = await this.prisma.testimonial.updateMany({
      where: dueWhere,
      data: { publishedAt: now },
    });
    const albums = await this.prisma.galleryAlbum.updateMany({
      where: dueWhere,
      data: { publishedAt: now },
    });

    const processed = pages.count + testimonials.count + albums.count;
    return {
      processed,
      pages: pages.count,
      testimonials: testimonials.count,
      galleryAlbums: albums.count,
      message:
        processed > 0
          ? `${processed} conteúdo(s) agendado(s) promovido(s) para público.`
          : 'Sem conteúdo agendado por promover.',
    };
  }
}
