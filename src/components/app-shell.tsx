"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpenText,
  Building2,
  CalendarCheck2,
  ChartNoAxesCombined,
  ClipboardCheck,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Users,
  WandSparkles,
  X,
} from "lucide-react";
import { useState } from "react";
import { Brand } from "./brand";
import { signOut } from "@/app/auth/actions";
const nav = {
  admin: [
    ["Overview", "/admin", LayoutDashboard],
    ["Clients", "/admin/clients", Building2],
    ["Tasks", "/admin/tasks", ClipboardCheck],
    ["Content", "/admin/content", CalendarCheck2],
    ["Blogs", "/admin/blogs", BookOpenText],
    ["Approvals", "/admin/approvals", WandSparkles],
    ["SEO", "/admin/seo", Search],
    ["Analytics", "/admin/analytics", ChartNoAxesCombined],
    ["Reports", "/admin/reports", FileText],
    ["Assets", "/admin/assets", FolderOpen],
    ["Automations", "/admin/automations", Settings],
    ["Staff", "/admin/staff", Users],
  ],
  staff: [
    ["Posting queue", "/staff", CalendarCheck2],
    ["Issues", "/staff/issues", ClipboardCheck],
  ],
  client: [
    ["Overview", "/client", LayoutDashboard],
    ["Leads", "/client/leads", Users],
    ["Traffic & SEO", "/client/traffic", ChartNoAxesCombined],
    ["Reports", "/client/reports", FileText],
  ],
};
export function AppShell({
  role,
  children,
  title,
  subtitle,
  actions,
}: {
  role: keyof typeof nav;
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname(),
    [open, setOpen] = useState(false),
    demo = process.env.NODE_ENV === "development";
  const roleLabel =
      role === "admin"
        ? "Partner workspace"
        : role === "staff"
          ? "Publishing desk"
          : demo
            ? "ABC Interiors"
            : "Your results",
    viewerName = demo ? "Fazil" : "Signed-in user",
    viewerInitials = demo
      ? "FA"
      : role === "admin"
        ? "PA"
        : role === "staff"
          ? "ST"
          : "CL";
  return (
    <div className={`app-frame${role === "client" ? " client-shell" : ""}`}>
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-top">
          <Brand />
          <button
            className="icon-button mobile-only"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        <div className="workspace-pill">
          <span className="avatar small">
            {role === "client" ? (demo ? "AI" : "CL") : "G1"}
          </span>
          <span>
            <b>{roleLabel}</b>
            <small>
              {role === "client" ? "Results dashboard" : "Growth1000"}
            </small>
          </span>
        </div>
        <nav>
          {nav[role].map(([label, href, Icon]) => (
            <Link
              key={href as string}
              className={pathname === href ? "active" : ""}
              href={href as string}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              {label as string}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          {demo ? (
            <Link href="/">
              <Users size={18} />
              Switch demo role
            </Link>
          ) : (
            <form action={signOut}>
              <button className="sidebar-signout">
                <LogOut size={18} />
                Sign out
              </button>
            </form>
          )}
          <div className="user-card">
            <span className="avatar">{viewerInitials}</span>
            <span>
              <b>{viewerName}</b>
              <small>
                {role === "admin"
                  ? "Partner / Admin"
                  : role === "staff"
                    ? "Content staff"
                    : "Client account"}
              </small>
            </span>
          </div>
        </div>
      </aside>
      {open && (
        <button
          className="scrim"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        />
      )}
      <main className="app-main">
        <header className="topbar">
          <button
            className="icon-button mobile-only"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={19} />
          </button>
          <div
            className={`top-search${role === "client" ? " client-topbar-title" : ""}`}
          >
            <Search size={16} />
            <span>
              {role === "client"
                ? "Your growth results"
                : "Search clients, tasks, content…"}
            </span>
            <kbd>⌘ K</kbd>
          </div>
          <button className="icon-button">
            <Bell size={18} />
            <i />
          </button>
        </header>
        <div className="page">
          {role !== "client" && (
            <div className="page-heading">
              <div>
                <p className="eyebrow">
                  {role === "admin" ? "Operations" : roleLabel}
                </p>
                <h1>{title}</h1>
                {subtitle && <p>{subtitle}</p>}
              </div>
              {actions && <div className="heading-actions">{actions}</div>}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
