import { AppShell } from "@/components/app-shell"; import { AutomationDashboard } from "@/components/automation-dashboard";
export default function AutomationsPage(){return <AppShell role="admin" title="Automations" subtitle="Workflow health, schedules, runs and failures across every client."><AutomationDashboard/></AppShell>}
