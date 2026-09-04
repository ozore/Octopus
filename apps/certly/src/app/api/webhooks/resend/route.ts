/**
 * POST /api/webhooks/resend — delivery, bounce and complaint. `specs/07` §8.
 *
 * SIGNATURE-VERIFIED BEFORE ANYTHING IS PARSED AS MEANINGFUL. The body is read
 * as raw text, verified, and only then treated as an event, because a webhook
 * endpoint that parses first is an endpoint anyone can write to.
 *
 * An unverifiable request gets 401 and nothing is written. A verified event for
 * a message we do not recognise is accepted and logged — a webhook retried
 * after a database restore must not 500 forever.
 */
import '@/lib/platform';

import { getEnv } from '@/env';
import { getDb } from '@/lib/db';
import { applyResendEvent, verifyResendWebhook, type ResendEvent } from '@/lib/reminders';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request): Promise<Response> {
  const env = getEnv();
  const secret = env.RESEND_WEBHOOK_SECRET;
  if (!secret) return new Response('webhook not configured', { status: 503 });

  const body = await request.text();
  const headers = {
    id: request.headers.get('svix-id') ?? '',
    timestamp: request.headers.get('svix-timestamp') ?? '',
    signature: request.headers.get('svix-signature') ?? '',
  };
  if (!verifyResendWebhook(secret, headers, body)) {
    return new Response('invalid signature', { status: 401 });
  }

  let event: ResendEvent;
  try {
    event = JSON.parse(body) as ResendEvent;
  } catch {
    return new Response('malformed body', { status: 400 });
  }
  if (!event?.data?.email_id) return new Response('no message id', { status: 400 });

  const db = await getDb();
  const outcome = await applyResendEvent(db, event);
  return Response.json(outcome, { status: 200 });
}
