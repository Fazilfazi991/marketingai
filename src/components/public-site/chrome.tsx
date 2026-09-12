import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Menu } from "lucide-react";
import s from "./public-site.module.css";

export function Wordmark() {
  return (
    <Link
      href="/"
      className={s.wordmark}
      aria-label="Gro by Fusion Ventures home"
    >
      <Image
        alt=""
        className={s.wordmarkImage}
        height={941}
        sizes="(max-width: 600px) 112px, 148px"
        src="/gro-logo.png"
        width={1672}
      />
    </Link>
  );
}
export function GrowthCTA({ className }: { className?: string } = {}) {
  return (
    <Link className={className ?? s.cta} href="/#contact">
      Get My Growth Agent <ArrowUpRight size={17} aria-hidden="true" />
    </Link>
  );
}
export const publicNavigation = [
  ["/#how-it-works", "How it works"],
  ["/#what-gro-does", "What Gro does"],
  ["/#why-gro", "Why Gro"],
  ["/#for-businesses", "For businesses"],
] as const;
export const publicClientLoginHref = "/login";
export function PublicHeader() {
  return (
    <header className={s.header}>
      <Wordmark />
      <nav className={s.desktopNav} aria-label="Main navigation">
        {publicNavigation.map(([href, label]) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
      </nav>
      <div className={s.headerActions}>
        <Link className={s.loginLink} href={publicClientLoginHref}>
          Client Login
        </Link>
        <GrowthCTA />
      </div>
      <details className={s.mobileMenu}>
        <summary aria-label="Open navigation">
          <Menu size={23} />
        </summary>
        <nav aria-label="Mobile navigation">
          {publicNavigation.map(([href, label]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
          <Link href="/#contact">Contact</Link>
          <Link href={publicClientLoginHref}>Client Login</Link>
        </nav>
      </details>
    </header>
  );
}
export function PublicFooter() {
  return (
    <footer className={s.footer}>
      <div>
        <Wordmark />
        <p>
          Your AI-powered Growth Agent
          <br />
          for digital business growth.
        </p>
      </div>
      <nav aria-label="Footer navigation">
        <Link href="/#how-it-works">How it works</Link>
        <Link href="/#what-gro-does">What Gro does</Link>
        <Link href="/#contact">Contact</Link>
        <Link href={publicClientLoginHref}>Client Login</Link>
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/terms">Terms</Link>
      </nav>
      <div className={s.footerBottom}>
        <span>A Fusion Ventures service.</span>
        <span>AI-powered. Human-backed.</span>
      </div>
    </footer>
  );
}
