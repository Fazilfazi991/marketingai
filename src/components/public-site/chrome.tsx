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
    <Link className={className ?? s.cta} href="/contact">
      Get My Growth Agent <ArrowUpRight size={17} aria-hidden="true" />
    </Link>
  );
}
export const publicNavigation = [
  ["/how-it-works", "How It Works"],
  ["/what-gro-does", "What Gro Does"],
  ["/about", "About"],
  ["/for-businesses", "For Businesses"],
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
          <Link href="/contact">Contact</Link>
          <Link href={publicClientLoginHref}>Client Login</Link>
          <GrowthCTA />
        </nav>
      </details>
    </header>
  );
}
export function PublicFooter() {
  return (
    <footer className={s.footer}>
      <div className={s.footerBrand}>
        <Wordmark />
        <p>
          Your AI-powered Growth Agent
          <br />
          for digital business growth.
        </p>
      </div>
      <div className={s.footerLinks}>
        <nav aria-label="Explore Gro">
          <strong>Explore</strong>
          <Link href="/how-it-works">How It Works</Link>
          <Link href="/what-gro-does">What Gro Does</Link>
          <Link href="/for-businesses">For Businesses</Link>
          <Link href="/about">About</Link>
        </nav>
        <nav aria-label="Contact Gro">
          <strong>Contact</strong>
          <Link href="/contact">Contact Gro</Link>
          <Link href={publicClientLoginHref}>Client Login</Link>
        </nav>
        <nav aria-label="Legal">
          <strong>Legal</strong>
          <Link href="/privacy">Privacy Policy</Link>
          <Link href="/terms">Terms of Service</Link>
        </nav>
      </div>
      <div className={s.footerBottom}>
        <span>A Fusion Ventures service.</span>
        <span>AI-powered. Human-backed.</span>
      </div>
    </footer>
  );
}
