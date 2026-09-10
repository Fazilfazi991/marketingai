"use client";
import { ArrowLeft, ArrowRight, Target } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ClientResultsData } from "@/lib/client-results";
import {
  keywordCounts,
  keywordMovement,
  pageLabel,
  resultHref,
} from "@/lib/result-consistency";
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
      <Link className="detail-back" href={resultHref("/client", data)}>
        <ArrowLeft size={14} /> Back to overview
      </Link>
      <nav className="detail-tabs" aria-label="Traffic and SEO sections">
        {(
          ["overview", "keywords", "pages", "opportunities"] as DetailView[]
        ).map((item) => (
          <Link
            key={item}
            href={href(item)}
            aria-current={view === item ? "page" : undefined}
          >
            {item[0].toUpperCase() + item.slice(1)}
          </Link>
        ))}
      </nav>
      {(!data.traffic.connected || !data.search.connected) && (
        <div className="empty-state">
          <b>Some analytics sources are not connected</b>
          <p>Only verified, successfully synced results are shown.</p>
        </div>
      )}
      {view === "overview" && (
        <>
          <div className="results-kpis five">
            <article>
              <span>Website visitors</span>
              <b>{data.traffic.visitors.toLocaleString()}</b>
              <small>verified users</small>
            </article>
            <article>
              <span>New visitors</span>
              <b>{data.traffic.newVisitors.toLocaleString()}</b>
              <small>first-time visitors</small>
            </article>
            <article>
              <span>Page views</span>
              <b>{data.traffic.pageViews.toLocaleString()}</b>
              <small>sitewide</small>
            </article>
            <article>
              <span>Organic clicks</span>
              <b>{data.search.clicks.toLocaleString()}</b>
              <small>Google Search</small>
            </article>
            <article>
              <span>Impressions</span>
              <b>{data.search.impressions.toLocaleString()}</b>
              <small>Google Search</small>
            </article>
          </div>
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
