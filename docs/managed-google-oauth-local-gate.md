# Managed Google OAuth — local review gate

Date: 2026-09-12. Branch: `codex/growth-agent-v1`. Local implementation only; uncommitted/unpushed.

## A. Existing architecture

Previously, onboarding manually saved GA4/Search Console identifiers into `client_integrations`; the importer acquired a service-account token from `GOOGLE_SERVICE_ACCOUNT_JSON`. The same fetch layer populated canonical analytics tables and `data_imports`. A stored `connected` flag did not prove Google access. Existing Preview references were previously audited as GA4 `545982719` and `sc-domain:kaamcareer.com`; this pass does **not** verify their ownership or access.

## B. Reused tables/fields

`client_integrations`: client/provider, external reference, configuration, status and existing sync timestamps/errors. `analytics_daily`, `analytics_page_daily`, `search_console_daily`, `data_imports`: unchanged canonical destinations. No historical rows, property references or reports are removed/backfilled.

## C. Proposed schema

Local migration: `supabase/migrations/20260912105216_managed_google_oauth.sql`.

- `google_connections`: organization, Google subject/email, connecting profile, encrypted refresh token, scopes, timestamps and connection status.
- `google_oauth_states`: hashed random state, initiating user/session/client/organization, encrypted PKCE verifier, ten-minute expiry and optional reconnect target. Atomic delete-returning consumes state once.
- `client_integrations`: `auth_method` (existing rows default to `service_account`) and `google_connection_id`.
- `data_imports.coverage`: new imports can state limits and incomplete coverage.
- Service-role-only, security-invoker mapping RPC; active admin and client checks inside the transaction. Connection row lock serializes bind versus revoke.
- Trigger rejects direct authenticated browser changes to OAuth mappings, including changing them back into service-account mappings.

The migration was replayed on a **new, schema-only loopback PostgreSQL 17 database**, not on Preview. SQL fixtures were rolled back. Two local rehearsal databases remain; no customer records were copied into them.

## D. Scopes

Exactly:

```
openid
email
https://www.googleapis.com/auth/analytics.readonly
https://www.googleapis.com/auth/webmasters.readonly
```

`openid email` identify the Google account for safe reconnect/reuse; they are not Gmail access. No Drive, Gmail, Calendar, Analytics write/admin or unrelated scopes are requested. Consent text must describe read-only analytics/search access.

## E. Google Cloud configuration required

An authorized operator must configure a Web application OAuth client, consent screen/audience/test users and enable Google Analytics Admin API, Google Analytics Data API and Search Console API. No credentials were created here. Use a **QA-only OAuth client credential** for localhost/Preview, and a distinct future Production credential: Google grant revocation must not cross environments. They can belong to the same managed Google Cloud application/project.

Before approving real consent, confirm the account has explicit access to the controlled QA properties; never authorize Production customer data by assumption. Review Google verification requirements for wider use beyond controlled test users.

## F. Exact callback URLs

Local (use this hostname consistently with the signed-in session):

`http://127.0.0.1:3000/api/integrations/google/callback`

Preview stable branch alias, verified with read-only Vercel deployment inspection:

`https://marketingai-git-codex-growth-agent-v1-faziils-projects.vercel.app/api/integrations/google/callback`

Future Production, **not to configure/enable in this pass**:

`https://marketingai-ruddy-xi.vercel.app/api/integrations/google/callback`

These routes are newly local and are not deployed on those hosted URLs yet. Google redirect registration and the environment variable must match exactly. No wildcard redirects. `localhost` is not interchangeable with `127.0.0.1` for session cookies. Do not disable Vercel deployment protection; test the protected callback in the approved Preview browser session.

## G. Token storage

AES-256-GCM, random 96-bit IV, authenticated organization/Google-subject context, versioned ciphertext envelope. Separate 32-byte base64 server-managed encryption key. PKCE verifier uses a separate state-bound context. Access tokens stay in request memory only; refresh tokens are encrypted in the database.

Token/state tables have RLS enabled and **no PUBLIC/anon/authenticated privileges or policies**. Narrow server methods obtain service-role access only after a verified active admin/client authorization boundary. UI/API metadata projections omit ciphertext, refresh/access tokens, subjects and scopes. Callback errors never echo provider bodies/code/state, and Next development logging excludes callback URLs. Hosted infrastructure/log-drain query-string redaction remains a deployment review requirement before real consent.

