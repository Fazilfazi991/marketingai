# Growth1000

Growth1000 is the internal operating system for a UAE digital-growth service. Partners manage client operations, staff manually schedule approved social content, and clients see a deliberately small results portal led by enquiries and measurable growth.

## Product boundaries

- Client billing, subscriptions, plan selection, and payments are not part of the product.
- Each client has an internal, configurable service scope and monthly deliverable quantities.
- Clients do not approve individual content or manage internal work.
- Social automation stops at `ready_to_post`; staff publish manually through the client’s accounts.
- Growth1000 does not build or host client websites. Website changes require separately authorized implementation work.

## Local development

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

Copy `.env.example` to `.env.local`. `NEXT_PUBLIC_DEMO_MODE=true` enables deterministic local demo data and role switching. To test the real Supabase-backed application locally, set it explicitly to `false` and provide the Supabase URL and publishable key. Never expose `SUPABASE_SECRET_KEY`, n8n credentials, Google service-account JSON, or AI keys through a `NEXT_PUBLIC_*` variable.

## Experiences

- `/admin` — partner operations, attention items, and monthly delivery
- `/admin/clients` — client lifecycle, health, service scope, business knowledge, access, leads, analytics, reports, and immutable activity history
- `/admin/tasks`, `/admin/content`, `/admin/blogs`, `/admin/seo`, `/admin/approvals`, `/admin/assets`, `/admin/automations`, `/admin/reports`, `/admin/staff` — operational workspaces
- `/staff` — mobile-first manual posting queue with copy, download, schedule, publish, and issue actions
- `/client` — results-only portal with `Overview / Leads / Traffic & SEO / Reports`

## Supabase

The ordered SQL files under `supabase/migrations` define the tenant model, Auth-linked roles, RLS, Storage policies, normalized leads and analytics, internal service scope, automation records, results-only client permissions, and immutable audit history. `supabase/seed.sql` supplies the Growth1000 demo organization and ABC Interiors operating data.

Apply every pending migration to the intended Supabase project before deploying application code that depends on it. Review permission changes before applying them. For local database verification:

```bash
supabase start
supabase test db
```

The pgTAP policy tests live under `supabase/tests`.

## Integrations

Generic n8n exports are stored under `n8n/`; one workflow serves every client. Configure credentials inside n8n and validate `X-Growth1000-Key` before activating production webhooks.

External lead sources post normalized events to `POST /api/webhooks/leads` with `X-Growth1000-Key: <N8N_WEBHOOK_SECRET>`. The route requires the canonical `client_id` plus a stable `event_id` for retry safety, and never exposes the Supabase secret key. Example body:

```json
{
  "client_id": "10000000-0000-4000-8000-000000000001",
  "event_id": "website-form-4831",
  "source": "website_form",
  "contact": { "name": "Aisha", "phone": "+971500000000" },
  "requirement": "Villa renovation",
  "qualification": { "quality": "qualified", "summary": "Dubai project" }
}
```

The first accepted delivery returns `201` with `created: true`; safe retries return the same lead ID with `200` and `created: false`.

The AI layer uses an OpenAI-compatible provider abstraction and reads `AI_BASE_URL`, `AI_API_KEY`, and `AI_MODEL` only on the server. Missing image-generation credentials do not block monthly social preparation: records remain reviewable with explicit placeholder state.

GA4 and Search Console imports are normalized into daily source records with provenance. Source access must be marked accurately; demo values must never be presented as live integrations.

## Deployment checklist

1. Run every quality gate below.
2. Apply and verify pending Supabase migrations and policy tests.
3. Create the three role accounts and membership records in Supabase Auth.
4. Configure production environment variables in Vercel with `NEXT_PUBLIC_DEMO_MODE=false`.
5. Import and secure the generic n8n workflows.
6. Verify admin, staff, and client isolation with separate accounts.
7. Verify desktop and 390×844 layouts against the deployed URL.

## Quality gates

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```
