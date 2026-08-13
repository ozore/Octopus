/**
 * `POST /api/inbound/email` — Shield's ingest endpoint (ADR-006).
 *
 * Spec: ARCHITECTURE.md §3.8 / ADR-006. This is the route `lib/email/inbound.ts`
 * was written against and named in its header ("the web process's inbound
 * webhook route calls `receiveInboundNotice`"); it did not exist, so mail
 * forwarded to `shield+{token}@{SHIELD_INGEST_DOMAIN}` had nowhere to arrive and
 * D6's included 30 days of monitoring could observe nothing.
 *
 * WHY THIS IS THE MONITORING PRODUCT AND NOT A CONVENIENCE. I4 forbids
 * credentials, and N1 defers SP-API: an inbound address the seller forwards to
 * is the ONLY mechanism left that can see a marketplace notice without holding
 * a Seller Central session. That is why ADR-006 makes it an adapter seam rather
 * than a feature — the eventual `SpApiNotificationSource` is a new adapter
 * behind the same `NoticeSource` interface, not a re-architecture.
 *
 * THE HANDLER IS DELIBERATELY THIN, and the thinness is the durability
 * argument (Twelve-Factor IX): verify, match the opaque token, persist, enqueue,
 * 200. Classification and alerting happen in the worker off the persisted row,
 * so a crash between "mail arrived" and "mail processed" loses nothing — mail
 * that has been 200'd is never re-delivered.
 *
 * Read the RAW body: the HMAC is computed over the exact bytes sent. An unknown
 * ingest token is a 404 rather than a 400 — the address is an unguessable
 * capability, and answering "that token is malformed" versus "that token does
 * not exist" differently would turn this endpoint into a token oracle.
 */

import { getAdapters } from '@/lib/adapters';
import { InboundVerificationError } from '@/lib/adapters/resend';
import { getDb } from '@/lib/db';
import { receiveInboundNotice, UnknownIngestTokenError } from '@/lib/email/inbound';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * `instanceof` ALONE IS NOT SAFE HERE, and the reason is the same one that
 * pins `getDb()` and `getAdapters()` to `globalThis`: Next compiles the RSC
 * graph and the route-handler graph separately, so a module can be instantiated
 * twice in one process and a class declared in it has TWO distinct identities.
 * An error thrown by the adapter instance the route-handler graph holds then
 * fails `instanceof` against the constructor this file imported — observed
 * directly: a forged inbound signature returned 500 ("signature mismatch"
 * escaping as an unhandled error) where the identical Stripe path returned 400.
 *
 * A 500 there is not cosmetic. It tells the mail provider to RETRY a payload we
 * have already refused, so a forged or corrupted delivery gets replayed on a
 * backoff schedule instead of being dropped.
 *
 * `name` is set explicitly in both error classes' constructors and survives the
 * duplication, so it is the reliable discriminator. `instanceof` is kept first
 * because it is the stronger check when the graphs happen to agree.
 */
function isKind(error: unknown, ctor: Function, name: string): boolean {
  return error instanceof ctor || (error instanceof Error && error.name === name);
}

export async function POST(request: Request): Promise<Response> {
  const signature =
    request.headers.get('resend-signature') ?? request.headers.get('svix-signature') ?? '';
  const rawPayload = await request.text();

  try {
    const db = await getDb();
    const { notice } = await receiveInboundNotice(db, getAdapters(), rawPayload, signature);
    log('info', 'inbound.received', { notice_id: notice.id });
    // The id, and nothing about the account it matched: the response goes back
    // to a caller that proved only that it holds the signing secret.
    return Response.json({ status: 'received', noticeId: notice.id }, { status: 200 });
  } catch (error) {
    if (isKind(error, InboundVerificationError, 'InboundVerificationError')) {
      log('warn', 'inbound.unverified', { reason: (error as Error).message });
      return Response.json({ status: 'invalid_signature' }, { status: 400 });
    }
    if (isKind(error, UnknownIngestTokenError, 'UnknownIngestTokenError')) {
      log('warn', 'inbound.unknown_token', {});
      return Response.json({ status: 'unknown_recipient' }, { status: 404 });
    }
    // 5xx so the provider retries: an accepted-but-unstored notice is mail we
    // told the seller we were watching for and then silently dropped.
    log('error', 'inbound.failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return Response.json({ status: 'error' }, { status: 500 });
  }
}

function log(level: 'info' | 'warn' | 'error', event: string, fields: Record<string, unknown>): void {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, proc: 'web', event, ...fields });
  if (level === 'error') process.stderr.write(`${line}\n`);
  else process.stdout.write(`${line}\n`);
}
