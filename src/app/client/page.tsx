import { ClientOverviewStream } from "@/components/client-overview-stream";
import type { ResultRangeInput } from "@/lib/client-results";
export default async function Client({
  searchParams,
}: {
  searchParams: Promise<ResultRangeInput>;
}) {
  return <ClientOverviewStream query={await searchParams} />;
}
