"use client";
import { AgentShell } from "./agent-shell";
import { ClientNotificationProvider } from "./client-notifications";
import { ClientRangeProvider } from "./client-range-state";

export function ClientRouteShell({ children }: { children: React.ReactNode }) {
  return (
    <ClientNotificationProvider>
      <ClientRangeProvider>
        <AgentShell>{children}</AgentShell>
      </ClientRangeProvider>
    </ClientNotificationProvider>
  );
}
