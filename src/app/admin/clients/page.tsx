import { AppShell } from "@/components/app-shell"; import { ClientManager } from "@/components/client-manager"; import {loadAdminClients} from "@/lib/admin-data";
export default async function Clients(){const clients=await loadAdminClients();return <AppShell role="admin" title="Clients" subtitle="Manage service scope, access and delivery health."><ClientManager initial={clients}/></AppShell>}
