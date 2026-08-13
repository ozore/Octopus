/**
 * S08 — `/rate-card/r/[token]`, the delivery page. Twelve-month TTL, token auth.
 *
 * AUTHORITY: `USER_JOURNEY.md` §3.1 (the six things the card contains), §3.4 (the
 * token is the identity; no account row exists), §3.5 (the rebuild control, and the
 * refund button: "no email address, no reason field").
 *
 * The refund here does not write a `refunds` row, and that is a schema fact rather
 * than an omission: `refunds.account_id` is NOT NULL and this purchase has no
 * account by construction (§3.4). So the control states the policy and the window,
 * and the refund is executed against Stripe when the buyer has an account to attach
 * it to — which signing in with the same address creates. The policy is printed
 * either way, because a policy a buyer cannot read is a negotiation.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { sql } from 'drizzle-orm';

import { getDb, rowsOf } from '@/db';
import { Cents } from '@/lib/money';
import { RATE_CARD_REFUND_WINDOW_DAYS } from '@/platform/billing/catalog';
import { quoteRateCardRefund } from '@/platform/billing/refunds';

import { appClock } from '../../../_lib/deps';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Your rate card — Ratepin' };

export default async function RateCardDeliveryPage({
  params,
}: {
  readonly params: Promise<{ readonly token: string }>;
}): Promise<React.ReactElement> {
  const { token } = await params;
  const db = await getDb();
  const now = appClock().now();

  const purchase = rowsOf<{
    id: string;
    email: string;
    cents: number | string;
    purchased_at: string | Date;
    expires_at: string | Date;
    claimed_by_account_id: string | null;
  }>(
    await db.execute(sql`
      SELECT id, email, cents, purchased_at, expires_at, claimed_by_account_id
        FROM rate_card_purchases WHERE delivery_token = ${token}
    `),
  )[0];

  if (!purchase) notFound();

  const purchasedAt = new Date(purchase.purchased_at);
  const expiresAt = new Date(purchase.expires_at);
  const expired = now.getTime() >= expiresAt.getTime();
  const quote = quoteRateCardRefund({
    priceCents: Cents.of(Number(purchase.cents)),
    purchasedAt,
    now,
  });

  return (
    <div className="rp-stack rp-stack--section rp-measure">
      <h1>Your rate card</h1>
      <p className="rp-t-lead rp-num">
        Bought {purchasedAt.toISOString().slice(0, 10)} · link good until{' '}
        {expiresAt.toISOString().slice(0, 10)}
      </p>

      {expired ? (
        <div className="rp-alert rp-alert--narrowed">
          <span className="rp-alert__glyph" aria-hidden="true">
            !
          </span>
          <div className="rp-alert__body">
            <p className="rp-alert__title">This link expired</p>
            <p>
              Rate-card links are kept twelve months and then deleted. Nothing was billed again and
              nothing is being kept.
            </p>
          </div>
        </div>
      ) : (
        <section className="rp-stack">
          <h2>What is on it</h2>
          <ul className="rp-stack rp-stack--tight">
            <li>
              Every selected classification: group id, verbatim label, base rate, fringe rate, and
              the line span in the determination text.
            </li>
            <li>The determination number, revision number and publication date, on every page.</li>
            <li>The per-classification diff against every earlier revision inside your window.</li>
            <li>
              The determination’s modification timeline: each revision, its publication date, and
              which of your classifications moved at each.
            </li>
            <li>
              The effectiveness panel, which states FAR 22.404-6, shows the observable dates, and
              draws no conclusion about which revision applies to your contract.
            </li>
            <li>The corpus snapshot hash and the generation timestamp.</li>
          </ul>
        </section>
      )}

      <section className="rp-stack">
        <h2>Wrong determination?</h2>
        <p>
          Rebuild this card for a different one, free, within {RATE_CARD_REFUND_WINDOW_DAYS} days,
          as many times as you need. That is cheaper for both of us than a refund and it fixes the
          actual problem.
        </p>
        <p>
          <Link className="rp-btn rp-btn--quiet" href="/rate-card">
            Rebuild for another determination
          </Link>
        </p>
      </section>

      <section className="rp-stack">
        <h2>Refund</h2>
        <p>{quote.policy}</p>
        {quote.eligible ? (
          <p>
            Sign in with <span className="rp-num">{purchase.email}</span> and the refund button is
            on your billing screen — no email address, no reason field, and this link keeps working
            afterwards. Clawing back a document you have already read would be theatre.
          </p>
        ) : null}
        <p>
          <Link href={`/signin?next=${encodeURIComponent('/app/settings/billing')}`}>
            Sign in with that address
          </Link>
        </p>
      </section>
    </div>
  );
}
