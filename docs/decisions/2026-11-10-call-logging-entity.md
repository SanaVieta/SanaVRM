# Decision: Add a `call_logs` entity shared between leads and customers

**Status:** proposed
**Date:** 2026-11-10

## Context

Sales/support calls are not tracked anywhere in the schema today. A call can happen against a lead (pre-sale, before a Shopify customer exists) or against a customer (post-sale). Both need the same shape: who was called, when, which direction, how long, and what happened — plus an optional free-text summary.

This mirrors the problem `notes` solved (see `docs/decisions/2026-11-06-notes-table.md`): one record attaching to exactly one of several possible targets, each with its own lifecycle. `notes` already covers `customers`, `orders`, and `inventory_levels`, but not `leads`, and a note has no structured call metadata (direction, duration, outcome).

## Decision

Add a `call_logs` table, same polymorphic-FK shape as `notes`, scoped to the two targets that need it:

| Column            | Type                  | Notes                                                              |
|-------------------|-----------------------|---------------------------------------------------------------------|
| id                | uuid                  | PK                                                                   |
| lead_id           | uuid                  | Nullable FK → `leads.id`, `ON DELETE CASCADE`                       |
| customer_id       | uuid                  | Nullable FK → `customers.id`, `ON DELETE CASCADE`                   |
| direction         | enum (`call_direction`) | `inbound`, `outbound`                                              |
| occurred_at       | timestamptz           | Not null; when the call happened (may differ from `created_at`)     |
| duration_seconds  | integer               | Nullable; null if not captured                                      |
| outcome           | text                  | Nullable, open-ended for now (e.g. `connected`, `voicemail`, `no_answer`) — same pattern as `leads.source` |
| body              | text                  | Nullable; free-text call summary                                    |
| created_at        | timestamptz           | Not null, default `now()`                                           |

Constraints:
- `CHECK (num_nonnulls(lead_id, customer_id) = 1)` — exactly one target per call log.
- Partial index on each FK column `where <column> is not null` (same as `notes`).

CRM-only, SanaVRM is the source of truth. No Shopify sync involved.

**Lead → customer transition:** once a lead links to a customer (`leads.customer_id` set), new calls get logged against the customer, not the lead. Existing call logs stay on whichever record they were created against; they are not migrated. Reading "all calls for this person" means querying both `lead_id` and, if linked, the linked `customer_id`.

## Alternatives considered

| Alternative | Why not chosen |
|-------------|----------------|
| Add `lead_id` to the existing `notes` table and a `call_metadata` jsonb column | Reuses a table, but mixes two concepts (a free-text annotation vs. a structured call event) and makes `notes`' CHECK constraint and queries sprawl across unrelated metadata. |
| `target_type` + `target_id` polymorphic column (no FK) | Same problem noted in the `notes` decision: no real foreign key, cascades need app code or triggers. |
| Separate `lead_call_logs` and `customer_call_logs` tables | Duplicate schema; "all calls for this person" across a lead-to-customer conversion needs a `UNION`. |
| Add `order_id` / `inventory_id` targets now, matching `notes` | Not asked for; a call is logged against a person, not an order or inventory row. Can extend later the same way `notes` would add a column + CHECK update. |

## Consequences / impact

- New `call_logs` table, new `call_direction` enum, new schema/validation/service/route layer (same shape as `leads`/`notes`) once accepted.
- No author column yet — same open gap as `notes`; add `author_id` when auth exists.
- `outcome` is unconstrained text for now; revisit as an enum once real call outcomes are observed (mirrors why `leads.source` stayed text).
- Does not touch Shopify sync or the `outbox`; this is purely local CRM data.

## Open questions

- Should `outcome` be an enum from day one, or stay text until usage patterns are clear?
- Does the CRM UI need a combined "activity timeline" across `notes` and `call_logs`, or are they shown in separate panels?
