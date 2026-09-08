# Growth1000 n8n workflows

These workflows are generic. Never duplicate them per client.

- `MONTHLY_SOCIAL(client_id, month, run_id)` loads verified business knowledge through Growth1000, generates the configured quantity, creates image placeholders, and stops at `needs_review`.
- `MONTHLY_BLOG(client_id, month, run_id)` uses the client’s configured blog quantity, verified business context and tracked keywords to create drafts at `internal_review`.
- `SEO_REVIEW(client_id, run_id)` loads tracked keyword and verified business context through Growth1000, creates evidence-linked SEO tasks, and stops at `awaiting_review`.
- `MONTHLY_REPORT(client_id, month)` prepares a reviewable report.

Before publishing, configure n8n variables `GROWTH1000_APP_URL` and `GROWTH1000_WEBHOOK_SECRET`. The app must use the same value for `N8N_API_KEY` and `N8N_WEBHOOK_SECRET`. Never publish a workflow until the webhook secret exists and a test execution completes successfully.
