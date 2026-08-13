/**
 * S06 — `/rate-card`, the bid rate card configurator.
 *
 * AUTHORITY: `USER_JOURNEY.md` §3.1 (the six things the card contains), §3.2 (**the
 * FAR panel is the most important thing on the document and it concludes nothing**),
 * §3.4 (no account is created), §3.5 (the unhappy paths — including the one where we
 * refuse the sale, and the one where a determination number cannot be resolved and
 * we never take money for an input we cannot resolve).
 *
 * A1's sharpest test: money changes hands with no account, no call and no quote.
 */

import Link from 'next/link';

import { RATE_CARD_PRICE_CENTS } from '@/platform/billing/catalog';
import { Cents } from '@/lib/money';
import { getDb } from '@/db';
import { wdNumber as toWdNumber } from '@/lib/types';

import { buyRateCardAction } from '../_actions/rate-card';
import { appClock } from '../_lib/deps';
import { activeDetermination, classificationsOf, corpusState, revisionsHeld } from '../_lib/mirror';
import { effectivenessDeclined, notInPublishedRecord } from '../_lib/refusals';
import { RefusalView } from '@/app/_components/refusal';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Bid rate card — Ratepin',
  description:
    'A dated rate card for the classifications you are bidding, with the per-classification diff ' +
    'against every earlier revision and the observable dates around FAR 22.404-6.',
};

