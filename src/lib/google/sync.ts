import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchGa4Report, fetchSearchConsoleReport } from "./analytics";
import { getGoogleAccessToken } from "./service-account";
import { oauthAccessToken } from './oauth-service';
import { GoogleError } from './oauth-core';
import { createAdminClient } from '@/lib/supabase/admin';
import { googleSyncRange } from './sync-range';

type SyncSource = "google_analytics" | "search_console";
type SyncRange = { from: string; to: string };
export type GoogleSyncRanges = SyncRange | Record<SyncSource, SyncRange>;
type Integration = {
  id: string;
  provider: SyncSource;
  external_reference: string | null;
  configuration: unknown;
  auth_method?: string;
  google_connection_id?: string | null;
};
type Config = { propertyId?: string; siteUrl?: string; authMethod?: string };
// Malformed/missing provider observations fail before writes, never become measured zero.
const observed = (value: unknown) => {
  if ((typeof value !== 'number' && typeof value !== 'string') || (typeof value==='string' && !value.trim()) || !Number.isFinite(Number(value)) || Number(value)<0) throw new GoogleError('sync_error');
  return Number(value);
};
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
  coverage?: Record<string,unknown>,
) {
  const result = await supabase
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
      ...(coverage ? {coverage} : {}),
    });
  if (result.error) throw new GoogleError('sync_error');
}

