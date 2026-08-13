/**
 * `/api/stripe/webhook` — the only input in this product that moves entitlement.
 *
 * AUTHORITY: `ARCHITECTURE.md` ADR-007 ("Stripe is the source of truth for money;
 * webhooks decide, we record"), §9.1, §3.1, `USER_JOURNEY.md` §11.1.
 *
 * ===========================================================================
 * WHY THIS FILE EXISTS
 *
 * `src/platform/billing/webhook.ts` was written whole — signature verification
 * before parse, the `stripe_events` ledger before dispatch, `processed_at` after —
 * and `handleStripeWebhook` is documented in that module as "the route handler's
 * whole body". Nothing called it. There was no HTTP route anywhere under `src/app`
 * that Stripe could POST to, and every screen that reads entitlement reads it from
 * state that only a webhook writes. So `startCheckoutAction` could open a Checkout
 * session and the payment could succeed and the account would stay on `none`
 * forever: no plan, no allowance, no overage, no dunning, no chargeback handling,
 * no rate-card fulfilment. The gap was invisible to the suite because
 * `tests/platform/` calls `handleStripeWebhook` directly, which is the one caller
 * that does not need the route to exist.
 *
 * ===========================================================================
 * THREE THINGS THIS HANDLER DOES NOT DO
 *
 * 1. **It does not parse the body.** `request.text()` and nothing else — the
 *    signature covers bytes, and a re-serialised object is not those bytes. Next
 *    does not pre-parse a `Request` body in a route handler, so the raw string
 *    reaches `handleStripeWebhook` unmodified.
 * 2. **It does not authenticate a session.** Stripe has none. The signature IS the
 *    authentication, and an unsigned or stale-timestamped body is a 401 before
 *    anything is read from it.
 * 3. **It does not report a failure to a person.** A non-2xx makes Stripe retry for
 *    three days, and `billing.replay` (§7.1) re-reads `/v1/events` daily and
 *    processes anything the ledger has not marked done. That is the whole of the
 *    escalation path, and it is a mechanism rather than an inbox (A3, I7).
 */

import { NextResponse } from 'next/server';

import { getDb } from '@/db';
import { handleStripeWebhook } from '@/platform/billing/webhook';

import { appClock, appConfig, billingConfigOf, stripeGateway } from '../../../_lib/deps';

export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');

  const config = appConfig();
  const db = await getDb();

  const result = await handleStripeWebhook(
    db,
    { payload, signature },
    {
      stripe: stripeGateway(config),
      config: {
        ...billingConfigOf(config),
        ...(config.STRIPE_WEBHOOK_SECRET === undefined
          ? {}
          : { STRIPE_WEBHOOK_SECRET: config.STRIPE_WEBHOOK_SECRET }),
      },
      clock: appClock(),
    },
  );

  if (!result.ok) {
    /**
     * The reason is returned to Stripe and to nobody else. It names a
     * configuration or signature fault — never an account, an email address or an
     * amount — because a webhook endpoint is unauthenticated by construction and
     * its error body is readable by whoever guessed the URL.
     */
    return NextResponse.json({ error: result.reason }, { status: result.status });
  }

  return NextResponse.json(
    { received: true, eventId: result.eventId, duplicate: result.duplicate, handled: result.handled },
    { status: 200 },
  );
}