export default async function RateCardPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.ReactElement> {
  const params = await searchParams;
  const db = await getDb();
  const now = appClock().now();
  const corpus = await corpusState(db, now);

  const raw = typeof params['wd'] === 'string' ? (params['wd'] as string).toUpperCase() : '';
  const refused = typeof params['refused'] === 'string' ? (params['refused'] as string) : null;

  const shaped = /^[A-Z]{2}\d{8}$/.test(raw);
  const held = shaped ? await activeDetermination(db, toWdNumber(raw)) : null;
  const classifications = held === null ? [] : await classificationsOf(db, held.wdNumber, held.revision);
  const revisions = held === null ? [] : await revisionsHeld(db, held.wdNumber);

  const stale = corpus.levels.some((level) => level === 'L2_STALE' || level === 'L3_QUARANTINE');

  return (
    <div className="rp-stack rp-stack--section">
      <section className="rp-stack rp-measure">
        <h1>Bid rate card</h1>
        <p className="rp-t-lead">
          {Cents.toDollarString(Cents.of(RATE_CARD_PRICE_CENTS))}, one time. No account, no call, no
          quote. You type an email address into Stripe’s checkout and that is the only identity we
          get and the only one we need.
        </p>
        <p>
          The card carries every classification on the determination with its group id, verbatim
          label, base and fringe rate and the line span in the source text; the determination
          number, revision and publication date on every page; the per-classification diff against
          every earlier revision we hold; the determination’s modification timeline; the
          effectiveness panel below; and the corpus snapshot hash, so the document is reproducible
          from stored data eighteen months later.
        </p>
      </section>

      <form className="rp-stack" action="/rate-card">
        <div className="rp-field">
          <label className="rp-field__label" htmlFor="wd">
            Wage determination number
          </label>
          <input
            id="wd"
            name="wd"
            className="rp-input rp-input--num"
            defaultValue={raw}
            placeholder="CA20260012"
            autoComplete="off"
          />
          <p className="rp-field__help">
            The number off the solicitation. Ratepin resolves it before Checkout opens — we never
            take money for an input we cannot resolve.
          </p>
        </div>
        <div className="rp-btn-row">
          <button type="submit" className="rp-btn rp-btn--quiet">
            Look it up
          </button>
        </div>
      </form>

      {raw !== '' && held === null ? (
        <RefusalView
          refusal={notInPublishedRecord(raw, {
            kind: 'link',
            label: 'Use the free WH-347 generator instead',
            href: '/wh347',
          })}
        />
      ) : null}

      {held === null ? null : (
        <>
          <section className="rp-stack">
            <h2 className="rp-num">
              {String(held.wdNumber)} revision {held.revision}
            </h2>
            <p className="rp-num">
              Published {String(held.publishDate)} · {classifications.length} classifications ·
              revisions held: {revisions.map((revision) => revision.revision).join(', ')}
            </p>
            <div className="rp-tablewrap">
              <table className="rp-table">
                <caption className="rp-sr-only">Preview of this determination’s classifications</caption>
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
                  </tr>
                </thead>
                <tbody>
                  {classifications.slice(0, 8).map((classification) => (
                    <tr key={classification.id}>
                      <th scope="row">{classification.className}</th>
                      <td className="rp-num">{classification.rateIdentifier}</td>
                      <td className="rp-td--num">{(classification.baseRate / 10000).toFixed(2)}</td>
                      <td className="rp-td--num">{(classification.fringeRate / 10000).toFixed(2)}</td>
                      <td className="rp-td--num">
                        {classification.sourceLineStart}–{classification.sourceLineEnd}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="rp-t-micro">
              A watermarked preview, so you can see exactly what you are buying before you pay.
            </p>
          </section>

          {/* §3.2 — the panel that concludes nothing, shown before purchase. One
              constructor, three screens: `_lib/refusals.ts`. */}
          <RefusalView
            refusal={effectivenessDeclined([
              { label: 'Determination', value: String(held.wdNumber) },
              { label: 'Revision shown here', value: String(held.revision) },
              { label: 'Published', value: String(held.publishDate) },
            ])}
          />

          {stale || refused === 'stale' ? (
            /* §3.5 — WE REFUSE THE MONEY. Not a warning above a live button: the
               button is replaced, because a rate card is a claim about what is
               current and we have not verified that claim. */
            <RefusalView
              refusal={{
                primitive: 'P-S',
                headline: `We’re not selling a rate card for ${String(held.wdNumber)} right now`,
                blocked:
                  'A rate card is a claim about what is current, so the sale is off until our ' +
                  'newer-revision check for this determination clears.',
                because:
                  corpus.verifiedAt === null
                    ? 'No corpus snapshot has been promoted yet.'
                    : `Our newer-revision check for this determination last completed ${corpus.verifiedAt.toISOString().slice(0, 16).replace('T', ' ')} UTC.`,
                clearedBy: null,
                clearsItself:
                  'It clears itself — nothing is required of you. The free generator still works, ' +
                  'and the county rate pages still answer from the last snapshot that passed every ' +
                  'gate, dated.',
                severity: 'narrowed',
              }}
            >
              <p>
                <Link href="/wh347">Use the free WH-347 generator</Link> ·{' '}
                <Link href="/rates">Look up a county and craft</Link>
              </p>
            </RefusalView>
          ) : (
            <form className="rp-stack" action={buyRateCardAction}>
              <input type="hidden" name="wdNumber" value={String(held.wdNumber)} />
              <div className="rp-field">
                <label className="rp-field__label" htmlFor="email">
                  Where should the card go?
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="rp-input"
                  autoComplete="email"
                  required
                />
                <p className="rp-field__help">
                  No account is created. If you later sign up with the same address, the card
                  attaches itself to the new account automatically.
                </p>
              </div>
              <div className="rp-btn-row">
                <button type="submit" className="rp-btn rp-btn--primary">
                  Buy the card — {Cents.toDollarString(Cents.of(RATE_CARD_PRICE_CENTS))}
                </button>
              </div>
              {refused === 'email' ? (
                <p className="rp-btn__why">That doesn’t look like an email address.</p>
              ) : null}
            </form>
          )}
        </>
      )}

      <section className="rp-stack rp-measure">
        <h2>Before you pay, the two things you can do afterwards</h2>
        <ul className="rp-stack rp-stack--tight">
          <li>
            Wrong county or wrong construction type? Rebuild the card for a different determination,
            free, within 14 days. Unlimited rebuilds inside that window.
          </li>
          <li>
            Want your money back? A button on the delivery page. Full refund within 14 days, no
            reason required, and the link keeps working — clawing back a document you already read
            would be theatre.
          </li>
        </ul>
      </section>
    </div>
  );
}
