import type { ClientResultsData } from "@/lib/client-results";
import { publishedHistory, todayMetrics } from "@/lib/today-dashboard";
import { leadComparison } from "@/lib/client-presentation";
import { resultHref } from "@/lib/result-consistency";
import { PendingLink } from "./pending-link";
import { NotificationFeed } from "./client-notifications";
import {
  TodayHeader,
  TodaySurface,
  GrowthOverview,
} from "./today-dashboard-controls";
import {
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Search,
  Globe,
  Users,
  MousePointer2,
  ClipboardCheck,
  History,
  FileText,
} from "lucide-react";

const number = (value: number) => value.toLocaleString("en");
function Change({ value }: { value: number | null }) {
  return value === null ? (
    <span className="today-muted">Comparison unavailable</span>
  ) : (
    <span className={value < 0 ? "today-change negative" : "today-change"}>
      {value < 0 ? <ArrowDown size={13} /> : <ArrowUp size={13} />}
      {Math.abs(value)}% <span>vs previous period</span>
    </span>
  );
}

export function AgentToday({ data }: { data: ClientResultsData }) {
  const metrics = todayMetrics(data);
  const focus = data.opportunities[0];
  const href = (path: string, view?: string) =>
    resultHref(path, data, view ? { view } : {});
  const reportWork = (data.report?.work ?? []).filter(
    (item) => /seo|website|blog/i.test(item) && !/social|paid ad/i.test(item),
  );
  return (
    <TodaySurface>
      <NotificationFeed data={data} />
      <TodayHeader
        data={{
          clientName: data.clientName,
          periodLabel: data.periodLabel,
          rangeKey: data.rangeKey,
          rangeStart: data.rangeStart,
          rangeEnd: data.rangeEnd,
          updatedAt: data.updatedAt,
          isDemo: data.isDemo,
        }}
      />
      <div className="today-kpis" aria-label="Performance snapshot">
        <article>
          <div className="today-kpi-label">
            <span>Website visitors</span>
            <Globe size={16} />
          </div>
          <strong>
            {metrics.trafficAvailable ? number(data.traffic.visitors) : "—"}
          </strong>
          {metrics.trafficAvailable ? (
            <Change value={data.traffic.growth} />
          ) : (
            <span className="today-muted">No measurements yet</span>
          )}
        </article>
        <article>
          <div className="today-kpi-label">
            <span>Organic clicks</span>
            <MousePointer2 size={16} />
          </div>
          <strong>
            {metrics.searchAvailable ? number(data.search.clicks) : "—"}
          </strong>
          <span className="today-muted">
            {metrics.searchAvailable
              ? `${number(data.search.impressions)} Google impressions`
              : "No measurements yet"}
          </span>
        </article>
        <article>
          <div className="today-kpi-label">
            <span>Enquiries</span>
            <MessageSquare size={16} />
          </div>
          <strong>{number(data.leads.total)}</strong>
          <Change value={data.leads.growth} />
        </article>
        <article>
          <div className="today-kpi-label">
            <span>Qualified enquiries</span>
            <Users size={16} />
          </div>
          <strong>{number(data.leads.qualified)}</strong>
          <span className="today-muted">
            {metrics.qualificationRate === null
              ? "No enquiries this period"
              : `${metrics.qualificationRate}% of enquiries`}
          </span>
        </article>
      </div>
      <div className="today-grid">
        <section
          className="today-agent today-card"
          aria-labelledby="today-agent-title"
        >
          <div className="today-agent-identity">
            <span className="today-agent-mark" aria-hidden="true">
              G
            </span>
            <div>
              <h2 id="today-agent-title">Your Growth Agent</h2>
              <span>Your next growth priority</span>
            </div>
          </div>
          <h3>
            {focus
              ? "A step closer to page one"
              : "Let’s find your next opportunity"}
          </h3>
          <p>
            {focus
              ? `“${focus.keyword}” is ranking around position ${Math.round(focus.position)}. Start with this page to strengthen your Google visibility.`
              : "Review your latest results with your agent and decide where to focus next."}
          </p>
          <div className="today-agent-signal">
            <Search size={15} />
            <strong>{data.opportunities.length}</strong> SEO{" "}
            {data.opportunities.length === 1 ? "opportunity" : "opportunities"}{" "}
            to explore
          </div>
          <div className="today-agent-actions">
            <PendingLink
              className="dossier-primary"
              href={href("/client/agent")}
            >
              Talk to Agent <ArrowUpRight size={16} />
            </PendingLink>
            <a href="#today-attention">View findings</a>
          </div>
        </section>
        <section
          className="today-attention"
          id="today-attention"
          aria-labelledby="today-attention-title"
        >
          <div className="today-section-heading">
            <h2 id="today-attention-title">Needs your attention</h2>
            <span>
              {data.opportunities.length
                ? `${data.opportunities.length} opportunities`
                : "Latest findings"}
            </span>
          </div>
          <div className="today-findings">
            {data.opportunities.length ? (
              data.opportunities.slice(0, 3).map((item) => (
                <article
                  className="today-card today-finding"
                  key={item.keyword}
                >
                  <h3>{item.keyword}</h3>
                  <div className="today-finding-meta">
                    <span>
                      <Search size={13} />
                      SEO
                    </span>
                    <span>
                      Position <strong>{item.position}</strong>
                    </span>
                  </div>
                  <p>
                    {item.position <= 15
                      ? "Close to page one. Review the page content to help more customers discover your business."
                      : "A visibility opportunity. Review how this page answers your customers’ searches."}
                  </p>
                  <div className="today-finding-footer">
                    <span className="today-status">For review</span>
                    <PendingLink href={href("/client/seo", "opportunities")}>
                      Review evidence <ArrowUpRight size={15} />
                    </PendingLink>
                  </div>
                </article>
              ))
            ) : (
              <div className="today-card today-empty">
                <Search size={23} />
                <h3>No keyword opportunities recorded yet</h3>
                <p>
                  Your latest search results will help identify where to focus.
                </p>
                <PendingLink href={href("/client/seo")}>
                  Review Google results <ArrowUpRight size={15} />
                </PendingLink>
              </div>
            )}
          </div>
        </section>
        <GrowthOverview
          traffic={publishedHistory(data.reports, data.rangeEnd, "users")}
          google={publishedHistory(data.reports, data.rangeEnd, "clicks")}
          period={data.periodLabel}
          enquiries={data.leads.total}
        />
        <section
          className="today-results today-card"
          aria-labelledby="today-results-title"
        >
          <div className="today-section-heading">
            <h2 id="today-results-title">Your results</h2>
            <PendingLink
              href={href("/client/results")}
              aria-label="View full results"
            >
              <ArrowUpRight size={18} />
            </PendingLink>
          </div>
          <p className="today-period-note">{data.periodLabel}</p>
          <div className="today-result-stats">
            <div>
              <strong>
                {metrics.searchAvailable
                  ? number(data.search.impressions)
                  : "—"}
              </strong>
              <span>Google impressions</span>
            </div>
            <div>
              <strong>{number(metrics.websiteEnquiries)}</strong>
              <span>Website enquiries</span>
            </div>
          </div>
          <div className="today-progress">
            <h3>Enquiry progress</h3>
            {data.leads.previousTotal != null && !data.isDemo ? (
              <>
                <div className="today-progress-labels">
                  <span>
                    Previous <b>{number(data.leads.previousTotal)}</b>
                  </span>
                  <span>
                    Current <b>{number(data.leads.total)}</b>
                  </span>
                </div>
                <div className="today-comparison-bars" aria-hidden="true">
                  <span
                    style={{
                      width: `${(data.leads.previousTotal / Math.max(1, data.leads.previousTotal, data.leads.total)) * 100}%`,
                    }}
                  />
                  <span
                    style={{
                      width: `${(data.leads.total / Math.max(1, data.leads.previousTotal, data.leads.total)) * 100}%`,
                    }}
                  />
                </div>
                <p>
                  {leadComparison(data.leads).replace("leads", "enquiries")}
                </p>
              </>
            ) : (
              <p>
                {number(data.leads.total)} enquiries recorded. A previous-period
                baseline is not available.
              </p>
            )}
          </div>
          <PendingLink
            className="today-text-link"
            href={href("/client/results")}
          >
            View full results <ArrowUpRight size={15} />
          </PendingLink>
        </section>
        <section
          className="today-actions today-card"
          aria-labelledby="today-actions-title"
        >
          <h2 id="today-actions-title">Actions prepared for you</h2>
          <div className="today-empty">
            <ClipboardCheck size={26} />
            <h3>Your next actions will appear here</h3>
            <p>
              Prepared recommendations are not available in this workspace yet.
              Talk to your agent about what you’d like to improve.
            </p>
            <PendingLink href={href("/client/agent")}>
              Discuss an improvement <ArrowUpRight size={15} />
            </PendingLink>
          </div>
        </section>
        <section
          className="today-conversations today-card"
          aria-labelledby="today-conversations-title"
        >
          <h2 id="today-conversations-title">Customer conversations</h2>
          <div className="today-conversation-count">
            <strong>{number(metrics.conversationEnquiries)}</strong>
            <span>
              enquiries from WhatsApp
              <br />
              and website chat
            </span>
          </div>
          <p>
            Conversation threads and customer-topic insights are not connected
            yet.
          </p>
          <PendingLink
            className="today-text-link"
            href={href("/client/conversations")}
          >
            Review conversations <ArrowUpRight size={15} />
          </PendingLink>
        </section>
        <section
          className="today-activity today-card"
          aria-labelledby="today-activity-title"
        >
          <h2 id="today-activity-title">Agent activity</h2>
          <p className="today-activity-note">
            <History size={18} />
            An agent activity feed is not available yet.
          </p>
          {reportWork.length ? (
            <>
              <h3>From your published report</h3>
              <ul className="today-report-work">
                {reportWork.slice(0, 3).map((item) => (
                  <li key={item}>
                    <FileText size={15} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <span className="today-period-note">
                {data.report?.monthLabel} · team-reported work
              </span>
            </>
          ) : (
            <p>
              Recorded updates will appear here when available. No scans or
              completed actions are assumed.
            </p>
          )}
          <PendingLink
            className="today-text-link"
            href={href("/client/reports")}
          >
            View published reports <ArrowUpRight size={15} />
          </PendingLink>
        </section>
      </div>
      <details className="today-evidence">
        <summary>About these results</summary>
        <p>
          {data.isDemo
            ? "Demo totals and reports are illustrative. "
            : `Source sync: ${data.updatedAt}. `}
          Enquiries use recorded leads and qualification status. Visitors are
          imported daily user totals, not deduplicated people across the whole
          period. Google figures use imported Search Console records. Rankings
          are the latest recorded positions and may differ from the selected
          period. Monthly charts use available published reports through the
          selected end month, separately from selected-period totals. Missing
          history, activity and approvals are not inferred.
        </p>
      </details>
    </TodaySurface>
  );
}
