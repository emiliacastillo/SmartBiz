# Smart Business Platform MVP

A local-first SaaS MVP for NFC and QR smart business pages. The app includes a public smart-page resolver, platform admin flow, business dashboard, secure session handling, Prisma-ready data model, demo businesses, and QR generation support.

## Architecture summary

- Public resolver: `/t/[code]`
- Admin area: `/admin`
- Business area: `/dashboard`
- API routes: `/api/*`
- Data model: Prisma schema in `prisma/schema.prisma`
- Local demo store: `lib/demo-store.ts`

## Local setup

### Prerequisites

- Docker Desktop running on Windows/macOS or Docker Engine on Linux
- Node.js 22 recommended for this project
- PostgreSQL via Docker Compose

### 1) Start Docker and the database

Make sure Docker Desktop is running, then from the project root execute:

```bash
docker compose up -d postgres
```

This starts PostgreSQL with the settings in `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/smartbiz?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/smartbiz?schema=public"
```

To confirm the container is running:

```bash
docker compose ps
```

Or:

```bash
docker ps
```

### 2) Install dependencies

```bash
npm install
```

If you hit a dependency mismatch, use the project-compatible runtime:

```bash
npx -p node@22 npm install
```

### 3) Generate Prisma client and apply migrations

```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4) Start the app

Recommended:

```bash
npx -p node@22 npm run dev
```

Alternative if your local Node is already 22:

```bash
npm run dev
```

The app should be available at:

- `http://localhost:3000`

### 5) Stop the database

```bash
docker compose down
```

### 6) Troubleshooting

- If Docker says the daemon is unavailable, open Docker Desktop and wait for it to finish starting.
- If Prisma fails to connect, confirm PostgreSQL is running with `docker compose ps`.
- If the app does not start, confirm Node 22 is active with:

```bash
node -v
```

Expected version:

```bash
v22.x
```

## Demo login

- Email: `admin@smartbiz.local`
- Password: `admin123`

## Demo smart tags

- Sunset Bistro: `A7K92`
- Luna Nail Studio: `N8L21`
- Forge & Fade: `R2Q09`

## Swagger / API docs

The project exposes an interactive Swagger UI page at:

- `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/api/openapi.json`

This document covers the public smart-page flow, admin management endpoints, QR generation, and click tracking APIs.

## Commands

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm test`
- `npx prisma generate`
- `npx prisma migrate dev --name init`

## Notes

This repository includes a Prisma schema for production deployment and a demo in-memory layer so the application remains usable without a live database during early local validation.
