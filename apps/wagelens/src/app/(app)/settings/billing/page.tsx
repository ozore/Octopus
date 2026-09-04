import Link from 'next/link';

import { Panel, StatusPill } from '@/components/primitives';
import { formatDay } from '@/components/provenance';
import { getEnv } from '@/env';
import { openPortalAction } from '@/lib/billing-actions';
import { latestAcceptance } from '@/lib/billing/checkout';
import { paywallMessage, productEntitlement } from '@/lib/billing/entitlement';
import { lookupKeyFor } from '@/lib/billing/sellable';
import { formatCents, PRE_CHARGE_REMINDER_DAYS } from '@/lib/billing/terms';
import { getDb } from '@/lib/db';
import { plans } from '@/lib/plans';
import { GcComingCard } from '@/components/gc-card';
import { requireOrg } from '@octopus/platform/next';
import { findPlan, priceIdFor } from '@octopus/platform/billing';

export const dynamic = 'force-dynamic';

const ERRORS: Record<string, string> = {
  no_customer: 'Nothing to manage yet: this organisation has never subscribed.',
  already_subscribed: 'This organisation already has a subscription. Change it in the portal.',
  portal_create_failed: 'We could not open the billing portal. Try again, or email support.',
};

/**
 * `/settings/billing` — what you are on, what you will be charged and when, and
 * one control that does everything else.
 *
 * **The next charge is stated as an amount and a date, never as "renews
 * monthly"** (V14's spirit applied after the sale as well as before it). The
 * terms version accepted and the date it was accepted are shown too: the
 * consent record is not a hidden compliance artefact, it is something the
 * customer is entitled to see.
 *
 * **Cancellation is at least as easy as subscribing** (V16b): two clicks, in
 * product, through Stripe's own portal, with no retention flow — the portal is
 * configured with cancel enabled and immediate, which is stated in
 * `STRIPE_SETUP.md` so the founder cannot accidentally turn a retention wall on.
 */
