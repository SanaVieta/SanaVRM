# Decision: Normalize notes into a `notes` table

**Status:** agr  
**Date:** 2026-11-06

## Context

`customers`, `orders`, and `inventory_levels` each had a single CRM-only `notes` text column. That allows one blob per record, with no timestamps and no history.

## Decision

- Add a `notes` table with `id`, `body`, `created_at`, and three nullable foreign keys: `customer_id`, `order_id`, `inventory_id` (→ `inventory_levels.id`). All use `ON DELETE CASCADE`.
- A `CHECK (num_nonnulls(customer_id, order_id, inventory_id) = 1)` guarantees each note has exactly one target.
- Drop the `notes` column from `customers`, `orders`, and `inventory_levels`.
- `products.notes` and `leads.notes` are unchanged for now.

## Alternatives considered

| Alternative | Why not chosen |
|-------------|----------------|
| `target_type` + `target_id` | No real foreign key; orphans and cascades need triggers or app code. |
| One notes table per entity | Duplicate tables; a combined view needs a `UNION`. |
| Keep text columns | One blob per record, no history. |

## Consequences / impact

- Multiple timestamped notes per record.
- Adding a new target (e.g. products, leads) means a new nullable FK column and an updated CHECK.
- Shopify's own `note` field is a separate, Shopify-owned value and is not stored here.
- No author column yet; add `author_id` when auth exists.
