# SanaVRM Data Model

## Source of truth (current)

**Shopify is the source of truth** for customers, orders, products, variants, and inventory quantities. SanaVRM holds a **read-only mirror** of Shopify-owned fields, refreshed via Admin API and webhooks. Do not treat the local database as authoritative for commerce data.

| Data | Authoritative system | SanaVRM role |
|------|----------------------|--------------|
| Customer profile (email, name, phone) | Shopify | Sync + display |
| Orders (totals, status, line items) | Shopify | Sync + display |
| Products / variants (title, vendor, type, status, image, SKU, price) | Shopify | Sync + display |
| Inventory (`available`, `on_hand`, `committed`) | Shopify | Sync + display |
| Leads (CSV import) | SanaVRM | Local read/write |
| CRM-only fields on synced records (`notes`, `low_stock_threshold`, internal `tags`, cached `lifetime_value`) | SanaVRM | Local read/write |

**Write policy (for now):** Inventory and catalog changes happen in Shopify Admin (or Shopify APIs). SanaVRM does not push quantity or product updates back to Shopify until a future phase explicitly adds that.

Conflict resolution: if local rows disagree with Shopify, **Shopify wins** on the next sync.

## Tables

### customers

| Column              | Type        | Notes                          |
|---------------------|-------------|--------------------------------|
| id                  | uuid        | PK                             |
| shopify_customer_id | bigint      | Unique, Shopify ID             |
| email               | text        |                                |
| first_name          | text        |                                |
| last_name           | text        |                                |
| phone               | text        |                                |
| tags                | text[]      | CRM-only (not synced to Shopify) |
| lifetime_value      | numeric     | CRM cache derived from orders  |
| created_at          | timestamptz |                                |
| updated_at          | timestamptz |                                |
| synced_at           | timestamptz | Last Shopify sync              |

### leads

CRM-only prospects. **Source of truth: SanaVRM.** A lead is **not** a Shopify entity. Created by CSV import or manual entry; it is associated with a Shopify customer (via `customer_id`) only when a matching customer exists. Orders for a lead are read through the linked customer.

| Column              | Type        | Notes                                      |
|---------------------|-------------|--------------------------------------------|
| id                  | uuid        | PK                                         |
| email               | text        | Required for dedupe; unique when present (case-insensitive) |
| first_name          | text        |                                            |
| last_name           | text        |                                            |
| phone               | text        |                                            |
| city                | text        | Customer master list column                |
| state               | text        | Customer master list column                |
| company             | text        |                                            |
| source              | text        | e.g. `csv:2026-11-campaign`, `webinar`     |
| status              | text        | e.g. `new`, `contacted`, `qualified`, `lost` |
| tags                | text[]      | CRM-only                                   |
| notes               | text        | CRM-only                                   |
| customer_id         | uuid        | FK → customers.id, `ON DELETE SET NULL`; null until a Shopify customer exists for this lead |
| linked_at           | timestamptz | When `customer_id` was set; null if unlinked |
| link_source         | text        | `auto_email` (matched by email), `manual` (linked in CRM UI), `unlinked` (manually unlinked; blocks auto-match). Null = never evaluated/linked |
| import_batch_id     | uuid        | Nullable; groups rows from one CSV upload    |
| created_at          | timestamptz | Master list "Creation Date" on import      |
| updated_at          | timestamptz |                                            |

**Constraints / indexes:**

- Unique index on `lower(email)` where `email is not null`.
- Unique index on `customer_id` where `customer_id is not null` (a customer links to at most one lead).
- `customer_id` and `linked_at` are set or cleared together.

### orders

| Column                       | Type        | Notes                                              |
| ---------------------------- | ----------- | -------------------------------------------------- |
| id                           | uuid        | PK                                                 |
| shopify_order_id             | bigint      | Unique, Shopify ID                                 |
| customer_id                  | uuid        | FK → customers.id                                  |
| total_price                  | numeric     |                                                    |
| financial_status             | text        |                                                    |
| fulfillment_status           | text        |                                                    |
| created_at                   | timestamptz |                                                    |
| updated_at                   | timestamptz |                                                    |
| synced_at                    | timestamptz |                                                    |

### order_items

One row per Shopify order line item. Each line item belongs to exactly one order and references exactly one product (variant). Title, SKU, and price are **snapshots from purchase time**, so order history stays correct if the product changes later.

| Column               | Type        | Notes                                      |
|----------------------|-------------|--------------------------------------------|
| id                   | uuid        | PK                                         |
| shopify_line_item_id | bigint      | Unique, Shopify line item ID               |
| order_id             | uuid        | FK → orders.id, ON DELETE CASCADE, not null |
| product_id           | uuid        | FK → products.id, `ON DELETE RESTRICT`, not null; a product row referenced by an order item cannot be deleted (mark it `status = 'archived'` instead) |
| shopify_variant_id   | bigint      | Kept so the row survives product deletion  |
| title                | text        | Snapshot at purchase time                  |
| sku                  | text        | Snapshot at purchase time                  |
| quantity             | integer     |                                            |
| unit_price           | numeric     | Snapshot at purchase time                  |
| created_at           | timestamptz |                                            |
| updated_at           | timestamptz |                                            |
| synced_at            | timestamptz | Last Shopify sync                          |

### products

