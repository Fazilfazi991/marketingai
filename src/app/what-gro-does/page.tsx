import type { Metadata } from "next";
import { PublicFooter, PublicHeader } from "@/components/public-site/chrome";
import { WhatGroDoesContent } from "@/components/public-site/detail-sections";
import { buildPublicPageMetadata } from "@/components/public-site/public-seo";
import site from "@/components/public-site/public-site.module.css";
import detail from "@/components/public-site/detail-pages.module.css";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "What Gro Does | AI Growth Agent for Businesses",
  description: "See how Gro helps with websites, Google visibility, customer conversations, WhatsApp, social media, analytics and digital growth.",
  path: "/what-gro-does",
});

export default function WhatGroDoesPage() {
  return <div className={site.site}><a className={site.skip} href="#main-content">Skip to content</a><PublicHeader/><main className={detail.detail} id="main-content"><WhatGroDoesContent/></main><PublicFooter/></div>;
}
