export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { ClientRouteShell } from "@/components/client-route-shell";

export const metadata: Metadata = {
  title: "Your Growth Agent workspace",
  description: "Your Gro Growth Agent workspace.",
  robots: { index: false, follow: false },
};

export default function ClientLayout({ children }: LayoutProps<"/client">) {
  return <ClientRouteShell>{children}</ClientRouteShell>;
}
