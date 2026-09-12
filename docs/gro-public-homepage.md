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
- Description: Get an AI-powered Growth Agent for your business. Gro helps with your website, Google visibility, customer conversations, social media and digital growth — backed by Fusion Ventures.
- H1: Get a Growth Agent for your business.
- Main CTA: Get My Growth Agent
- Canonical: `https://gro.expert/` when Production has `APP_URL=https://gro.expert`.
- Open Graph URL: `https://gro.expert/` in that Production configuration.
- OG/Twitter large-image metadata uses the absolute `APP_URL` origin and the rendered 1200x630 branded image.
- Organization and WebSite JSON-LD use the canonical homepage URL and include only supplied factual brand/company names.
- Production indexing is allowed only when both `VERCEL_ENV=production` and `APP_URL=https://gro.expert`. Preview and localhost remain `noindex, nofollow`; their robots response disallows crawling.
- The sitemap uses `APP_URL` and includes only the homepage. Login remains `noindex, nofollow` and private application routes are excluded.

## Domain readiness

- `gro.expert` is already attached to Production.
- Current Production behavior remains `gro.expert` → `www.gro.expert`, where the old Production application is served.
- Future intended behavior is `www.gro.expert` → `gro.expert`, with `https://gro.expert/` as canonical.
- This repository pass does not change Vercel domains, DNS, TLS, redirects, Production environment variables, or deploy Production.
- `APP_URL` is the canonical server-side public application URL. Set it to `https://gro.expert` in Production. Local development safely falls back to `http://localhost:3000`.

## Auth boundary

/login presents the existing email/password form and imports the existing signIn server action unchanged. Existing /?error= redirects are forwarded to /login?error= by the public root, preserving failed-sign-in and protected-route entry behavior. Public error text is generic to avoid exposing internal wording. No changes to proxy, auth actions, role routing, Supabase, internal components, integrations, or environment variables. Authenticated sign-in was not tested with a real account.

## Validation

- pnpm typecheck: passed.
- pnpm lint: passed; targeted lint also passed after formatting.
- pnpm build: final build passed including TypeScript and all existing route compilation, without metadata warning.
- Actual browser QA against production build on port 3002: 390, 430, 768, 1440 widths; no horizontal overflow, correct title/H1, no broken anchor targets. Screenshots reviewed.
- Mobile menu opens; login and legacy error redirect load the existing form; social/Apple images and robots/sitemap endpoints respond.
- No customer messages sent or live database submissions performed.
- A shell quoting error created two scratch files that caused a transient Turbopack glob failure. Those files were removed and final build passed. Existing shared dev process was not restarted.

## Integration readiness and boundaries

- Google OAuth already requires an explicit exact `GOOGLE_OAUTH_REDIRECT_URI` and accepts HTTPS callbacks at `/api/integrations/google/callback`. Future Production configuration must use `https://gro.expert/api/integrations/google/callback`. The QA OAuth client and callbacks were not changed.
- Hosted Supabase configuration was not changed. Future Production Site URL: `https://gro.expert`; relevant allowed redirects must use exact Gro URLs.
- `/api/leads` is a cross-origin ingestion endpoint for configured client websites, not the Gro homepage enquiry action. It requires site identity/key headers and validates each stored client-site origin before accepting data. Its wildcard CORS response was preserved because restricting it to the Gro origin would break that purpose; the homepage continues to use WhatsApp/email and no lead backend was changed.
- `APP_URL` is the public canonical URL. Existing n8n `GROWTH1000_APP_URL` remains the internal workflow target and `N8N_BASE_URL` remains the app's outbound n8n host. They serve different directions, so neither was renamed.
- Public and client-facing copy now uses Gro, Your Growth Agent, or Fusion Ventures. Internal protocol headers, environment variables, database identifiers, audit files, and admin/staff operational wording retain Growth1000 where required.

## Remaining launch dependencies

- **LEGAL CONTENT REQUIRED:** approved Privacy Policy and Terms content/routes do not exist. No generic legal text or broken footer links were added.
- Configure and verify the Production OAuth client and consent flow.
- Set Production Supabase Site URL and exact redirect allowlist for Gro.
- Set and verify Production Vercel environment values, including `APP_URL=https://gro.expert`.
- Reverse the Production domain redirect from apex → www to www → apex.
- Deploy, smoke-test public and authenticated flows, then submit the sitemap.
- Existing authentication and integration architecture remains owned by the other agent.
- Production changes in this pass: **NONE**.
