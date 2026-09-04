import Link from 'next/link';
import { redirect } from 'next/navigation';

import { Panel } from '@/components/primitives';
import { emitEvent } from '@/lib/analytics/events';
import { productEntitlement } from '@/lib/billing/entitlement';
import { getDb } from '@/lib/db';
import { getEnv } from '@/env';
import { plans } from '@/lib/plans';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * `/billing/return` — where Stripe sends the browser after Checkout.
 *
 * **IT GRANTS NOTHING.** A redirect is a claim by the browser; the webhook is a
 * statement by Stripe, and the webhook is the only writer of entitlement
 * (Clausewright ADR-007, which this whole platform inherits). So this page
 * reads OUR mirror and does one of two things: sends the customer on if the
 * webhook has landed, or says "confirming" and refreshes.
 *
 * The refresh is an HTML `<meta http-equiv="refresh">` rather than a client
 * component. It is one line, it works with no JavaScript, and it keeps this
 * page a server component — which matters because the thing it is polling is a
 * database row and there is nothing for a client to do but ask again.
 */
export default async function BillingReturnPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { org, user } = await requireOrg();
  const db = await getDb();
  const attempt = Number(typeof params['attempt'] === 'string' ? params['attempt'] : '0') || 0;

  const entitlement = await productEntitlement(db, org.id, { plans, env: getEnv() as never });

  if (entitlement.entitlement.active) {
    await emitEvent(db, 'checkout_completed', {
      orgId: org.id,
      userId: user.id,
      props: { plan: entitlement.entitlement.planKey },
    });
    if (entitlement.entitlement.trialing) {
      await emitEvent(db, 'trial_started', {
        orgId: org.id,
        userId: user.id,
        props: {
          plan: entitlement.entitlement.planKey,
          trial_ends_at: entitlement.trialEndsAt?.toISOString() ?? null,
        },
      });
    }
    redirect('/settings/billing?checkout=success');
  }

  // Ten attempts at three seconds is the 30 seconds the spec allows before we
  // stop waiting on the webhook and say so plainly.
  const timedOut = attempt >= 10;
  if (timedOut) {
    console.error('billing_return_timeout', { orgId: org.id });
  }

  return (
    <>
      {timedOut ? null : (
        <meta httpEquiv="refresh" content={`3;url=/billing/return?attempt=${attempt + 1}`} />
      )}
      <h1>Confirming your subscription…</h1>
      <Panel title={timedOut ? 'Still confirming' : 'One moment'}>
        {timedOut ? (
          <>
            <p data-testid="billing-return-timeout">
              Stripe has your card and we have not yet heard back. Nothing is lost and nothing was
              charged twice — the confirmation arrives on its own, usually within a minute, and your
              plan appears in billing when it does.
            </p>
            <p className="wl-sm wl-muted">
              We do not unlock the product from this page on purpose: a redirect is the browser&rsquo;s
              word for what happened, and only Stripe&rsquo;s own signed message is evidence.
            </p>
            <p>
              <Link className="wl-btn wl-btn--secondary" href="/settings/billing">
                Open billing
              </Link>
            </p>
          </>
        ) : (
          <>
            <p data-testid="billing-return-polling">
              We are waiting for Stripe&rsquo;s confirmation. This page refreshes itself — you do not
              need to do anything.
            </p>
            <p className="wl-sm wl-muted">
              Attempt {attempt + 1} of 10. Access is granted by Stripe&rsquo;s signed message, never by
              this redirect.
            </p>
          </>
        )}
      </Panel>
    </>
  );
}
