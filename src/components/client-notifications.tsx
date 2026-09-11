"use client";

import { Bell, Check, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { PendingLink } from "./pending-link";
import type { ClientResultsData } from "@/lib/client-results";
import { ResultsRetry } from "./results-feedback";

type Notice = { id: string; title: string; href: string; source: string };
type Feed = {
  scope: string;
  items: Notice[];
  unavailable: boolean;
  loaded: string[];
};
const NotificationContext = createContext<{
  feed: Feed | null;
  setFeed: (feed: Feed) => void;
} | null>(null);
export function ClientNotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [feed, updateFeed] = useState<Feed | null>(null);
  const setFeed = useCallback(
    (incoming: Feed) =>
      updateFeed((previous) => ({
        ...incoming,
        items: [
          ...(previous?.scope === incoming.scope
            ? previous.items.filter(
                (item) => !incoming.loaded.includes(item.source),
              )
            : []),
          ...incoming.items,
        ],
      })),
    [],
  );
  return (
    <NotificationContext.Provider value={{ feed, setFeed }}>
      {children}
    </NotificationContext.Provider>
  );
}
export function NotificationFeed({ data }: { data: ClientResultsData }) {
  const setFeed = useContext(NotificationContext)?.setFeed;
  useEffect(() => {
    if (!setFeed) return;
    const items: Notice[] = [];
    if (!data.unavailableSources?.includes("leads"))
      for (const lead of data.leads.latest)
        items.push({
          id: `lead:${lead.id}`,
          title: `New enquiry · ${lead.service}`,
          href: "/client/leads",
          source: "leads",
        });
    if (data.report)
      items.push({
        id: `report:${data.report.month}`,
        title: `${data.report.monthLabel} report available`,
        href: "/client/reports",
        source: "reports",
      });
    for (const opportunity of data.opportunities)
      items.push({
        id: `seo:${opportunity.keyword}:${opportunity.position}`,
        title: `SEO opportunity · ${opportunity.keyword}`,
        href: "/client/traffic?view=opportunities",
        source: "keywords",
      });
    const scope = data.isDemo ? "demo:abc-interiors" : data.scope;
    if (scope)
      setFeed({
        scope,
        items,
        unavailable: Boolean(data.unavailableSources?.length),
        loaded: (data.loadedSources ?? ["leads", "reports", "keywords"]).filter(
          (source) => !data.unavailableSources?.includes(source),
        ),
      });
  }, [data, setFeed]);
  return null;
}
export function ClientNotifications() {
  const context = useContext(NotificationContext);
  const [open, setOpen] = useState(false);
  const [waitExpired, setWaitExpired] = useState(false);
  const [read, setRead] = useState<Record<string, string[]>>({});
  const root = useRef<HTMLDivElement>(null),
    toggle = useRef<HTMLButtonElement>(null);
  const feed = context?.feed,
    scope = feed?.scope;
  useEffect(() => {
    if (feed) return;
    const timer = setTimeout(() => setWaitExpired(true), 10000);
    return () => clearTimeout(timer);
  }, [feed]);
  useEffect(() => {
    if (!scope) return;
    try {
      const value = JSON.parse(
        localStorage.getItem(`growth-read:${scope}`) ?? "[]",
      );
      if (Array.isArray(value))
        queueMicrotask(() =>
          setRead((current) => ({
            ...current,
            [scope]: value.filter((v) => typeof v === "string"),
          })),
        );
    } catch {
      /* Reading remains available when storage is blocked. */
    }
  }, [scope]);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", escape);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);
  const readIds = scope ? (read[scope] ?? []) : [];
  const unread = feed?.items.filter((i) => !readIds.includes(i.id)).length ?? 0;
  const mark = (ids: string[]) => {
    if (!scope) return;
    const next = [...new Set([...readIds, ...ids])].slice(-200);
    setRead((current) => ({ ...current, [scope]: next }));
    try {
      localStorage.setItem(`growth-read:${scope}`, JSON.stringify(next));
    } catch {
      /* Read state remains usable for this session. */
    }
  };
  return (
    <div className="client-notifications" ref={root}>
      <button
        ref={toggle}
        className="icon-button"
        type="button"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        aria-controls="client-notification-panel"
        onClick={() => setOpen(!open)}
      >
        <Bell size={18} />
        {unread > 0 && <span className="notification-count">{unread}</span>}
      </button>
      {open && (
        <section
          id="client-notification-panel"
          className="notification-panel"
          aria-label="Notifications"
        >
          <header>
            <h2>Notifications</h2>
            <button
              type="button"
              aria-label="Close notifications"
              onClick={() => {
                setOpen(false);
                toggle.current?.focus();
              }}
            >
              <X size={18} />
            </button>
          </header>
          {!feed ? (
            waitExpired ? (
              <ResultsRetry label="Workspace updates could not be loaded." />
            ) : (
              <p role="status">Your workspace updates are loading…</p>
            )
          ) : (
            <>
              {feed.unavailable && (
                <ResultsRetry label="Some workspace updates are temporarily unavailable." />
              )}
              {feed.items.length === 0 ? (
                <p>
                  {feed.unavailable
                    ? "No updates could be verified."
                    : "You’re all caught up. New workspace updates will appear here."}
                </p>
              ) : (
                <>
                  <button
                    className="mark-all"
                    type="button"
                    disabled={!unread}
                    onClick={() => mark(feed.items.map((i) => i.id))}
                  >
                    Mark all read
                  </button>
                  <ul>
                    {feed.items.map((item) => (
                      <li
                        key={item.id}
                        className={
                          readIds.includes(item.id) ? "read" : "unread"
                        }
                      >
                        <PendingLink
                          href={item.href}
                          onClick={() => {
                            mark([item.id]);
                            setOpen(false);
                          }}
                        >
                          {item.title}
                        </PendingLink>
                        <button
                          type="button"
                          aria-label={`Mark read: ${item.title}`}
                          disabled={readIds.includes(item.id)}
                          onClick={() => mark([item.id])}
                        >
                          <Check size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
          <footer>Read status is saved in this browser.</footer>
        </section>
      )}
    </div>
  );
}