export async function syncGoogleClient(
  supabase: SupabaseClient,
  clientId: string,
  ranges: GoogleSyncRanges,
  env: Record<string, string | undefined> = process.env,
  expectedOrganizationId?: string,
) {
  const rangeFor = (source: SyncSource) => "from" in ranges ? ranges : ranges[source];
  for (const source of ["google_analytics", "search_console"] as const) {
    const range = rangeFor(source);
    googleSyncRange(range.from, range.to);
  }
  let clientQuery = supabase
    .from("clients")
    .select("id,is_demo,lifecycle_status,organization_id")
    .eq("id", clientId)
    .eq("lifecycle_status", "active")
    .eq("is_demo", false)
    .is("deleted_at", null);
  if (expectedOrganizationId) clientQuery = clientQuery.eq("organization_id", expectedOrganizationId);
  const { data: client, error: clientError } = await clientQuery.single();
  if (clientError || !client) throw new Error("Client not found.");
  if (client.is_demo)
    throw new Error("Demo clients cannot run live Google sync.");
  const { data, error } = await supabase
    .from("client_integrations")
    .select(env.GOOGLE_OAUTH_ENABLED === 'true' ? "id,provider,external_reference,configuration,auth_method,google_connection_id" : "id,provider,external_reference,configuration")
    .eq("client_id", clientId)
    .in("provider", ["google_analytics", "search_console"])
    .in("status", ["connected","sync_error"]);
  if (error) throw error;
  const integrations = (data ?? []) as unknown as Integration[];
  if (!integrations.length)
    throw new Error("No connected Google integrations are configured.");
  // Validate every configured source before exchanging credentials or writing sync state.
  for (const integration of integrations) {
    const cfg = configOf(integration.configuration);
    if (cfg.authMethod==='google_oauth' && env.GOOGLE_OAUTH_ENABLED!=='true') throw new GoogleError('configuration');
    if (integration.auth_method==='google_oauth' && !integration.google_connection_id) throw new GoogleError('configuration');
    const property = (integration.provider === "google_analytics" ? cfg.propertyId : cfg.siteUrl) ?? integration.external_reference ?? "";
    if (integration.provider === "google_analytics") {
      if (!/^\d+$/.test(property)) throw new Error("A numeric GA4 property ID is required.");
    } else if (!/^sc-domain:[a-z0-9.-]+$/i.test(property)) {
      let url: URL;
      try { url = new URL(property); } catch { throw new Error("A valid Search Console property is required."); }
      if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error("A valid Search Console property is required.");
    }
  }
  let legacyToken: string | undefined;
  if (integrations.some(i=>i.auth_method!=='google_oauth')) legacyToken = await getGoogleAccessToken(env.GOOGLE_SERVICE_ACCOUNT_JSON);
  // Only after the caller's session-scoped eligible-client and mapping reads succeed.
  // OAuth mapping writes are intentionally prohibited through the browser Data API.
  if (integrations.some(i=>i.auth_method==='google_oauth')) {
    if (!expectedOrganizationId || client.organization_id!==expectedOrganizationId) throw new GoogleError('forbidden');
    const writer = createAdminClient(); if (!writer) throw new GoogleError('configuration');
    supabase = writer;
  }
  const results: { source: SyncSource; rows: number; range: SyncRange; fetchDurationMs: number; databaseDurationMs: number; totalDurationMs: number; coverage: Record<string,unknown> }[] = [];
  for (const integration of integrations) {
    const sourceStarted = Date.now(), started = new Date().toISOString(), range = rangeFor(integration.provider),
      cfg = configOf(integration.configuration);
    let fetchDurationMs = 0, databaseStarted = 0, outcome: {rows:number;coverage:Record<string,unknown>} | null = null;
    try {
      const accessToken = integration.auth_method==='google_oauth' ? await oauthAccessToken(expectedOrganizationId!,integration.google_connection_id!,env) : legacyToken!;
      await supabase.from('client_integrations').update({last_sync_started_at:started,last_sync_status:'running',last_sync_error:null}).eq('id',integration.id).eq('client_id',clientId);
      if (integration.provider === "google_analytics") {
        const property = cfg.propertyId ?? integration.external_reference ?? "";
        if (!/^\d+$/.test(property))
          throw new Error("A numeric GA4 property ID is required.");
        const fetchStarted = Date.now();
        const report = await fetchGa4Report(
          { accessToken, ga4PropertyId: property, searchConsoleSiteUrl: "" },
          range,
        );
        fetchDurationMs = Date.now() - fetchStarted;
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
            page = row.dimensionValues?.[1]?.value;
          if (!day || !page || day<range.from || day>range.to) throw new GoogleError('sync_error');
          const key = `${day}\u0000${page}`,
            current = pages.get(key) ?? {
              day,
              page_path: page,
              users: 0,
              new_users: 0,
              sessions: 0,
              page_views: 0,
            };
          current.users += observed(row.metricValues?.[0]?.value);
          current.new_users += observed(row.metricValues?.[1]?.value);
          current.sessions += observed(row.metricValues?.[2]?.value);
          current.page_views += observed(row.metricValues?.[3]?.value);
          pages.set(key, current);
        }
        const pageRows = [...pages.values()].map((row) => ({
          client_id: clientId,
          ...row,
          source: "google_analytics",
          synced_at: started,
        }));
        if (pageRows.length) {
          databaseStarted = Date.now();
          const { error: pageError } = await supabase
            .from("analytics_page_daily")
            .upsert(pageRows, { onConflict: "client_id,day,page_path" });
          if (pageError) throw pageError;
        }
        const dailyRows = (report.dailyRows ?? []).map(row => {
          const day = dayFromGa(row.dimensionValues?.[0]?.value);
          if (!day || day<range.from || day>range.to) throw new GoogleError('sync_error');
          const m = {
            users: observed(row.metricValues?.[0]?.value),
            new_users: observed(row.metricValues?.[1]?.value),
            sessions: observed(row.metricValues?.[2]?.value),
            page_views: observed(row.metricValues?.[3]?.value),
          };
          return {
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
          };
        });
        if ((report.rows?.length ?? 0) > 0 && !dailyRows.length) throw new GoogleError('sync_error');
        if (!databaseStarted) databaseStarted = Date.now();
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
          undefined,
          env.GOOGLE_OAUTH_ENABLED==='true' ? {provider_rows:report.rows?.length ?? 0,row_count:report.rowCount ?? 0,row_limit:100000,
            page_requests:report.pageRequests ?? 1,coverage_incomplete:report.pagePaginationComplete===false,
            completeness:report.pagePaginationComplete===false?'incomplete':'provider_rows_exhausted',
            daily_total_semantics:'GA4 date-only report; not summed from page dimensions',daily_rows:dailyRows.length} : undefined,
        );
        outcome = {rows:pageRows.length,coverage:{pagePaginationComplete:report.pagePaginationComplete!==false,dailyRows:dailyRows.length}};
      } else {
        const siteUrl = cfg.siteUrl ?? integration.external_reference ?? "";
        if (!siteUrl) throw new Error("A Search Console property is required.");
        const fetchStarted = Date.now();
        const report = await fetchSearchConsoleReport(
          { accessToken, ga4PropertyId: "", searchConsoleSiteUrl: siteUrl },
          range,
        );
        fetchDurationMs = Date.now() - fetchStarted;
        const rows = (report.rows ?? [])
          .map((row) => ({
            client_id: clientId,
            day: row.keys?.[0] ?? "",
            query: row.keys?.[1] ?? "",
            page: row.keys?.[2] ?? "",
            clicks: observed(row.clicks),
            impressions: observed(row.impressions),
            ctr: observed(row.ctr),
            average_position: observed(row.position),
            metrics: {
              clicks: observed(row.clicks),
              impressions: observed(row.impressions),
              ctr: observed(row.ctr),
              position: observed(row.position),
            },
            source: "search_console",
            synced_at: started,
            is_demo: false,
          }))
          ;
        if (rows.some(row=>!/^\d{4}-\d{2}-\d{2}$/.test(row.day) || row.day<range.from || row.day>range.to || !row.page || !row.query)) throw new GoogleError('sync_error');
        if (rows.length) {
          databaseStarted = Date.now();
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
          undefined,
          env.GOOGLE_OAUTH_ENABLED==='true' ? {provider_rows:report.rows?.length ?? 0,row_limit:report.rowLimit ?? 25000,
            page_requests:report.pageRequests ?? 1,pagination_exhausted:report.paginationComplete===true,coverage_incomplete:true,
            completeness:report.paginationComplete===true?'provider_pagination_exhausted_but_top_rows_not_guaranteed':'incomplete',
            caveat:'Search Console returns top rows, not a guaranteed exhaustive dataset.'} : undefined,
        );
        outcome = {rows:rows.length,coverage:{paginationComplete:report.paginationComplete===true,coverageIncomplete:true,pageRequests:report.pageRequests ?? 1}};
      }
      await supabase
        .from("client_integrations")
        .update({
          last_synced_at: started,
          last_sync_status: "succeeded",
          last_sync_error: null,
          next_sync_at: null,
        })
        .eq("id", integration.id).eq('client_id',clientId);
      if (!outcome) throw new GoogleError('sync_error');
      results.push({source:integration.provider,rows:outcome.rows,range,fetchDurationMs,
        databaseDurationMs:databaseStarted ? Date.now()-databaseStarted : 0,totalDurationMs:Date.now()-sourceStarted,coverage:outcome.coverage});
    } catch (cause) {
      const message = cause instanceof GoogleError ? cause.code : 'Google sync failed';
      await supabase
        .from("client_integrations")
        .update({ last_sync_status: "failed", last_sync_error: message,
          ...(integration.auth_method==='google_oauth' ? {status:message==='needs_reconnection'?'needs_reconnection':message==='access_removed'?'access_removed':'sync_error'} : {}) })
        .eq("id", integration.id).eq('client_id',clientId);
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
