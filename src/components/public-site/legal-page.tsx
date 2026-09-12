import type { ReactNode } from "react";
import { PublicFooter, PublicHeader } from "./chrome";
import s from "./public-site.module.css";

export const LEGAL_EFFECTIVE_DATE = "12 September 2026";

export function LegalPage({
  eyebrow,
  title,
  introduction,
  children,
}: {
  eyebrow: string;
  title: string;
  introduction: string;
  children: ReactNode;
}) {
  return (
    <div className={s.site}>
      <a href="#legal-content" className={s.skip}>
        Skip to content
      </a>
      <PublicHeader />
      <main id="legal-content" className={s.legalMain}>
        <header className={s.legalIntro}>
          <p className={s.eyebrow}>
            <span aria-hidden="true" /> {eyebrow}
          </p>
          <h1>{title}</h1>
          <p className={s.legalLead}>{introduction}</p>
          <dl className={s.legalDates}>
            <div>
              <dt>Effective</dt>
              <dd>{LEGAL_EFFECTIVE_DATE}</dd>
            </div>
            <div>
              <dt>Last updated</dt>
              <dd>{LEGAL_EFFECTIVE_DATE}</dd>
            </div>
          </dl>
        </header>
        <article className={s.legalArticle}>{children}</article>
      </main>
      <PublicFooter />
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
