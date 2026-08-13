/**
 * S08 — `/rate-card/r/[token]`, the delivery page. Twelve-month TTL, token auth.
 *
 * AUTHORITY: `USER_JOURNEY.md` §3.1 (the six things the card contains), §3.2 (**the
 * FAR panel is the most important thing on the document and it concludes nothing**),
 * §3.4 (the token is the identity; no account row exists), §3.5 (the rebuild
 * control, and the refund: "no email address, no reason field").
 *
 * ===========================================================================
 * THIS PAGE IS THE DOCUMENT, NOT A DESCRIPTION OF ONE
 *
 * It used to render a bulleted list of what the card *would* contain, with no
 * classification, no rate, no timeline and no snapshot hash on it — the $49 bought a
 * page describing a document that did not exist, and the only links on it went back
 * to the purchase form. The card is now rendered here, from the mirror, at the
 * revision the buyer names.
 *
 * WHY THE DETERMINATION IS CHOSEN HERE RATHER THAN CARRIED FROM CHECKOUT. §3.5
 * already promises unlimited free rebuilds for a different determination inside the
 * refund window — "that is cheaper for both of us than a refund and it fixes the
 * actual problem". A card bound at purchase would make the rebuild a second sale.
 * The token is the entitlement; the determination is a parameter of it. The rebuild
 * control therefore points HERE, not at `/rate-card`, which would have asked the
 * buyer for another $49 to fix our own mis-resolution.
 *
 * WHAT IS STILL REFUSED ON THIS PAGE. The conclusion. FAR 22.404-6 turns on a
 * finding by the contracting officer that Ratepin cannot observe, so the panel states
 * the rule, prints the observable dates and stops — on the delivered document exactly
 * as on the preview.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { sql } from 'drizzle-orm';

import { getDb, rowsOf } from '@/db';
import { Cents } from '@/lib/money';
import { wdNumber as toWdNumber } from '@/lib/types';
import { RATE_CARD_REFUND_WINDOW_DAYS } from '@/platform/billing/catalog';
import { quoteRateCardRefund } from '@/platform/billing/refunds';

import {
  activeDetermination,
  classificationsOf,
  corpusState,
  revisionsHeld,
} from '../../../../(free)/_data/mirror';
import { appClock } from '../../../_lib/deps';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Your rate card — Ratepin',
  robots: { index: false, follow: false },
};

function rate(milli: number): string {
  return (milli / 10000).toFixed(2);
}

export default async function RateCardDeliveryPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly token: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.ReactElement> {
  const { token } = await params;
  const query = await searchParams;
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

  const raw = typeof query['wd'] === 'string' ? (query['wd'] as string).toUpperCase() : '';
  const shaped = /^[A-Z]{2}\d{8}$/.test(raw);
  const held = shaped && !expired ? await activeDetermination(db, toWdNumber(raw)) : null;
  const classifications =
    held === null ? [] : await classificationsOf(db, held.wdNumber, held.revision);
  const revisions = held === null ? [] : await revisionsHeld(db, held.wdNumber);
  const corpus = expired ? null : await corpusState(db, now);

  // The per-classification diff §3.1 names: what each classification's base and
  // fringe were at the previous revision we hold, and nothing where we hold none.
  const previous = revisions
    .filter((entry) => held !== null && entry.revision < held.revision)
    .sort((a, b) => b.revision - a.revision)[0];
  const previousClasses =
    held === null || previous === undefined
      ? []
      : await classificationsOf(db, held.wdNumber, previous.revision);
  const previousByName = new Map(previousClasses.map((entry) => [entry.classNameNorm, entry]));

  return (
    <div className="rp-stack rp-stack--section">
      <section className="rp-stack rp-measure">
        <h1>Your rate card</h1>
        <p className="rp-t-lead rp-num">
          Bought {purchasedAt.toISOString().slice(0, 10)} · link good until{' '}
          {expiresAt.toISOString().slice(0, 10)}
        </p>
      </section>

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
        <>
          {/* The determination selector. This is the rebuild control §3.5 promises,
              and it is free and unlimited: the token is the entitlement. */}
          <form className="rp-stack" action={`/rate-card/r/${token}`}>
            <div className="rp-field">
              <label className="rp-field__label" htmlFor="wd">
                Wage determination number
              </label>
              <input
                id="wd"
                name="wd"
                className="rp-input rp-input--num"
                defaultValue={raw}
                placeholder="TN20260151"
                autoComplete="off"
              />
              <p className="rp-field__help">
                Build the card for any determination in the published record we mirror, as many
                times as you like, for as long as this link lives. A wrong county is a rebuild, not
                a second purchase and not a refund.
              </p>
            </div>
            <div className="rp-btn-row">
              <button type="submit" className="rp-btn rp-btn--primary">
                Build the card
              </button>
            </div>
          </form>

          {raw !== '' && held === null ? (
            <div className="rp-alert rp-alert--declined">
              <span className="rp-alert__glyph" aria-hidden="true">
                §
              </span>
              <div className="rp-alert__body">
                <p className="rp-alert__title">
                  {raw} is not in the active published record Ratepin holds
                </p>
                <p>
                  Ratepin does not conclude that this determination does not exist. It concludes
                  only that it is not in the published record we mirror — a project wage
                  determination issued directly to a contracting agency is never published. Try
                  another number, or take the refund below; the button is on this page and there is
                  no reason field.
                </p>
              </div>
            </div>
          ) : null}

          {held === null ? null : (
            <>
              <section className="rp-stack">
                <h2 className="rp-num">
                  {String(held.wdNumber)} revision {held.revision}
                </h2>
                <p className="rp-num">
                  Published {String(held.publishDate)} · {classifications.length} classifications ·{' '}
                  {held.constructionTypes.join(', ')}
                </p>
                <div className="rp-tablewrap">
                  <table className="rp-table">
                    <caption className="rp-sr-only">
                      Every classification on {String(held.wdNumber)} revision {held.revision}, with
                      its base and fringe rate, the line span in the source text, and what it was at
                      the previous revision we hold.
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Classification</th>
                        <th scope="col">Group</th>
                        <th scope="col" className="rp-th--num">
                          Base
                        </th>
                        <th scope="col" className="rp-th--num">
                          Fringe
                        </th>
                        <th scope="col" className="rp-th--num">
                          Lines
                        </th>
                        <th scope="col" className="rp-th--num">
                          {previous === undefined
                            ? 'Earlier revision'
                            : `At revision ${String(previous.revision)}`}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {classifications.map((classification) => {
                        const before = previousByName.get(classification.classNameNorm);
                        return (
                          <tr key={classification.id}>
                            <th scope="row">{classification.className}</th>
                            <td className="rp-num">{classification.rateIdentifier}</td>
                            <td className="rp-td--num">{rate(classification.baseRate)}</td>
                            <td className="rp-td--num">{rate(classification.fringeRate)}</td>
                            <td className="rp-td--num">
                              {classification.sourceLineStart}–{classification.sourceLineEnd}
                            </td>
                            <td className="rp-td--num">
                              {previous === undefined
                                ? 'no earlier revision held'
                                : before === undefined
                                  ? 'not on that revision'
                                  : `${rate(before.baseRate)} / ${rate(before.fringeRate)}`}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="rp-stack">
                <h3>Modification timeline</h3>
                <div className="rp-tablewrap">
                  <table className="rp-table">
                    <caption className="rp-sr-only">
                      Every revision of {String(held.wdNumber)} Ratepin holds.
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col">Revision</th>
                        <th scope="col">Published</th>
                        <th scope="col">Superseded</th>
                        <th scope="col" className="rp-th--num">
                          Classifications
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {revisions.map((entry) => (
                        <tr key={entry.revision}>
                          <th scope="row" className="rp-num">
                            {entry.revision}
                          </th>
                          <td className="rp-num">{String(entry.publishDate)}</td>
                          <td className="rp-num">
                            {entry.supersededOn === null ? 'current' : String(entry.supersededOn)}
                          </td>
                          <td className="rp-td--num">{entry.classCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* §3.2 — the panel that concludes nothing, on the delivered document
                  and not only on the preview. */}
              <div className="rp-alert rp-alert--declined">
                <span className="rp-alert__glyph" aria-hidden="true">
                  §
                </span>
                <div className="rp-alert__body rp-stack rp-stack--tight">
                  <p className="rp-alert__title">
                    Effectiveness — what we can show, and what we will not say
                  </p>
                  <p className="rp-num">
                    Revision {held.revision} of {String(held.wdNumber)} was published{' '}
                    {String(held.publishDate)}.
                  </p>
                  <p>
                    FAR 22.404-6 governs which revision applies to a contract, and the answer can
                    turn on a finding by the contracting officer — a finding Ratepin cannot observe.
                  </p>
                  <p>
                    <strong>
                      Ratepin does not conclude which revision is effective for your contract.
                    </strong>{' '}
                    The dates on this card are what we can see. The determination incorporated into
                    your solicitation, and any amendment your contracting officer issues, govern.
                  </p>
                </div>
              </div>

              <section className="rp-stack rp-measure">
                <h3>Where this came from</h3>
                <p className="rp-t-data rp-num">
                  Corpus snapshot {corpus?.snapshotRef === null ? 'none' : String(corpus?.snapshotRef)}{' '}
                  · merkle root{' '}
                  {corpus?.merkleRoot === null || corpus?.merkleRoot === undefined
                    ? 'none'
                    : String(corpus.merkleRoot).slice(0, 16)}{' '}
                  · determination sha256 {String(held.canonicalSha256).slice(0, 16)} · built{' '}
                  {now.toISOString().slice(0, 16).replace('T', ' ')} UTC
                </p>
                <p className="rp-t-micro">
                  Those four values are what makes this document reproducible from stored data
                  eighteen months from now. Print this page to keep a copy; the link rebuilds it
                  from the same snapshot until it expires.
                </p>
              </section>
            </>
          )}
        </>
      )}

      <section className="rp-stack rp-measure">
        <h2>Refund</h2>
        <p>{quote.policy}</p>
        {quote.eligible ? (
          <p>
            Sign in with the address you bought this with and the refund button is on your billing
            screen — no email address, no reason field, and this link keeps working afterwards.
            Clawing back a document you have already read would be theatre.
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
