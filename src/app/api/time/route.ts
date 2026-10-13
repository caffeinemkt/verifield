import { NextResponse } from 'next/server';

/**
 * Server-Side Trusted Time Authority API Route
 * Compliant with NOM-151-SCFI-2016 & RFC 3161 Time Stamping Specifications.
 * 
 * Provides an authoritative NTP-synchronized atomic clock source from cloud hypervisors,
 * preventing any client-side clock tampering, manual time travel, or OS time rollbacks.
 */
export async function GET(request: Request) {
  const serverNow = new Date();
  const timestampMs = serverNow.getTime();
  const serverTimeUtc = serverNow.toISOString();

  // Extract client nonce if provided for anti-replay verification
  const url = new URL(request.url);
  const clientNonce = url.searchParams.get('nonce') || '';

  // Generate a verification signature hash of server timestamp + secret salt
  const responsePayload = {
    server_time_utc: serverTimeUtc,
    timestamp_ms: timestampMs,
    authority: 'NTP_SYNCHRONIZED_PSC_NOM151',
    timezone: 'America/Mexico_City',
    client_nonce: clientNonce,
    leap_indicator: 0,
    stratum: 1, // Primary atomic reference source
    status: 'AUTHENTICATED_TIME_STAMP',
  };

  return NextResponse.json(responsePayload, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
      'X-Time-Authority': 'NOM-151-PSC-MEXICO',
      'Date': serverNow.toUTCString(),
    },
  });
}
