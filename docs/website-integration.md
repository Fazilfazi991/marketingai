# Growth1000 website lead integration

Growth1000 does not host or rebuild client websites. Each website receives a site identifier and a secret key from **Admin → Client → Access → Website lead intake**. The secret is displayed once and must be stored in the website's server environment, never in browser JavaScript.

Send form or chatbot leads from the website server to `POST /api/leads` with headers `Content-Type: application/json`, `X-Growth1000-Site`, and `X-Growth1000-Site-Key`.

```json
{
  "event_id": "form-provider-stable-id",
  "source": "website_form",
  "name": "Customer name",
  "phone": "+971...",
  "email": "customer@example.com",
  "message": "I need help...",
  "service": "Requested service",
  "url": "https://client.example/contact",
  "referrer": "https://google.com/",
  "campaign": { "utm_source": "google", "utm_campaign": "brand" },
  "received_at": "2026-09-09T00:00:00Z",
  "company_website": ""
}
```

`event_id` makes retries idempotent. `company_website` is a honeypot and must stay empty. Requests are size-limited, validated, origin-restricted when configured, and authenticated against a one-way hash of the site key.

For WhatsApp CTA measurement, send a lightweight server-side event only after a genuine click. Use `source: "whatsapp"`; never report WhatsApp attribution from GA4 unless a verified click/conversion event exists.

Google data is synced separately by the generic `/api/automations/google-sync` worker. Give the Growth1000 Google service-account email Viewer access to the client's GA4 property and Search Console property, save the property references in Admin, then invoke the worker with the existing automation secret.
