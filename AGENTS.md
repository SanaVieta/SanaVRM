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
- **Asynchronous functions** prefer using `async/await` over `.then((data) =>...).catch((err)=>...) unless really needed

## Next.js and React

- Prefer **React Server Components** and Next.js **SSR/streaming** (App Router) by default.
- Restrict **`"use client"`** to small, isolated pieces (forms, browser APIs, local UI state).
- Follow App Router conventions: `layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`, and route handlers where appropriate.
- Before implementing Next.js APIs, read `node_modules/next/dist/docs/` for this repo’s version.
- CRM pages that belong in the sidebar are listed in `src/lib/client-routes.ts` (`routes`: `href`, `label`, `icon`). `src/components/crm/shell.tsx` renders that list. Add the page there; do not hardcode a new link in the shell.
- When rendering tabular data in the CRM, use `Table`, `TableHeader`, and `TableBody` from `src/components/crm/shared.tsx` instead of hand-rolled `<table>`/`<thead>`/`<tbody>` markup. `TableHeader` takes `headers: string[]`; `TableBody` takes `rows`, `getKey`, and a `children` render-prop returning the `<tr>`.
- If a `useEffect` is running an api call, wrap the call inside an IIFE (Immediately Invoked Function Expression) in order to use `async/await`.
## Data fetching (Supabase and server data)

- Fetch on the server when possible (RSC, Server Actions, Route Handlers).
- Every user-facing data surface needs explicit **loading** and **error** UI (`loading.tsx`, `error.tsx`, or equivalent boundaries).
- **Error handling:** catch failures, show safe messages to users, log details server-side (no secrets in client logs).
- **API error handling:** In callbacks passed to `handleRequest` (`src/lib/api-utils.ts`), throw an `ApiError` for expected HTTP failures. For example, if a requested database record does not exist, throw `new ApiError(404, "Record not found")` (import `ApiError` from `next/dist/server/api-utils`, as the helper does). Use an appropriate status code and a safe, client-facing message for other expected errors. The helper returns the `ApiError` status and message as JSON; unexpected errors are logged server-side and return a generic 500. Do not silently return a successful response for a missing record.
- Validate inputs at trust boundaries; use typed Supabase clients and RLS-aware patterns.
- `request.json()` returns any in an App Router endpoint. Use `getRequestBody<T>()`. It will allow you to return the typed json body from the request context.
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

# Testing
 - Follow test driven development patterns
 - For every new feature integrated, write tests under /tests
 - If tests exist for an existing integration, update existing tests. Otherwise, create new ones if they don't exist 
# E2E Testing

Verify the change against a running app. Vitest tests under `/tests` stay the unit and integration layer. An e2e check is required when the change is only visible over HTTP or in the browser.

Pick the tool from the surface:

- **API** — route handlers under `src/app/api`. Test with `curl` against the running server.
- **UI** — pages and components a person sees or operates. Test with Playwright. Follow **UI Testing**.

## API (`curl`)

- Start the app if not running (`npm run dev`, or `npm run build` then `npm run start`) and call the real route. Importing the handler or passing a Vitest test is not the e2e check.
- Send the method, path, headers, and body the route expects. Assert the status code and the response body.
- Cover the success path and the failure cases the change owns (invalid input, missing record, auth, conflict). If those cases are unclear, ask before inventing them.
- Keep the exact `curl` command and the status and body you observed. The route is unverified until that command has been run.
- Do not change the route's request or response shape so the command succeeds. Ask first (see Assumptions).
- Keep secrets out of commands left in the transcript. Read them from the environment.

# UI Testing

Use Playwright for layout, styling, routing, client state, forms, and rendered data.

- Run the flow the way a person does: open the page, click, type, submit, and navigate. A screenshot of the first paint is not a test.
- Check every page that reads or writes the same state, data, or components.
- Check the empty, loading, and error states the change can reach, along with the main path.
- When layout or styling changed, check a desktop viewport and a mobile viewport.
- Check CSS breakage wherever text, images, or layout can grow. Text stays inside its box and does not cross a border, overlap a neighbor, or spill out of the page. Put a long unbroken string (a URL, email, id, or SKU) and a long wrapping sentence into every text container the change renders, then look at the result in Playwright:
  - A long word or URL wraps or truncates inside the box. It does not paint across the border or force the page wider than the viewport.
  - Wrapped lines stay inside the padding. They do not collide with the border, the next row, or an icon or button beside them.
  - `overflow` does not clip a value the person still needs to read. If the design truncates, the full value is still reachable (title, expand, or the detail view that already exists).
  - Flex and grid children shrink. A long label does not blow out a row, a button, an input, or a table cell.
  - Images and icons stay inside their frame. They do not stretch the card or cover the text.
  - Narrow viewports wrap or scroll inside the component. The page itself does not gain a horizontal scrollbar.
  - Sticky or fixed bars, menus, and dialogs do not cover the content, the focus ring, or each other.
- If a check fails, fix it and run the flow again.
- If Playwright is not available, say what you could not run. Do not report the UI as verified.

# Assumptions
Never guess. If the prompt is ambiguous or open ended i.e make the screen size bigger or smaller or what are the failure cases on an api, stop and ask.
- Ask before changing an api shape in `src/app/api` or db schema in `src/lib/db/schemas`
- Do not invent product decisions, copy, or acceptance criteria. ask and clarify
- Do not widen what was asked. Keep things in scope. Note the adjacent thing you spotted; don't just fix it if unprompted
- If you had to assume something you couldn't resolve, list it explicitly at the top of your summary.
- Ask when the request could mean two different things. 
# The Loop
For every change made, run the following commands to ensure the code conforms to formatting and linting practices and to ensure the project build
```bash
    npm run build # builds project
    npm run lint # Linting
    npm run format # Formatting
    npm run test # Testing

