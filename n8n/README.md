# Growth1000 n8n workflows

These workflows are generic. Never duplicate them per client.

- `MONTHLY_SOCIAL(client_id, month)` prepares social records and stops at `needs_review`.
- `MONTHLY_BLOG(client_id, month)` prepares blog obligations and drafts.
- `SEO_REVIEW(client_id)` records review opportunities.
- `MONTHLY_REPORT(client_id, month)` prepares a reviewable report.

Configure credentials inside n8n, not in these exports. The webhook caller sends `X-Growth1000-Key`; validate it against an n8n credential or environment secret before activating production webhooks.
