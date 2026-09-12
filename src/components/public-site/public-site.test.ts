import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  buildHomeMetadata,
  buildRobots,
  buildSitemap,
  buildStructuredData,
} from "./public-seo";
import {
  getPublicSite,
  LOCAL_ORIGIN,
  PRODUCTION_ORIGIN,
  publicSite,
} from "./site-config";
import { publicClientLoginHref, publicNavigation } from "./chrome";

const configuredSite = (env: Parameters<typeof getPublicSite>[0]) => ({
  ...getPublicSite(env),
  title: publicSite.title,
  description: publicSite.description,
});

describe("Gro public domain configuration", () => {
  it("uses APP_URL as the single production identity", () => {
    const site = getPublicSite({
      APP_URL: `${PRODUCTION_ORIGIN}/`,
      VERCEL_ENV: "production",
    });

    expect(site).toMatchObject({
      appOrigin: PRODUCTION_ORIGIN,
      origin: PRODUCTION_ORIGIN,
      homepageUrl: `${PRODUCTION_ORIGIN}/`,
      loginUrl: `${PRODUCTION_ORIGIN}/login`,
      socialImageUrl: `${PRODUCTION_ORIGIN}/gro-social`,
      indexable: true,
    });
  });

  it("falls back safely on localhost and rejects unsafe APP_URL values", () => {
    expect(getPublicSite({}).appOrigin).toBe(LOCAL_ORIGIN);
    expect(getPublicSite({}).origin).toBe(PRODUCTION_ORIGIN);
    expect(getPublicSite({}).indexable).toBe(false);
    expect(() => getPublicSite({ APP_URL: "http://gro.expert" })).toThrow();
    expect(() =>
      getPublicSite({ APP_URL: "https://gro.expert/path" }),
    ).toThrow();
  });

  it("uses an explicit Preview APP_URL for application links without changing the canonical", () => {
    const preview = getPublicSite({
      APP_URL: "https://preview.example",
      VERCEL_ENV: "preview",
    });

    expect(preview.appOrigin).toBe("https://preview.example");
    expect(preview.loginUrl).toBe("https://preview.example/login");
    expect(preview.origin).toBe(PRODUCTION_ORIGIN);
    expect(preview.homepageUrl).toBe(`${PRODUCTION_ORIGIN}/`);
    expect(preview.indexable).toBe(false);
  });

  it("keeps Preview noindex even if it receives the production APP_URL", () => {
    const preview = configuredSite({
      APP_URL: PRODUCTION_ORIGIN,
      VERCEL_ENV: "preview",
    });
    const metadata = buildHomeMetadata(preview);

    expect(preview.indexable).toBe(false);
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(buildRobots(preview)).toEqual({
      rules: { userAgent: "*", disallow: "/" },
    });
    expect(buildSitemap(preview)).toEqual([]);
  });

  it("never emits the Preview host as the public canonical", () => {
    const preview = configuredSite({
      APP_URL:
        "https://marketingai-git-codex-growth-agent-v1-faziils-projects.vercel.app",
      VERCEL_ENV: "preview",
    });
    const metadata = buildHomeMetadata(preview);

    expect(preview.appOrigin).toContain("marketingai-git-codex-growth-agent-v1");
    expect(metadata.alternates?.canonical).toBe(`${PRODUCTION_ORIGIN}/`);
    expect(JSON.stringify(metadata)).not.toContain(
      "marketingai-git-codex-growth-agent-v1",
    );
  });

  it("renders canonical production metadata and absolute social URLs", () => {
    const site = configuredSite({
      APP_URL: PRODUCTION_ORIGIN,
      VERCEL_ENV: "production",
    });
    const metadata = buildHomeMetadata(site);

    expect(metadata.title).toEqual({
      absolute: "Gro | AI Growth Agent for Your Business",
    });
    expect(metadata.description).toContain(
      "backed by the Fusion Ventures team",
    );
    expect(metadata.alternates?.canonical).toBe(`${PRODUCTION_ORIGIN}/`);
    expect(metadata.openGraph?.url).toBe(`${PRODUCTION_ORIGIN}/`);
    expect(metadata.openGraph?.images).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: `${PRODUCTION_ORIGIN}/gro-social` }),
      ]),
    );
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(buildRobots(site)).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/staff/", "/client/", "/api/", "/login"],
      },
      sitemap: `${PRODUCTION_ORIGIN}/sitemap.xml`,
    });
  });

  it("uses APP_URL for the public-only sitemap and structured data", () => {
    const site = configuredSite({
      APP_URL: PRODUCTION_ORIGIN,
      VERCEL_ENV: "production",
    });
    const sitemap = buildSitemap(site);
    const serialized = JSON.stringify(sitemap);

    expect(sitemap).toEqual([
      expect.objectContaining({ url: `${PRODUCTION_ORIGIN}/` }),
    ]);
    expect(serialized).not.toMatch(/admin|staff|client|api|login/);
    expect(JSON.stringify(buildStructuredData(site))).toContain(
      `"url":"${PRODUCTION_ORIGIN}/"`,
    );
  });

  it("keeps public navigation limited to the client login and page sections", () => {
    const hrefs = [
      ...publicNavigation.map(([href]) => href),
      publicClientLoginHref,
    ];

    expect(publicClientLoginHref).toBe("/login");
    expect(hrefs).not.toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^\/(admin|staff|client)/),
      ]),
    );
  });

  it("does not restore stale Vercel metadata fallbacks or public legacy branding", () => {
    const publicSources = [
      "src/app/page.tsx",
      "src/app/login/page.tsx",
      "src/components/public-site/site-config.ts",
      "src/components/public-site/chrome.tsx",
    ]
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");

    expect(publicSources).not.toMatch(/marketingai-ruddy-xi|VERCEL_URL/);
    expect(publicSources).not.toMatch(
      /Growth1000|Marketing AI|Internal Growth Operating System/,
    );
  });

  it("keeps legacy branding out of the client-visible workspace shell", () => {
    const clientSources = [
      "src/app/client/layout.tsx",
      "src/components/agent-shell.tsx",
      "src/components/client-portal-section.tsx",
      "src/components/client-traffic-detail.tsx",
      "src/components/growth-ai-assistant.tsx",
      "src/components/lazy-assistant.tsx",
    ]
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");

    expect(clientSources).not.toMatch(
      /Growth1000|Marketing AI|Internal Growth Operating System/,
    );
  });

  it("preserves internal Growth1000 compatibility identifiers", () => {
    const leadRoute = readFileSync("src/app/api/leads/route.ts", "utf8");
    const workflow = readFileSync("n8n/DAILY_GOOGLE_SYNC.json", "utf8");

    expect(leadRoute).toContain("x-growth1000-site");
    expect(leadRoute).toContain("x-growth1000-site-key");
    expect(workflow).toContain("GROWTH1000_APP_URL");
    expect(workflow).toContain("GROWTH1000_WEBHOOK_SECRET");
    expect(workflow).not.toContain("GROWTH1000_BASE_URL");
  });
});
