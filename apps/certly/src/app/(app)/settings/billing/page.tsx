import Link from 'next/link';

import { Paywall } from '@/components/billing/Paywall';
import { TrialBanner } from '@/components/billing/TrialBanner';
import { TrialCta } from '@/components/billing/TrialCta';
import { UsageMeter } from '@/components/billing/UsageMeter';
import { getEnv } from '@/env';
import { addVendorPackAction, openBillingPortalAction } from '@/lib/billing/checkout';
import { certlyEntitlement } from '@/lib/billing/entitlement';
import { chargeDateLabel } from '@/lib/billing/trial';
import { getDb } from '@/lib/db';
import { formatDate } from '@/lib/engine';
import {
  METER_SENTENCE,
  TAIL_RATE_CENTS_PER_VENDOR_MONTH,
  TAIL_THRESHOLD_VENDORS,
  TIER_LIST,
  VENDOR_PACK,
  amountCentsFor,
  packPriceEnvVar,
  planKeyFor,
  type Interval,
} from '@/lib/plans';
import { latestTrialConsent } from '@/lib/repos/billing';
import { findPlan, formatAmount, priceIdFor } from '@octopus/platform/billing';
import { requireOrg } from '@octopus/platform/next';

import { plans } from '@/lib/plans';

export const dynamic = 'force-dynamic';

/**
 * PLAN & BILLING — `specs/10` §6.
 *
 * Everything money-shaped that is not "start a subscription" happens in
 * Stripe's Portal, which is why this page has no cancellation flow, no
 * proration arithmetic and no invoice rendering to get wrong.
 *
 * What it MUST carry, and each is an acceptance criterion rather than a layout
 * choice: the usage meter against the tracked-vendor limit (§6), the canonical
 * meter sentence VERBATIM (§2.1), the trial's first-charge DATE (§6), the
 * disclosure adjacent to every control that collects a card (A14), the Vendor
 * Pack as a published way out of the cap (A2), and the read-only state stated
 * plainly rather than discovered through a failed upload (§5).
 */

