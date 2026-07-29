# Smoke regression — autenticação por cookies (SEC-06)

Checklist manual / API após alterações de auth. Correr com API em `:3001` e frontend em `:8080` (ou origem em `CORS_ORIGIN`).

## Contas seed (palavras-passe conhecidas)

Definidas em `escola-api/prisma/seed.ts` (upsert não destrutivo):

| Perfil | Email | Password |
|--------|-------|----------|
| ADMIN | `admin@betteryoukids.com` | `Admin123!` |
| COMUNICACAO | `comunicacao@betteryoukids.com` | `Comunica123!` |
| DIRECAO | `direcao@betteryoukids.com` | `Direcao123!` |
| COORDENACAO | `coordenacao@betteryoukids.com` | `Coordena123!` |
| ENCARREGADO | `encarregado@betteryoukids.com` | `Encarrega123!` |

Após alterar o seed: `cd escola-api && npx prisma db seed`.

## Smoke automatizado por perfil

```bash
cd escola-api
npm run smoke:roles
```

Para cada conta: login (cookies) → `GET /auth/me` (role + módulos) → logout → `GET /auth/me` = 401.  
ENCARREGADO: também `GET /api/financeiro/mine/invoices`.

### Resultados (último smoke local — roles)

Corrido com `npm run smoke:roles` (API `:3001`, seed actualizado):

| Perfil | Login | /auth/me | Módulos | /mine | Logout | Pós-logout |
|--------|-------|----------|---------|-------|--------|------------|
| ADMIN | OK | OK | OK (25) | n/a | OK | OK |
| COMUNICACAO | OK | OK | OK (5) | n/a | OK | OK |
| DIRECAO | OK | OK | OK (22) | n/a | OK | OK |
| COORDENACAO | OK | OK | OK (16) | n/a | OK | OK |
| ENCARREGADO | OK | OK | OK (4) | OK (`/financeiro/mine/invoices`) | OK | OK |

## Smoke CRUD (inscrições + upload)

```bash
cd escola-api
npm run smoke:crud
```

Fluxo: login ADMIN (cookies) → listagens (units/years/rooms/classes) → CRUD rascunho de comunicado → `POST /enrollments` + upload PNG com `uploadToken` + lista documentos + cleanup → ENCARREGADO `GET` `/mine` (financeiro, comunicados, inscrições, NEE).

### Resultados (último smoke local — CRUD)

Corrido com `npm run smoke:crud` (API `:3001`, 2026-07-28):

| Passo | Resultado |
|-------|-----------|
| ADMIN login | OK |
| GET /units | OK (2) |
| GET /academic-years | OK (1) |
| GET /academic-years/active | 2026/2027 |
| GET /rooms | OK (19) |
| GET /classes | OK (0) |
| POST /communications (rascunho) | OK |
| GET /communications (lista) | OK (rascunho presente) |
| PATCH /communications/:id | OK |
| DELETE /communications/:id (cleanup) | OK |
| POST /enrollments | OK (lista_espera) |
| POST /enrollments/:id/documents | OK (png) |
| GET /enrollments/:id/documents | OK (1) |
| DELETE /enrollments/:id (cleanup) | OK |
| ENCARREGADO login | OK |
| GET /financeiro/mine/invoices | OK |
| GET /communications/mine | OK |
| GET /enrollments/mine | OK |
| GET /nee/mine | OK |

## Pré-requisitos

- `COOKIE_SECURE=false` em local HTTP
- `CORS_ORIGIN` inclui a origem do frontend (ex.: `http://localhost:8080`)
- Conta de teste (ex.: `admin@betteryoukids.com`)
- **SPA:** respostas de login/register/refresh **não** incluem `accessToken`/`refreshToken` no JSON (só cookies HttpOnly). Para Swagger/Bearer com tokens no corpo: `SWAGGER_RETURN_TOKENS=true`.

## Auth cookies (automatizável)

1. **Login** — `POST /api/auth/login` com email/password + cookie jar  
   - Esperado: `200`, `Set-Cookie: by_access_token=...; HttpOnly; Path=/; SameSite=Lax` (+ refresh)  
   - Corpo: `user` **sem** tokens (salvo `SWAGGER_RETURN_TOKENS=true`)
2. **GET autenticado** — `GET /api/auth/me` com cookies (sem Bearer)  
   - Esperado: `200` com dados do utilizador
3. **Logout** — `POST /api/auth/logout` com cookies  
   - Esperado: `200`, cookies limpos (`Set-Cookie` com Max-Age=0 ou equivalentes)
4. **Após logout** — `GET /api/auth/me` com os mesmos cookies  
   - Esperado: `401`
5. **Plataforma (UI)** — entrar / sair / recarregar página autenticada continua a funcionar sem `by_access_token` em `localStorage`

Repetir 1–4 com as contas seed da tabela acima (ADMIN, COMUNICACAO, DIRECAO, COORDENACAO, ENCARREGADO) ou correr `node scripts/smoke-roles.mjs`.

## Público e inscrições (automatizável)

6. **Páginas públicas** — `/`, `/servicos`, `/actividades`, `/galeria`, `/contato`, `/eventos` carregam (título/meta presentes)
7. **Criar inscrição** — `POST /api/enrollments` (fluxo público) com campos obrigatórios do formulário (incl. local de nascimento, morada, ID/profissão/parentesco/morada do encarregado, alergias/medicação/restrições = `"Nenhuma"` se vazio). Unidade/serviço seed: ex. `Patriota` / `Creche`. `yearLabel` deve coincidir com o ano activo (ex. `2026/2027` — confirmar em `GET /api/academic-years/active`).  
   - Esperado: resposta com `uploadToken` (+ `id`)
8. **Upload documento** — `POST /api/enrollments/:id/documents` multipart (`file`, `type`, `uploadToken`)  
   - Allowlist: PDF/JPEG/PNG (ver filtro Multer da API)  
   - Esperado: `201`/`200` com metadados do documento
9. **Bloqueio estático** — `GET /uploads/documents/...`  
   - Esperado: `404` JSON (não servir ficheiro)
10. **Throttle login** — 6+ `POST /api/auth/login` em <60s  
    - Esperado: `429` após o limite (5/min) — correr no fim para não bloquear outros testes

## Perfis e UI

- **ENCARREGADO:** portal, ficha e renovações; smoke HTTP cobre `/financeiro/mine/invoices`.
- **DIRECAO / COORDENACAO:** módulos do perfil no seed; validar painéis restritos na UI após smoke.
- **COMUNICACAO:** além do login cookie, validar comunicados/eventos/conteúdo na UI.

## Swagger

11. Com `NODE_ENV=production` e sem `SWAGGER_ENABLED` — `/docs` indisponível  
12. Em desenvolvimento — `/docs` disponível  
13. Tokens no JSON só com `SWAGGER_RETURN_TOKENS=true` (documentação Bearer)

## SEO estático

14. `GET /robots.txt` e `GET /sitemap.xml` no frontend Vite
