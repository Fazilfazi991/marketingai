# Gro public homepage rebuild

## Scope and files

- Replaced `src/app/page.tsx` with the public homepage and page-specific metadata.
- Added `src/components/public-site/{chrome.tsx,sections.tsx,site-config.ts,public-site.module.css}`.
- Added `src/app/login/page.tsx`, reusing the existing signIn action and SignInButton.
- Added `src/app/gro-social/route.tsx`, `src/app/gro-apple-icon/route.tsx`, and `public/gro-icon.svg`.
- Added `src/app/robots.ts` and `src/app/sitemap.ts`.

## Experience

Nine sections: hero, business problem, capabilities, intelligence examples, connected growth, setup steps, human backing, audiences, enquiry CTA. Public header/footer use Gro by Fusion Ventures. No public role selection, admin/staff links, technical security language, or legacy homepage branding.
Primary buttons lead to the contact section; the final button opens WhatsApp at +971542763828 with a prepared enquiry. Email alternative: info@fusionventuresglobal.com. No lead database or shared ingestion changes.

## Exact SEO and conversion copy

- Title: Gro | AI Growth Agent for Your Business
- Description: Your dedicated Growth Agent for clearer website, Google and analytics priorities, backed by the Fusion Ventures team.
- H1: Get a Growth Agent for your business.
- Main CTA: Get My Growth Agent
- Canonical: `https://gro.expert/` in every environment; Preview never emits its host as canonical.
- Open Graph URL: `https://gro.expert/`.
- OG/Twitter large-image metadata uses the absolute canonical Production origin and the rendered 1200x630 branded image.
- Organization and WebSite JSON-LD use the canonical homepage URL and include only supplied factual brand/company names.
- Production indexing is allowed only when both `VERCEL_ENV=production` and `APP_URL=https://gro.expert`. Preview and localhost remain `noindex, nofollow`; their robots response disallows crawling.
- Preview metadata keeps the intended `https://gro.expert/` canonical and never publishes the Vercel Preview hostname; Preview application links may still use an explicit Preview `APP_URL`.
- The sitemap is empty outside explicit Production. In Production it uses `https://gro.expert/` and includes only the homepage. Login remains `noindex, nofollow` and private application routes are excluded.

## Domain readiness

- `gro.expert` is already attached to Production.
- Current Production behavior remains `gro.expert` → `www.gro.expert`, where the old Production application is served.
- Future intended behavior is `www.gro.expert` → `gro.expert`, with `https://gro.expert/` as canonical.
- This repository pass does not change Vercel domains, DNS, TLS, redirects, Production environment variables, or deploy Production.
- `APP_URL` is the server-side runtime application origin used for absolute login/invitation links and Production indexability gating. Set it to `https://gro.expert` in Production; Preview uses its stable branch URL. Local development safely falls back to `http://127.0.0.1:3000`. SEO canonical URLs remain fixed to the approved Production origin.

## Auth boundary

`/login` presents the existing email/password form and sign-in action. Existing `/?error=` redirects are forwarded to `/login?error=`, and protected-route/auth failures now land on `/login`. Admin invitations use the exact `APP_URL` login URL. No hosted Supabase Auth settings were changed.

## Validation

- `pnpm typecheck`: passed.
- `pnpm lint`: passed.
- `pnpm test`: 375/375 passed, including public metadata, OAuth callback, lead CORS, and tenant-binding regressions.
- `pnpm build`: passed with Next.js 16.3.4, including `/privacy`, `/terms`, `/robots.txt`, and `/sitemap.xml`.
- Local production-server smoke: homepage and login returned 200; title was exact; canonical was `https://gro.expert`; non-production robots metadata was `noindex, nofollow`; robots disallowed all; sitemap was empty; no legacy public brand or stale Vercel host appeared.
- `git diff --check`: passed.
- No customer messages or live lead submissions were made.

## Integration readiness and boundaries

- Google OAuth already requires an explicit exact `GOOGLE_OAUTH_REDIRECT_URI` and accepts HTTPS callbacks at `/api/integrations/google/callback`. Future Production configuration must use `https://gro.expert/api/integrations/google/callback`. The QA OAuth client and callbacks were not changed.
- Hosted Supabase configuration was not changed. Future Production Site URL: `https://gro.expert`; relevant allowed redirects must use exact Gro URLs.
- `/api/leads` is a cross-origin ingestion endpoint for configured client websites, not the Gro homepage enquiry action. It requires site identity/key headers, emits CORS only for an exact active `client_sites.origin`, rejects arbitrary browser origins, and preserves authenticated server-to-server requests without an `Access-Control-Allow-Origin` header.
- `GROWTH1000_APP_URL` is the normalized internal n8n callback target. `GROWTH1000_BASE_URL` is no longer used by the daily Google workflow. `N8N_BASE_URL` remains the app's outbound n8n host, and webhook/header compatibility names remain unchanged.
- Public and client-facing copy now uses Gro, Your Growth Agent, or Fusion Ventures. Internal protocol headers, environment variables, database identifiers, audit files, and admin/staff operational wording retain Growth1000 where required.

## Remaining launch dependencies

- **LEGAL CONTENT REQUIRED:** public `/privacy` and `/terms` route structure exists with factual status/contact copy, but approved legal content is still required before Production OAuth verification.
- Configure and verify the Production OAuth client and consent flow.
- Set Production Supabase Site URL and exact redirect allowlist for Gro.
- Set and verify Production Vercel environment values, including `APP_URL=https://gro.expert`.
- Reverse the Production domain redirect from apex → www to www → apex.
- Deploy, smoke-test public and authenticated flows, then submit the sitemap.
- Existing authentication and integration architecture remains owned by the other agent.
- Production changes in this pass: **NONE**.
