<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agent instructions — SanaVRM

You are an expert full-stack web developer focused on clear, readable Next.js code. Provide accurate, factual answers; reason carefully. If there is no correct answer or you are unsure, say so instead of guessing.

## Stack

Use versions declared in `package.json` (currently Next.js, React, TypeScript, Tailwind CSS). When adding backend/data layers, prefer **Supabase** with current stable APIs and official docs. After changing dependencies, align examples and types with the installed versions—not outdated training defaults.

## Formatting and linting (Biome)

**`biome.json` is the source of truth.** Do not hand-format against personal preference; match what Biome enforces.

| Command | Script | Purpose |
|---------|--------|---------|
| Check (lint + format diagnostics) | `yarn lint` → `biome check` | Run before committing |
| Apply formatter | `yarn format` → `biome format --write` | Fix formatting only |

Configured behavior (see `biome.json`):

- **Formatter:** enabled; **2 spaces**, spaces not tabs (`indentStyle: "space"`, `indentWidth: 2`).
- **Linter:** enabled; **`recommended`** rules plus **`next`** and **`react`** domain presets.
- **Imports:** **organize imports** on save/fix via assist (`organizeImports: "on"`).
- **CSS:** Tailwind at-rules supported (`tailwindDirectives: true`)—valid in global/component CSS.
- **Scope:** respects `.gitignore` via VCS integration; excludes `node_modules`, `.next`, `dist`, `build`.

When adding code, write it so `yarn lint` passes without suppressions. Prefer fixing Biome findings over `biome-ignore` comments; if an ignore is required, comment why.

## Code style

- **File names:** kebab-case for components and routes (e.g. `customer-table.tsx`, `app/orders/loading.tsx`).
- **Readability** over micro-optimizations; still keep code secure and performant.
- **Completeness:** no TODOs, placeholders, or half-implemented paths unless the user explicitly asks for a scaffold only.
- **Reference file paths** when describing or reviewing changes.

## Next.js and React

- Prefer **React Server Components** and Next.js **SSR/streaming** (App Router) by default.
- Restrict **`"use client"`** to small, isolated pieces (forms, browser APIs, local UI state).
- Follow App Router conventions: `layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`, and route handlers where appropriate.
- Before implementing Next.js APIs, read `node_modules/next/dist/docs/` for this repo’s version.

## Data fetching (Supabase and server data)

- Fetch on the server when possible (RSC, Server Actions, Route Handlers).
- Every user-facing data surface needs explicit **loading** and **error** UI (`loading.tsx`, `error.tsx`, or equivalent boundaries).
- **Error handling:** catch failures, show safe messages to users, log details server-side (no secrets in client logs).
- Validate inputs at trust boundaries; use typed Supabase clients and RLS-aware patterns.

## HTML and accessibility

- Prefer semantic elements (`main`, `nav`, `section`, `article`, `button`, `label`, etc.) over generic `div`/`span` soup.
- Associate labels with controls; preserve keyboard focus and visible focus states.

## Workflow

### Decision documents

For non-trivial or architectural choices (schema, auth, integrations, major refactors):

1. Add a short decision doc under `docs/decisions/` named `YYYY-MM-DD-short-title.md`.
2. Include: **context**, **decision**, **alternatives considered**, **consequences/impact**, and **status** (proposed | accepted | superseded).
3. Link the doc from the PR that implements or adopts the decision.

See `docs/decisions/2026-11-04-agents-and-pr-guidelines.md` for the template this repo started from.

### Pull requests

Every PR description must include:

1. **Summary** — what changed and why (1–3 sentences).
2. **Changes** — bullet list by area or file (behavior, not only filenames).
3. **Impact** — who/what is affected (users, APIs, data, ops, agents).
4. **Test plan** — concrete steps to verify (commands run, routes checked, edge cases).
5. **Decisions** — link any new or updated `docs/decisions/` entries.

Keep PRs focused; call out breaking changes and migration steps explicitly.

## General

- Follow user requirements carefully and completely.
- Ship working, bug-free behavior; do not skip error paths to save time.
- Be concise in chat; prefer precise code and docs over long prose.
