import { NextRequest, NextResponse } from 'next/server';
import { completeGoogle } from '@/lib/google/oauth-service';
import { oauthConfig, STATE_COOKIE } from '@/lib/google/oauth-core';

export async function GET(req: NextRequest) {
  try {
    const cfg = oauthConfig();
    const expected = new URL(cfg.origin);
    const requestHost = (req.headers.get('x-forwarded-host') ?? req.headers.get('host'))?.split(',')[0].trim();
    const requestProtocol = req.headers.get('x-forwarded-proto')?.split(',')[0].trim();
    if (requestHost !== expected.host || (requestProtocol && `${requestProtocol}:` !== expected.protocol) || req.nextUrl.searchParams.has('error')) throw new Error();
    const {client,connectionId} = await completeGoogle(req.nextUrl.searchParams.get('state') ?? '',req.cookies.get(STATE_COOKIE)?.value ?? '',req.nextUrl.searchParams.get('code') ?? '');
    const response = NextResponse.redirect(new URL(`/admin/clients/${encodeURIComponent(client.slug)}/integrations?connection=${encodeURIComponent(connectionId)}`,cfg.origin),303);
    response.cookies.set(STATE_COOKIE,'',{maxAge:0,path:'/api/integrations/google'});
    response.headers.set('Cache-Control','no-store'); response.headers.set('Referrer-Policy','no-referrer');
    return response;
  } catch {
    // Never echo the callback URL, code, token or provider error; no generic server exception log.
    return new NextResponse('Google connection could not be verified. Return to the client Integrations page and start Connect Google again.',
      {status:400,headers:{'Cache-Control':'no-store','Referrer-Policy':'no-referrer','Content-Type':'text/plain'}});
  }
}
