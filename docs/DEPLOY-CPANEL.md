# Deploy Namecheap cPanel — BetterYou Kids

Guia para `betteryoukids.com` (frontend estático) + `api.betteryoukids.com` (Node Nest) + MariaDB.

Documentação operacional geral: [OPERACAO-PLATAFORMA.md](./OPERACAO-PLATAFORMA.md).

---

## Arquitectura alvo

| Peça | Host / caminho | Notas |
|------|----------------|--------|
| Frontend SPA | `https://betteryoukids.com` → `public_html/` | Build Vite; `.htaccess` SPA |
| API Nest | `https://api.betteryoukids.com` → Application root `api/` | Node 24; startup `dist/src/main.js` |
| Prefixo HTTP | `/api` | Frontend chama `https://api.betteryoukids.com/api` |
| Media pública | `https://api.betteryoukids.com/uploads/...` | Pasta `UPLOAD_DIR` no Application root |
| MariaDB | `localhost` | User `bettyuld_escola`, DB `bettyuld_betteryoukids` |

Estrutura no repositório local:

- API: `escola-api/`
- Frontend: `Betteryou_Kids_Website-master/Betteryou_Kids_Website-master/`

---

## Cookie / CORS (subdomínio) — veredicto

- `https://betteryoukids.com` → `https://api.betteryoukids.com` é **cross-origin** mas **same-site** (mesmo eTLD+1 `betteryoukids.com`).
- Cookies HttpOnly com **`SameSite=Lax` + `Secure`** + `credentials: 'include'` **funcionam** neste split. **Não** é obrigatório `SameSite=None`.
- `SameSite=None` só se a API estiver noutro site (eTLD+1 diferente) ou se um browser falhar — definir `COOKIE_SAMESITE=none` e `COOKIE_SECURE=true`.
- Cookies são **host-only** no host da API (`api.betteryoukids.com`); o browser envia-os nos pedidos a esse host.
- CORS: origens exactas HTTPS, **nunca** `*`, com `credentials: true` (já no código).

Checklist mínimo auth em produção:

1. `CORS_ORIGIN=https://betteryoukids.com,https://www.betteryoukids.com` (incluir www se o site o servir)
2. `COOKIE_SECURE=true` (ou omitir com `NODE_ENV=production`)
3. `COOKIE_SAMESITE=lax` (omissão)
4. Frontend build com `VITE_API_URL=https://api.betteryoukids.com/api`
5. HTTPS ponta-a-ponta no apex e no subdomínio `api`

---

## 1. MariaDB

No cPanel → MySQL® Databases (já criados):

- Database: `bettyuld_betteryoukids`
- User: `bettyuld_escola` (todas as privilégios na DB)
- Host: `localhost`

`DATABASE_URL` (exemplo):

```text
mysql://bettyuld_escola:SENHA_FORTE@localhost:3306/bettyuld_betteryoukids
```

Prisma usa `provider = "mysql"` — compatível com **MariaDB 10.x / 11.4**.

### Migrações (no servidor, na pasta da API)

```bash
cd ~/api   # ou o Application root real
npx prisma generate
npx prisma migrate deploy
```

Seed **só** em ambiente controlado (não produção com dados reais):

```bash
npx prisma db seed
```

---

## 2. API — Setup Node.js App (cPanel)

1. **Setup Node.js App** → Create Application  
   - Node.js version: **24**  
   - Application mode: **Production**  
   - Application root: `api` (pasta sob home, **fora** de `public_html` se possível)  
   - Application URL: `https://api.betteryoukids.com`  
   - Application startup file: **`dist/src/main.js`**  
     (confirmado pelo `nest build` deste repo — **não** `dist/main.js`)
2. Copiar o código de `escola-api/` para o Application root (FTP/Git/SSH).
3. Em **Environment variables** do Node App (preferível a ficheiro `.env` no disco):

| Variável | Valor exemplo |
|----------|----------------|
| `NODE_ENV` | `production` |
| `PORT` | *(deixar o cPanel definir — a app lê `process.env.PORT`)* |
| `DATABASE_URL` | `mysql://bettyuld_escola:…@localhost:3306/bettyuld_betteryoukids` |
| `JWT_SECRET` | ≥32 chars aleatórios |
| `JWT_REFRESH_SECRET` | ≥32 chars aleatórios |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `CORS_ORIGIN` | `https://betteryoukids.com,https://www.betteryoukids.com` |
| `COOKIE_SECURE` | `true` |
| `COOKIE_SAMESITE` | `lax` (opcional) |
| `PUBLIC_APP_URL` | `https://betteryoukids.com` |
| `SWAGGER_ENABLED` | `false` |
| `UPLOAD_DIR` | `./uploads` |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | SMTP cPanel |

