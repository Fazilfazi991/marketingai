import type { MetadataRoute } from "next";
import { publicSite } from "@/components/public-site/site-config";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/$", disallow: "/" },
    ...(publicSite.url
      ? { sitemap: `${publicSite.url.replace(/\/$/, "")}/sitemap.xml` }
      : {}),
  };
}
