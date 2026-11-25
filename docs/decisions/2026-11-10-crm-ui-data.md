# CRM screens backed by local APIs

**Status:** accepted  
**Date:** 2026-11-10

## Context

The supplied SanaVieta artifact designs Leads, Lead detail, Orders, Products, Add lead, and CSV import using sample data. The application already has database entities and services, but no client screens and no order/product list handlers.

## Decision

Install shadcn/ui and reproduce the supplied CRM visual language. Browser-side screens fetch the existing paginated lead API and new order/product list endpoints. For correct global counts and filtering without expanding the existing query contracts, the client loads all pages in batches of 100, then filters and paginates locally. Create/edit leads and import CSV through validated API routes; imports run transactionally and offer email-based skip/update. Lead detail reads/writes lead-owned notes.

## Alternatives considered

- Render static sample rows: would not reflect the seeded database or persist edits.
- Add server-side search, filtering, and aggregate endpoints now: more API surface than the current UI needs.
- Add Shopify synchronization: deferred by product direction; the mirror is read-only here.

## Consequences/impact

This loads the complete result set, so large catalogs may need server-side filters, aggregates, and pagination later. Orders/products mirror the database; sync controls, call logging, and customer link/unlink are not exposed. CSV accepts up to 1,000 rows per transaction with exact template headers. Deploy the lead-notes migration before serving lead notes.

## Update 2026-11-25: Lists poll for Shopify changes

**Status:** accepted

### Context

The Shopify inbound webhook ([two-way-sync-webhook.md](two-way-sync-webhook.md)) writes to Postgres in real time, but the CRM lists load once on mount, so open screens go stale until a manual reload.

### Decision

`useCollection` (`src/lib/crm-api.ts`) refetches its collection every 20 seconds (`POLL_INTERVAL_MS`) while the tab is visible, and once when the tab becomes visible again. This covers the Leads dashboard, Orders, and Products lists.

- Background reloads are silent: `loading` stays false, and a failure is logged without replacing the rows or showing an error. A later success clears an earlier error.
- One request is in flight at a time; a new load aborts the previous one, so a slow poll cannot overwrite the result of a manual refresh.
- Hidden tabs make no requests.

### Alternatives considered

- **Supabase Realtime** (`postgres_changes`): needs a SELECT policy on the table, which conflicts with `lockPublicTableFromPostgrest`. Broadcast from the database avoids that, but needs a migration, a trigger per table, and a private-channel policy requiring Supabase Auth, which the CRM does not use yet.
- **Message broker (Redis, RabbitMQ, SQS):** adds a second system; the outbox table and `pg_cron` already queue outbound sync.

### Consequences/impact

- A Shopify change appears in an open CRM list within about 20 seconds (plus webhook processing time). Sub-20s freshness would need Realtime.
- Each poll refetches the full result set in batches of 100, so load scales with catalog size and the number of open tabs. The server-side filtering and pagination noted above becomes more pressing as catalogs grow.
- The lead detail page has its own fetch effect and does not poll. Refreshing it mid-edit could disrupt a note being typed.
