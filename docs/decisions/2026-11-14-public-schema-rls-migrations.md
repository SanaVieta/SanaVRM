# Decision: Lock down `public` tables in migrations for Supabase PostgREST

**Status:** accepted  
**Date:** 2026-11-14

## Context

Sandbox and production use Supabase-hosted Postgres (`README.md`). Tables in `public` are exposed to PostgREST (Data API) for `anon` and `authenticated` roles when grants exist. Row Level Security (RLS) off allows unrestricted access through the publishable key unless routes block it.

The CRM uses **TypeORM** against Postgres (`src/lib/db/data-source.ts`), not the Supabase client for entity reads and writes today. TypeORM connects as the `postgres` database role and **bypasses RLS**. Risk is leakage via PostgREST, not via Next.js route handlers alone.

Supabase database advisors flag any `public` table without RLS enabled. TypeORM creates `public.migrations` when `npm run db:migrate` runs; that table triggered the first advisor finding.

Auth and per-table RLS policies are planned (`docs/decisions/2026-11-11-user-authentication.md`) but not implemented yet. Until policies exist, new tables should default to **RLS on with no permissive policies** and **revoked** `anon` / `authenticated` grants.

Local development uses Docker Postgres (`docker-compose.yaml`), which does not define `anon` or `authenticated` roles. Migration SQL must not assume those roles exist.

## Decision

1. **Every new table in `public`** created by a TypeORM migration must be locked down in the **same migration** immediately after `CREATE TABLE`, using `lockPublicTableFromPostgrest` from `src/lib/db/migration-utils.ts`.
2. **`public.migrations`** stays permanently locked down (migration `1794360000000-MigrationsTableRls.ts`). Do not add policies that allow PostgREST access.
3. **Do not edit applied migrations** to add RLS. Ship a follow-up migration for backfills or new tables.
4. **Create migration files** under `src/lib/db/migrations/` (for example `npm run db:migration:create -- src/lib/db/migrations/AddCallLogs`).
5. **`db:migration:generate`** does not emit RLS steps. After generating, add `lockPublicTableFromPostgrest` for each new table before merge.
6. **After `db:migrate` on Supabase**, re-run Database advisors (dashboard or Supabase MCP) on staging to confirm no new RLS findings.

### What `lockPublicTableFromPostgrest` does

- `ALTER TABLE "<name>" ENABLE ROW LEVEL SECURITY`
- `REVOKE ALL` on that table from `anon` and `authenticated` when each role exists (no-op on Docker)

With RLS enabled and no `USING` policies for API roles, PostgREST cannot read or write the table. The `postgres` role used by TypeORM is unchanged.

### Phases

| Phase | PostgREST access | App access |
|-------|------------------|------------|
| Now | Denied (RLS + revoke) | TypeORM + API routes |
| After Auth | Policies on CRM tables for `authenticated` + role claims | TypeORM and/or Supabase client per route design |
| `migrations` table | Always denied | TypeORM migrations only |

## Alternatives considered

| Alternative | Why not chosen |
|-------------|----------------|
| Rely on API routes only, no RLS | Leaked publishable key exposes `public` tables through Data API (`2026-11-11-user-authentication.md`). |
| Enable RLS with `USING (true)` for `anon` | Clears advisor lint but increases exposure. |
| Move all tables to a non-`public` schema | Large refactor; Supabase defaults and tooling assume `public` for many setups. |
| Supabase SQL-only migrations alongside TypeORM | Two schema sources; TypeORM remains source of truth. |
| Postgres event trigger on `CREATE TABLE` | Hidden magic; harder to review in git than explicit migration calls. |

## Consequences / impact

- Migration authors must call one helper per new `public` table.
- Existing CRM tables from `1794191076745-InitialSchema.ts` still need a **one-time backfill migration** if advisors flag them (separate PR).
- Optional CI: Vitest or a script that fails if a new migration file contains `CREATE TABLE` without `lockPublicTableFromPostgrest` or `ENABLE ROW LEVEL SECURITY` (not required in this decision).

## Test plan

- Run `npm run db:migrate` against Docker Postgres (no `anon` / `authenticated`): migration succeeds.
- Run `npm run db:migrate` against Supabase: migration succeeds; advisor no longer reports RLS disabled on `public.migrations`.
- TypeORM `db:migrate:show` and app API routes still work against both targets.

## References

- `src/lib/db/migration-utils.ts`
- `src/lib/db/migrations/1794360000000-MigrationsTableRls.ts`
- `docs/decisions/2026-11-11-user-authentication.md`