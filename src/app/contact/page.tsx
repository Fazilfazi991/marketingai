import type { Metadata } from "next";
import { PublicFooter, PublicHeader } from "@/components/public-site/chrome";
import { ContactContent } from "@/components/public-site/detail-sections";
import { buildPublicPageMetadata } from "@/components/public-site/public-seo";
import site from "@/components/public-site/public-site.module.css";
import detail from "@/components/public-site/detail-pages.module.css";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Get Your Growth Agent | Contact Gro",
  description: "Tell us about your business and discover how Gro by Fusion Ventures can create a Growth Agent around your goals.",
  path: "/contact",
});

export default function ContactPage() {
  return <div className={site.site}><a className={site.skip} href="#main-content">Skip to content</a><PublicHeader/><main className={detail.detail} id="main-content"><ContactContent/></main><PublicFooter/></div>;
}
