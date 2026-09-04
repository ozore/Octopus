import Link from 'next/link';

import { Panel, StatusPill } from '@/components/primitives';
import { emitEvent } from '@/lib/analytics/events';
import { startTrialAction } from '@/lib/billing-actions';
import { lookupKeyFor, planForLookupKey, SELLABLE_LOOKUP_KEYS } from '@/lib/billing/sellable';
import {
  TRIAL_CTA_LABEL,
  TRIAL_TERMS_CONSENT_LABEL,
  formatCents,
  trialTerms,
} from '@/lib/billing/terms';
import { getDb } from '@/lib/db';
import { plans } from '@/lib/plans';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

const ERRORS: Record<string, string> = {
  terms_not_accepted:
    'Nothing was charged and no card was asked for. We need the box ticked before we can take a payment method — that is what makes the terms above a record rather than a claim.',
  tier_not_sellable: 'That tier is not for sale yet.',
  price_not_configured: 'That plan is not on sale yet — its Stripe price is not configured.',
  unknown_plan: 'That plan does not exist.',
  already_subscribed: 'This organisation already has a subscription.',
};

/**
 * `/billing/start` — the trial-terms screen (WL-09 V14/V15, finding B9).
 *
 * THE SHAPE OF THIS PAGE IS THE COMPLIANCE CONTROL, so it is worth stating what
 * must not change:
 *
 *  - the disclosure block is a **sibling of the button**, in the surrounding
 *    type size. It is not in a `<details>`, not in a tooltip, not a footnote and
 *    not a linked page — a card-on-file trial that auto-charges is a
 *    negative-option offer, and ROSCA asks for the terms *before* the payment
 *    method, clearly and conspicuously;
 *  - the amount and the calendar date are **computed** from the plan and the
 *    clock, so they cannot go stale, and switching plan re-renders both AND
 *    changes the content hash — the previous acceptance then no longer
 *    satisfies V15, which is exactly what should happen;
 *  - the checkbox has **no `defaultChecked`**. A pre-ticked box is not consent;
 *  - the button reads `Start 14-day trial`. Never "Start free": the lookup is
 *    free, this takes a card, and `tests/naming.test.ts` fails the build on the
 *    other wording.
 */
export default async function BillingStartPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { org, user, entitlement } = await requireOrg();
  const db = await getDb();

  const sellable = plans.plans
    .map((plan) => ({ plan, lookupKey: lookupKeyFor(plan) }))
    .filter((entry) => SELLABLE_LOOKUP_KEYS.includes(entry.lookupKey));

  const requested = typeof params['plan'] === 'string' ? params['plan'] : '';
  const chosenKey =
    requested && planForLookupKey(plans, requested)
      ? requested
      : (sellable.find((entry) => entry.plan.popular) ?? sellable[0])?.lookupKey ?? '';
  const chosen = planForLookupKey(plans, chosenKey);
  const error = typeof params['error'] === 'string' ? ERRORS[params['error']] : undefined;

  if (!chosen) {
    return (
      <Panel title="No plan is on sale">
        <p>
          No Stripe price is configured yet. <Link href="/settings/billing">Billing</Link>.
        </p>
      </Panel>
    );
  }

  const terms = trialTerms({ plan: chosen, lookupKey: chosenKey, now: new Date() });

  await emitEvent(db, 'trial_terms_viewed', {
    orgId: org.id,
    userId: user.id,
    props: { plan: chosen.key, terms_version: terms.version },
  });

  return (
    <>
      <h1>Start your trial</h1>

      {entitlement.active ? (
        <div className="wl-alert wl-alert--info" role="status">
          <div>
            <p className="wl-alert__title">This organisation already has a subscription.</p>
            <p className="wl-alert__body">
              Change plan, update the card or cancel in{' '}
              <Link href="/settings/billing">billing</Link>.
            </p>
          </div>
        </div>
      ) : null}

      {params['checkout'] === 'cancelled' ? (
        <div className="wl-alert wl-alert--info" role="status" data-testid="checkout-cancelled">
          <div>
            <p className="wl-alert__title">Checkout cancelled — nothing was charged.</p>
            <p className="wl-alert__body">
              Your account still works: you can set up a project and see your own determination.
              Filing needs a card.
            </p>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="wl-alert wl-alert--error" role="alert" data-testid="terms-error">
          <div>
            <p className="wl-alert__title">{error}</p>
          </div>
        </div>
      ) : null}

      <Panel title="Choose a plan">
        <div className="wl-cols-2">
          {sellable.map(({ plan, lookupKey }) => (
            <section className="wl-panel" key={lookupKey}>
              <div className="wl-panel__body wl-stack-2">
                <h3>
                  {plan.name}{' '}
                  {lookupKey === chosenKey ? <StatusPill tone="filed">Chosen</StatusPill> : null}
                </h3>
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
                {lookupKey === chosenKey ? null : (
                  <p>
                    <Link
                      className="wl-btn wl-btn--ghost wl-btn--sm"
                      href={`/billing/start?plan=${encodeURIComponent(lookupKey)}`}
                    >
                      Choose {plan.name}
                    </Link>
                  </p>
                )}
              </div>
            </section>
          ))}
        </div>
      </Panel>

      <Panel title={`${chosen.name} — the terms`}>
        {/*
          THE DISCLOSURE BLOCK. A sibling of the button below, same type size,
          nothing collapsed and nothing linked away (V14). The order is fixed:
          trial length; the exact amount AND the exact calendar date; the
          interval and that it continues until cancelled; how to cancel, in one
          sentence, with the route; and the promise of a reminder.
        */}
        <div className="wl-stack-2" data-testid="trial-terms" data-terms-version={terms.version}>
          {terms.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <form className="wl-stack" action={startTrialAction}>
          <input type="hidden" name="lookupKey" value={chosenKey} />
          <div className="wl-field">
            <label className="wl-field__label" htmlFor="trial-terms-consent">
              {/* No `defaultChecked`. A pre-ticked box is not consent (V15). */}
              <input id="trial-terms-consent" name="terms" type="checkbox" required />{' '}
              {TRIAL_TERMS_CONSENT_LABEL}
            </label>
          </div>
          <div>
            <button
              className="wl-btn wl-btn--primary"
              type="submit"
              data-testid="start-trial"
              disabled={entitlement.active}
            >
              {TRIAL_CTA_LABEL}
            </button>
          </div>
        </form>

        <p className="wl-xs wl-muted">
          Payments are processed by Stripe on their own page. We never see or store your card
          number. <Link href="/legal/terms">Terms</Link> ·{' '}
          <Link href="/settings/billing">cancel any time</Link>.
        </p>
      </Panel>
    </>
  );
}
