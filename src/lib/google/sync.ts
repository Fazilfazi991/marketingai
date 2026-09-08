import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchGa4Report, fetchSearchConsoleReport } from "./analytics";
import { numeric } from "./normalize";
import { getGoogleAccessToken } from "./service-account";

type SyncSource = "google_analytics" | "search_console";
type Integration = {
  id: string;
  provider: SyncSource;
  external_reference: string | null;
  configuration: unknown;
};
type Config = { propertyId?: string; siteUrl?: string };
const dayFromGa = (value: string | undefined) =>
  value && /^\d{8}$/.test(value)
    ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6)}`
    : "";
const configOf = (value: unknown): Config =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Config)
    : {};

async function recordImport(
  supabase: SupabaseClient,
  clientId: string,
  source: SyncSource,
  property: string,
  from: string,
  to: string,
  status: string,
  rowCount: number,
  error?: string,
) {
  await supabase
    .from("data_imports")
    .insert({
      client_id: clientId,
      source,
      source_property: property,
      date_from: from,
      date_to: to,
      status,
      is_demo: false,
      row_count: rowCount,
      error_message: error ?? null,
    });
}

export async function syncGoogleClient(
  supabase: SupabaseClient,
  clientId: string,
  range: { from: string; to: string },
  env: Record<string, string | undefined> = process.env,
) {
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id,is_demo,lifecycle_status")
    .eq("id", clientId)
    .is("deleted_at", null)
    .single();
  if (clientError || !client) throw new Error("Client not found.");
  if (client.is_demo)
    throw new Error("Demo clients cannot run live Google sync.");
  const { data, error } = await supabase
    .from("client_integrations")
    .select("id,provider,external_reference,configuration")
    .eq("client_id", clientId)
    .in("provider", ["google_analytics", "search_console"])
    .eq("status", "connected");
  if (error) throw error;
  const integrations = (data ?? []) as Integration[];
  if (!integrations.length)
    throw new Error("No connected Google integrations are configured.");
  const accessToken = await getGoogleAccessToken(
    env.GOOGLE_SERVICE_ACCOUNT_JSON,
  );
  const results: { source: SyncSource; rows: number }[] = [];
  for (const integration of integrations) {
    const started = new Date().toISOString(),
      cfg = configOf(integration.configuration);
    await supabase
      .from("client_integrations")
      .update({
        last_sync_started_at: started,
        last_sync_status: "running",
        last_sync_error: null,
      })
      .eq("id", integration.id);
    try {
      if (integration.provider === "google_analytics") {
        const property = cfg.propertyId ?? integration.external_reference ?? "";
        if (!/^\d+$/.test(property))
          throw new Error("A numeric GA4 property ID is required.");
        const report = await fetchGa4Report(
          { accessToken, ga4PropertyId: property, searchConsoleSiteUrl: "" },
          range,
        );
        const pages = new Map<
          string,
          {
            day: string;
            page_path: string;
            users: number;
            new_users: number;
            sessions: number;
            page_views: number;
          }
        >();
        for (const row of report.rows ?? []) {
          const day = dayFromGa(row.dimensionValues?.[0]?.value),
            page = row.dimensionValues?.[1]?.value ?? "/";
          if (!day) continue;
          const key = `${day}\u0000${page}`,
            current = pages.get(key) ?? {
              day,
              page_path: page,
              users: 0,
              new_users: 0,
              sessions: 0,
              page_views: 0,
            };
          current.users += numeric(row.metricValues?.[0]?.value);
          current.new_users += numeric(row.metricValues?.[1]?.value);
          current.sessions += numeric(row.metricValues?.[2]?.value);
          current.page_views += numeric(row.metricValues?.[3]?.value);
          pages.set(key, current);
        }
        const pageRows = [...pages.values()].map((row) => ({
          client_id: clientId,
          ...row,
          source: "google_analytics",
          synced_at: started,
        }));
        if (pageRows.length) {
          const { error: pageError } = await supabase
            .from("analytics_page_daily")
            .upsert(pageRows, { onConflict: "client_id,day,page_path" });
          if (pageError) throw pageError;
        }
        const daily = new Map<
          string,
          {
            users: number;
            new_users: number;
            sessions: number;
            page_views: number;
          }
        >();
        for (const row of pageRows) {
          const item = daily.get(row.day) ?? {
            users: 0,
            new_users: 0,
            sessions: 0,
            page_views: 0,
          };
          item.users += row.users;
          item.new_users += row.new_users;
          item.sessions += row.sessions;
          item.page_views += row.page_views;
          daily.set(row.day, item);
        }
        const dailyRows = [...daily].map(([day, m]) => ({
          client_id: clientId,
          day,
          ...m,
          metrics: {
            activeUsers: m.users,
            newUsers: m.new_users,
            sessions: m.sessions,
            screenPageViews: m.page_views,
          },
          source: "google_analytics",
          synced_at: started,
          is_demo: false,
        }));
        if (dailyRows.length) {
          const { error: dailyError } = await supabase
            .from("analytics_daily")
            .upsert(dailyRows, { onConflict: "client_id,day" });
          if (dailyError) throw dailyError;
        }
        await recordImport(
          supabase,
          clientId,
          "google_analytics",
          property,
          range.from,
          range.to,
          "completed",
          pageRows.length,
        );
        results.push({ source: "google_analytics", rows: pageRows.length });
      } else {
        const siteUrl = cfg.siteUrl ?? integration.external_reference ?? "";
        if (!siteUrl) throw new Error("A Search Console property is required.");
        const report = await fetchSearchConsoleReport(
          { accessToken, ga4PropertyId: "", searchConsoleSiteUrl: siteUrl },
          range,
        );
        const rows = (report.rows ?? [])
          .map((row) => ({
            client_id: clientId,
            day: row.keys?.[0] ?? "",
            query: row.keys?.[1] ?? "",
            page: row.keys?.[2] ?? "",
            clicks: Math.round(row.clicks ?? 0),
            impressions: Math.round(row.impressions ?? 0),
            ctr: row.ctr ?? 0,
            average_position: row.position ?? 0,
            metrics: {
              clicks: row.clicks ?? 0,
              impressions: row.impressions ?? 0,
              ctr: row.ctr ?? 0,
              position: row.position ?? 0,
            },
            source: "search_console",
            synced_at: started,
            is_demo: false,
          }))
          .filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.day));
        if (rows.length) {
          const { error: rowError } = await supabase
            .from("search_console_daily")
            .upsert(rows, { onConflict: "client_id,day,query,page" });
          if (rowError) throw rowError;
        }
        await recordImport(
          supabase,
          clientId,
          "search_console",
          siteUrl,
          range.from,
          range.to,
          "completed",
          rows.length,
        );
        results.push({ source: "search_console", rows: rows.length });
      }
      await supabase
        .from("client_integrations")
        .update({
          last_synced_at: started,
          last_sync_status: "succeeded",
          last_sync_error: null,
          next_sync_at: new Date(Date.now() + 86400000).toISOString(),
        })
        .eq("id", integration.id);
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Google sync failed";
      await supabase
        .from("client_integrations")
        .update({ last_sync_status: "failed", last_sync_error: message })
        .eq("id", integration.id);
      await recordImport(
        supabase,
        clientId,
        integration.provider,
        integration.external_reference ?? "unknown",
        range.from,
        range.to,
        "failed",
        0,
        message,
      );
      throw cause;
    }
  }
  return results;
}
