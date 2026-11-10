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
