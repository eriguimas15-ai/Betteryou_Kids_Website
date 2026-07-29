/**
 * SEC-06: em fluxo SPA normal os tokens vão só em cookies HttpOnly.
 * Tokens no JSON só quando SWAGGER_RETURN_TOKENS=true (Swagger / clientes Bearer).
 */
export function shouldReturnTokensInBody(): boolean {
  const flag = process.env.SWAGGER_RETURN_TOKENS;
  return flag === 'true' || flag === '1';
}

export function toAuthClientBody<
  T extends { accessToken: string; refreshToken: string; user: unknown },
>(result: T): T | Omit<T, 'accessToken' | 'refreshToken'> {
  if (shouldReturnTokensInBody()) {
    return result;
  }
  const { accessToken: _a, refreshToken: _r, ...safe } = result;
  return safe;
}
