import type { CookieOptions, Request, Response } from 'express';

export const ACCESS_COOKIE = 'by_access_token';
export const REFRESH_COOKIE = 'by_refresh_token';

function cookieSecure(): boolean {
  const raw = process.env.COOKIE_SECURE;
  if (raw === 'true' || raw === '1') return true;
  if (raw === 'false' || raw === '0') return false;
  return process.env.NODE_ENV === 'production';
}

function baseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: 'lax',
    path: '/',
  };
}

/** Converte valores tipo `15m`, `12h`, `7d` em milissegundos. */
export function durationToMs(value: string | undefined, fallbackMs: number): number {
  if (!value) return fallbackMs;
  const match = /^(\d+)([smhd])$/i.exec(value.trim());
  if (!match) return fallbackMs;
  const n = Number(match[1]);
  const unit = match[2].toLowerCase();
  const mult =
    unit === 's' ? 1000 : unit === 'm' ? 60_000 : unit === 'h' ? 3_600_000 : 86_400_000;
  return n * mult;
}

export function setAuthCookies(
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
) {
  const accessMaxAge = durationToMs(process.env.JWT_EXPIRES_IN, 12 * 3_600_000);
  const refreshMaxAge = durationToMs(
    process.env.JWT_REFRESH_EXPIRES_IN,
    7 * 86_400_000,
  );
  const base = baseCookieOptions();
  res.cookie(ACCESS_COOKIE, tokens.accessToken, { ...base, maxAge: accessMaxAge });
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    ...base,
    maxAge: refreshMaxAge,
  });
}

export function clearAuthCookies(res: Response) {
  const base = baseCookieOptions();
  res.clearCookie(ACCESS_COOKIE, base);
  res.clearCookie(REFRESH_COOKIE, base);
}

export function readRefreshToken(req: Request, bodyToken?: string): string | undefined {
  const fromBody = bodyToken?.trim();
  if (fromBody) return fromBody;
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
  const fromCookie = cookies?.[REFRESH_COOKIE]?.trim();
  return fromCookie || undefined;
}