Keep the encryption key stable and securely backed up outside source control. Rotation requires an explicit decrypt/re-encrypt plan; changing it blindly makes grants unusable. No secrets were added in this pass.

## H. GA4 discovery

Google Analytics Admin API `GET /v1beta/accountSummaries`, pages of 200 accounts, following `nextPageToken`; repeated/capped pagination fails closed instead of presenting a silently incomplete picker. Shows property ID/name and parent account. Binding re-fetches access lists and rejects IDs not present. No name-based or first-item auto-selection.

## I. Search Console discovery

`GET https://www.googleapis.com/webmasters/v3/sites`; retains owner/full/restricted accessible sites and excludes unverified entries. Preserves exact domain or URL-prefix identifiers. Binding rechecks the returned access list.

## J. Shared-account design

One connection can serve many explicitly bound clients **within one organization**. Subject uniqueness prevents the same Google application grant being attached to two organizations: Google grant revocation is broader than one database row. Cross-org lookup/binding fails without exposing another organization's metadata.

Configuration remains admin-only, honoring the earlier role decision; ordinary staff continue assigned work but do not gain Google configuration permissions. No client-facing OAuth/account email/property-picker UI was added.

## K. Disconnect/reconnect

Client disconnect changes only that client's mappings to `not_connected`; property references/history are retained and shared refresh tokens survive. Revocation requires zero dependent active mappings, transitions to `revoking` under lock, then revokes at Google and clears ciphertext. A failed revoke stays blocked from reuse and can be explicitly retried.

Reconnect must match the selected Google subject. A missing new refresh token preserves an existing connected same-org/same-subject refresh token; a revoked/unusable grant is not silently revived without a token. Refresh failure `invalid_grant` marks the shared connection `needs_reconnection`. Sync authorization failures mark affected mappings `needs_reconnection`/`access_removed`; other failures use `sync_error` and can be retried manually. Rebinding after renewed access re-verifies selected properties.

## L. Service-account compatibility and ingestion

Legacy importer remains. OAuth and service-account credentials feed the same Google fetch and canonical ingestion layer. The old manual-ID form is replaced by a link to managed Google setup; historical references are visible, explicitly labelled legacy/unverified. The existing server action is retained for compatibility; the database trigger prevents it from overwriting an OAuth binding.

No automatic sync on callback/binding and no schedule added. Manual sync validates a 1–90 completed-day range, loads only stored client mappings, scopes authorization to the organization and rejects browser-supplied property overrides. OAuth write escalation occurs only after those session-scoped checks; every mapping update includes client ID.

Missing/malformed numeric provider observations fail before canonical metric writes rather than becoming zero. Genuine zero remains zero. Empty responses do not manufacture date rows. New import coverage records GA4's 100,000-row cap and Search Console's 25,000-row cap and never claim guaranteed completeness. No pagination/completeness claim is made for performance imports.

Retained importer limitation: daily active-user/session totals are sums of page-level observations, not independently deduplicated GA4 totals. They must not be described as exact unique-user totals. The range boundary currently uses completed UTC dates; controlled Google QA must verify the GA4 property's reporting timezone before using boundary-day results. Neither limitation is hidden by the OAuth change.

## M. Security and local QA

- 37 new OAuth tests cover real API/service boundaries: client/staff/inactive/no-session rejection, invalid/cross-org clients, CSRF, metadata token exclusion, property access isolation, arbitrary GA4/GSC IDs, unverified sites, transactional binding, scoped disconnect, dependent revocation, revoked/transient refresh failure, stored-context sync, random state/PKCE, ciphertext tampering/context binding, config fail-closed, callback session/user/client/expiry checks, replay/concurrent replay, refresh preservation/account mismatch and callback redirect sanitization.
- Eight additional real sync-boundary tests cover OAuth token selection/client-scoped canonical writes, absent/invalid/whitespace metrics, measured zero, absent Search Console metrics, no fabricated history and disabled-feature fail-closed.
- Actual PostgreSQL tests: migration DDL, shared client bindings, cross-org rejection, dependent-revoke rejection, one-client disconnect preserving the second, reference preservation, browser mapping-write rejection, token/state/RPC grants, RLS. Not a simulated RLS claim. Fixtures roll back.
- Browser fixture uses the **actual React integration component** with synthetic endpoints, no Google/Supabase traffic: explicit account/property selection, save, manual sync and client disconnect passed. Shared account remained available. Desktop 1258px and 390×844 mobile: no horizontal overflow; visible controls are at least 44px. Unconfigured state disables connection/sync controls.
- Actual localhost unauthenticated integration API returned 403; invalid callback returned 400 without secrets. The user's prior localhost browser session was no longer authenticated; no password reset or account mutation was attempted.

