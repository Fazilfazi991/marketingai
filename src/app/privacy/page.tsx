import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/public-site/chrome";
import s from "@/components/public-site/public-site.module.css";

export const metadata: Metadata = {
  title: "Privacy notice",
  description: "Gro privacy notice status and contact information.",
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <main className={`${s.site} ${s.loginPage}`}>
      <section className={s.loginCard}>
        <Wordmark />
        <h1>Privacy notice</h1>
        <p>
          Gro&apos;s approved privacy notice is being prepared and is not yet
          published. Contact the Fusion Ventures team before providing personal
          information through this website.
        </p>
        <a className={s.textLink} href="mailto:info@fusionventuresglobal.com">
          Contact Fusion Ventures
        </a>
        <Link className={s.textLink} href="/">
          Back to Gro
        </Link>
      </section>
    </main>
  );
}
