# Operação da Plataforma Betteryou Kids

## Variáveis de ambiente obrigatórias/recomendadas

### API (`escola-api/.env`)
- `DATABASE_URL` - ligação MySQL.
- `JWT_SECRET` - segredo de autenticação.
- `JWT_REFRESH_SECRET` - segredo refresh token (legado; refresh usa hash na BD).
- `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` - duração dos cookies (ex.: `15m`, `7d`).
- `CORS_ORIGIN` - lista de origens do frontend (vírgula). **Nunca** usar `*` com cookies.
- `COOKIE_SECURE` - `true`/`false` para o flag `Secure` nos cookies HttpOnly. Em produção, omissão = `true`.
- `SWAGGER_ENABLED` - `true` para forçar Swagger; `false` para desactivar. Em produção, omissão = desactivado.
- `PUBLIC_APP_URL` - URL pública do frontend (usada em links de email).

### Autenticação (SEC-06)
- Access e refresh JWT são emitidos como cookies HttpOnly (`by_access_token`, `by_refresh_token`), `SameSite=Lax`, `Secure` conforme `COOKIE_SECURE`.
- O frontend deve chamar a API com `credentials: 'include'` e **não** guardar tokens em `localStorage`.
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
