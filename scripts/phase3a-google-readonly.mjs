// Explicit Phase 3A read-access audit. No database writes or Google ingestion.
import { createSign } from 'node:crypto';
import { assertQaUrl } from './qa-project-guard.mjs';
assertQaUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
const report = { checkedAt: new Date().toISOString(), ga4Property: '545982719', searchConsoleProperty: 'sc-domain:kaamcareer.com', ingestion: false };
const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
if (!raw) {
  console.log(JSON.stringify({ ...report, access: 'UNAVAILABLE', reason: 'GOOGLE_SERVICE_ACCOUNT_JSON is not configured in the isolated Preview environment.' }));
  process.exit(0);
}
try {
  const account = JSON.parse(raw);
  if (!account.client_email || !account.private_key) throw new Error('Invalid service account configuration');
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  if (account.token_uri && account.token_uri !== tokenUrl) throw new Error('Unexpected credential token endpoint');
  const b64 = value => Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: account.client_email, scope: 'https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly', aud: tokenUrl, iat: now, exp: now + 3600 })}`;
  const signature = createSign('RSA-SHA256').update(unsigned).sign(account.private_key.replace(/\\n/g, '\n')).toString('base64url');
  const exchange = await fetch(tokenUrl, { method: 'POST', body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${signature}` }), signal: AbortSignal.timeout(15000) });
  const token = await exchange.json();
  if (!exchange.ok || !token.access_token) { console.log(JSON.stringify({ ...report, access: 'FAILED', stage: 'token_exchange', status: exchange.status, reason: token.error ?? 'no_access_token' })); process.exit(0); }
  const read = async (url, body) => {
    const response = await fetch(url, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000) });
    const data = await response.json();
    return response.ok ? { ok: true, data } : { ok: false, status: response.status, reason: data.error?.status, details: data.error?.details?.map(item => item.reason).filter(Boolean) };
  };
  const ga = await read('https://analyticsadmin.googleapis.com/v1beta/properties/545982719');
  report.ga4 = ga.ok ? { access: true, name: ga.data.name, displayName: ga.data.displayName, createTime: ga.data.createTime } : ga;
  if (ga.ok) {
    const streams = await read('https://analyticsadmin.googleapis.com/v1beta/properties/545982719/dataStreams');
    report.ga4.streams = streams.ok ? streams.data.dataStreams?.map(stream => ({ name: stream.name, type: stream.type, defaultUri: stream.webStreamData?.defaultUri })) : streams;
    // Only probe dates after the stream proves it is the approved domain.
    const matches = streams.ok && streams.data.dataStreams?.some(stream => { try { return ['kaamcareer.com', 'www.kaamcareer.com'].includes(new URL(stream.webStreamData?.defaultUri).hostname); } catch { return false; } });
    report.ga4.classification = matches ? 'REAL PRODUCTION PROPERTY DETECTED: public KAAM website; no test designation verified' : 'OWNERSHIP MISMATCH OR UNVERIFIED';
    if (matches) for (const desc of [false, true]) {
      const dates = await read('https://analyticsdata.googleapis.com/v1beta/properties/545982719:runReport', { dateRanges: [{ startDate: ga.data.createTime?.slice(0, 10) ?? '2015-08-14', endDate: 'yesterday' }], dimensions: [{ name: 'date' }], metrics: [{ name: 'activeUsers' }], orderBys: [{ dimension: { dimensionName: 'date' }, desc }], limit: '1' });
      report.ga4[desc ? 'latestCompletedObservation' : 'earliestObservation'] = dates.ok ? dates.data.rows?.[0]?.dimensionValues?.[0]?.value ?? null : dates;
    }
  }
  const gsc = await read('https://www.googleapis.com/webmasters/v3/sites/' + encodeURIComponent(report.searchConsoleProperty));
  report.gsc = gsc.ok ? { access: true, siteUrl: gsc.data.siteUrl, permissionLevel: gsc.data.permissionLevel, classification: 'REAL PRODUCTION PROPERTY DETECTED: public KAAM domain; no test designation verified' } : gsc;
  if (gsc.ok && gsc.data.siteUrl === report.searchConsoleProperty) {
    const end = new Date(); end.setUTCDate(end.getUTCDate() - 1);
    const start = new Date(end); start.setUTCMonth(start.getUTCMonth() - 16);
    const range = { startDate: start.toISOString().slice(0,10), endDate: end.toISOString().slice(0,10), dataState: 'final' };
    const dates = await read('https://www.googleapis.com/webmasters/v3/sites/' + encodeURIComponent(report.searchConsoleProperty) + '/searchAnalytics/query', { ...range, dimensions: ['date'], rowLimit: 1000 });
    if (dates.ok) { const days = (dates.data.rows ?? []).map(row => row.keys?.[0]).filter(Boolean).sort(); Object.assign(report.gsc, { queriedRange: range, earliestReturnedDate: days[0] ?? null, latestReturnedDate: days.at(-1) ?? null, observedDays: days.length }); } else report.gsc.dates = dates;
    const sample = await read('https://www.googleapis.com/webmasters/v3/sites/' + encodeURIComponent(report.searchConsoleProperty) + '/searchAnalytics/query', { ...range, dimensions: ['query','page'], rowLimit: 1 });
    report.gsc.queryPageObservationsExist = sample.ok ? !!sample.data.rows?.length : sample;
  }
  console.log(JSON.stringify(report, null, 2));
} catch { console.log(JSON.stringify({ ...report, access: 'FAILED', reason: 'Credential parsing, signing, network or response failure; no credentials printed.' })); process.exitCode = 1; }
