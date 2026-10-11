# Production data consistency investigation

## Evidence and limits

The inspected checkout started at `ad1c5a2` (remove DEMO-MOde dependencies).
The production deployment commit and Vercel environment have not been verified.
The supplied Vercel project log URL requires authenticated access and could not
be opened with the available tools. Do not treat the workspace `.env` as proof
of Vercel's configuration.

## Exact data paths

| Consumer | Data source | Restrictions |
| --- | --- | --- |
| `app/page.tsx`, `HomePage` | `getAppStore()` from `lib/data-store.ts` | None on businesses; active-tag filtering and a three-tag preview affect tags only |
| `app/admin/page.tsx`, `AdminPage` | The same `getAppStore()` | Requires a signed session with role `admin`; no business membership, active-status, or count filter |
| `app/api/businesses/route.ts`, `GET` | The same `getAppStore()` | Admin session required |
| `app/api/businesses/route.ts`, `POST` | `createBusiness()` from `lib/data-store.ts` | Admin session and validated input required |

The business list query is exactly:

```ts
prisma.business.findMany({ orderBy: { createdAt: "asc" } })
```

`getAppStore()` also queries `smartTag`, `businessLink`, `smartTagLink`, and
`promotion`. These results do not restrict the business list. `/admin` separately
calls `countAllInteractions()` in `lib/analytics.ts`, which runs
`prisma.interaction.count()` and only supplies the event count.

Creation uses `prisma.business.create({ data: ... })` through the same Prisma
client. `CreateBusinessForm` in `components/platform-admin-manager.tsx` awaits
the successful POST response before calling `router.refresh()`.

## Database, demo data, and rendering

`lib/prisma.ts` constructs a PostgreSQL adapter from runtime `DATABASE_URL`.
Both pages import that client through the same data store. `DIRECT_URL` is not
used by the application client; `prisma.config.ts` also uses `DATABASE_URL`.
Without `DATABASE_URL`, the client defaults to local PostgreSQL. Production
therefore needs an explicitly configured URL for the intended database and schema.

There are no runtime demo business arrays or demo-mode branches in this checkout.
`prisma/seed.js` contains six sample business definitions and legacy-slug update
logic for `sunset-bistro`, `luna-nail-studio`, and `forge-and-fade`. Running that
seed can rename existing records. It was not run during this investigation.
The build runs only `prisma generate && next build`; it does not seed or migrate.

The preceding commit, `07d1b93`, still had `lib/demo-store.ts` and
`isDemoModeEnabled()`. The homepage had no explicit request-time rendering
boundary, while admin read cookies. An older deployment with different build-time
and runtime data could produce different homepage and admin results. This is a
plausible explanation, not a confirmed diagnosis of the Vercel deployment.

In the current checkout, the homepage calls `connection()` before reading data.
Admin calls the request-time `cookies()` API through `getSessionUser()`. Neither
query uses a caching wrapper. The production build reports both routes as dynamic.

A transaction explicitly opened with `BEGIN READ ONLY` against the workspace's
configured Neon database (`neondb`, schema `public`) returned six active businesses:
Columbia Restaurant - Ybor City, Ulele, The Ravenous Pig, Tampa Nails,
Tampa Spa & Nails, and Barber & Co. - Gasworx. It returned none of the three
reported old business names. No database mutations were performed.

## Confirmed auth defects and fixes

Previously, `app/api/login/route.ts` redirected successful and failed POSTs to
`APP_URL` using the default HTTP 307. This could move the browser to a different
deployment and preserved the POST method when navigating to a page. Session
cookies are host-scoped, so changing hostname can also lose the login session.
Login now uses HTTP 303 and the incoming request origin for both outcomes.

`GET /api/login` previously returned 405 because the module only exported POST.
The login form in `app/login/page.tsx` explicitly submits POST, and no application
link navigated to GET `/api/login`. The source of the logged GET is not established.
The 307 redirect after POST does not explain a GET at the original login endpoint.
A GET handler now redirects to `/login` without reading credentials or creating
a session. This handles direct navigation but does not prove what caused the log.

Logout previously mutated the session on GET and was linked from admin with
`next/link`. Both admin and business dashboards now submit explicit POST logout
forms; the logout endpoint redirects with 303 on the request origin. GET cannot
clear the session. The OpenAPI document reflects the login and logout behavior.

## Validation performed

- All 17 tests pass, including the new `tests/admin-session.test.ts` suite.
- Regression tests exercise the real login/session code, business creation handler,
  data-store mapping, and server-page rendering with a simulated Prisma boundary.
  A created business appears on the homepage, admin refreshes, and the authorized
  list API. Existing inactive businesses and businesses without tags remain visible.
- Unauthorized users cannot read or create businesses. Invalid, expired, and
  tampered sessions are rejected. Cookie flags and eight-hour persistence are tested.
- Production build and targeted ESLint checks pass.
- A headless Chrome session against the local production build and the configured
  database verified six matching businesses on homepage/admin/API, successful login,
  two full admin reloads preserving the same session, safe GET login navigation,
  and explicit logout. APP_URL deliberately differed from the browser origin.
  This browser check created no businesses and changed no database records.

## Remaining production verification

With authenticated Vercel access and the public application URL:

1. Identify the deployment and Git commit behind the homepage domain and the URL
   reached after login. Confirm that the deployment includes the demo-removal commit
   and these auth fixes. Compare immutable deployment URLs with the production alias.
2. Inspect the deployment's environment target (Production or Preview) and the
   effective `DATABASE_URL` database host, database name, and schema without exposing
   credentials. Check for branch-specific overrides. Compare both route deployments.
3. Verify `AUTH_SECRET` is configured consistently for the serving deployment and
   `ADMIN_EMAIL`/`ADMIN_PASSWORD` are configured. APP_URL should describe the intended
   public origin for generated tag links; auth redirects no longer use it.
4. Inspect the supplied GET log's timestamp, deployment ID, Referer, User-Agent,
   status, and adjacent redirect requests. Distinguish direct navigation, external
   requests, and redirects from an application-generated POST.
5. Deploy the fixes, then repeat login, business-list comparison, and full admin
   refreshes at the production URL. Environment changes must be applied to a new
   deployment. Do not seed, reset, migrate destructively, or rename existing data
   to make the two lists match.

The production mismatch remains unconfirmed until those deployment facts are
available. The verified code defects have been fixed locally, not deployed.
