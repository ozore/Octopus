/**
 * `/rates` — the county x craft lookup, entry.
 *
 * AUTHORITY: `USER_JOURNEY.md` §2 (J2), `ARCHITECTURE.md` §3.1 (this route may
 * touch "the mirror read model only"), `CORPUS_DESIGN.md` §6.3.
 *
 * FORCE-DYNAMIC, AND THE REASON IS THE REFRESH RULE. The brief asks for "a refresh
 * tied to promotion". Rendering per request from the promoted snapshot is the
 * tightest possible form of that: the mirror is append-only and nothing a visitor
 * can see changes until a snapshot is promoted, so the page refreshes exactly when
 * promotion happens and at no other time. An ISR window would add a second clock
 * with no second source behind it. Every page prints the snapshot it rendered from,
 * so the claim is checkable rather than asserted.
 */

import Link from 'next/link';

import { getDb } from '@/db';

import { CorpusNotice, SnapshotLine } from '../_components/corpus-notice';
import { corpusState, statesWithRates } from '../_data/mirror';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Prevailing wage rates by county — Ratepin',
  description:
    'Davis-Bacon wage determination rates by state, county and classification, each with its ' +
    'determination number, revision and publication date.',
};

export default async function RatesIndexPage(): Promise<React.ReactElement> {
  const db = await getDb();
  const now = new Date();
  const [corpus, states] = await Promise.all([corpusState(db, now), statesWithRates(db)]);

  return (
    <div className="rp-stack rp-stack--section rp-measure">
      <section className="rp-stack">
        <h1>Wage determination rates by county</h1>
        <p className="rp-t-lead">
          Every rate on these pages is a row of a published general wage determination, shown with
          the determination&rsquo;s own classification label, its number, its revision, and the date
          that revision was published. Ratepin does not average, interpolate or adjust a rate, and
          does not carry a rate from one county to another.
        </p>
      </section>

      <CorpusNotice corpus={corpus} />

      {states.length === 0 ? (
        <div className="rp-empty">
          <p className="rp-empty__title">No determination has been promoted into the mirror yet</p>
          <p className="rp-empty__body">
            Rate pages are built from promoted corpus snapshots. Until a snapshot passes every gate
            there is nothing here to show, and showing an unpromoted one would be showing a rate we
            have not verified.
          </p>
        </div>
      ) : (
        <section className="rp-stack">
          <h2>States covered by this snapshot</h2>
          <div className="rp-tablewrap">
            <table className="rp-table">
              <caption className="rp-sr-only">
                States with published wage determination rates in the current corpus snapshot
              </caption>
              <thead>
                <tr>
                  <th scope="col">State</th>
                  <th scope="col" className="rp-th--num">
                    Counties
                  </th>
                  <th scope="col" className="rp-th--num">
                    Classification rows
                  </th>
                </tr>
              </thead>
              <tbody>
                {states.map((state) => (
                  <tr key={state.stateCode}>
                    <th scope="row">
                      <Link href={`/rates/${state.stateCode.toLowerCase()}`}>{state.stateCode}</Link>
                    </th>
                    <td className="rp-td--num rp-num">{state.countyCount}</td>
                    <td className="rp-td--num rp-num">{state.classCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="rp-t-micro">
            These are the states this snapshot holds, not the states Davis-Bacon reaches. A state
            missing here is a gap in what Ratepin has ingested, and nothing more.
          </p>
        </section>
      )}

      <SnapshotLine corpus={corpus} />
    </div>
  );
}