```

Rules:

- Run the loop yourself from the repo root after every code change, before you finish. Do not hand it back to the user.
- Run the commands in the order above. If one fails, stop, fix the cause, and start again from `npm run build`.
- `npm run format` rewrites files. If it changes anything, run `npm run lint` and `npm run build` again. The loop is done only when all three succeed and format leaves no further diff.
- Fix the underlying issue. Do not add `biome-ignore` comments, skip the build, or weaken types to force a green loop.
- If you cannot get the loop green, say which command failed and paste the error. Do not claim the change is done.
- If an integration breaks an existing test, understand the breaking change and fix the integration. Do not modify the test unless that is necessary.

# Naming conventions

Keep names consistent so the codebase stays readable.

### Functions

- Use **camelCase**.
- Use at least two words. A single-word name is acceptable only when a longer name would not be clearer.

### Variables

- Use **camelCase**.
- Prefix unused variables with `_`.

# PRs
Use the Github MCP if it exists
When opening the PR, convert the branch name into the title.

The description should consist of:

- The additions or changes in the branch, based on the files touched, the lines changed, and the commit history.
- An outline of those changes and their impact.

### Example

Branch: `db-layer` (12 commits, 13 files, +1594 / −29 vs `main`)

**Title:** Db layer

**Description:**

This branch adds a server-side Postgres connection and the tests around it.

- `src/lib/db/data-source.ts` and `src/lib/db/getDB.ts` connect with TypeORM and retry a failed connection up to 3 times (`b3d34bb`, `5180898`).
- `src/instrumentation.ts` opens that connection when the Next.js Node.js runtime starts (`11905a2`).
- `next.config.ts` lists TypeORM in `serverExternalPackages` so the server bundle does not break on a runtime `require` (`92be82e`).
- `docker-compose.yaml`, `README.md`, and the `pg` / `typeorm` dependencies run Postgres in Docker locally. Sandbox and production stay on Supabase (`ae2e364`, `c773bba`, `254f446`).
- Vitest is configured in `vitest.config.mts`, with tests for `getDb` and instrumentation (`e53e0d9`, `a4efbb3`, `tests/lib/db/get-db.test.ts`, `tests/instrumentation.test.ts`).

**Impact:** The Node.js server now connects to the database at startup. Local development depends on the Docker Postgres service. A failed connection is retried three times before the error surfaces. Client bundles are unchanged.

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Routine debugging is not feedback. Verify changes before retaining them as feedback candidates. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Retain qualifying friction even if it is later fixed or worked around; record the final outcome during the reporting pass.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `npx --no-install next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->