4. Terminal / SSH no Application root:

```bash
npm ci
npm run build
npx prisma generate
npx prisma migrate deploy
mkdir -p uploads uploads/documents
chmod -R u+rwX uploads
```

5. **Restart** da Node App no cPanel.

### Scripts e Passenger

- `npm start` / `npm run start:prod` → `node dist/src/main.js`
- `ConfigModule` carrega `.env` se existir; variáveis já definidas no cPanel **não** são sobrescritas pelo dotenv.
- A app faz `trust proxy` = 1 e escuta em `HOST` (omissão `0.0.0.0`) + `PORT`.
- Prefixo global: `/api`. Health/login: `https://api.betteryoukids.com/api/auth/login` (POST).
- Swagger `/docs`: desactivado com `NODE_ENV=production` ou `SWAGGER_ENABLED=false`.

### Uploads

Pasta relativa `./uploads` sob o Application root — tem de ser **escrevível** pelo utilizador da app. Não apontar para `public_html` sem necessidade.

---

## 3. Frontend — `public_html`

1. Localmente (ou CI), na pasta do site Vite:

```bash
cd Betteryou_Kids_Website-master/Betteryou_Kids_Website-master
cp .env.production.example .env.production
# confirmar VITE_API_URL=https://api.betteryoukids.com/api
npm ci
npm run build
```

2. Conteúdo de `dist/` → `public_html/` (inclui `.htaccess` copiado de `public/.htaccess`).

3. Confirmar no browser: DevTools → Network → pedidos a `api.betteryoukids.com` com cookies; login em `/plataforma`.

### `.htaccess` SPA (já em `public/.htaccess`)

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

Sem isto, rotas como `/plataforma` devolvem 404 no refresh.

### DNS / SSL

- A record ou CNAME do apex → hosting  
- Subdomínio `api` apontado para o mesmo servidor (cPanel cria o vhost da Node App)  
- AutoSSL / Let’s Encrypt nos dois hosts  

---

## 4. Checklist READY / NOT READY

### Corrigido no código (pré-requisitos de deploy)

| Item | Estado |
|------|--------|
| `process.env.PORT` + bind `0.0.0.0` | OK |
| `trust proxy` | OK |
| CORS + credentials | OK (configurar origens) |
| SameSite Lax para split subdomínio | OK (veredicto acima; `COOKIE_SAMESITE` opcional) |
| Prefixo `/api` | OK |
| `VITE_API_URL` documentado + `.env.production.example` | OK |
| Startup `dist/src/main.js` + `npm start` | OK |
| Swagger off em production | OK |
| `.htaccess` SPA em `public/` | OK |
| Prisma mysql / MariaDB | OK |

### Manual no servidor (ainda necessário) → **NOT READY até concluído**

- [ ] Criar/confirmar DB + user MariaDB e `DATABASE_URL`
- [ ] Node App Node 24, root `api`, URL `api.betteryoukids.com`, startup `dist/src/main.js`
- [ ] Env vars de produção (JWT fortes, CORS, COOKIE_SECURE, SMTP, SWAGGER_ENABLED=false)
- [ ] `npm ci && npm run build && npx prisma migrate deploy` no servidor
- [ ] Pasta `uploads` escrevível
- [ ] Build frontend com `VITE_API_URL=https://api.betteryoukids.com/api` → `public_html`
- [ ] SSL nos dois hosts
- [ ] Teste login SPA + cookie `by_access_token` / `by_refresh_token` no domínio `api.`
- [ ] (Opcional) smoke: `API_BASE=https://api.betteryoukids.com/api npm run smoke:roles` com conta de teste

**Veredicto deploy:** código **READY** para o split cPanel descrito; go-live depende dos passos manuais acima.

---

## 5. Troubleshooting rápido

| Sintoma | Causa provável |
|---------|----------------|
| Login OK na API mas SPA “não autentica” | CORS sem origem exacta; build sem `VITE_API_URL`; cookies sem Secure em HTTPS |
| `502` / app não arranca | Startup file errado; falta `npm run build`; crash no boot (JWT/DB) — ver stderr da Node App |
| Refresh em `/plataforma` → 404 | Falta `.htaccess` SPA |
| Upload falha | `UPLOAD_DIR` sem permissão de escrita |
| Rate-limit / IP 127.0.0.1 | Confirmar `trust proxy` (já no código) e reiniciar app |
| Cookies bloqueados noutro domínio | Definir `COOKIE_SAMESITE=none` + `COOKIE_SECURE=true` |
