# Smoke regression — autenticação por cookies (SEC-06)

Checklist manual / API após alterações de auth. Correr com API em `:3001` e frontend em `:8080` (ou origem em `CORS_ORIGIN`).

## Pré-requisitos

- `COOKIE_SECURE=false` em local HTTP
- `CORS_ORIGIN` inclui a origem do frontend (ex.: `http://localhost:8080`)
- Conta de teste (ex.: `admin@betteryoukids.com`)

## Auth cookies

1. **Login** — `POST /api/auth/login` com email/password  
   - Esperado: `200`, `Set-Cookie: by_access_token=...; HttpOnly; Path=/; SameSite=Lax` (+ refresh)  
   - Corpo inclui `user` (e tokens para Swagger; o browser não precisa guardá-los)
2. **GET autenticado** — `GET /api/auth/me` com `-b` / cookie jar (sem Bearer)  
   - Esperado: `200` com dados do utilizador
3. **Logout** — `POST /api/auth/logout` com cookies  
   - Esperado: `200`, cookies limpos (`Set-Cookie` com Max-Age=0 ou equivalentes)
4. **Após logout** — `GET /api/auth/me` com os mesmos cookies  
   - Esperado: `401`
5. **Plataforma (UI)** — entrar / sair / recarregar página autenticada continua a funcionar sem `by_access_token` em `localStorage`

## Público e inscrições

6. **Páginas públicas** — `/`, `/servicos`, `/actividades`, `/galeria`, `/contato`, `/eventos` carregam (título/meta presentes)
7. **Criar inscrição** — `POST /api/enrollments` (fluxo público)  
   - Esperado: resposta com `uploadToken`
8. **Upload documento** — `POST /api/enrollments/:id/documents` com `uploadToken` + ficheiro  
   - Esperado: `201`/`200` com metadados do documento
9. **Bloqueio estático** — `GET /uploads/documents/...`  
   - Esperado: `404` JSON (não servir ficheiro)
10. **Throttle login** — 6+ `POST /api/auth/login` em <60s  
    - Esperado: `429` após o limite (5/min)

## Swagger

11. Com `NODE_ENV=production` e sem `SWAGGER_ENABLED` — `/docs` indisponível  
12. Em desenvolvimento — `/docs` disponível

## SEO estático

13. `GET /robots.txt` e `GET /sitemap.xml` no frontend Vite
