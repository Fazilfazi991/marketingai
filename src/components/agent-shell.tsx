"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  House,
  MessageSquare,
  Globe,
  Search,
  Ellipsis,
  MessagesSquare,
  ChartNoAxesCombined,
  X,
} from "lucide-react";
import { PendingLink } from "./pending-link";
import { ClientNotifications } from "./client-notifications";
import { Brand } from "./brand";
import { signOut } from "@/app/auth/actions";
const items = [
  { label: "Today", mobile: "Today", href: "/client", icon: House },
  {
    label: "Ask Agent",
    mobile: "Agent",
    href: "/client/agent",
    icon: MessageSquare,
  },
  { label: "Website", mobile: "Website", href: "/client/website", icon: Globe },
  { label: "SEO & Google", mobile: "SEO", href: "/client/seo", icon: Search },
  {
    label: "Conversations",
    mobile: "Conversations",
    href: "/client/conversations",
    icon: MessagesSquare,
  },
  {
    label: "Results",
    mobile: "Results",
    href: "/client/results",
    icon: ChartNoAxesCombined,
  },
];
export function AgentShell({ children }: { children: React.ReactNode }) {
  const path = usePathname(),
    [more, setMore] = useState(false);
  const moreButton = useRef<HTMLButtonElement>(null);
  const activePath =
    path === "/client/traffic"
      ? "/client/seo"
      : path === "/client/leads"
        ? "/client/conversations"
        : path === "/client/reports"
          ? "/client/results"
          : path;
  useEffect(() => {
    if (!more) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMore(false);
        moreButton.current?.focus();
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [more]);
  const link = (item: (typeof items)[number], mobile = false) => (
    <PendingLink
      key={item.href}
      href={item.href}
      aria-current={activePath === item.href ? "page" : undefined}
      onClick={() => setMore(false)}
    >
      <item.icon size={19} />
      <span>{mobile ? item.mobile : item.label}</span>
    </PendingLink>
  );
  return (
    <div className="client-shell dossier-shell">
      <a href="#dossier-content" className="dossier-skip">
        Skip to workspace
      </a>
      <aside className="dossier-sidebar">
        <Brand />
        <p>Your growth workspace</p>
        <nav aria-label="Client navigation">
          {items.map((item) => link(item))}
        </nav>
        <form action={signOut}>
          <button type="submit">Sign out</button>
        </form>
      </aside>
      <div className="dossier-main">
        <header className="dossier-topbar">
          <span>
            Gro <span className="dossier-topbar-note">/ Your workspace</span>
          </span>
          <ClientNotifications />
        </header>
        <main id="dossier-content" className="dossier-content">
          {children}
        </main>
      </div>
      <nav className="dossier-bottom-nav" aria-label="Mobile navigation">
        {items.slice(0, 4).map((item) => link(item, true))}
        <button
          ref={moreButton}
          type="button"
          aria-expanded={more}
          aria-controls="dossier-more"
          onClick={() => setMore(!more)}
        >
          <Ellipsis size={20} />
          <span>More</span>
        </button>
      </nav>
      {more && (
        <section
          id="dossier-more"
          className="dossier-more"
          aria-label="More navigation"
        >
          <header>
            <h2>Your workspace</h2>
            <button
              type="button"
              aria-label="Close more navigation"
              onClick={() => {
                setMore(false);
                moreButton.current?.focus();
              }}
            >
              <X size={20} />
            </button>
          </header>
          {items.slice(4).map((item) => link(item))}
          <form action={signOut}>
            <button type="submit">Sign out</button>
          </form>
        </section>
      )}
    </div>
  );
}
