# Operação da Plataforma Betteryou Kids

> **Deploy Namecheap/cPanel** (apex + `api.` + MariaDB): ver [DEPLOY-CPANEL.md](./DEPLOY-CPANEL.md).

## Variáveis de ambiente obrigatórias/recomendadas

### API (`escola-api/.env`)
- `DATABASE_URL` - ligação MySQL.
  - Local típico: `mysql://root@127.0.0.1:3306/betteryou_kids` (serviço Windows / XAMPP).
  - Docker Compose: host do serviço (ex. `db`), **não** misturar com MySQL em `127.0.0.1`.
- `JWT_SECRET` - segredo de autenticação (**forte e único** em staging/produção).
- `JWT_REFRESH_SECRET` - segredo refresh token (legado; refresh usa hash na BD).
- `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` - duração dos cookies (ex.: `15m`, `7d`).
- `CORS_ORIGIN` - lista de origens do frontend (vírgula). **Nunca** usar `*` com cookies. Em staging/prod: URL **exacta** HTTPS.
- `COOKIE_SECURE` - `true`/`false` para o flag `Secure` nos cookies HttpOnly. Em produção, omissão = `true`. Local HTTP: `false`.
- `COOKIE_SAMESITE` - `lax` (omissão), `strict` ou `none`. Split `betteryoukids.com` ↔ `api.betteryoukids.com` é same-site: **manter `lax`**. `none` só com API noutro eTLD+1 (+ `COOKIE_SECURE=true`).
- `HOST` - bind da API (omissão `0.0.0.0`; útil em cPanel/Passenger).
- `SWAGGER_ENABLED` - `true` para forçar Swagger; `false` para desactivar. Em produção, omissão = desactivado.
- `SWAGGER_RETURN_TOKENS` - `true` para devolver `accessToken`/`refreshToken` no JSON (Swagger/Bearer). **Omitir** no SPA — tokens só em cookies.
- `PUBLIC_APP_URL` - URL pública do frontend (usada em links de email).

### Checklist go-live (staging / produção)

Antes de abrir a plataforma a utilizadores reais:

1. `NODE_ENV=production` e HTTPS ponta-a-ponta (proxy/TLS)
2. `COOKIE_SECURE=true` (ou omitir — em produção omissão = `true`)
3. `JWT_SECRET` / `JWT_REFRESH_SECRET` aleatórios **≥32 caracteres** (não `change-me` / valores de dev). Em produção a API emite **warn** no boot se detectar segredo fraco.
4. `CORS_ORIGIN` = origem exacta do frontend (ex.: `https://app.example.com`) — sem `*`
5. `SWAGGER_ENABLED` **unset** ou `false` (não expor `/docs`)
6. `SWAGGER_RETURN_TOKENS` **unset** (SPA cookie-only)
7. Cookies: `HttpOnly` + `Secure` + `SameSite=Lax` (subdomínios do mesmo site); frontend com `credentials: 'include'` e `VITE_API_URL` de produção no build
8. Confirmar `helmet` + `trust proxy` na API e CSP enforce no build do frontend (secção CSP abaixo)
9. Smoke: `npm run smoke:roles` e `npm run smoke:crud` contra a API de staging (seed de teste só em ambiente controlado)
10. Backup MySQL + pasta `UPLOAD_DIR` agendados; testar restauro
11. SMTP/SMS: validar envio real ou deixar em simulação consciente
12. Contas operacionais (ADMIN/DIRECAO/…) com palavras-passe fortes — não reutilizar seed de demo

### Autenticação (SEC-06)
- Access e refresh JWT são emitidos como cookies HttpOnly (`by_access_token`, `by_refresh_token`), `SameSite` conforme `COOKIE_SAMESITE` (omissão `Lax`), `Secure` conforme `COOKIE_SECURE` (produção por omissão = Secure).
- SPA no apex e API em `api.*` do **mesmo** domínio registado: cross-origin mas same-site — `Lax` + CORS credentials é suficiente (ver [DEPLOY-CPANEL.md](./DEPLOY-CPANEL.md)).
- O frontend deve chamar a API com `credentials: 'include'` e **não** guardar tokens em `localStorage` (apenas flag de sessão `by_session`).
- Corpo JSON de login/register/refresh: **sem** tokens, excepto `SWAGGER_RETURN_TOKENS=true`.
- `Authorization: Bearer` continua válido (Swagger / testes / clientes API).

