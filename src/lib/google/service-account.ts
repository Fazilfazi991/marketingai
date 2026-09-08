import "server-only";
import { createSign } from "node:crypto";

type ServiceAccount = { client_email: string; private_key: string; token_uri?: string };

const base64url = (value: string | Buffer) => Buffer.from(value).toString("base64url");

export function parseGoogleServiceAccount(raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON): ServiceAccount {
  if (!raw) throw new Error("Google service account is not configured.");
  const value = JSON.parse(raw) as Partial<ServiceAccount>;
  if (!value.client_email || !value.private_key) throw new Error("Google service account configuration is incomplete.");
  return { client_email: value.client_email, private_key: value.private_key.replace(/\\n/g, "\n"), token_uri: value.token_uri };
}

export async function getGoogleAccessToken(raw?: string) {
  const account = parseGoogleServiceAccount(raw);
  const now = Math.floor(Date.now() / 1000);
  const tokenUri = account.token_uri ?? "https://oauth2.googleapis.com/token";
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(JSON.stringify({ iss: account.client_email, scope: "https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly", aud: tokenUri, iat: now, exp: now + 3600 }));
  const signingInput = `${header}.${claim}`;
  const signature = createSign("RSA-SHA256").update(signingInput).sign(account.private_key);
  const response = await fetch(tokenUri, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${signingInput}.${base64url(signature)}` }), cache: "no-store" });
  if (!response.ok) throw new Error(`Google token exchange failed (${response.status}).`);
  const body = await response.json() as { access_token?: string };
  if (!body.access_token) throw new Error("Google token exchange returned no access token.");
  return body.access_token;
}
