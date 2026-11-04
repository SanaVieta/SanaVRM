# SanaVRM

CRM system that tracks customers, orders, products, and interfaces with Shopify.

## Overview

SanaVRM is a lightweight CRM that extends Shopify data with relationship management features. Shopify remains the source of truth for products and orders. SanaVRM syncs that data and layers on CRM-specific fields (notes, tags, follow-ups, custom attributes).

## Core Entities

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
- Title, SKU, price, inventory (synced)
- CRM extensions: internal notes, preferred suppliers, custom metadata

## Architecture

```
┌─────────────────┐         ┌──────────────────┐
│   Shopify Store │◄──────►│   SanaVRM CRM    │
│                 │ Webhooks │                  │
│  Products       │ + Poll   │  Customers       │
│  Orders         │ + API    │  Orders          │
│  Customers      │          │  Products        │
└─────────────────┘         │  Notes / Tags    │
                            │  Follow-ups      │
                            └──────────────────┘
                                      │
                                      ▼
                            ┌──────────────────┐
                            │   Database       │
                            │  (PostgreSQL)    │
                            └──────────────────┘
```

### Sync Strategy
1. **Initial import** — pull products, customers, and recent orders via Shopify Admin API.
2. **Ongoing sync** — Shopify webhooks for `orders/create`, `orders/updated`, `customers/create`, `customers/update`, `products/update`.
3. **Bidirectional where safe** — CRM notes and tags stay local; product/order changes push back to Shopify only when explicitly required.

### Tech Stack (proposed)
- Backend: Node.js / TypeScript (or Python)
- Database: PostgreSQL
- Shopify integration: `@shopify/shopify-api` or Shopify Admin REST/GraphQL
- Auth: Shopify OAuth for app installation
- Webhooks: verified HMAC signatures

## Next Steps
- [ ] Define database schema
- [ ] Implement Shopify OAuth + webhook receiver
- [ ] Build initial data sync
- [ ] CRM UI for notes, tags, and customer timelines
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
