import type { MetadataRoute } from "next";
import { buildRobots } from "@/components/public-site/public-seo";
export default function robots(): MetadataRoute.Robots {
  return buildRobots();
}
