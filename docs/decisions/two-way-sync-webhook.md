# 2 way sync webhook

## Rules

- Shopify receives a payload (Inventory, Customer, Order, Product) -> sent to edge function (sync layer) 
- Sync layer receives shopify metadata -> stored in Supabase / Postgres
- CRM fetches database records from Supabase
- If Lead is converted to a customer, it should be sent to shopify (Leads should not be sent via webhook)

## Outbound flow

```
- CRM (Order, Customer, Inventory, Product) --> Supabase --> Sync Layer --> Shopify 
```

## Inbound flow

```
- Shopify (Customer, Order, Product, Inventory) --> Sync Layer --> Database
- CRM should fetch from the database
```

## Decision: Outbound sync via `pg_cron` (Option B)

**Status:** accepted  
**Chosen over:** instant database webhook (`pg_net` on outbox insert — Option A)

### How it works

1. CRM or app logic writes Shopify-bound changes to an **outbox** table (pending rows with payload, entity type, idempotency key).
2. `pg_cron` schedules a job every ~1 minute that invokes the **Sync Layer Edge Function** (HTTP) or runs a wrapper that does.
3. The function **polls** outbox rows in `pending` (or `failed` under retry policy), processes them in **batch**, calls Shopify Admin API, then marks rows `sent` or `failed` with error detail.
4. Inbound Shopify webhooks still write directly to Postgres via the sync layer; this path is **outbound only**.

### Why Option B

| Benefit | Detail |
| --- | --- |
| Retries | Failed rows stay pending/failed and are picked up on the next cron tick without manual re-send. |
| Rate limits | Batching and a single worker per tick are easier to throttle against Shopify limits. |
| Operations | One code path for failure handling; no per-insert `pg_net` fire-and-forget. |

### Tradeoffs

- Shopify may lag by up to **one cron interval** (~1 minute). Acceptable for CRM outbound (lead conversion, note-driven updates) unless product requirements change.
- Empty outbox still triggers a scheduled run; keep the job cheap (early exit when `count = 0`).

### Requirements

- Outbox schema (`outbox` table):

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | PK |
| `entity` | enum | Postgres enum `outbox_entity`: `customers`, `orders`, `leads`, `products`, `inventory` |
| `entity_id` | uuid | Row id in `entity`; the function reads the current row at send time (no FK, polymorphic) |
| `operation` | text | `create` / `update` / `delete` |
| `status` | text | `pending` / `sent` / `failed`; the cron job filters on this |
| `attempts` | integer | Incremented on each try |
| `last_error` | text | Last failure detail, null on success |
| `idempotency_key` | text | Unique, e.g. `customers:<uuid>:create` |
| `shopify_id` | bigint | Nullable; needed for update and delete |
| `created_at` | timestamptz | |

- Edge Function: idempotent Shopify writes; respect 429 with backoff inside the batch.
- Monitor: alert on outbox rows stuck in `failed` after N attempts.

If sub-minute outbound latency becomes a requirement, see **Option A (deferred)** below.

---

## Option A (deferred): Database webhook — instant `pg_net`

**Status:** not chosen (reference only)

### How it works

A trigger on the outbox table calls the Edge Function through `pg_net` as soon as a row is inserted (no cron poll).

| | Detail |
| --- | --- |
| **Pros** | Change reaches Shopify within seconds; no polling. Built into Supabase; relatively little setup. |
| **Cons** | Fires once with no automatic retry — failed call leaves a pending outbox row until someone re-sends. Bursts of writes mean bursts of function calls; needs idempotency and Shopify rate-limit handling. |
| **Best when** | Speed matters (e.g. lead conversion must appear in Shopify immediately). |

### Hybrid note

Option B can remain the default while Option A handles specific outbox event types (e.g. `lead.converted`) via a conditional trigger + `pg_net`.
