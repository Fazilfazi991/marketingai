export const dynamic = "force-dynamic";
import { ClientRouteShell } from "@/components/client-route-shell";

export default function ClientLayout({ children }: LayoutProps<"/client">) {
  return <ClientRouteShell>{children}</ClientRouteShell>;
}
