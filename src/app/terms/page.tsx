import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/public-site/chrome";
import s from "@/components/public-site/public-site.module.css";

export const metadata: Metadata = {
  title: "Terms",
  description: "Gro terms status and contact information.",
  robots: { index: false, follow: false },
};

export default function TermsPage() {
  return (
    <main className={`${s.site} ${s.loginPage}`}>
      <section className={s.loginCard}>
        <Wordmark />
        <h1>Terms</h1>
        <p>
          Gro&apos;s approved terms are being prepared and are not yet published.
          Contact the Fusion Ventures team for the terms applicable to a
          proposed service engagement.
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
