# Deploying Duban (powered by THUMA)

## Database: SQLite (dev) vs PostgreSQL (production)
Prisma cannot read the provider from an env var, so the repo carries two schemas:

| | Schema | Migrations |
| --- | --- | --- |
| SQLite (local/demo) | `prisma/schema.prisma` (source of truth) | `prisma/migrations` |
| PostgreSQL (production) | `prisma/postgres/schema.prisma` (generated) | `prisma/postgres/migrations` |

`scripts/prisma-db.mjs` picks the schema from `DATABASE_URL`
(`postgres://` / `postgresql://` → Postgres, anything else → SQLite) for `generate` and `deploy`.
`npm run build` and `postinstall` use it, so Vercel builds the right client automatically.

When you change the data model:
1. Edit `prisma/schema.prisma`, run `npm run db:migrate` (SQLite migration).
2. `npm run db:pg:sync` to regenerate the Postgres schema.
3. Against a scratch Postgres: `DATABASE_URL=postgresql://... npm run db:pg:migrate -- --name <name>`.
4. `npm test` runs `db:pg:check` and fails if step 2 was skipped.

Verified 2026-10-26: Postgres 17 locally — `migrate deploy`, seed and the e2e order flow pass.

## Vercel
`vercel.json`: Next.js framework, `npm install`, build = prisma generate (provider-aware),
optional `migrate deploy` when `THUMA_MIGRATE_ON_BUILD=1`, then `next build`.
`next.config.ts` bundles `data/demo.db` for the /tmp demo mode.

Needed before deploying (not done — no accounts were created):
1. A Vercel account/team with the GitHub repo `Qyvn/Thumadelivrry` imported (or `vercel login` on the box).
2. A managed Postgres (e.g. Neon or Supabase via the Vercel Marketplace; pick an EU region — no
   SA region for most providers — and set the Vercel function region close to it).
3. Env vars in Vercel: `DATABASE_URL` (pooled URL), `THUMA_MIGRATE_ON_BUILD=1`, `PAYMENT_PROVIDER=mock_payfast`.
4. First deploy, then seed once: `DATABASE_URL=... npm run db:pg:seed` (dev sample data is marked `[DEV]`;
   replace with real merchants before launch).
5. Without Postgres, setting `THUMA_USE_TMP_DB=1` deploys the read-mostly demo; writes are lost on cold start.
