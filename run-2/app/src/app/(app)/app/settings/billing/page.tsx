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
  refundRateCardAction,
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

interface Outcome {
  readonly key: string;
  readonly tone: 'narrowed' | 'declined';
  readonly title: string;
  readonly detail: string;
}

/**
 * The six redirect parameters `_actions/billing.ts` can produce, and what each one
 * means.
 *
 * THIS IS AN ENUMERATION, NOT A BEST EFFORT. Every `redirect()` in that file lands
 * here: `?error=` from checkout, plan change, revert and portal; `?changed=`;
 * `?reverted=`; `?rechecked=`; `?refund=`. The screen used to read exactly one of
 * them, so `Re-check my payment status` — which §11.7 calls "the whole of the
 * escalation path" — and `Open the billing portal`, which is the only route to
 * cancellation, both returned a byte-identical page and no information at all.
 *
 * Each sentence names what is true now and what she can do next ON THIS SCREEN.
 * There is no address in any of them, because there is no address; what replaces it
 * is that every state has a control beside it.
 */
function billingOutcomes(params: Record<string, string | string[] | undefined>): readonly Outcome[] {
  const read = (name: string): string | null =>
    typeof params[name] === 'string' ? (params[name] as string) : null;
  const outcomes: Outcome[] = [];

  const rechecked = read('rechecked');
  if (rechecked !== null) {
    const said: Readonly<Record<string, string>> = {
      active:
        'Stripe reports this subscription as active, and that is now what this page shows. If it ' +
        'read restricted a moment ago, a webhook was dropped and this check replaced it.',
      trialing: 'Stripe reports this subscription as trialing, and that is now what this page shows.',
      past_due:
        'Stripe reports this subscription as past due. The card was charged and declined; your ' +
        'archive and export stay open, and updating the card in the portal below resolves it.',
      canceled: 'Stripe reports this subscription as cancelled. Your archive and export stay open.',
      unpaid:
        'Stripe reports this subscription as unpaid. Your archive and export stay open; the plan ' +
        'cards below start a new subscription whenever you want one.',
      none:
        'Stripe answered, and it holds no status for this subscription. Nothing on this page ' +
        'changed, because there was nothing to apply.',
      no_subscription:
        'There is no subscription on this account to re-check. If you have just paid, the plan ' +
        'cards below are what start one; nothing was charged and nothing is pending.',
    };
    outcomes.push({
      key: 'rechecked',
      tone: 'narrowed',
      title: 'We asked Stripe directly',
      detail:
        said[rechecked] ??
        `Stripe answered "${rechecked}", which is a status this screen does not have a sentence ` +
          'for. It has been applied to your entitlement exactly as Stripe reported it.',
    });
  }

  const changed = read('changed');
  if (changed !== null) {
    outcomes.push({
      key: 'changed',
      tone: 'narrowed',
      title: changed === 'upgrade' ? 'You moved up a plan' : 'You moved down a plan',
      detail:
        changed === 'upgrade'
          ? 'The change is immediate and prorated — you are charged for the difference for the days ' +
            'left in this period, not a second full month.'
          : 'The change takes effect at the end of this period, because you have already paid for ' +
            'it. Nothing about your archive changes at either end.',
    });
  }

  if (read('reverted') !== null) {
    outcomes.push({
      key: 'reverted',
      tone: 'narrowed',
      title: 'You are back on the plan you chose',
      detail:
        'The automatic upgrade has been reversed and prorated back. The overage job will not move ' +
        'you again for the rest of this period — your choice ends the question rather than ' +
        'postponing it by an hour.',
    });
  }

  const error = read('error');
  if (error !== null) {
    const said: Readonly<Record<string, string>> = {
      unknown_plan:
        'That plan is not one we sell. Nothing was charged. The plans below are the whole ladder; ' +
        'there is no custom tier and no quote.',
      no_subscription:
        'There is no subscription on this account, so there was nothing to change. Starting one is ' +
        'a button on any plan card below.',
      same_plan: 'That is already your plan, so nothing was changed and nothing was charged.',
      no_auto_upgrade:
        'There is no automatic upgrade on this account to reverse. If you moved plans yourself, ' +
        'moving back is a button on the plan cards below.',
      no_customer:
        'Ratepin holds no Stripe customer for this account yet, so the hosted portal has nothing ' +
        'to open — the portal is where a card and its invoices live, and this account has never ' +
        'had one. Starting a plan below creates it; until then there is no card to change, no ' +
        'invoice to download and nothing to cancel.',
    };
    outcomes.push({
      key: 'error',
      tone: 'declined',
      title: 'That did not happen, and nothing was charged',
      detail:
        said[error] ??
        'That request did not complete and nothing on this account was changed. Every control on ' +
        'this screen is safe to press again.',
    });
  }

  return outcomes;
}

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
  const outcomes = billingOutcomes(params);

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

      {/* Every outcome any action on this screen can redirect with. A redirect
          parameter no branch renders is a byte-identical page reload, which tells the
          customer nothing about whether the thing ran, found nothing, or did not run
          — and under A3 there is nobody to ask. */}
      {outcomes.map((outcome) => (
        <div key={outcome.key} className={`rp-alert rp-alert--${outcome.tone}`}>
          <span className="rp-alert__glyph" aria-hidden="true">
            {outcome.tone === 'declined' ? '§' : '!'}
          </span>
          <div className="rp-alert__body rp-stack rp-stack--tight">
            <p className="rp-alert__title">{outcome.title}</p>
            <p>{outcome.detail}</p>
          </div>
        </div>
      ))}

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
          {/* The consequence, stated before the click rather than discovered after
              it. The overage job reads this decision and stops re-firing, which is
              what makes the button an undo rather than an hour's delay. */}
          <p className="rp-btn__why">
            Pressing this puts you back on {view.revertableUpgrade.fromPlanId} and prorates the
            difference back. It also settles the question for the rest of this billing period:
            Ratepin will not move you up again automatically before it renews, however many filings
            you release. Overage is charged as usual, and the cap above is what it can reach.
          </p>
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
        {/* The $49 card, which is a separate purchase with a separate policy and its
            own button. The delivery page sends the buyer here for it. */}
        {view.rateCardRefund === null ? null : (
          <div className="rp-stack rp-stack--tight">
            <h3>The bid rate card you bought</h3>
            <p className="rp-num">
              Bought {view.rateCardRefund.purchasedAt.toISOString().slice(0, 10)}
            </p>
            <p className="rp-measure">{view.rateCardRefund.quote.policy}</p>
            {view.rateCardRefund.alreadyRefunded ? (
              <p className="rp-btn__why">
                This card has already been refunded. It appears in the ledger below and the
                document stays downloadable — clawing back something you have read would be
                theatre.
              </p>
            ) : view.rateCardRefund.paymentIntentId === null ? (
              <p className="rp-btn__why">
                Ratepin holds no completed charge for this purchase in Stripe’s event ledger, so
                there is nothing here to reverse. Nothing was taken twice.
              </p>
            ) : (
              <form action={refundRateCardAction}>
                <div className="rp-btn-row">
                  <button
                    type="submit"
                    className="rp-btn rp-btn--destructive"
                    disabled={!view.rateCardRefund.quote.eligible}
                  >
                    Refund {Cents.toDollarString(view.rateCardRefund.quote.cents)}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {view.refundQuote === null ? (
          <p>
            {view.rateCardRefund === null
              ? 'There is no subscription and no one-time purchase on this account to refund.'
              : 'There is no subscription on this account; the one-time purchase above is what ' +
                'there is to refund.'}
          </p>
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
        {notice === 'no_rate_card' ? (
          <p className="rp-btn__why">
            There is no bid rate card attached to this account. A card attaches itself when you
            sign in with the address you bought it with; nothing needs to be reconciled by hand.
          </p>
        ) : null}
        {notice === 'already_refunded' ? (
          <p className="rp-btn__why">
            That purchase has already been refunded, and it appears in the ledger below. Pressing
            the button twice refunds once.
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
