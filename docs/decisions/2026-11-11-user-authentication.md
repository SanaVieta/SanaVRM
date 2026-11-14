# Decision: Authenticate and authorize CRM users with Supabase Auth, limited to Google Workspace

**Status:** proposed
**Date:** 2026-11-11

## Context

The CRM has no sign-in. Anyone who can open the app can read and change lead, order, and product data. Notes and call logs also have no `author_id` yet, because there is no signed-in user to attach (`docs/decisions/2026-11-06-notes-table.md`, `docs/decisions/2026-11-10-call-logging-entity.md`).

SanaVieta staff should sign in with their Google Workspace account. After sign-in, Supabase Auth issues a session whose access token is a JWT. That session is what authorizes role-protected routes and, later, row-level access to CRM data. The sidebar in `src/components/crm/shell.tsx` still shows a static "SV / SanaVieta CRM" block; it should show the signed-in user and a way to sign out.

## Decision

Use **Supabase Auth** as the only identity provider for the CRM. Google is the only enabled sign-in method, and only Google Workspace accounts for the SanaVieta domain are accepted.

1. **Sign-in.** A server route starts `signInWithOAuth({ provider: "google" })` with the `@supabase/ssr` server client and the PKCE flow. The callback route (`app/auth/callback`) calls `exchangeCodeForSession` and stores the session in cookies. The publishable key is the only Supabase key that reaches the browser. The `service_role` key stays on the server.
2. **Workspace limit.** Pass Google's `hd` query parameter so the consent screen prefers the Workspace domain. That parameter does not reject other Google accounts. A **Before User Created** Auth hook rejects any email outside the Workspace domain, and email/password plus every other provider stay disabled.
3. **Authorization.** Roles live in `app_metadata` and are copied onto the JWT with a **Custom Access Token** hook. Route protection reads that claim on the server (middleware or a server layout): no session redirects to sign-in; a session without the required role is forbidden. Database policies use `TO authenticated` together with a role or ownership check. `user_metadata` is never used for authorization, because the user can edit it.
4. **Shell.** A server layout reads the session and passes the user into `Shell`. The aside in `src/components/crm/shell.tsx` shows that user's name and Google avatar, and a control that signs them out.

This decision does not add `author_id` to notes or call logs. Those columns can follow once a session exists.

## Blocker

Implementation waits on a real Google Workspace for SanaVieta. Until that Workspace exists there is no domain to enforce, and no Google Cloud OAuth client (client id and secret) to attach to the Supabase Google provider. App code, Auth hooks, and route protection stay unbuilt until the Workspace is in hand.

## Alternatives considered

| Alternative | Why not chosen |
|-------------|----------------|
| Amazon Cognito (a user pool plus Google federation) | The app already targets Supabase for data. A second identity system would split the JWT from Postgres RLS. |
| Auth.js / NextAuth with a Google provider | Fits Next.js, but the session would not be a Supabase JWT, so RLS could not authorize the same user. |
| Supabase SAML SSO against Google Workspace | Supported, and heavier than this team needs. One Workspace and Google OAuth cover the same sign-in. |
| Check the session in route handlers only, with no RLS | A leaked publishable key or a missed check would expose tables through the Data API. |

## Consequences / impact

- New Supabase browser and server clients, a sign-in route, an `app/auth/callback` route, and server-side route protection. CRM pages require a session.
- Google client id and secret are configured on the Supabase Auth Google provider. The app stores the Supabase URL and publishable key.
- The static avatar block in `src/components/crm/shell.tsx` becomes the signed-in user, with sign-out.
- RLS policies have to be added with the tables they protect. `TO authenticated` alone is not authorization.
- JWT role claims stay stale until the token refreshes. A role change applies on the next refresh.
- Deleting a user does not revoke an already issued access token. Sign-out or session revoke comes first.

## Open questions

- Which roles exist, and which routes does each role open?
- Should the avatar use the Google profile photo only, or a fallback initial when Google sends none?
