import type { MetadataRoute } from "next";
import { buildSitemap } from "@/components/public-site/public-seo";
export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap();
}
