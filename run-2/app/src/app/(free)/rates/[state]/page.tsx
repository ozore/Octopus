/**
 * `/rates/[state]` — the counties this snapshot covers.
 *
 * AUTHORITY: `USER_JOURNEY.md` §2, `CORPUS_DESIGN.md` §6.2.
 *
 * The independent-city flag is rendered, not swallowed. An independent city is NOT
 * inside the county it adjoins, and the wrong rate follows if it is treated as
 * though it were — the parser keeps the distinction (`wd_county_scope`), so the
 * page does too.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getDb } from '@/db';

import { CorpusNotice, SnapshotLine } from '../../_components/corpus-notice';
import { corpusState, countiesInState } from '../../_data/mirror';
import { slug } from '../../_lib/format';

export const dynamic = 'force-dynamic';

interface Params {
  readonly params: Promise<{ readonly state: string }>;
}

export async function generateMetadata({ params }: Params): Promise<{ title: string }> {
  const { state } = await params;
  return { title: `${state.toUpperCase()} prevailing wage rates by county — Ratepin` };
}

export default async function StatePage({ params }: Params): Promise<React.ReactElement> {
  const { state } = await params;
  const stateCode = state.toUpperCase();
  if (!/^[A-Z]{2}$/.test(stateCode)) notFound();

  const db = await getDb();
  const now = new Date();
  const [corpus, counties] = await Promise.all([
    corpusState(db, now),
    countiesInState(db, stateCode),
  ]);

  return (
    <div className="rp-stack rp-stack--section rp-measure">
      <nav aria-label="Breadcrumb">
        <Link href="/rates">All states</Link>
      </nav>

      <section className="rp-stack">
        <h1>{stateCode} — counties covered by this snapshot</h1>
      </section>

      <CorpusNotice corpus={corpus} />

      {counties.length === 0 ? (
        <div className="rp-empty">
          <p className="rp-empty__title">
            This snapshot holds no active determination for {stateCode}
          </p>
          <p className="rp-empty__body">
            That is a statement about what Ratepin has ingested, not about whether Davis-Bacon
            reaches work in {stateCode}. Read the determination number off your contract and look it
            up directly.
          </p>
        </div>
      ) : (
        <div className="rp-tablewrap">
          <table className="rp-table">
            <caption className="rp-sr-only">Counties in {stateCode} with published rates</caption>
            <thead>
              <tr>
                <th scope="col">County</th>
                <th scope="col">Construction types</th>
                <th scope="col" className="rp-th--num">
                  Classification rows
                </th>
              </tr>
            </thead>
            <tbody>
              {counties.map((county) => (
                <tr key={county.countyNameNorm}>
                  <th scope="row">
                    <Link href={`/rates/${state.toLowerCase()}/${slug(county.countyName)}`}>
                      {county.countyName}
                    </Link>
                    {county.independentCity ? (
                      <span className="rp-t-micro"> · independent city</span>
                    ) : null}
                  </th>
                  <td>{county.constructionTypes.join(' · ')}</td>
                  <td className="rp-td--num rp-num">{county.classCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SnapshotLine corpus={corpus} />
    </div>
  );
}
