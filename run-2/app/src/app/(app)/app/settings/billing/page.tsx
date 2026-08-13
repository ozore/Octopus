/**
 * S21 — `/app/settings/billing`.
 *
 * AUTHORITY: `USER_JOURNEY.md` §11.1 (the split with Stripe's portal and why it is
 * forced), §11.2 (non-payment never destroys data and never closes the archive),
 * §11.4 (**upgrade and downgrade are symmetric**; the auto-upgrade has a one-click
 * revert; **the cancellation-deflection coupon is deliberately not enabled**),
 * §11.5 (the refund, with the policy shown before the click and no reason field),
 * §11.6 (the credit she did not ask for), §11.7 ("Re-check my payment status", and
 * the flat refusal of a custom tier).
 *
 * ===========================================================================
 * THERE IS ONE ADDRESS IN THIS PRODUCT AND IT IS NOT ON THIS PAGE EITHER
 *
 * §11.7's last row allows exactly one billing-dispute address, outside the
 * compliance flow, because a customer who cannot pay cannot use the in-app refund
 * button and the card networks expect one. It is not rendered here: this build does
 * not publish an address, and `tests/web/app.test.ts` asserts that no route under
 * this group contains one. When one is published it goes in the copy bundle, is
 * declared in the published-address list, and every message it receives increments
 * the G5 counter with no triage.
 */

import Link from 'next/link';

import { Cents } from '@/lib/money';
import { getDb } from '@/db';

import {
  changePlanAction,
  openPortalAction,
  recheckPaymentAction,
  refundAction,
  revertUpgradeAction,
  startCheckoutAction,
} from '../../../_actions/billing';
import { readAs, requireSession } from '../../../_lib/auth';
import { billingView } from '../../../_lib/billing';
import {
  CREDIT_NOTE,
  NO_CUSTOM_TIER,
  NO_DEFLECTION_COUPON,
  PLAN_SYMMETRY_NOTE,
  RECHECK_LABEL,
  RECHECK_NOTE,
  REFUND_POLICY_HEADING,
  REFUND_POLICY_ROWS,
} from '../../../_lib/copy';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Billing — Ratepin' };

