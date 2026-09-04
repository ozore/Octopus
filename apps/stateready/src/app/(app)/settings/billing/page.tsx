import Link from 'next/link';

import { getEnv } from '@/env';
import { openPortalAction, startCheckoutAction, submitEnterpriseEnquiryAction } from '@/lib/actions';
import { ENTERPRISE_QUOTE_PROMISE } from '@/lib/billing/enterprise';
import { listOneOffPurchases, pendingCredit } from '@/lib/billing/one-off';
import { getDb } from '@/lib/db';
import { getEntitlements } from '@/lib/entitlements';
import { ENTERPRISE_STATE_THRESHOLD, plans, TRIAL_DAYS } from '@/lib/plans';
import { formatAmount, priceIdFor } from '@octopus/platform/billing';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

const ERRORS: Record<string, string> = {
  unknown_plan: 'That plan does not exist.',
  price_not_configured: 'That plan is not on sale yet — its Stripe price is not configured.',
  no_customer: 'Nothing to manage yet: this organisation has never subscribed.',
};

function Bar({ used, limit, label }: { used: number; limit: number; label: string }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div style={{ marginBlockEnd: 12 }}>
      <div className="small" style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>{label}</span>
        <span className="mono">
          {used} / {limit}
        </span>
      </div>
      <div style={{ background: 'var(--sr-sunken)', blockSize: 8, borderRadius: 4 }}>
        <div
          style={{
            inlineSize: `${pct}%`,
            blockSize: 8,
            borderRadius: 4,
            background: pct >= 100 ? 'var(--sr-risk)' : 'var(--sr-ink-2)',
          }}
        />
      </div>
    </div>
  );
}

/**
 * `/settings/billing` — `specs/09` §Screens.
 *
 * Both limits get a bar, and they are not the same kind of limit: **states are
 * the plan and technicians are a fair-use band**. Over the band the message
 * asks; it does not block, and it says so on the page, because a customer who
 * is stopped from recording a licence they legally hold is a customer with a
 * compliance gap we created.
 */