const ERRORS: Record<string, string> = {
  unknown_plan: 'That plan does not exist.',
  price_not_configured: 'That plan is not on sale yet — its Stripe price is not configured.',
  pack_not_configured: 'The Vendor Pack is not on sale yet — its Stripe price is not configured.',
  no_customer: 'Nothing to manage yet: this organisation has never subscribed.',
  owner_only: 'Only an owner can change billing.',
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const env = getEnv();
  const { org, membership } = await requireOrg();
  const db = await getDb();
  const entitlement = await certlyEntitlement(db, org.id, {
    env: env as unknown as Record<string, unknown>,
  });
  const consent = await latestTrialConsent(db, org.id);

  const interval: Interval = params['interval'] === 'year' ? 'year' : 'month';
  const isOwner = membership.role === 'owner';
  const error = typeof params['error'] === 'string' ? ERRORS[params['error']] : undefined;
  const packConfigured = Boolean((env as unknown as Record<string, unknown>)[packPriceEnvVar(interval)]);

  return (
    <main>
      <h1>Plan &amp; billing</h1>

      <TrialBanner entitlement={entitlement} />

      {params['checkout'] === 'success' ? (
        <p className="notice" data-testid="checkout-success">
          Your card is on file and the trial has started. Stripe emails every receipt; the first
          charge is below, dated.
        </p>
      ) : null}
      {params['checkout'] === 'cancelled' ? (
        <p className="notice">Checkout cancelled — nothing was charged.</p>
      ) : null}
      {params['pack'] === 'added' ? (
        <p className="notice" data-testid="pack-added">Vendor Pack added.</p>
      ) : null}
      {error ? <p className="notice error">{error}</p> : null}

      <section className="card" data-testid="current-plan">
        <h2 style={{ marginTop: 0 }}>Current plan</h2>
        <p>
          <strong data-testid="plan-name">
            {entitlement.tier === 'none' ? 'Free onboarding' : entitlement.planName}
          </strong>{' '}
          <span className="badge" data-testid="plan-status">
            {entitlement.status}
          </span>
          {entitlement.interval === 'year' ? <span className="badge">annual</span> : null}
        </p>

        <UsageMeter
          used={entitlement.vendorsUsed}
          limit={entitlement.vendorLimit}
          unit="tracked vendors"
          testId="vendor-meter"
        />
        <UsageMeter
          used={entitlement.seatsUsed}
          limit={entitlement.seatLimit}
          unit="seats"
          testId="seat-meter"
        />

        {entitlement.packQuantity > 0 ? (
          <p className="c-small" data-testid="pack-quantity">
            {entitlement.packQuantity} × {VENDOR_PACK.name} — {entitlement.baseVendorLimit} +{' '}
            {entitlement.packQuantity * VENDOR_PACK.increment} = {entitlement.vendorLimit} tracked
            vendors.
          </p>
        ) : null}

        {entitlement.documentLimit >= 0 ? (
          <p className="c-small c-muted" data-testid="document-allowance">
            Free onboarding includes {entitlement.documentLimit} documents; you have used{' '}
            {entitlement.documentsUsed}. Unlimited on every paid plan.
          </p>
        ) : null}

        {entitlement.trialEndsAt ? (
          <p className="c-small" data-testid="first-charge">
            First charge {chargeDateLabel(entitlement.trialEndsAt)}
            {entitlement.tier !== 'none'
              ? ` — ${formatAmount(amountCentsFor(entitlement.tier, entitlement.interval ?? 'month'))}`
              : ''}
            . Cancel before then and nothing is charged.
          </p>
        ) : null}

        {entitlement.currentPeriodEnd ? (
          <p className="c-small">
            {entitlement.cancelAtPeriodEnd ? 'Access ends' : 'Renews'}{' '}
            {formatDate(entitlement.currentPeriodEnd.toISOString().slice(0, 10))}
          </p>
        ) : null}

        {entitlement.stripeCustomerId ? (
          <form action={openBillingPortalAction}>
            <button
              className="c-btn c-btn--secondary"
              type="submit"
              disabled={!isOwner}
              data-testid="open-portal"
            >
              Manage billing in Stripe
            </button>
            <span className="c-xs c-muted" style={{ marginLeft: 'var(--c-space-3)' }}>
              Card, invoices, plan switch, Vendor Pack quantity, and cancel in one click.
            </span>
          </form>
        ) : null}
      </section>

      {entitlement.overLimit ? (
        <Paywall
          trigger="vendor"
          used={entitlement.vendorsUsed}
          limit={entitlement.vendorLimit}
          tier={entitlement.tier}
        />
      ) : null}

      <h2>Plans</h2>
      <p className="c-small">
        <Link href={`/settings/billing?interval=month`} aria-current={interval === 'month' ? 'true' : undefined}>
          Monthly
        </Link>{' '}
        ·{' '}
        <Link href={`/settings/billing?interval=year`} aria-current={interval === 'year' ? 'true' : undefined}>
          Annual — two months free
        </Link>
      </p>

      <div className="grid">
        {TIER_LIST.map((spec) => {
          const plan = findPlan(plans, planKeyFor(spec.tier, interval));
          const configured = plan
            ? Boolean(priceIdFor(plan, env as unknown as Record<string, unknown>))
            : false;
          const current = entitlement.tier === spec.tier && entitlement.interval === interval;
          return (
            <section className="card" key={spec.tier}>
              <h3 style={{ marginTop: 0 }}>{spec.name}</h3>
              <p className="small muted">{spec.tagline}</p>
              <p style={{ fontSize: 24, fontWeight: 700 }}>
                {formatAmount(amountCentsFor(spec.tier, interval))}
                <span className="small muted"> /{interval === 'year' ? 'year' : 'month'}</span>
              </p>
              <ul className="small">
                {spec.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              {current ? (
                <p className="badge">Current plan</p>
              ) : configured ? (
                <TrialCta tier={spec.tier} interval={interval} disabled={!isOwner} quiet={!spec.popular} />
              ) : (
                <p className="small muted">
                  Not configured: <code>{plan?.priceEnvVar ?? 'price'}</code>
                </p>
              )}
            </section>
          );
        })}
      </div>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>{VENDOR_PACK.name}</h2>
        <p className="c-small">
          {formatAmount(interval === 'year' ? VENDOR_PACK.annualCents : VENDOR_PACK.monthlyCents)} per{' '}
          {interval === 'year' ? 'year' : 'month'} for {VENDOR_PACK.increment} more tracked vendors,
          stackable up to {VENDOR_PACK.maxQuantity}. Adjust the quantity any time in the Portal.
        </p>
        {packConfigured ? (
          <form action={addVendorPackAction}>
            <input type="hidden" name="interval" value={interval} />
            <label className="c-field" htmlFor="pack-quantity-input">
              <span className="c-field__label">How many packs</span>
              <input
                className="c-input c-input--num"
                id="pack-quantity-input"
                name="quantity"
                type="number"
                min={1}
                max={VENDOR_PACK.maxQuantity}
                defaultValue={1}
              />
            </label>
            <button className="c-btn c-btn--secondary" type="submit" disabled={!isOwner} data-testid="add-pack">
              Add {VENDOR_PACK.name}
            </button>
          </form>
        ) : (
          <p className="small muted">
            Not configured: <code>{packPriceEnvVar(interval)}</code>
          </p>
        )}
      </section>

      <h2>What a tracked vendor is</h2>
      {/* specs/10 §2.1's canonical meter sentence, VERBATIM — the same string
          the pricing block, OFFER.md §8.1 and help article 12 carry. It is
          never paraphrased, because a meter a customer cannot predict is a
          bill they cannot predict. */}
      <p className="c-small c-muted" data-testid="meter-sentence">
        {METER_SENTENCE}
      </p>
      <p className="c-small c-muted">
        More than {TAIL_THRESHOLD_VENDORS} tracked vendors? It is $
        {(TAIL_RATE_CENTS_PER_VENDOR_MONTH / 100).toFixed(2)} each per month, invoiced —{' '}
        <a href={`mailto:${env.SUPPORT_EMAIL}`}>email us</a>, still no demo.
      </p>

      {consent ? (
        <p className="c-xs c-muted" data-testid="consent-record">
          Recorded when your trial started, {formatDate(consent.acceptedAt.toISOString().slice(0, 10))}:
          “{consent.disclosureText}”
        </p>
      ) : null}

      <p className="disclaimer">
        Payments are processed by Stripe. We never see or store your card number. We never charge your
        vendors — not for uploading a certificate, not for anything. Read{' '}
        <Link href="/legal/lapse-watch">the Lapse Watch in full</Link>.
      </p>
    </main>
  );
}
