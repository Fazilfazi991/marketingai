import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PublicHeader, PublicFooter } from "@/components/public-site/chrome";
import {
  Hero,
  BusinessSignals,
  AgentStory,
  Capabilities,
  HumanBacked,
  FinalCTA,
} from "@/components/public-site/sections";
import {
  buildHomeMetadata,
  buildStructuredData,
} from "@/components/public-site/public-seo";
import s from "@/components/public-site/public-site.module.css";
import home from "@/components/public-site/homepage.module.css";

export const metadata: Metadata = buildHomeMetadata();
const structuredData = buildStructuredData();
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  // Keep legacy authentication error redirects working without changing auth internals.
  if (error) redirect(`/login?error=${encodeURIComponent(error)}`);
  return (
    <div className={s.site}>
      <a href="#main-content" className={s.skip}>
        Skip to content
      </a>
      <PublicHeader />
      <main id="main-content" className={home.home}>
        <Hero />
        <BusinessSignals />
        <AgentStory />
        <Capabilities />
        <HumanBacked />
        <FinalCTA />
      </main>
      <PublicFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
    </div>
  );
}
