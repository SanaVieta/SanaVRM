# Decision: Leads link optionally to Shopify customers

**Status:** proposed  
**Date:** 2026-11-05

## Context

A lead is a CRM-only prospect (CSV import or manual entry). Shopify has no lead entity; it only has customers. We still want to see a lead's orders once they become a Shopify customer.

## Decision

- Keep `leads` as its own table, owned by SanaVRM.
- Associate a lead with a customer through nullable `leads.customer_id` (FK → `customers.id`, `ON DELETE SET NULL`), plus `linked_at` and `link_source` (`auto_email`, `manual`, `unlinked`).
- Auto-link by case-insensitive email when a matching customer exists (on lead import/insert and on `customers/*` webhooks). Manual link/unlink in the CRM UI is allowed and is never overridden by auto-match.
- Orders for a lead are read via the linked customer; orders get no `lead_id`.
- Unique index on `customer_id` (non-null) so a customer links to at most one lead.

## Alternatives considered

| Alternative | Why not chosen |
|-------------|----------------|
| Create a Shopify customer for every lead | Pollutes the store with prospects; Shopify is not the lead system. |
| Store leads in `customers` with a flag | Mixes Shopify-owned mirror rows with CRM-owned rows; breaks "Shopify wins" sync. |
| Match on phone as well as email | Phone formats vary widely in the master list; too many false matches. Email only for now. |
| Always auto-relink | Would undo a deliberate manual unlink. |

## Consequences / impact

- UI: lead detail shows linked state with Link/Unlink; leads list shows a Shopify column.
- Sync: customer webhooks gain a lead-matching step.
- Leads with no email never auto-link; they can only be linked manually.
- Master list statuses (`Processed`/`Declined`) are not the same set as the example `leads.status` values; reconcile before import is built.
