import { loadClientResults } from "@/lib/client-results";
import { ClientTrafficDetail } from "@/components/client-traffic-detail";
export default async function Traffic({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  return (
    <ClientTrafficDetail
      data={await loadClientResults(await searchParams, "traffic")}
    />
  );
}