export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const env = getEnv();
  const { org, entitlement: platformEntitlement, membership } = await requireOrg();
  const db = await getDb();
  const entitlement = await productEntitlement(db, org.id, { plans, env: env as never });
  const acceptance = await latestAcceptance(db, org.id);
  const error = typeof params['error'] === 'string' ? ERRORS[params['error']] : undefined;
  const isOwner = membership.role === 'owner';

  const currentPlan = findPlan(plans, platformEntitlement.planKey);
  const nextChargeDate = entitlement.trialEndsAt ?? platformEntitlement.currentPeriodEnd;
  const nextChargeAmount = currentPlan
    ? formatCents(currentPlan.amountCents * platformEntitlement.quantity, currentPlan.currency)
    : undefined;
  const paywall = paywallMessage(entitlement);

  return (
    <>
      <h1>Billing</h1>

      {params['checkout'] === 'success' ? (
        <div className="wl-alert wl-alert--success" role="status" data-testid="checkout-success">
          <div>
            <p className="wl-alert__title">Payment method on file.</p>
            <p className="wl-alert__body">Stripe emails the receipt; your plan is below.</p>
          </div>
        </div>
      ) : null}
      {error ? (
        <div className="wl-alert wl-alert--error" role="alert">
          <div>
            <p className="wl-alert__title">{error}</p>
          </div>
        </div>
      ) : null}
      {paywall ? (
        <div className="wl-alert wl-alert--warn" role="alert" data-testid="paywall-notice">
          <div>
            <p className="wl-alert__title">{paywall}</p>
          </div>
        </div>
      ) : null}

      <Panel title="Current plan">
        <p className="wl-row">
          <strong data-testid="plan-name">{platformEntitlement.planName}</strong>
          <StatusPill tone={platformEntitlement.active ? 'filed' : 'none'}>
            {platformEntitlement.status}
          </StatusPill>
        </p>

        {nextChargeDate && nextChargeAmount ? (
          <p data-testid="next-charge">
            {entitlement.entitlement.cancelAtPeriodEnd ? (
              <>
                Cancelled — access ends on <strong>{formatDay(nextChargeDate)}</strong> and there is
                no further charge.
              </>
            ) : (
              <>
                Your next charge is <strong>{nextChargeAmount}</strong> on{' '}
                <strong>{formatDay(nextChargeDate)}</strong>
                {entitlement.entitlement.trialing
                  ? `. We will email you ${PRE_CHARGE_REMINDER_DAYS} days before it happens.`
                  : `, and every ${currentPlan?.interval ?? 'month'} after that until you cancel.`}
              </>
            )}
          </p>
        ) : null}

        <ul className="wl-xs wl-muted wl-prose">
          {Object.entries(platformEntitlement.limits).map(([key, value]) => (
            <li key={key}>
              {key}: {typeof value === 'number' && value < 0 ? 'unlimited' : String(value)}
            </li>
          ))}
        </ul>

        {entitlement.readOnlyUntil ? (
          <p className="wl-sm">
            Your payrolls and exports stay readable until{' '}
            <strong>{formatDay(entitlement.readOnlyUntil)}</strong>. We do not take an audit trail
            away the day a card fails — the three-year retention obligation is yours and it outlives
            us.
          </p>
        ) : null}

        {platformEntitlement.stripeCustomerId ? (
          <form action={openPortalAction}>
            <button
              className="wl-btn wl-btn--secondary"
              type="submit"
              disabled={!isOwner}
              data-testid="open-portal"
            >
              Manage or cancel in Stripe
            </button>
          </form>
        ) : (
          <p>
            <Link className="wl-btn wl-btn--primary" href="/billing/start" data-testid="go-to-trial">
              Start 14-day trial
            </Link>
          </p>
        )}
        <p className="wl-xs wl-muted">
          Cancelling is two clicks in the portal: no call, no email, no retention offer.
        </p>
      </Panel>

      {acceptance ? (
        <Panel title="The terms you accepted">
          <p className="wl-sm" data-testid="terms-record">
            On {formatDay(acceptance.acceptedAt)} you accepted{' '}
            <span className="wl-mono">{acceptance.priceLookupKey}</span>:{' '}
            {formatCents(acceptance.disclosedAmountCents)} charged on{' '}
            {formatDay(acceptance.disclosedChargeDate)}, every {acceptance.disclosedInterval}.
          </p>
          <p className="wl-xs wl-muted">
            Version <span className="wl-mono">{acceptance.termsVersion.slice(0, 12)}</span> — the
            content hash of the block as it was shown to you. We keep it so the record says what you
            agreed to, not what the page says today.
          </p>
        </Panel>
      ) : null}

      <h2>Plans</h2>
      <div className="wl-cols-2">
        {plans.plans.map((plan) => {
          const configured = Boolean(priceIdFor(plan, env));
          const current = platformEntitlement.planKey === plan.key;
          return (
            <section className="wl-panel" key={plan.key}>
              <div className="wl-panel__body wl-stack-2">
                <h3>{plan.name}</h3>
                <p className="wl-sm wl-muted">{plan.tagline}</p>
                <p className="wl-num" style={{ fontSize: 'var(--wl-text-xl)', fontWeight: 700 }}>
                  {formatCents(plan.amountCents, plan.currency)}
                  <span className="wl-xs wl-muted"> /{plan.interval}</span>
                </p>
                <ul className="wl-xs wl-prose">
                  {(plan.features ?? []).map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                {plan.trialDays ? (
                  <p className="wl-xs wl-muted">
                    {plan.trialDays}-day trial. Card on file;{' '}
                    {formatCents(plan.amountCents, plan.currency)} charged on day{' '}
                    {plan.trialDays + 1} unless you cancel before then.
                  </p>
                ) : null}
                {current ? (
                  <StatusPill tone="filed">Current plan</StatusPill>
                ) : platformEntitlement.active ? (
                  <p className="wl-xs wl-muted">
                    Switch plan in the portal — proration is on, so you pay the difference and
                    nothing more.
                  </p>
                ) : configured ? (
                  <p>
                    <Link
                      className="wl-btn wl-btn--primary"
                      href={`/billing/start?plan=${encodeURIComponent(lookupKeyFor(plan))}`}
                      data-testid={`checkout-${plan.key}`}
                    >
                      Start 14-day trial
                    </Link>
                  </p>
                ) : (
                  <p className="wl-xs wl-muted">
                    Not configured: <span className="wl-mono">{plan.priceEnvVar}</span>
                  </p>
                )}
              </div>
            </section>
          );
        })}

        <GcComingCard surface="billing" />
      </div>

      {!isOwner ? <p className="wl-xs wl-muted">Only an owner can change billing.</p> : null}
      <p className="wl-disclaimer">
        Payments are processed by Stripe. We never see or store your card number.{' '}
        <Link href="/legal/terms">Terms</Link>.
      </p>
    </>
  );
}
