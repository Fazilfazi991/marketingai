import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ClientWorkspace } from "@/components/client-workspace";
import { loadAdminClient } from "@/lib/admin-data";
import { isDemoMode } from "@/lib/demo-mode";

export default async function ClientPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = await loadAdminClient(slug);
  if (client === null) notFound();
  return <AppShell role="admin" title="Client workspace" subtitle={`${client?.name ?? "ABC Interiors"} · operational detail`}><ClientWorkspace section="overview" initial={client} live={!isDemoMode()} /></AppShell>;
}
