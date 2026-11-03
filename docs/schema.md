# SanaVRM Data Model

Shopify is the system of record for core commerce data. SanaVRM stores local copies plus CRM extensions.

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
| tags                | text[]      | CRM tags                       |
| notes               | text        | Internal notes                 |
| lifetime_value      | numeric     | Cached from orders             |
| created_at          | timestamptz |                                |
| updated_at          | timestamptz |                                |
| synced_at           | timestamptz | Last Shopify sync              |

### orders
| Column           | Type        | Notes                     |
|------------------|-------------|---------------------------|
| id               | uuid        | PK                        |
| shopify_order_id | bigint      | Unique, Shopify ID        |
| customer_id      | uuid        | FK → customers.id        |
| total_price      | numeric     |                           |
| financial_status | text        |                           |
| fulfillment_status| text       |                           |
| notes            | text        | Internal CRM notes        |
| created_at       | timestamptz |                           |
| updated_at       | timestamptz |                           |
| synced_at        | timestamptz |                           |

### products
| Column              | Type        | Notes                     |
|---------------------|-------------|---------------------------|
| id                  | uuid        | PK                        |
| shopify_product_id  | bigint      | Unique                    |
| shopify_variant_id  | bigint      | Unique per variant        |
| title               | text        |                           |
| sku                 | text        |                           |
| price               | numeric     |                           |
| inventory_quantity  | integer     |                           |
| notes               | text        | Internal notes            |
| created_at          | timestamptz |                           |
| updated_at          | timestamptz |                           |
| synced_at           | timestamptz |                           |

## Relationships
- Customer 1—N Orders
- Orders contain line items that reference Products (via Shopify variant ID)
- All entities keep a `shopify_*_id` for bidirectional lookup and webhook matching