### Email (SMTP)
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Notas:
- Se SMTP não estiver configurado, a publicação de comunicados/boletins continua sem bloqueio; o envio email é ignorado com registo em log.

### SMS (fornecedor configurável)
- `SMS_PROVIDER` - fallback global (`console` ou `http`).
- `SMS_API_URL` - fallback da URL do gateway.
- `SMS_API_KEY` - chave API do fornecedor (não é guardada na BD).
- `SMS_FROM` - fallback do remetente.
- `SMS_API_TO_FIELD` (opcional, predefinido `to`).
- `SMS_API_BODY_FIELD` (opcional, predefinido `body`).
- `SMS_API_FROM_FIELD` (opcional, predefinido `from`).

Notas:
- A activação no site é feita em Plataforma -> Comunicação -> Enviar SMS -> Configuração do fornecedor SMS.
- Mesmo com fornecedor `http`, o modo mantém-se em Simulação até existir URL + chave API e o toggle "Envio activo" estar ligado.

## Arranque local

### API
- `cd escola-api`
- `npm install`
- `npx prisma migrate deploy`
- `npx prisma generate`
- `npm run start:dev`

### Frontend
- `cd Betteryou_Kids_Website-master`
- `npm install`
- `npm run dev`

## Notas operacionais por perfis/módulos

- Após alterações de módulos/perfis de acesso, os utilizadores devem terminar sessão e entrar novamente para actualizar permissões no token.
- Se um perfil não vir uma área nova, validar associação ao perfil correcto e repetir login.

## CSP (Content-Security-Policy)

Fonte: `Betteryou_Kids_Website-master/vite.csp.ts` + meta em `index.html`, aplicada pelo plugin `betteryouCspPlugin` em `vite.config.ts`.

| Modo | Cabeçalho | Comportamento |
|------|-----------|---------------|
| `npm run dev` | `Content-Security-Policy-Report-Only` | Não bloqueia; permite `unsafe-inline`/`unsafe-eval` e `ws:`/`wss:` (HMR Vite) |
| `npm run build` | `Content-Security-Policy` (enforce) | Bloqueia; `script-src 'self'` (assets empacotados); `style-src` com `'unsafe-inline'` (Tailwind/shadcn) |

Política de produção (resumo):
- `default-src 'self'`
- `script-src 'self'`
- `style-src 'self' 'unsafe-inline'`
- `img-src 'self' data: blob: https:` (+ `localhost:3001` para media `/uploads` em local)
- `connect-src 'self' https:` (+ API local `:3001`)
- `frame-src 'self' https://www.google.com https://maps.google.com` (mapas em Contacto)
- `font-src 'self' data:`
- `frame-ancestors 'self'`; `base-uri` / `form-action` `'self'`

Caminho para endurecer mais (sem partir Vite):
1. Manter Report-Only em dev (já feito).
2. Em staging, servir o build com CSP enforce e rever a consola do browser por violações.
3. Se a API estiver noutro host HTTPS, confirmar que `connect-src`/`img-src` cobrem esse origin (hoje `https:` cobre; pode restringir-se ao host exacto).
4. Evitar voltar a `unsafe-eval` em produção; só necessário no HMR.

## Troubleshooting rápido

### Porta em uso
- API: mudar porta (`PORT`) ou terminar processo que usa a porta.
- Frontend: arrancar com outra porta (`npm run dev -- --port 5174`).

### Prisma lock/migração bloqueada
- Confirmar que não existem migrações concorrentes.
- Reexecutar `npx prisma migrate deploy` e `npx prisma generate`.

### "No exit status" em comandos no terminal do editor
- Reiniciar o terminal integrado.
- Se persistir, reiniciar a janela do Cursor e voltar a correr os comandos.
- Validar manualmente se API/frontend ficaram activos.
