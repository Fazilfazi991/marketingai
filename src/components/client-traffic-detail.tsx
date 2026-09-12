"use client";
import { ArrowRight, Info, Target } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ClientResultsData } from "@/lib/client-results";
import {
  keywordCounts,
  keywordMovement,
  pageLabel,
} from "@/lib/result-consistency";
import { ClientPageHeader } from "./client-page-header";
import { ClientMetricGrid } from "./client-metric-grid";
import { InteractiveTrendChart } from "./interactive-results-charts";
type DetailView = "overview" | "keywords" | "pages" | "opportunities";

export function ClientTrafficDetail({ data }: { data: ClientResultsData }) {
  const params = useSearchParams(),
    requested = params.get("view");
  const view: DetailView =
    requested === "keywords" ||
    requested === "pages" ||
    requested === "opportunities"
      ? requested
      : "overview";
  const href = (next: DetailView) => {
    const query = new URLSearchParams(params.toString());
    if (next === "overview") query.delete("view");
    else query.set("view", next);
    return `/client/traffic${query.size ? `?${query}` : ""}`;
  };
  const { improved, declined, stable } = keywordCounts(data.search.keywords);
  return (
    <>
      <ClientPageHeader data={data} title="Traffic & SEO" />
      <nav className="detail-tabs" aria-label="Traffic and SEO sections">
        {(
          ["overview", "keywords", "pages", "opportunities"] as DetailView[]
        ).map((item) => (
          <Link
            key={item}
            href={href(item)}
            prefetch={false}
            onClick={(event) => {
              if (
                event.button !== 0 ||
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              )
                return;
              event.preventDefault();
              window.history.pushState(null, "", href(item));
            }}
            aria-current={view === item ? "page" : undefined}
          >
            {item[0].toUpperCase() + item.slice(1)}
          </Link>
        ))}
      </nav>
      {(!data.traffic.connected || !data.search.connected) && (
        <details className="client-status-banner">
          <summary>
            <Info size={16} />
            <span>Some analytics sources aren’t connected yet</span>
            <b>View status</b>
          </summary>
          <div>
            <p>
              Website analytics:{" "}
              {data.traffic.connected ? "Connected" : "Not connected"}
            </p>
            <p>
              Google Search:{" "}
              {data.search.connected ? "Connected" : "Not connected"}
            </p>
            <p>
              Only successfully synced results are shown. Contact your Fusion
              Ventures team to connect a source.
            </p>
          </div>
        </details>
      )}
      {view === "overview" && (
        <>
          <ClientMetricGrid
            label="Traffic and search metrics"
            items={[
              {
                label: "Website visitors",
                value: data.traffic.visitors,
                note: "Verified users",
              },
              {
                label: "New visitors",
                value: data.traffic.newVisitors,
                note: "First-time visitors",
              },
              {
                label: "Page views",
                value: data.traffic.pageViews,
                note: "Sitewide",
              },
              {
                label: "Organic clicks",
                value: data.search.clicks,
                note: "Google Search",
              },
              {
                label: "Impressions",
                value: data.search.impressions,
                note: "Google Search",
              },
            ]}
          />
          <div className="detail-chart-grid">
            <section>
              <header>
                <h2>Visitor trend</h2>
                <span>Published history</span>
              </header>
              {data.traffic.trend?.length ? (
                <InteractiveTrendChart
                  unit="Visitors"
                  height={170}
                  data={data.traffic.trend}
                />
              ) : (
                <p>No historical data available.</p>
              )}
            </section>
            <section>
              <header>
                <h2>Organic-click trend</h2>
                <span>Published history</span>
              </header>
              {data.search.trend?.length ? (
                <InteractiveTrendChart
                  unit="Organic clicks"
                  height={170}
                  data={data.search.trend}
                />
              ) : (
                <p>No historical data available.</p>
              )}
            </section>
          </div>
        </>
      )}
      {view === "keywords" && (
        <section className="detail-surface">
          <header>
            <div>
              <span>Keyword movement</span>
              <h2>{data.search.keywords.length} published keyword results</h2>
            </div>
            <p>
              {improved} improved · {declined} declined · {stable} stable
            </p>
          </header>
          <p className="detail-data-note">
            Latest available ranking snapshot, not date-filtered history.
            Query-level clicks, impressions and CTR are not supplied by this
            published dataset.
          </p>
          <div className="keyword-table client-keyword-table">
            <div>
              <span>Keyword</span>
              <span>Previous</span>
              <span>Current</span>
            </div>
            {data.search.keywords.length ? (
              data.search.keywords.map((item) => (
                <div key={item.keyword}>
                  <b>
                    {item.keyword}
                    <small
                      className={`keyword-movement ${keywordMovement(item).toLowerCase()}`}
                    >
                      {keywordMovement(item)}
                      {keywordMovement(item) !== "Unavailable" &&
                      keywordMovement(item) !== "Stable"
                        ? ` · ${Math.abs(item.previous - item.current).toFixed(1)} positions`
                        : ""}
                    </small>
                  </b>
                  <span>{item.comparable === false ? "—" : item.previous}</span>
                  <strong>
                    {item.current}{" "}
                    {keywordMovement(item) === "Improved"
                      ? "↑"
                      : keywordMovement(item) === "Declined"
                        ? "↓"
                        : ""}
                  </strong>
                </div>
              ))
            ) : (
              <div>
                <b>No ranking data published yet</b>
                <span>—</span>
                <strong>—</strong>
              </div>
            )}
          </div>
        </section>
      )}
      {view === "pages" && (
        <section className="detail-surface">
          <header>
            <div>
              <span>Top pages</span>
              <h2>Traffic and attributable leads</h2>
            </div>
          </header>
          <div className="top-pages">
            <div>
              <span>Page</span>
              <span>Visitors</span>
              <span>Leads</span>
            </div>
            {data.topPages.length ? (
              data.topPages.map((item) => (
                <div key={item.page}>
                  <b>{pageLabel(item.page)}</b>
                  <span>{item.visitors.toLocaleString()}</span>
                  <strong>{item.leads}</strong>
                </div>
              ))
            ) : (
              <div>
                <b>No page data published yet</b>
                <span>—</span>
                <strong>—</strong>
              </div>
            )}
          </div>
        </section>
      )}
      {view === "opportunities" && (
        <section className="detail-surface">
          <header>
            <div>
              <span>SEO opportunities</span>
              <h2>Verified growth priorities</h2>
            </div>
          </header>
          <div className="detail-opportunities">
            {data.opportunities.length ? (
              data.opportunities.map((item) => (
                <article key={item.keyword}>
                  <Target size={18} />
                  <div>
                    <b>{item.keyword}</b>
                    <span>Current position {item.position}</span>
                    <p>{item.note}</p>
                  </div>
                </article>
              ))
            ) : (
              <p>No verified opportunities are available yet.</p>
            )}
          </div>
          {data.nextFocus.length > 0 && (
            <div className="detail-focus">
              <b>Next focus</b>
              {data.nextFocus.map((item) => (
                <span key={item}>
                  {item}
                  <ArrowRight size={13} />
                </span>
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}
