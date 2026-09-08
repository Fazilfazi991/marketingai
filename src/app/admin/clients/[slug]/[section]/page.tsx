import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ClientWorkspace } from "@/components/client-workspace";
import { loadAdminClient } from "@/lib/admin-data";
import { isDemoMode } from "@/lib/demo-mode";

const sections = new Set(["business", "access", "scope", "social", "blogs", "seo", "website", "analytics", "leads", "reports", "tasks", "notes"]);

export default async function ClientSectionPage({ params }: { params: Promise<{ slug: string; section: string }> }) {
  const { slug, section } = await params;
  if (!sections.has(section)) notFound();
  const client = await loadAdminClient(slug);
  if (client === null) notFound();
  return <AppShell role="admin" title="Client workspace" subtitle={`${client?.name ?? "ABC Interiors"} · operational detail`}><ClientWorkspace section={section} initial={client} live={!isDemoMode()} /></AppShell>;
}
