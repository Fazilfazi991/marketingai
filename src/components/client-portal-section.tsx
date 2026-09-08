"use client";

import { Check, Download } from "lucide-react";
import type { ClientResultsData } from "@/lib/client-results";
import { Panel } from "./ui";

export function ClientPortalSection({ data }: { data: ClientResultsData }) {
  const report = data.report;
  if (!report) return <Panel title="Monthly reports" meta="Published reports only"><div className="empty-state"><b>No report has been published for {data.periodLabel}.</b><p>Your Growth1000 partner will publish the verified monthly summary here when it is ready.</p></div></Panel>;
  return <>
    <div className="report-hero"><div><span>{data.periodLabel} · {data.isDemo ? "Demo preview" : "Published"}</span><h2>Your monthly growth report</h2><p>{report.summary}</p></div><button className="button secondary" onClick={() => window.print()}><Download size={14} />Print / save PDF</button></div>
    <div className="client-kpis"><div><span>Website users</span><b>{report.users.toLocaleString()}</b><small>{data.isDemo ? "Demo" : "Verified result"}</small></div><div><span>Search clicks</span><b>{report.clicks.toLocaleString()}</b><small>{data.isDemo ? "Demo" : "Verified result"}</small></div><div><span>Social posts</span><b>{report.posts}</b><small>published this month</small></div></div>
    <div className="client-grid"><Panel title="Work completed" meta={`${data.periodLabel} delivery`}><div className="report-list">{report.work.map(item => <div key={item}><Check size={14} />{item}</div>)}</div></Panel><Panel title="Next month focus" meta="Partner recommendation"><div className="panel-body"><p className="report-copy">{report.nextFocus}</p></div></Panel></div>
  </>;
}
