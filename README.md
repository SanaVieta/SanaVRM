# SanaVRM

CRM system that tracks customers, orders, products, and interfaces with Shopify.

## Overview

SanaVRM is a lightweight CRM that extends Shopify data with relationship management features. **Shopify is the source of truth** for products, orders, customers, and inventory. SanaVRM syncs that data and layers on CRM-specific fields (notes, tags, follow-ups, **leads from CSV import**, custom attributes).

## Core Entities

### Lead
- CRM-only until linked or promoted to Shopify
- Imported via **CSV upload** (bulk onboarding, events, ads, partner lists)
- Typical fields: email, name, phone, company, source, status, tags, notes
- Optional link to a synced **Customer** when the lead converts or matches Shopify

### Customer
- Shopify customer ID (primary link)
- Email, name, phone
- Order history (synced)
- CRM extensions: tags, notes, lifetime value, last contact, custom fields

### Order
- Shopify order ID (primary link)
- Line items, totals, status, fulfillment
- Linked customer
- CRM extensions: internal notes, follow-up status

### Product
- Shopify product / variant ID (primary link)
- Title, SKU, price; inventory by location (synced — see `docs/schema.md`)
- CRM extensions: internal notes, preferred suppliers, custom metadata

## Architecture

```
                    ┌──────────────┐
                    │  CSV upload  │
                    │  (leads)     │
                    └──────┬───────┘
                           │ import / validate
                           ▼
┌─────────────────┐         ┌──────────────────┐
│   Shopify Store │◄──────►│   SanaVRM CRM    │
│  (source of     │ Webhooks │                  │
│   truth)        │ + API    │  Leads (local)   │
│                 │          │  Customers       │
│  Products       │          │  Orders          │
│  Orders         │          │  Products        │
│  Customers      │          │  Inventory       │
│  Inventory      │          │  Notes / Tags    │
└─────────────────┘         │  Follow-ups      │
                            └──────────────────┘
                                      │
                                      ▼
                            ┌──────────────────┐
                            │   Database       │
                            │  (PostgreSQL)    │
                            └──────────────────┘
```

### Features
- **Shopify sync** — mirror customers, orders, products, and inventory levels (Shopify wins on conflict).
- **CRM extensions** — local notes, tags, follow-ups, and thresholds without changing Shopify catalog rules.
- **Lead import (CSV)** — upload a CSV in the app; validate rows, report errors per line, and upsert **leads** in PostgreSQL. Leads stay CRM-owned until you link them to a Shopify customer or promote them in a later workflow.
- **Customer timeline** — view synced order history plus CRM activity on matched records.

### Sync Strategy
1. **Initial import** — pull products, customers, recent orders, and inventory levels via Shopify Admin API.
2. **Ongoing sync** — Shopify webhooks for `orders/create`, `orders/updated`, `customers/create`, `customers/update`, `products/update`, `inventory_levels/update`.
3. **One-way commerce data (for now)** — product, order, and inventory quantities are read-only in SanaVRM; changes happen in Shopify.
4. **Local-only writes** — CRM notes, tags, lead records, and CSV imports are stored in SanaVRM only.

### Tech Stack (proposed)
- Backend: Node.js / TypeScript (or Python)
- Database: PostgreSQL
- Shopify integration: `@shopify/shopify-api` or Shopify Admin REST/GraphQL
- Auth: Shopify OAuth for app installation
- Webhooks: verified HMAC signatures

## Next Steps
- [x] Define database schema (`docs/schema.md`)
- [ ] Implement Shopify OAuth + webhook receiver
- [ ] Build initial data sync
- [ ] CSV lead import (upload, validation, batch reporting)
- [ ] CRM UI for notes, tags, leads, and customer timelines
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
