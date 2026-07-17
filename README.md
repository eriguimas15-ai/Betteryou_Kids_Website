# BetterYou Kids — Workspace

## Projetos

| Pasta | Função |
|-------|--------|
| `Betteryou_Kids_Website-master/` | Website institucional (Vite + React) |
| `escola-api/` | API NestJS + Prisma (plataforma escolar) |
| `escola-backend/` | API PHP legado (substituída pela NestJS) |
| `escola-frontend/` | Protótipo antigo (opcional) |

## Arranque (Fase 1)

### 1. API (requer Laragon com MySQL ligado)

```bash
cd escola-api
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev
```

Base de dados: MySQL `betteryou_kids` em `127.0.0.1:3306` (utilizador `root`, password vazia no Laragon).

- API: http://localhost:3001/api
- Swagger: http://localhost:3001/docs

Contas:
- Admin: `admin@betteryoukids.com` / `Admin123!`
- Comunicação: `comunicacao@betteryoukids.com` / `Comunica123!`

### 2. Website

```bash
cd Betteryou_Kids_Website-master
npm install
npm run dev
```

Abrir http://localhost:8080 e aceder a `/plataforma` ou `/inscricoes`.

## O que já está implementado

- Autenticação JWT + refresh + RBAC
- Unidades Gika/Patriota e serviços por unidade
- Salas, capacidade e cálculo de vagas
- Inscrições online com reserva ou lista de espera
- Dashboard de ocupação
- CMS básico da Home (Guardar / Publicar)
