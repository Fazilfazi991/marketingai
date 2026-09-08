import { describe, expect, it } from "vitest";
import { isDemoMode } from "./demo-mode";

describe("demo mode", () => {
  it("uses demo mode by default during local development", () => {
    expect(isDemoMode({ NODE_ENV: "development" })).toBe(true);
  });

  it("allows explicit live Supabase mode during local development", () => {
    expect(isDemoMode({ NODE_ENV: "development", NEXT_PUBLIC_DEMO_MODE: "false", NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable" })).toBe(false);
  });

  it("uses demo mode when production credentials are absent unless live mode is explicit", () => {
    expect(isDemoMode({ NODE_ENV: "production" })).toBe(true);
    expect(isDemoMode({ NODE_ENV: "production", NEXT_PUBLIC_DEMO_MODE: "false" })).toBe(false);
  });
});