Each row is one **variant** (Shopify’s sellable SKU). Inventory is stored in `inventory_levels`, not on this row. Product-level fields (`vendor`, `product_type`, `status`) are denormalized onto every variant row and refreshed together on `products/update`; `image_url` is the variant image when set, else the product's featured image.

| Column              | Type        | Notes                     |
|---------------------|-------------|---------------------------|
| id                  | uuid        | PK                        |
| shopify_product_id  | bigint      | Shopify product ID        |
| shopify_variant_id  | bigint      | Unique, Shopify variant ID |
| title               | text        | Variant / product display name |
| vendor              | text        | Shopify product `vendor`; repeated on each variant row of the product |
| product_type        | text        | Shopify `productType`; repeated on each variant row |
| status              | text        | Shopify product status: `active`, `draft`, `archived`; repeated on each variant row |
| image_url           | text        | Variant image URL, falling back to the product's featured image; null if none |
| sku                 | text        |                           |
| price               | numeric     |                           |
| tracks_inventory    | boolean     | From Shopify variant      |
| notes               | text        | CRM-only                  |
| created_at          | timestamptz |                           |
| updated_at          | timestamptz |                           |
| synced_at           | timestamptz | Last Shopify sync         |

### inventory_levels

Stock for a product variant, **per Shopify location**. Quantity columns are **mirrors of Shopify**; only `low_stock_threshold` is CRM-only (internal notes live in `notes`).

| Column                      | Type        | Notes                                      |
|-----------------------------|-------------|--------------------------------------------|
| id                          | uuid        | PK                                         |
| product_id                  | uuid        | FK → products.id, ON DELETE CASCADE        |
| shopify_inventory_item_id   | bigint      | Shopify inventory item ID                  |
| shopify_location_id         | bigint      | Unique with `product_id` per location      |
| location_name               | text        | Cached label for CRM UI                    |
| available                   | integer     | Sellable quantity (Shopify `available`)    |
| on_hand                     | integer     | Physical count (Shopify `on_hand`)         |
| committed                   | integer     | Reserved for orders (Shopify `committed`)  |
| low_stock_threshold         | integer     | CRM alert threshold (optional)             |
| created_at                  | timestamptz |                                            |
| updated_at                  | timestamptz |                                            |
| synced_at                   | timestamptz | Last Shopify sync                          |

**Unique constraint:** `(product_id, shopify_location_id)`

### notes

CRM-only internal notes, many per record. **Source of truth: SanaVRM.** Each note attaches to exactly one of a customer, an order, or an inventory level.

| Column       | Type        | Notes                                                  |
|--------------|-------------|--------------------------------------------------------|
| id           | uuid        | PK                                                     |
| customer_id  | uuid        | Nullable FK → customers.id, `ON DELETE CASCADE`        |
| order_id     | uuid        | Nullable FK → orders.id, `ON DELETE CASCADE`           |
| inventory_id | uuid        | Nullable FK → inventory_levels.id, `ON DELETE CASCADE` |
| body         | text        | Not null                                               |
| created_at   | timestamptz | Not null, default `now()`                              |

**Constraints / indexes:**

- `CHECK (num_nonnulls(customer_id, order_id, inventory_id) = 1)` — exactly one target per note.
- Partial index on each FK column `where <column> is not null`.

## Relationships

- Lead 0..1—0..1 Customer (optional link; set when a Shopify customer with the same email exists, or manually)
- Lead → Orders only through its linked Customer (no `lead_id` on orders)
- Customer 1—N Orders
- Order 1—N Order items (a line item belongs to exactly one order)
- Order item N—1 Product (each line item references exactly one product variant; a variant can appear in many line items across orders)
- Product (variant) 1—N Inventory levels (one row per Shopify location)
- Customer / Order / Inventory level 1—N Notes (each note has exactly one target)
- All entities keep a `shopify_*_id` for bidirectional lookup and webhook matching

## Sync (Shopify → SanaVRM)

- **Triggers:** Admin API import; webhooks such as `customers/`*, `orders/*`, `products/update`, `inventory_levels/update`.
- **Order items:** On `orders/`*, upsert the order, then upsert its `order_items` by `shopify_line_item_id`, resolving `product_id` from `shopify_variant_id`. If the variant is not yet in `products`, sync it first, then insert the item. Line items with no variant (Shopify custom items) are skipped and logged. Line items removed from the order in Shopify are deleted locally. When Shopify deletes a variant, keep the local `products` row and set `status = 'archived'`.
- **Inventory:** For each row in `products`, upsert `inventory_levels` from Shopify inventory item + location. Overwrite `available`, `on_hand`, and `committed` on every successful sync.
- **CRM alerts:** Compare synced `available` to local `low_stock_threshold` only; adjusting stock still happens in Shopify.
- **Leads (CSV):** Parse upload → validate required columns → insert/update `leads` with `import_batch_id`; store row-level errors for the UI. Does not write to Shopify.
- **Lead ↔ customer linking:** Match on `lower(trim(email))`.
  - On lead insert/import: if a `customers` row has the same email and the lead's `link_source` is null, set `customer_id`, `linked_at = now()`, `link_source = 'auto_email'`.
  - On `customers/create` and `customers/update` webhooks (after upserting the customer): link any unlinked lead with the same email and `link_source` null.
  - Manual link/unlink in the CRM UI writes `link_source = 'manual'` / `'unlinked'` and is never overridden by auto-match.
  - If a customer's email changes in Shopify, an existing link is kept (matching only runs for leads with no link decision).
