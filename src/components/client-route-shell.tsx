"use client";
import { usePathname } from "next/navigation";
import { AppShell } from "./app-shell";
import { ClientNotificationProvider } from "./client-notifications";

export function ClientRouteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = pathname.endsWith("/leads")
    ? "Leads"
    : pathname.endsWith("/traffic")
      ? "Traffic & SEO"
      : pathname.endsWith("/reports")
        ? "Reports"
        : "Your growth results";
  return (
    <ClientNotificationProvider>
      <AppShell role="client" title={title}>
        {children}
      </AppShell>
    </ClientNotificationProvider>
  );
}
