import { BadRequestException } from '@nestjs/common';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { extname, basename } from 'path';
import type { Request } from 'express';

/** Extensões permitidas para documentos de inscrição e media CMS. */
export const ALLOWED_UPLOAD_EXTENSIONS = new Set([
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
]);

export const ALLOWED_UPLOAD_MIMES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

/** TTL do token de upload após criação da candidatura (48 h). */
export const UPLOAD_TOKEN_TTL_MS = 48 * 60 * 60 * 1000;

const DOC_MAX_BYTES = 8 * 1024 * 1024;
const MEDIA_MAX_BYTES = 5 * 1024 * 1024;

export function generateUploadToken(): {
  token: string;
  hash: string;
  expiresAt: Date;
} {
  const token = randomBytes(32).toString('base64url');
  return {
    token,
    hash: hashUploadToken(token),
    expiresAt: new Date(Date.now() + UPLOAD_TOKEN_TTL_MS),
  };
}

export function hashUploadToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function uploadTokensMatch(
  plainToken: string | undefined | null,
  storedHash: string | null | undefined,
): boolean {
  if (!plainToken || !storedHash) return false;
  const incoming = hashUploadToken(plainToken);
  try {
    const a = Buffer.from(incoming, 'hex');
    const b = Buffer.from(storedHash, 'hex');
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Valida nome original: extensão na allowlist, sem extensão dupla,
 * sem path traversal.
 * Devolve a extensão segura (minúsculas) a usar no ficheiro gravado.
 */
export function assertSafeUploadFilename(originalname: string): string {
  const base = basename(originalname || '');
  if (
    !base ||
    base === '.' ||
    base === '..' ||
    base.includes('\0') ||
    /[/\\]/.test(base)
  ) {
    throw new BadRequestException('Nome de ficheiro inválido');
  }

  const ext = extname(base).toLowerCase();
  if (!ALLOWED_UPLOAD_EXTENSIONS.has(ext)) {
    throw new BadRequestException(
      'Tipo de ficheiro não permitido. Use PDF, JPG, PNG ou WEBP.',
    );
  }

  const nameWithoutExt = base.slice(0, -ext.length);
  // Rejeita extensão dupla (ex.: ficheiro.php.jpg)
  if (/\.[a-z0-9]{1,15}$/i.test(nameWithoutExt)) {
    throw new BadRequestException(
      'Nome de ficheiro inválido (extensão dupla)',
    );
  }

  return ext;
}

export function assertSafeUploadMime(mimetype: string | undefined): void {
  const mime = (mimetype || '').toLowerCase().split(';')[0].trim();
  if (!ALLOWED_UPLOAD_MIMES.has(mime)) {
    throw new BadRequestException(
      'Tipo de ficheiro não permitido. Use PDF, JPG, PNG ou WEBP.',
    );
  }
}

export function multerUploadFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  try {
    assertSafeUploadFilename(file.originalname);
    assertSafeUploadMime(file.mimetype);
    cb(null, true);
  } catch (err) {
    cb(
      err instanceof Error
        ? err
        : new BadRequestException('Ficheiro inválido'),
      false,
    );
  }
}

export function uniqueSafeFilename(originalname: string): string {
  const ext = assertSafeUploadFilename(originalname);
  const unique = `${Date.now()}-${randomBytes(6).toString('hex')}`;
  return `${unique}${ext}`;
}

export const ENROLLMENT_DOC_LIMITS = { fileSize: DOC_MAX_BYTES };
export const CMS_MEDIA_LIMITS = { fileSize: MEDIA_MAX_BYTES };