export default async function BillingPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.ReactElement> {
  const session = await requireSession('/app/settings/billing');
  const params = await searchParams;
  const db = await getDb();

  const view = await readAs(session, async (tx) =>
    billingView(db, tx, { accountId: session.accountId }),
  );

  const notice = typeof params['refund'] === 'string' ? (params['refund'] as string) : null;

  return (
    <div className="rp-stack rp-stack--section">
      <section className="rp-stack rp-measure">
        <h1>Billing</h1>
        <p className="rp-t-lead">
          {view.plan === null
            ? 'No subscription on this account.'
            : `${view.plan.name} · ${Cents.toDollarString(view.plan.priceCents)} per period`}
        </p>
        {view.entitlement.banner === null ? null : (
          <div className="rp-alert rp-alert--narrowed">
            <span className="rp-alert__glyph" aria-hidden="true">
              !
            </span>
            <div className="rp-alert__body">
              <p>{view.entitlement.banner}</p>
              <p className="rp-t-micro">
                Your archive and your export stay open in every billing state, including this one.
                A product that held a contractor’s certified-payroll archive during a card failure
                would deserve the chargeback it got.
              </p>
            </div>
          </div>
        )}
      </section>

      {/* §11.7 — the button that closes the worst failure mode in the product. */}
      <section className="rp-stack rp-measure">
        <h2>Paid, but this page disagrees?</h2>
        <p>{RECHECK_NOTE}</p>
        <form action={recheckPaymentAction}>
          <div className="rp-btn-row">
            <button type="submit" className="rp-btn rp-btn--quiet">
              {RECHECK_LABEL}
            </button>
          </div>
        </form>
      </section>

      <section className="rp-stack">
        <h2>This period</h2>
        <dl className="rp-stack rp-stack--tight">
          <div className="rp-row rp-row--between">
            <dt>Certifiable filings released</dt>
            <dd className="rp-num">{view.billableThisPeriod}</dd>
          </div>
          <div className="rp-row rp-row--between">
            <dt>Drafts generated — never billed</dt>
            <dd className="rp-num">{view.draftsThisPeriod}</dd>
          </div>
          {view.usage === null ? null : (
            <>
              <div className="rp-row rp-row--between">
                <dt>Included in your plan</dt>
                <dd className="rp-num">
                  {view.usage.includedFilings === null ? 'unlimited' : view.usage.includedFilings}
                </dd>
              </div>
              <div className="rp-row rp-row--between">
                <dt>Overage filings</dt>
                <dd className="rp-num">{view.usage.overageFilings}</dd>
              </div>
              <div className="rp-row rp-row--between">
                <dt>Overage this period</dt>
                <dd className="rp-num">{Cents.toDollarString(view.usage.overageCents)}</dd>
              </div>
              <div className="rp-row rp-row--between">
                <dt>Overage cap</dt>
                <dd className="rp-num">
                  {/*
                   * THE LABEL HAS TO NAME THE NUMBER BESIDE IT.
                   *
                   * `capCents` is `price(next) − price(current)` — the point at
                   * which staying put stops being cheaper than moving up, which is
                   * the only reading of "capped at the next tier's price" that
                   * passes §11.4's test that the upgrade be defensible as cheaper
                   * for her. `pricing.ts` says so at length and computes the
                   * subtraction. This line said "the price of the next plan" while
                   * printing the difference: on Solo it rendered "$150.00 — the
                   * price of the next plan" next to a Crew card reading $249.00.
                   */}
                  {view.usage.capCents === null
                    ? 'no cap — this is the top plan'
                    : `${Cents.toDollarString(view.usage.capCents)} — what closes the gap to the next plan`}
                </dd>
              </div>
            </>
          )}
        </dl>
        {view.usage?.approachingCap === true ? (
          <div className="rp-alert rp-alert--narrowed">
            <span className="rp-alert__glyph" aria-hidden="true">
              !
            </span>
            <div className="rp-alert__body">
              <p className="rp-alert__title">You are within reach of the overage cap</p>
              <p>
                At the cap Ratepin moves you to the next plan and stops charging overage. That is
                announced now, announced again when it fires, and reversible in one click — an
                automatic upgrade you cannot undo would be a fait accompli rather than a service.
              </p>
            </div>
          </div>
        ) : null}
      </section>

      {view.revertableUpgrade === null ? null : (
        <section className="rp-stack rp-measure">
          <h2>You were moved to a larger plan automatically</h2>
          <p className="rp-num">
            {view.revertableUpgrade.fromPlanId} → {view.revertableUpgrade.toPlanId} on{' '}
            {view.revertableUpgrade.at.toISOString().slice(0, 10)}
          </p>
          <form action={revertUpgradeAction}>
            <div className="rp-btn-row">
              <button type="submit" className="rp-btn rp-btn--quiet">
                Put me back on {view.revertableUpgrade.fromPlanId}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* §11.4 — upgrade and downgrade, same screen, same weight, same size. */}
      <section className="rp-stack">
        <h2>Plans</h2>
        <p className="rp-measure">{PLAN_SYMMETRY_NOTE}</p>
        <div className="rp-price__list">
          {view.plans.map((plan) => {
            const current = view.plan?.id === plan.id;
            const downgrade = view.downgrades.find((entry) => entry.plan.id === plan.id);
            return (
              <div className="rp-price" key={plan.id}>
                <p className="rp-price__tier">{plan.name}</p>
                <p className="rp-price__amount rp-num">
                  {Cents.toDollarString(plan.priceCents)}
                  <span className="rp-price__unit"> per period</span>
                </p>
                <ul className="rp-price__list">
                  <li className="rp-price__item">
                    {plan.includedFilings === null
                      ? 'Unlimited certified filings'
                      : `${String(plan.includedFilings)} certified filings included`}
                  </li>
                  <li className="rp-price__item">
                    {plan.overagePriceCents === null
                      ? 'No overage'
                      : `${Cents.toDollarString(plan.overagePriceCents)} per filing over the allowance`}
                  </li>
                  <li className="rp-price__item">No project cap. The plan meters filings, not jobs.</li>
                </ul>
                {downgrade === undefined ? null : (
                  <div className="rp-stack rp-stack--tight">
                    <p className="rp-t-micro">
                      What changes: {downgrade.loses.length === 0 ? 'nothing' : downgrade.loses.join('; ')}.
                    </p>
                    <p className="rp-t-micro">What does not: {downgrade.keeps.join('; ')}.</p>
                  </div>
                )}
                {current ? (
                  <p className="rp-price__terms">Your current plan.</p>
                ) : (
                  <form action={view.plan === null ? startCheckoutAction : changePlanAction}>
                    <input type="hidden" name="planId" value={plan.id} />
                    <div className="rp-btn-row">
                      <button type="submit" className="rp-btn">
                        {view.plan === null
                          ? `Start ${plan.name}`
                          : plan.priceCents > (view.plan?.priceCents ?? 0)
                            ? `Move up to ${plan.name}`
                            : `Move down to ${plan.name}`}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
        <p className="rp-t-micro">{NO_CUSTOM_TIER}</p>
      </section>

      <section className="rp-stack rp-measure">
        <h2>Cancel, change your card, download invoices</h2>
        <p>{NO_DEFLECTION_COUPON}</p>
        <form action={openPortalAction}>
          <div className="rp-btn-row">
            <button type="submit" className="rp-btn rp-btn--quiet">
              Open the billing portal
            </button>
          </div>
        </form>
        <p className="rp-t-micro">
          Invoices live in Stripe’s portal because that is where they are issued. Everything Ratepin
          holds about your money — meter events, credits, refunds — is in the tables below and in
          your export.
        </p>
      </section>

      {/* §11.5 — the policy is above the button, so there is nothing to negotiate. */}
      <section className="rp-stack">
        <h2>Refund</h2>
        <h3>{REFUND_POLICY_HEADING}</h3>
        <div className="rp-tablewrap">
          <table className="rp-table">
            <thead>
              <tr>
                <th scope="col">Situation</th>
                <th scope="col">Rule</th>
              </tr>
            </thead>
            <tbody>
              {REFUND_POLICY_ROWS.map((row) => (
                <tr key={row.situation}>
                  <th scope="row">{row.situation}</th>
                  <td>{row.rule}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {view.refundQuote === null ? (
          <p>There is no subscription on this account to refund.</p>
        ) : (
          <>
            <p className="rp-measure">{view.refundQuote.policy}</p>
            <form action={refundAction}>
              <div className="rp-btn-row">
                <button
                  type="submit"
                  className="rp-btn rp-btn--destructive"
                  aria-disabled={view.refundQuote.eligible ? undefined : true}
                  disabled={!view.refundQuote.eligible}
                >
                  Refund {Cents.toDollarString(view.refundQuote.cents)}
                </button>
              </div>
            </form>
            {view.refundQuote.eligible ? null : (
              <p className="rp-btn__why">
                The policy above does not produce a refund in this situation. There is no reason
                field and nobody to appeal to, because the rule is the whole of the decision.
              </p>
            )}
          </>
        )}
        {notice === 'no_payment' ? (
          <p className="rp-btn__why">
            Ratepin holds no completed payment for this account, so there is no charge to reverse.
          </p>
        ) : null}
        {notice === 'done' ? <p className="rp-t-data">Refund requested. It appears below.</p> : null}
      </section>

      <section className="rp-stack">
        <h2>Credits and refunds we have posted</h2>
        <p className="rp-measure">{CREDIT_NOTE}</p>
        <div className="rp-tablewrap">
          <table className="rp-table">
            <thead>
              <tr>
                <th scope="col">When</th>
                <th scope="col">What</th>
                <th scope="col" className="rp-th--num">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {[...view.credits.map((credit) => ({
                at: credit.createdAt,
                what: `Service credit — ${credit.reason}`,
                cents: credit.cents,
              })),
              ...view.refunds.map((refund) => ({
                at: refund.requestedAt,
                what: `Refund — ${refund.reasonCode}${refund.executedAt === null ? ' (requested)' : ''}`,
                cents: refund.cents,
              }))]
                .sort((a, b) => b.at.getTime() - a.at.getTime())
                .map((row) => (
                  <tr key={`${row.what}-${row.at.toISOString()}`}>
                    <th scope="row" className="rp-num">
                      {row.at.toISOString().slice(0, 10)}
                    </th>
                    <td>{row.what}</td>
                    <td className="rp-td--num">{Cents.toDollarString(Cents.of(row.cents))}</td>
                  </tr>
                ))}
              {view.credits.length + view.refunds.length === 0 ? (
                <tr>
                  <td colSpan={3}>Nothing posted.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <p>
          <Link href="/app/settings/data">Export everything, including this ledger</Link>
        </p>
      </section>
    </div>
  );
}
