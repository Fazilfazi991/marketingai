import type { Metadata } from "next";
import { PublicFooter, PublicHeader } from "@/components/public-site/chrome";
import { AboutContent } from "@/components/public-site/detail-sections";
import { buildPublicPageMetadata } from "@/components/public-site/public-seo";
import site from "@/components/public-site/public-site.module.css";
import detail from "@/components/public-site/detail-pages.module.css";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "About Gro | AI-Powered, Human-Backed Growth",
  description: "Learn why Fusion Ventures built Gro: an AI-powered Growth Agent designed to help businesses manage and grow their digital presence.",
  path: "/about",
});

export default function AboutPage() {
  return <div className={site.site}><a className={site.skip} href="#main-content">Skip to content</a><PublicHeader/><main className={detail.detail} id="main-content"><AboutContent/></main><PublicFooter/></div>;
}
