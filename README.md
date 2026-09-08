# Growth1000

Internal operating system for managing UAE digital-growth clients. The current local-first milestone includes responsive demo experiences for partner/admin, publishing staff, and the ABC Interiors client.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`. Demo role buttons are visible only in the local demo experience. The documented local-only password is `Growth1000Demo!`; production auth is activated after a Supabase project is connected.

## Routes

- `/admin` — operational dashboard
- `/admin/clients` — client health, access, onboarding, plan and renewal
- `/admin/tasks`, `/admin/content`, plus foundation views for approvals, SEO, reports, assets and automations
- `/staff` — mobile-first manual posting queue with copy and status transitions
- `/client` — isolated, intentionally simple ABC Interiors portal

## Data and security

`supabase/migrations/202609080001_growth1000_foundation.sql` defines the tenant model, core operational tables, indexes, RLS policies, private authorization helpers, automation run/error model, and analytics staging tables. `supabase/seed.sql` provides deterministic demo organization, plans, ABC Interiors profile/services/locations/access data.

The current machine has no Supabase project credentials or local Docker runtime, so the SQL has not yet been applied. UI demo records are explicitly local and never imply a live integration. Add values from `.env.example` to `.env.local` after connecting a project. Never expose a Supabase secret/service-role key through `NEXT_PUBLIC_*`.

## Quality gates

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Publishing to Meta, payments, client website hosting/building, real Google ingestion, n8n workflows, and AI generation are intentionally outside this foundation milestone.
