import type { MetadataRoute } from "next";
import { publicSite } from "@/components/public-site/site-config";
export default function sitemap(): MetadataRoute.Sitemap {
  return publicSite.url
    ? [{ url: publicSite.url, changeFrequency: "monthly", priority: 1 }]
    : [];
}
