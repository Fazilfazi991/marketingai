export const leadSources = ["website_form", "website_chatbot", "whatsapp", "manual", "instagram", "facebook", "google_business", "phone", "other"] as const;
export const leadQualities = ["unqualified", "qualified", "high_intent", "disqualified"] as const;
export const leadStatuses = ["new", "contacted", "qualified", "won", "lost", "spam"] as const;

type LeadSource = typeof leadSources[number];
type LeadQuality = typeof leadQualities[number];
type LeadStatus = typeof leadStatuses[number];

export type LeadIngestion = {
  clientId: string;
  eventId: string;
  source: LeadSource;
  sourceDetail?: string;
  name?: string;
  phone?: string;
  email?: string;
  service?: string;
  location?: string;
  message?: string;
  qualificationSummary?: string;
  leadQuality: LeadQuality;
  status: LeadStatus;
  createdAt?: string;
};

const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown, max: number) => typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined;
const member = <T extends readonly string[]>(value: unknown, allowed: T, fallback?: T[number]) => typeof value === "string" && allowed.includes(value) ? value as T[number] : fallback;

export function parseLeadIngestion(value: unknown): { ok: true; value: LeadIngestion } | { ok: false; error: string } {
  const body = record(value), contact = record(body.contact), qualification = record(body.qualification);
  const clientId = text(body.client_id, 36), eventId = text(body.event_id, 200);
  const source = member(body.source, leadSources), leadQuality = member(qualification.quality ?? body.lead_quality, leadQualities, "unqualified"), status = member(body.status, leadStatuses, "new");
  if (!clientId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clientId)) return { ok: false, error: "client_id must be a UUID." };
  if (!eventId) return { ok: false, error: "event_id is required for safe retries." };
  if (!source) return { ok: false, error: "source is not supported." };
  const name = text(contact.name ?? body.name, 200), phone = text(contact.phone ?? body.phone, 80), email = text(contact.email ?? body.email, 320);
  if (!name && !phone && !email) return { ok: false, error: "Provide a lead name, phone number, or email address." };
  if (email && !/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "email is invalid." };
  const receivedAt = text(body.received_at, 40);
  if (receivedAt && Number.isNaN(Date.parse(receivedAt))) return { ok: false, error: "received_at must be an ISO date." };
  return { ok: true, value: { clientId, eventId, source, sourceDetail: text(body.source_detail, 300), name, phone, email, service: text(body.service ?? body.requirement, 300), location: text(body.location, 200), message: text(body.message, 5000), qualificationSummary: text(qualification.summary ?? body.qualification_summary, 2000), leadQuality: leadQuality!, status: status!, createdAt: receivedAt ? new Date(receivedAt).toISOString() : undefined } };
}
