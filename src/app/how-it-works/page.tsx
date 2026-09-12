import type { Metadata } from "next";
import { PublicFooter, PublicHeader } from "@/components/public-site/chrome";
import { HowItWorksContent } from "@/components/public-site/detail-sections";
import { buildPublicPageMetadata } from "@/components/public-site/public-seo";
import site from "@/components/public-site/public-site.module.css";
import detail from "@/components/public-site/detail-pages.module.css";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "How Gro Works | Your AI Growth Agent",
  description: "See how Gro learns your business, connects your digital channels, finds opportunities and helps turn them into action — backed by Fusion Ventures.",
  path: "/how-it-works",
});

export default function HowItWorksPage() {
  return <div className={site.site}><a className={site.skip} href="#main-content">Skip to content</a><PublicHeader/><main className={detail.detail} id="main-content"><HowItWorksContent/></main><PublicFooter/></div>;
}
