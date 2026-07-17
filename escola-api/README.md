# BetterYou Kids API

API NestJS da plataforma escolar BetterYou Kids.

## Arranque rápido (desenvolvimento)

```bash
cd escola-api
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```

- API: http://localhost:3001/api
- Swagger: http://localhost:3001/docs

### Contas seed

| Perfil | Email | Password |
|--------|-------|----------|
| Admin | admin@betteryoukids.com | Admin123! |
| Comunicação | comunicacao@betteryoukids.com | Comunica123! |

## Stack

- NestJS + TypeScript
- Prisma ORM
- MySQL via Laragon (`betteryou_kids` em `127.0.0.1:3306`)
- JWT + Refresh Tokens + RBAC
- Swagger

## Laragon

1. Inicie o Laragon (MySQL deve estar a correr).
2. A base `betteryou_kids` é criada automaticamente pelo setup.
3. Credenciais padrão Laragon: utilizador `root`, password vazia.

```env
DATABASE_URL="mysql://root@127.0.0.1:3306/betteryou_kids"
```

Se a password do MySQL for diferente, atualize o `.env`.

## Arranque rápido (desenvolvimento)

```bash
cd escola-api
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

- API: http://localhost:3001/api
- Swagger: http://localhost:3001/docs

### Contas seed

| Perfil | Email | Password |
|--------|-------|----------|
| Admin | admin@betteryoukids.com | Admin123! |
| Comunicação | comunicacao@betteryoukids.com | Comunica123! |

## Endpoints principais

- `POST /api/auth/login`
- `GET /api/units`
- `GET /api/rooms/availability`
- `POST /api/enrollments`
- `GET /api/enrollments/waitlist`
- `GET /api/dashboard/overview`
- `GET|POST /api/cms/...`

## HeidiSQL

Pode abrir a base `betteryou_kids` no HeidiSQL do Laragon para inspecionar tabelas e dados.

