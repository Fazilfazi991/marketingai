"use client";

import { Check, Download } from "lucide-react";
import { useReports } from "@/lib/report-store";
import { Panel } from "./ui";

export function ClientPortalSection() {
  const { reports } = useReports();
  const report = reports.find(item => item.status === "Published") ?? reports[0];
  return <>
    <div className="report-hero"><div><span>{report.month} · {report.source}</span><h2>Your monthly growth report</h2><p>{report.summary}</p></div><button className="button secondary" onClick={() => window.print()}><Download size={14} />Print / save PDF</button></div>
    {report.status !== "Published" && <div className="client-alert"><div><b>Demo report preview</b><p>The partner has not published this report yet. Production clients only receive published reports.</p></div></div>}
    <div className="client-kpis"><div><span>Website users</span><b>{report.users.toLocaleString()}</b><small>{report.source} · +{report.userChange}%</small></div><div><span>Search clicks</span><b>{report.clicks}</b><small>{report.source} · +{report.clickChange}%</small></div><div><span>Social posts</span><b>{report.posts}</b><small>9 delivered</small></div></div>
    <div className="client-grid"><Panel title="Work completed" meta={`${report.month} delivery`}><div className="report-list">{report.work.map(item => <div key={item}><Check size={14} />{item}</div>)}</div></Panel><Panel title="Next month focus" meta="Partner recommendation"><div className="panel-body"><p className="report-copy">{report.nextFocus}</p></div></Panel></div>
  </>;
}
