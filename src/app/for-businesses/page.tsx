import type { Metadata } from "next";
import { PublicFooter, PublicHeader } from "@/components/public-site/chrome";
import { ForBusinessesContent } from "@/components/public-site/detail-sections";
import { buildPublicPageMetadata } from "@/components/public-site/public-seo";
import site from "@/components/public-site/public-site.module.css";
import detail from "@/components/public-site/detail-pages.module.css";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Gro for Businesses | Your Dedicated Growth Agent",
  description: "See how Gro adapts to different businesses, customers and goals to support digital growth across channels.",
  path: "/for-businesses",
});

export default function ForBusinessesPage() {
  return <div className={site.site}><a className={site.skip} href="#main-content">Skip to content</a><PublicHeader/><main className={detail.detail} id="main-content"><ForBusinessesContent/></main><PublicFooter/></div>;
}
