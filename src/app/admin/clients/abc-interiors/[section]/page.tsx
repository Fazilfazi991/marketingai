import { AppShell } from "@/components/app-shell"; import { ClientWorkspace } from "@/components/client-workspace";
export default async function ABCSection({params}:{params:Promise<{section:string}>}){const {section}=await params;return <AppShell role="admin" title="Client workspace" subtitle="ABC Interiors · operational detail"><ClientWorkspace section={section}/></AppShell>}
