# Lead-owned notes

**Status:** accepted  
**Date:** 2026-11-10

## Context

The CRM lead detail design includes notes for every lead. The existing notes table only supports customer, order, or inventory targets, and leads can exist without a linked customer.

## Decision

Add a nullable `lead_id` foreign key to notes and extend the exactly-one-target constraint to include it. Lead detail creates and reads lead-owned notes regardless of Shopify linkage. Existing notes retain their original targets.

## Alternatives considered

- Store notes on the Shopify customer: excludes unlinked leads and mixes separate records.
- Use the lead's legacy text `notes` column: cannot preserve multiple dated notes.

## Consequences/impact

The migration must run before using lead notes. Removing a lead cascades to its notes; existing notes are unaffected. The lead notes API exposes only notes belonging to the requested lead.
