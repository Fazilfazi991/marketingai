import Link from "next/link";
import { ArrowUpRight, Menu } from "lucide-react";
import s from "./public-site.module.css";

export function Wordmark() {
  return (
    <Link
      href="/"
      className={s.wordmark}
      aria-label="Gro by Fusion Ventures home"
    >
      <strong>
        gro<span>↗</span>
      </strong>
      <small>by Fusion Ventures</small>
    </Link>
  );
}
export function GrowthCTA() {
  return (
    <a className={s.cta} href="#contact">
      Get My Growth Agent <ArrowUpRight size={17} aria-hidden="true" />
    </a>
  );
}
const links = [
  ["#how-it-works", "How it works"],
  ["#what-gro-does", "What Gro does"],
  ["#why-gro", "Why Gro"],
  ["#for-businesses", "For businesses"],
];
export function PublicHeader() {
  return (
    <header className={s.header}>
      <Wordmark />
      <nav className={s.desktopNav} aria-label="Main navigation">
        {links.map(([href, label]) => (
          <a key={href} href={href}>
            {label}
          </a>
        ))}
      </nav>
      <div className={s.headerActions}>
        <Link className={s.loginLink} href="/login">
          Client Login
        </Link>
        <GrowthCTA />
      </div>
      <details className={s.mobileMenu}>
        <summary aria-label="Open navigation">
          <Menu size={23} />
        </summary>
        <nav aria-label="Mobile navigation">
          {links.map(([href, label]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
          <a href="#contact">Contact</a>
          <Link href="/login">Client Login</Link>
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
        <a href="#how-it-works">How it works</a>
        <a href="#what-gro-does">What Gro does</a>
        <a href="#contact">Contact</a>
        <Link href="/login">Client Login</Link>
      </nav>
      <div className={s.footerBottom}>
        <span>A Fusion Ventures service.</span>
        <span>AI-powered. Human-backed.</span>
      </div>
    </footer>
  );
}
