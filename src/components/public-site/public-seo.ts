import type { Metadata, MetadataRoute } from "next";
import { getPublicSite, publicSite } from "./site-config";

type SiteIdentity = ReturnType<typeof getPublicSite>;
type Site = SiteIdentity & Pick<typeof publicSite, "title" | "description">;

export function buildPublicPageMetadata(
  page: { title: string; description: string; path: `/${string}` },
  site: SiteIdentity = publicSite,
): Metadata {
  const url = `${site.origin}${page.path}`;

  return {
    metadataBase: new URL(site.origin),
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: page.title,
      description: page.description,
      siteName: site.formalName,
      url,
      images: [site.socialImageUrl],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: [site.socialImageUrl],
    },
    robots: { index: site.indexable, follow: site.indexable },
  };
}

export function buildHomeMetadata(site: Site = publicSite): Metadata {
  return {
    metadataBase: new URL(site.origin),
    title: { absolute: site.title },
    description: site.description,
    alternates: { canonical: site.homepageUrl },
    openGraph: {
      type: "website",
      title: site.title,
      description: site.description,
      siteName: site.formalName,
      url: site.homepageUrl,
      images: [
        {
          url: site.socialImageUrl,
          width: 1200,
          height: 630,
          alt: "Gro by Fusion Ventures. Get a Growth Agent for your business. AI-powered. Human-backed.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: site.title,
      description: site.description,
      images: [site.socialImageUrl],
    },
    icons: { icon: "/gro-icon.svg", apple: "/gro-apple-icon" },
    robots: { index: site.indexable, follow: site.indexable },
  };
}

export function buildStructuredData(site: SiteIdentity = publicSite) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: site.formalName,
        url: site.homepageUrl,
        brand: { "@type": "Brand", name: site.brand },
        parentOrganization: {
          "@type": "Organization",
          name: "Fusion Ventures",
        },
      },
      {
        "@type": "WebSite",
        name: site.formalName,
        url: site.homepageUrl,
      },
    ],
  };
}

export function buildRobots(
  site: SiteIdentity = publicSite,
): MetadataRoute.Robots {
  if (!site.indexable) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/staff/", "/client/", "/api/", "/login"],
    },
    sitemap: `${site.origin}/sitemap.xml`,
  };
}

export function buildSitemap(
  site: SiteIdentity = publicSite,
): MetadataRoute.Sitemap {
  if (!site.indexable) return [];

  return [
    {
      url: site.homepageUrl,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${site.origin}/how-it-works`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${site.origin}/what-gro-does`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${site.origin}/about`,
      changeFrequency: "yearly",
      priority: 0.6,
    },
    {
      url: `${site.origin}/for-businesses`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${site.origin}/contact`,
      changeFrequency: "yearly",
      priority: 0.7,
    },
    {
      url: `${site.origin}/privacy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${site.origin}/terms`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
