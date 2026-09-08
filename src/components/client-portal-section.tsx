"use client";

import { Check, Download } from "lucide-react";
import { useState } from "react";
import type { ClientResultsData } from "@/lib/client-results";
import { Panel } from "./ui";

export function ClientPortalSection({ data }: { data: ClientResultsData }) {
  const [selectedMonth, setSelectedMonth] = useState(data.report?.month ?? data.reports[0]?.month ?? "");
  const report = data.reports.find(item => item.month === selectedMonth) ?? data.reports[0];
  if (!report) return <Panel title="Monthly reports" meta="Published reports only"><div className="empty-state"><b>No monthly report has been published yet.</b><p>Your Growth1000 partner will publish verified growth summaries here when they are ready.</p></div></Panel>;
  return <>
    <div className="report-toolbar"><div><label htmlFor="client-report-month">Report month</label><select id="client-report-month" value={report.month} onChange={event => setSelectedMonth(event.target.value)}>{data.reports.map(item => <option key={item.month} value={item.month}>{item.monthLabel}</option>)}</select></div></div>
    <div className="report-hero"><div><span>{report.monthLabel} · {data.isDemo ? "Demo preview" : "Published"}</span><h2>Your monthly growth report</h2><p>{report.summary}</p></div><button className="button secondary" onClick={() => window.print()}><Download size={14} />Print / save PDF</button></div>
    <div className="client-kpis"><div><span>Website users</span><b>{report.users.toLocaleString()}</b><small>{data.isDemo ? "Demo" : "Verified result"}</small></div><div><span>Search clicks</span><b>{report.clicks.toLocaleString()}</b><small>{data.isDemo ? "Demo" : "Verified result"}</small></div><div><span>Social posts</span><b>{report.posts}</b><small>published this month</small></div></div>
    <div className="client-grid"><Panel title="Work completed" meta={`${report.monthLabel} delivery`}><div className="report-list">{report.work.length ? report.work.map(item => <div key={item}><Check size={14} />{item}</div>) : <div>No completed work was included in this report.</div>}</div></Panel><Panel title="Next month focus" meta="Partner recommendation"><div className="panel-body"><p className="report-copy">{report.nextFocus}</p></div></Panel></div>
  </>;
}
