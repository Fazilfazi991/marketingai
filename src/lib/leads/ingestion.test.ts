import { describe, expect, it } from "vitest";
import { parseLeadIngestion } from "./ingestion";

describe("lead ingestion payloads", () => {
  it("normalizes an n8n website form event", () => {
    const result = parseLeadIngestion({ client_id: "10000000-0000-4000-8000-000000000001", event_id: "form-42", source: "website_form", contact: { name: " Aisha ", email: "aisha@example.com" }, requirement: "Villa renovation", qualification: { quality: "qualified", summary: "Dubai project" } });
    expect(result.ok && result.value).toMatchObject({ clientId: "10000000-0000-4000-8000-000000000001", eventId: "form-42", source: "website_form", name: "Aisha", service: "Villa renovation", leadQuality: "qualified" });
  });

  it("requires a stable source event id", () => {
    expect(parseLeadIngestion({ client_id: "10000000-0000-4000-8000-000000000001", source: "whatsapp", phone: "+971500000000" })).toEqual({ ok: false, error: "event_id is required for safe retries." });
  });

  it("rejects invalid tenant ids and unsupported sources", () => {
    expect(parseLeadIngestion({ client_id: "abc", event_id: "1", source: "phone", phone: "1" })).toEqual({ ok: false, error: "client_id must be a UUID." });
    expect(parseLeadIngestion({ client_id: "10000000-0000-4000-8000-000000000001", event_id: "1", source: "email", email: "a@b.com" })).toEqual({ ok: false, error: "source is not supported." });
  });
  it("supports the intentionally small lead lifecycle",()=>{const result=parseLeadIngestion({client_id:"10000000-0000-4000-8000-000000000001",event_id:"general-1",source:"website_form",email:"a@b.com",status:"general"});expect(result.ok&&result.value.status).toBe("general")});
});
