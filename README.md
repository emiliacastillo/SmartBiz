# Smart Business Platform MVP

A local-first SaaS MVP for NFC and QR smart business pages. The app includes a public smart-page resolver, platform admin flow, business dashboard, secure session handling, Prisma data model, Florida sample businesses, and QR generation support.

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
DEMO_MODE="false"
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

### 4) Seed the database with real demo data

```bash
npm run db:seed
```

This loads a real set of sample businesses, links, tags, promotions, and interactions into PostgreSQL. The seed script is defined in `prisma/seed.js` and is configured in `prisma.config.ts`.

### 5) Demo mode configuration

The app can be controlled via environment variables:

```env
DEMO_MODE="false"
```

- `true`: uses the in-memory demo store
- `false`: uses the real PostgreSQL-backed app data

Set `APP_URL` to the public origin used by the deployment so generated smart-tag URLs point to the deployed app. Locally, keep it as `http://localhost:3000`.

### 6) Start the app

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

### 7) Stop the database

```bash
docker compose down
```

### 8) Troubleshooting

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

## Florida sample businesses and smart tags

- Columbia Restaurant - Ybor City, Tampa: `A7K92` ([official menu](https://www.columbiarestaurant.com/_files/ugd/28e529_55b4395ee05445c0acdf7f673686322e.pdf), [contact and location](https://www.columbiarestaurant.com/ybor-city-tampa))
- Ulele, Tampa: `N8L21` ([official menus](https://ulele.com/menus/), [contact and location](https://ulele.com/))
- The Ravenous Pig, Winter Park: `R2Q09` ([official menu](https://www.theravenouspig.com/menu), [contact page](https://www.theravenouspig.com/contact))
- Tampa Nails, Westshore: `TN6A82` ([services](https://tampanails.com/services/), [contact and location](https://tampanails.com/contact/))
- Tampa Spa & Nails: `TS4P91` ([services and booking](https://tampaspanails.com/), [contact and location](https://tampaspanails.com/contact-us))
- Barber & Co. - Gasworx, Tampa: `BC7G53` ([services, booking, and contact](https://www.barbercotampa.com/))

The seed uses publicly listed business information and links to each business's public menu or contact pages. The businesses are independent examples and are not affiliated with this project.

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
- `npm run db:seed`
- `npx prisma studio`

## Notes

This repository includes a Prisma schema for production deployment and a demo in-memory layer so the application remains usable without a live database during early local validation.