export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const env = getEnv();
  const { org, membership } = await requireOrg();
  const db = await getDb();
  const ent = await getEntitlements(db, org.id);
  const credit = await pendingCredit(db, org.id);
  const purchases = await listOneOffPurchases(db, org.id);
  const error = typeof params['error'] === 'string' ? ERRORS[params['error']] : undefined;
  const isOwner = membership.role === 'owner';

  return (
    <main>
      <h1>Billing</h1>

      {params['checkout'] === 'success' ? (
        <p className="notice" data-testid="checkout-success">
          Payment received. Stripe emails the receipt; your plan is below. If the plan still says the old
          one, give the webhook a few seconds and reload — the redirect grants nothing on its own.
        </p>
      ) : null}
      {params['checkout'] === 'cancelled' ? <p className="notice">Checkout cancelled — nothing was charged.</p> : null}
      {params['enquiry'] === 'sent' ? (
        <p className="notice" data-testid="enquiry-sent">
          Sent. {ENTERPRISE_QUOTE_PROMISE[0]?.toUpperCase()}
          {ENTERPRISE_QUOTE_PROMISE.slice(1)}.
        </p>
      ) : null}
      {error ? <p className="notice error">{error}</p> : null}

      {ent.trial.onTrial ? (
        <p className="notice" data-testid="trial-banner">
          <strong>
            {ent.trial.daysLeft} day{ent.trial.daysLeft === 1 ? '' : 's'} left of your {TRIAL_DAYS}-day trial.
          </strong>{' '}
          No card, nothing to cancel. On day {TRIAL_DAYS} the account becomes read-only: everything you have
          entered stays and exports keep working, and new entries and alerts pause until you choose a plan.
        </p>
      ) : null}
      {ent.readOnly ? (
        <p className="notice warn" data-testid="read-only-banner">
          <strong>This account is read-only.</strong>{' '}
          {ent.readOnlyReason === 'past_due'
            ? 'The last payment did not go through and the retry window has closed.'
            : 'Your trial has ended.'}{' '}
          Your licences, dates, citations and exports all still work. Alerts are paused — we are telling you
          rather than going quiet.
        </p>
      ) : null}
      {ent.inGrace ? (
        <p className="notice warn">
          Your last payment failed. Access stays on while Stripe retries
          {ent.graceEndsAt ? ` until ${ent.graceEndsAt.toISOString().slice(0, 10)}` : ''}; update the card
          below.
        </p>
      ) : null}

      <section className="card" data-testid="current-plan">
        <h2 style={{ marginTop: 0 }}>Current plan</h2>
        <p>
          <strong data-testid="plan-name">{ent.planName}</strong> <span className="badge">{ent.status}</span>
        </p>
        <Bar used={ent.statesUsed} limit={ent.stateLimit} label="States" />
        <Bar used={ent.techniciansUsed} limit={ent.technicianLimit} label="Technicians (fair use)" />
        {ent.technicianGuardrailExceeded ? (
          <p className="small" data-testid="technician-guardrail">
            You are over the {ent.technicianLimit}-technician fair-use band — let us move you up. Nothing
            stops working in the meantime.
          </p>
        ) : null}
        {ent.entitlement.currentPeriodEnd ? (
          <p className="small">
            {ent.entitlement.cancelAtPeriodEnd ? 'Ends' : 'Renews'}{' '}
            {ent.entitlement.currentPeriodEnd.toISOString().slice(0, 10)}
          </p>
        ) : null}
        {ent.entitlement.stripeCustomerId ? (
          <form action={openPortalAction}>
            <button className="button secondary" type="submit" disabled={!isOwner}>
              Manage billing in Stripe
            </button>
          </form>
        ) : null}
      </section>

      {credit && !credit.expired ? (
        <section className="card" data-testid="entry-pack-credit">
          <h2 style={{ marginTop: 0 }}>Your State Entry Pack credit</h2>
          <p>
            <strong>{formatAmount(credit.amountCents)}</strong> comes off an annual plan taken before{' '}
            {credit.expiresAt.toISOString().slice(0, 10)}.
          </p>
          <p className="small muted">
            One credit per customer, and it is the larger one if you have bought more than one pack — never
            two. It applies to an annual plan only; a monthly plan leaves it here, waiting.
          </p>
        </section>
      ) : null}

      <h2>Plans</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(15rem, 1fr))', gap: 16 }}>
        {plans.plans.map((plan) => {
          const configured = Boolean(priceIdFor(plan, env));
          const current = ent.entitlement.planKey === plan.key;
          return (
            <section className="card" key={plan.key}>
              <h3 style={{ marginTop: 0 }}>{plan.name}</h3>
              <p className="small muted">{plan.tagline}</p>
              <p style={{ fontSize: 24, fontWeight: 700 }}>
                {formatAmount(plan.amountCents, plan.currency)}
                <span className="small muted"> /{plan.interval}</span>
              </p>
              <ul className="small">
                {(plan.features ?? []).map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
              {current ? (
                <p className="badge">Current plan</p>
              ) : configured ? (
                <form action={startCheckoutAction}>
                  <input type="hidden" name="planKey" value={plan.key} />
                  <button className="button" type="submit" disabled={!isOwner} data-testid={`checkout-${plan.key}`}>
                    {ent.entitlement.active ? `Switch to ${plan.name}` : `Start ${plan.name}`}
                  </button>
                </form>
              ) : (
                <p className="small muted">
                  Not configured: <code>{plan.priceEnvVar}</code>
                </p>
              )}
            </section>
          );
        })}
      </div>

      <section className="card" data-testid="enterprise-row">
        <h2 style={{ marginTop: 0 }}>Enterprise — contact us</h2>
        <p className="small muted">
          Over {ENTERPRISE_STATE_THRESHOLD} states, or unlimited. There is no self-serve path and no
          published price: we have no honest basis for one, and a made-up number would rot the whole card.
          What we promise is {ENTERPRISE_QUOTE_PROMISE}.
        </p>
        <form action={submitEnterpriseEnquiryAction} className="stack">
          <div>
            <label htmlFor="message">Anything we should know (optional)</label>
            <textarea id="message" name="message" rows={3} />
          </div>
          <button className="button secondary" type="submit" data-testid="enterprise-enquiry">
            Ask for an Enterprise quote
          </button>
        </form>
      </section>

      {purchases.length > 0 ? (
        <section className="card">
          <h2 style={{ marginTop: 0 }}>One-off purchases</h2>
          <table>
            <thead>
              <tr>
                <th>What</th>
                <th>Amount</th>
                <th>Status</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr key={purchase.id}>
                  <td className="small">{purchase.sku ?? purchase.kind}</td>
                  <td className="small mono">{formatAmount(purchase.amountCents)}</td>
                  <td className="small">{purchase.status}</td>
                  <td className="small">{purchase.createdAt.toISOString().slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {!isOwner ? <p className="small muted">Only an owner can change billing.</p> : null}
      <p className="disclaimer">
        Payments are processed by Stripe. We never see or store your card number. Prices in USD.{' '}
        <Link href="/legal/refunds">Refunds and guarantees</Link>.
      </p>
    </main>
  );
}
