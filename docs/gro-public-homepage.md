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
- Description: Get an AI-powered Growth Agent for your business. Website, Google visibility, customer conversations and social media, backed by Fusion Ventures.
- H1: Get a Growth Agent for your business.
- Main CTA: Get My Growth Agent
- Canonical: intentionally omitted pending verified production domain.
- Vercel project inspection on 2026-09-12 did not list gro.expert. No domains or deployment configuration changed.
- OG/Twitter large-image metadata uses a rendered 1200x630 branded image. Image base uses the deployment URL or verified Vercel project alias, independently of canonical.
- Organization and WebSite JSON-LD include only supplied factual brand/company names.
- Robots allows only the exact homepage, blocking other paths without listing internal route names. Sitemap intentionally empty until publicSite.url is verified. Login is noindex/nofollow.

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

## Remaining launch dependencies
- Confirm/configure production domain through its owning agent, then set publicSite.url to activate canonical and populated sitemap.
- Supply approved Privacy Policy and Terms content/routes; no fabricated policy text or broken links added.
- Existing authentication architecture remains owned by the other agent; this adds public presentation only.
- No Production deployment authorized or performed.