Real Google consent, token exchange/refresh, property discovery and canonical ingestion against Preview remain **NOT TESTED**, blocked until the separate migration/environment/Google-account approval gate. Synthetic browser tests do not substitute for this.

## N. Checks

Final checks: **353/353 tests across 43 files PASS; TypeScript PASS; ESLint PASS; production build PASS; git diff whitespace check PASS.** Local database checks passed against the final migration. Browser fixture verification passed as scoped above. No real Google provider call was made by these mocked tests.

## O. Files for this change

```
next.config.ts
src/app/admin/clients/[slug]/integrations/page.tsx
src/app/api/integrations/google/route.ts
src/app/api/integrations/google/callback/route.ts
src/components/client-workspace.tsx
src/components/google-integration.tsx
src/components/google-integration.module.css
src/lib/google/oauth-core.ts
src/lib/google/oauth-service.ts
src/lib/google/oauth-security.test.ts
src/lib/google/sync-range.ts
src/lib/google/analytics.ts
src/lib/google/sync.ts
src/lib/google/sync-security.test.ts
supabase/migrations/20260912105216_managed_google_oauth.sql
scripts/google-oauth-local-db-test.sql
scripts/google-oauth-ui-fixture.mjs
docs/managed-google-oauth-local-gate.md
```

Earlier uncommitted Phase 3 foundation files remain untouched except for the shared Google sync/security files listed above. No screenshots, credentials, or generated bundles were added to Git.

## P. Exact Preview environment requirements

New server-only variables, scoped **only to the approved Preview branch**:

```
GOOGLE_OAUTH_ENABLED=true
GOOGLE_OAUTH_CLIENT_ID=<QA Web OAuth client ID>
GOOGLE_OAUTH_CLIENT_SECRET=<QA Web OAuth client secret>
GOOGLE_OAUTH_REDIRECT_URI=https://marketingai-git-codex-growth-agent-v1-faziils-projects.vercel.app/api/integrations/google/callback
GOOGLE_OAUTH_TOKEN_ENCRYPTION_KEY=<32 random bytes encoded as standard base64>
```

Enable only after the reviewed migration and compatible application build are approved. For local testing use the same QA-only credentials/key but the localhost redirect above; do not pull the hosted redirect unchanged into localhost.

Existing Supabase URL/publishable/server secret settings must continue targeting `cwamjlqqacjfppnqquuw`. Do not change/link to `yzxhckeyktgxpflnrtne`. `GOOGLE_SERVICE_ACCOUNT_JSON` is not required for OAuth onboarding. Keep `GROWTH_AGENT_ALLOW_PROVIDER_CALLS=false`; no provider keys required.

## Q. Migration required

**YES**, local proposal and rehearsal complete; remote migration **not applied**.

## R. Recommended approval gate

Review the code, local migration, cross-org grant restriction, and documented importer limitations. Then separately approve: Preview backup/migration; QA-only Google OAuth client/consent configuration and server secrets; compatible Preview deployment. After that approve the controlled Google account and exact QA properties, test consent/binding/refresh/tenant isolation, and only then explicitly approve bounded ingestion. No commit, push, deploy or remote mutation is authorized by this report.

## Official sources (retrieved 2026-09-12)

- [Google web-server OAuth, offline access and revocation](https://developers.google.com/identity/protocols/oauth2/web-server)
- [GA4 account/property discovery and readonly scope](https://developers.google.com/analytics/devguides/config/admin/v1/rest/v1beta/accountSummaries/list)
- [Search Console site discovery](https://developers.google.com/webmaster-tools/v1/sites/list)
- [Supabase explicit grants and RLS](https://supabase.com/docs/guides/api/securing-your-api)
- [Supabase changelog](https://supabase.com/changelog)

Production modified: NO
Production deployment: NO
Main merged: NO
Preview database modified: NO
Google OAuth credentials added: NO
Google data ingested: NO
Provider credentials added: NO
Paid AI calls made: NO
Ask Agent AI enabled: NO
