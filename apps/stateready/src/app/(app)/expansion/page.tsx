import Link from 'next/link';

import { getEnv } from '@/env';
import { getDb } from '@/lib/db';
import { coverageTable, JURISDICTION_NAMES, TRADES } from '@/lib/kb/accessors';
import { ENTRY_PACK_GUARANTEE } from '@/lib/legal/guarantees';
import { joinExpansionWaitlistAction } from '@/lib/packs/actions';
import { entryPackPriceCents, listPlaybooks } from '@/lib/packs/service';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

const MONEY = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

/**
 * `/expansion` — the picker (`specs/08` §Screens).
 *
 * The list is generated from the knowledge base, and it has **three** states
 * rather than two, which is the whole of `BUILD.md` §4 D3:
 *
 *  - **ready** — publishable AND every `CORE_SET` field verified. Purchasable.
 *  - **in preparation** — publishable, but a `CORE_SET` field is missing. Not
 *    purchasable, and the reason is named on the screen. Florida's three
 *    records are here today, on `reciprocity`.
 *  - **not covered** — no record. Waitlist, no charge, no promise.
 *
 * `specs/08` AC5 gives the second and the third the same treatment, and this
 * screen does too: no buy button, a waitlist, and a sentence saying what is
 * missing. *"Selling a report we cannot fully source is the one failure this
 * product does not recover from."*
 */
export default async function ExpansionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { org } = await requireOrg();
  const db = await getDb();
  const env = getEnv();
  const today = new Date().toISOString().slice(0, 10);

  const rows = coverageTable(today).filter((row) => row.covered);
  const ready = rows.filter((row) => row.entryPackReady);
  const inPreparation = rows.filter((row) => !row.entryPackReady);
  const price = await entryPackPriceCents(db, org.id);
  const mine = await listPlaybooks(db, org.id);

  const refused = typeof params['refused'] === 'string' ? params['refused'] : null;
  const waitlisted = typeof params['waitlisted'] === 'string' ? params['waitlisted'] : null;

  return (
    <main className="narrow">
      <p className="sr-eyebrow">Expansion</p>
      <h1>A State Entry Pack</h1>
      <p className="sr-lead">
        Every requirement the state&apos;s board publishes, each with the page it came from and the day we
        checked it — and, on the first page, every requirement it does not publish. One state, one to three
        trades, {MONEY.format(price / 100)}.
      </p>

      {refused ? (
        <p className="notice warn" data-testid="expansion-refused">
          {refused === 'in_preparation'
            ? 'That state and trade is in preparation: the record is verified but does not yet carry every requirement a paid pack needs. We have not charged you.'
            : refused === 'not_covered'
              ? 'We do not cover that state and trade yet. We have not charged you and we have not promised a date.'
              : 'We could not start that purchase. Nothing has been charged.'}
        </p>
      ) : null}
      {waitlisted ? (
        <p className="notice" data-testid="expansion-waitlisted">
          Noted — {JURISDICTION_NAMES[waitlisted] ?? waitlisted}. We will write when the record is verified.
          No charge, and no date promised.
        </p>
      ) : null}

      <h2>Ready now</h2>
      <table data-testid="expansion-ready">
        <thead>
          <tr>
            <th>State</th>
            <th>Trade</th>
            <th>Verified requirements</th>
            <th>Not published by this board</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {ready.map((row) => (
            <tr key={`${row.state}-${row.trade}`} data-testid={`expansion-row-${row.state}-${row.trade}`}>
              <th scope="row">
                {row.state} <span className="muted small">{row.stateName}</span>
              </th>
              <td>{row.trade}</td>
              <td className="sr-num">{row.verifiedValues}</td>
              <td className="sr-num" data-testid={`expansion-gaps-${row.state}-${row.trade}`}>
                {row.disclosedGaps?.length ?? 0}
              </td>
              <td>
                <Link className="button" href={`/expansion/preview/${row.state}/${row.trade}`}>
                  Preview and buy
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>In preparation</h2>
      <p className="small">
        These records are verified and are used in the product, but they do not yet carry every requirement a
        paid pack needs, so they are not for sale. The missing field is named, not hidden.
      </p>
      <ul data-testid="expansion-in-preparation">
        {inPreparation.map((row) => (
          <li key={`${row.state}-${row.trade}`} data-testid={`expansion-prep-${row.state}-${row.trade}`}>
            <strong>
              {row.stateName} — {row.trade}
            </strong>
            : in preparation.{' '}
            <form action={joinExpansionWaitlistAction} style={{ display: 'inline' }}>
              <input name="state" type="hidden" value={row.state} />
              <input name="trade" type="hidden" value={row.trade} />
              <button className="button secondary" type="submit">
                Tell me when it lands
              </button>
            </form>
          </li>
        ))}
      </ul>

      <h2>Not covered</h2>
      <p className="small">
        Everything outside the table above. We say so rather than guessing:{' '}
        <Link href="/coverage">the whole coverage table is public</Link>, including the age of every value in
        it. We cover HVAC, plumbing and electrical only.
      </p>

      {mine.length > 0 ? (
        <>
          <h2>Your packs</h2>
          <ul data-testid="expansion-mine">
            {mine.map((row) => (
              <li key={row.id}>
                <Link href={`/expansion/${row.id}`}>
                  {row.targetState} — {(row.trades as string[]).join(', ')}
                </Link>{' '}
                <span className="badge">{row.status.replace(/_/g, ' ')}</span>{' '}
                <span className="small muted">
                  {row.needsCheckCount} requirement(s) this board does not publish
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <h2>The Entry Pack Guarantee</h2>
      <p data-testid="guarantee-entry-pack">{ENTRY_PACK_GUARANTEE}</p>
      <p className="small">
        <Link href="/legal/refunds">The full refund policy.</Link> Questions before you buy:{' '}
        <a href={`mailto:${env.SUPPORT_EMAIL}`}>{env.SUPPORT_EMAIL}</a>.
      </p>

      <p className="small muted">
        {TRADES.length} trades × {rows.length} verified state-and-trade records today.
      </p>
    </main>
  );
}
