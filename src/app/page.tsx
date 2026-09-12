import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PublicHeader, PublicFooter } from "@/components/public-site/chrome";
import {
  Hero,
  ProblemSection,
  Capabilities,
  IntelligenceExamples,
  ConnectedGrowth,
  HowItWorks,
  HumanBacked,
  WhoItsFor,
  FinalCTA,
} from "@/components/public-site/sections";
import { publicSite } from "@/components/public-site/site-config";
import s from "@/components/public-site/public-site.module.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    publicSite.url ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "https://marketingai-ruddy-xi.vercel.app"),
  ),
  title: publicSite.title,
  description: publicSite.description,
  ...(publicSite.url
    ? {
        metadataBase: new URL(publicSite.url),
        alternates: { canonical: publicSite.url },
      }
    : {}),
  openGraph: {
    type: "website",
    title: publicSite.title,
    description: publicSite.description,
    siteName: "Gro by Fusion Ventures",
    ...(publicSite.url ? { url: publicSite.url } : {}),
    images: [
      {
        url: "/gro-social",
        width: 1200,
        height: 630,
        alt: "Gro by Fusion Ventures. Get a Growth Agent for your business. AI-powered. Human-backed.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: publicSite.title,
    description: publicSite.description,
    images: ["/gro-social"],
  },
  icons: { icon: "/gro-icon.svg", apple: "/gro-apple-icon" },
  robots: { index: true, follow: true },
};
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Gro by Fusion Ventures",
      brand: { "@type": "Brand", name: "Gro" },
      parentOrganization: { "@type": "Organization", name: "Fusion Ventures" },
      ...(publicSite.url ? { url: publicSite.url } : {}),
    },
    {
      "@type": "WebSite",
      name: "Gro by Fusion Ventures",
      ...(publicSite.url ? { url: publicSite.url } : {}),
    },
  ],
};
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
      <main id="main-content">
        <Hero />
        <ProblemSection />
        <Capabilities />
        <IntelligenceExamples />
        <ConnectedGrowth />
        <HowItWorks />
        <HumanBacked />
        <WhoItsFor />
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
