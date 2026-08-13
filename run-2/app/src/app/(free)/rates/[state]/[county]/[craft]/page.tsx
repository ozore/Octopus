/**
 * S04 — `/rates/[state]/[county]/[craft]`, the programmatic page set.
 *
 * AUTHORITY: `USER_JOURNEY.md` §2.1 (what is above the fold), **§2.4 (why the diff
 * is above the fold)**, §2.3 (the unhappy paths), `ARCHITECTURE.md` §3.1 (generated
 * from the mirror), `CORPUS_DESIGN.md` §6.2.
 *
 * ===========================================================================
 * THE PAGE IS THE ASSEMBLY, NOT THE DATA
 *
 * §2.4 is the hardest finding in the research and it is what this file is written
 * against: **the wage-determination archive is not a cornered resource.** A
 * superseded revision is reproducible from SAM's own archive path and at least one
 * vendor resells the series. So the sentence "you cannot reconstruct a superseded
 * revision" is measured false and is banned from every surface, and this page must
 * not be a templated paragraph wrapped around a number anyone can fetch.
 *
 * What is on it that only the mirror can produce:
 *
 *   1. **The revision history of THIS classification** — its base and fringe at
 *      every revision the mirror holds, with the publication date of each.
 *   2. **The dated diff** — what moved at the last revision, computed from the two
 *      parsed revisions rather than read from a table nothing populates.
 *   3. The line span in the determination text, so the number is checkable against
 *      the federal source rather than trusted.
 *
 * Each of those is per-classification, per-county assembly across N revisions. That
 * is the claim — assembly, latency and crosswalk memory — and it is the only moat
 * sentence any surface of this company is allowed to make.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { lookupCountyRates } from '@/corpus';
import { getDb } from '@/db';
import type { Refusal } from '@/lib/types';

import { CorpusNotice, SnapshotLine } from '../../../../_components/corpus-notice';
import { RefusalView } from '../../../../_components/refusal';
import {
  classificationHistory,
  classificationsOf,
  corpusState,
  countiesInState,
  revisionsHeld,
} from '../../../../_data/mirror';
import { rate, signedRate, slug } from '../../../../_lib/format';

export const dynamic = 'force-dynamic';

interface Params {
  readonly params: Promise<{
    readonly state: string;
    readonly county: string;
    readonly craft: string;
  }>;
}

export async function generateMetadata({ params }: Params): Promise<{ title: string }> {
  const { state, county, craft } = await params;
  return {
    title: `${craft.replace(/-/g, ' ')} — ${county.replace(/-/g, ' ')}, ${state.toUpperCase()} prevailing wage — Ratepin`,
  };
}

export default async function CraftPage({ params }: Params): Promise<React.ReactElement> {
  const { state, county, craft } = await params;
  const stateCode = state.toUpperCase();
  if (!/^[A-Z]{2}$/.test(stateCode)) notFound();

  const db = await getDb();
  const now = new Date();
  const counties = await countiesInState(db, stateCode);
  const countyRow = counties.find((row) => slug(row.countyName) === county.toLowerCase());
  if (!countyRow) notFound();

  const [corpus, rows] = await Promise.all([
    corpusState(db, now),
    lookupCountyRates(db, { stateCode, countyName: countyRow.countyName }),
  ]);

  const matches = rows.filter((row) => slug(row.className) === craft.toLowerCase());
  if (matches.length === 0) {
    return (
      <div className="rp-stack rp-stack--section rp-measure">
        <nav aria-label="Breadcrumb">
          <Link href={`/rates/${state.toLowerCase()}/${county.toLowerCase()}`}>
            {countyRow.countyName}, {stateCode}
          </Link>
        </nav>
        <h1>
          No classification on the determinations covering {countyRow.countyName} slugs to
          “{craft}”
        </h1>
        <p>
          <Link href={`/rates/${state.toLowerCase()}/${county.toLowerCase()}`}>
            Every classification this county&rsquo;s determinations do list
          </Link>
        </p>
        <SnapshotLine corpus={corpus} />
      </div>
    );
  }

  // Two construction types can list the same classification at different rates.
  // §2.2 disambiguates with the determination's OWN type strings rather than by
  // picking one, because picking one is the product deciding which contract the
  // reader is on.
  const primary = matches[0];
  if (!primary) notFound();

  const [verbatimRows, history, revisions] = await Promise.all([
    classificationsOf(db, primary.wdNumber, primary.revision),
    classificationHistory(db, primary.wdNumber, primary.classNameNorm),
    revisionsHeld(db, primary.wdNumber),
  ]);
  const verbatim = verbatimRows.find((row) => row.classNameNorm === primary.classNameNorm) ?? null;

  const latest = history[history.length - 1] ?? null;
  const previous = history.length >= 2 ? (history[history.length - 2] ?? null) : null;

  return (
    <div className="rp-stack rp-stack--section">
      <nav aria-label="Breadcrumb">
        <Link href="/rates">All states</Link> ·{' '}
        <Link href={`/rates/${state.toLowerCase()}`}>{stateCode}</Link> ·{' '}
        <Link href={`/rates/${state.toLowerCase()}/${county.toLowerCase()}`}>
          {countyRow.countyName}
        </Link>
      </nav>

      <section className="rp-stack rp-measure">
        <h1>
          {primary.className} — {countyRow.countyName}, {stateCode}
        </h1>
        <p className="rp-t-lead">
          Wage determination <span className="rp-num">{primary.wdNumber}</span>, revision{' '}
          <span className="rp-num">{primary.revision}</span>, published{' '}
          <span className="rp-num">{primary.publishDate}</span> · {primary.constructionType}
        </p>
      </section>

      <CorpusNotice corpus={corpus} />

      <section className="rp-stack">
        <h2>The rate, as the determination publishes it</h2>
        <div className="rp-tablewrap">
          <table className="rp-table">
            <caption className="rp-sr-only">
              Base and fringe rates for {primary.className} in {countyRow.countyName}, {stateCode}
            </caption>
            <thead>
              <tr>
                <th scope="col">Construction type</th>
                <th scope="col">Group</th>
                <th scope="col" className="rp-th--num">
                  Base hourly
                </th>
                <th scope="col" className="rp-th--num">
                  Fringe hourly
                </th>
                <th scope="col" className="rp-th--num">
                  Determination
                </th>
              </tr>
            </thead>
            <tbody>
              {matches.map((row) => (
                <tr key={`${row.constructionType}:${row.rateIdentifier}`}>
                  <th scope="row">{row.constructionType}</th>
                  <td className="rp-td--id rp-num">{row.rateIdentifier}</td>
                  <td className="rp-td--num rp-num">{rate(row.baseRateMilli)}</td>
                  <td className="rp-td--num rp-num">{rate(row.fringeRateMilli)}</td>
                  <td className="rp-td--num rp-num">
                    {row.wdNumber} rev {row.revision} · {row.publishDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {verbatim ? (
          <div className="rp-stack rp-stack--tight">
            <h3>The determination&rsquo;s own words</h3>
            <blockquote className="rp-prose">
              <pre className="rp-num">{verbatim.classNameVerbatim}</pre>
            </blockquote>
            <p className="rp-t-micro rp-num">
              Read from the determination text at lines {verbatim.sourceLineStart}–
              {verbatim.sourceLineEnd}
              {verbatim.wrapped ? ' (the name wraps across physical lines in the source)' : ''}.
            </p>
          </div>
        ) : null}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* §2.4 — the diff, above the fold, because it is the whole reason the  */}
      {/* page is worth building.                                             */}
      {/* ------------------------------------------------------------------ */}
      <section className="rp-stack">
        <h2>What changed at the last revision</h2>
        {latest === null || previous === null ? (
          <p>
            The mirror holds{' '}
            <span className="rp-num">
              {history.length === 1 ? 'one revision' : `${history.length} revisions`}
            </span>{' '}
            of {primary.wdNumber} carrying this classification, so there is no earlier revision here
            to compare against. That is a statement about what Ratepin has ingested, not about
            whether the rate has ever moved.
          </p>
        ) : (
          <>
            <div className="rp-tablewrap">
              <table className="rp-table">
                <caption className="rp-sr-only">
                  Change in {primary.className} between revision {previous.revision} and revision{' '}
                  {latest.revision}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Component</th>
                    <th scope="col" className="rp-th--num">
                      Revision {previous.revision} ({previous.publishDate})
                    </th>
                    <th scope="col" className="rp-th--num">
                      Revision {latest.revision} ({latest.publishDate})
                    </th>
                    <th scope="col" className="rp-th--num">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr data-row={previous.baseRateMilli === latest.baseRateMilli ? undefined : 'asserted'}>
                    <th scope="row">Base hourly</th>
                    <td className="rp-td--num rp-num">{rate(previous.baseRateMilli)}</td>
                    <td className="rp-td--num rp-num">{rate(latest.baseRateMilli)}</td>
                    <td className="rp-td--num rp-num">
                      {signedRate(latest.baseRateMilli - previous.baseRateMilli)}
                    </td>
                  </tr>
                  <tr
                    data-row={previous.fringeRateMilli === latest.fringeRateMilli ? undefined : 'asserted'}
                  >
                    <th scope="row">Fringe hourly</th>
                    <td className="rp-td--num rp-num">{rate(previous.fringeRateMilli)}</td>
                    <td className="rp-td--num rp-num">{rate(latest.fringeRateMilli)}</td>
                    <td className="rp-td--num rp-num">
                      {signedRate(latest.fringeRateMilli - previous.fringeRateMilli)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="rp-t-micro">
              Computed by comparing the two parsed revisions this mirror holds, matched on the
              determination&rsquo;s own normalized classification name. A rename shows as one
              classification ending and another beginning, not as a rate move.
            </p>
          </>
        )}
      </section>

      <section className="rp-stack">
        <h2>This classification across every revision the mirror holds</h2>
        <div className="rp-tablewrap">
          <table className="rp-table">
            <caption className="rp-sr-only">
              Revision history for {primary.className} on {primary.wdNumber}
            </caption>
            <thead>
              <tr>
                <th scope="col" className="rp-th--num">
                  Revision
                </th>
                <th scope="col" className="rp-th--num">
                  Published
                </th>
                <th scope="col">Group</th>
                <th scope="col" className="rp-th--num">
                  Base hourly
                </th>
                <th scope="col" className="rp-th--num">
                  Fringe hourly
                </th>
                <th scope="col" className="rp-th--num">
                  Moved
                </th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry, index) => {
                const before = index === 0 ? null : (history[index - 1] ?? null);
                const moved =
                  before === null
                    ? 'first held'
                    : before.baseRateMilli === entry.baseRateMilli &&
                        before.fringeRateMilli === entry.fringeRateMilli
                      ? 'no change'
                      : `${signedRate(entry.baseRateMilli - before.baseRateMilli)} base · ${signedRate(entry.fringeRateMilli - before.fringeRateMilli)} fringe`;
                return (
                  <tr key={entry.revision}>
                    <th scope="row" className="rp-num">
                      {entry.revision}
                    </th>
                    <td className="rp-td--num rp-num">{entry.publishDate}</td>
                    <td className="rp-td--id rp-num">{entry.rateIdentifier}</td>
                    <td className="rp-td--num rp-num">{rate(entry.baseRateMilli)}</td>
                    <td className="rp-td--num rp-num">{rate(entry.fringeRateMilli)}</td>
                    <td className="rp-td--num rp-num">{moved}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="rp-t-micro">
          The mirror holds{' '}
          <span className="rp-num">{revisions.length}</span> revision
          {revisions.length === 1 ? '' : 's'} of {primary.wdNumber} in total; a revision missing from
          the table above did not list this classification.
        </p>
      </section>

      <RefusalView refusal={effectivenessDeclined(primary.wdNumber, primary.revision, primary.publishDate)} />

      {isUnionIdentifier(primary.identifierKind) ? (
        <RefusalView refusal={cbaFringeDeclined(primary.rateIdentifier)} />
      ) : null}

      <RefusalView refusal={stateLawDeclined(stateCode)} />

      <section className="rp-stack rp-measure">
        <h2>Use this rate</h2>
        <p>
          <Link href={`/wh347?wd=${primary.wdNumber}`}>
            Generate a WH-347 with this determination
          </Link>{' '}
          — free, unlimited, no account. The form comes out marked{' '}
          <strong>DRAFT — NOT CERTIFIABLE</strong> with the signature block withheld, because
          nothing on the free path pins a revision of record.
        </p>
      </section>

      <SnapshotLine corpus={corpus} />
    </div>
  );
}

function isUnionIdentifier(kind: string): boolean {
  return kind === 'union' || kind === 'union_average';
}

/** §16.3's sentence pair, as a component: never "revision N now applies". */
function effectivenessDeclined(wd: string, revision: number, publishDate: string): Refusal {
  return {
    primitive: 'P-D',
    headline: 'Which revision applies to a contract is not a question Ratepin answers',
    rule:
      'FAR 22.404-6 governs which wage determination revision applies to a contract, and the answer ' +
      'can turn on a finding by the contracting officer.',
    citation: 'FAR 22.404-6',
    observableFacts: [
      { label: 'Determination', value: wd },
      { label: 'Revision shown here', value: String(revision) },
      { label: 'Published', value: publishDate },
    ],
    declined:
      'These are the dates we can see. The determination incorporated into your solicitation, and ' +
      'any amendment your contracting officer issues, govern.',
  };
}

function cbaFringeDeclined(identifier: string): Refusal {
  return {
    primitive: 'P-D',
    headline: `${identifier} is a collective-bargaining group`,
    rule:
      'The determination publishes an aggregate fringe figure for this group. It does not publish ' +
      'the agreement’s fringe schedule — which plans, at what per-hour cost, with what eligibility.',
    citation: '29 CFR 5.5(a)(1)(i)',
    observableFacts: [{ label: 'Rate identifier', value: identifier }],
    declined:
      'Ratepin will not compute a fringe credit against a schedule it does not hold. The aggregate ' +
      'above is shown because the determination publishes it; the credit is not, because it does not.',
  };
}

function stateLawDeclined(stateCode: string): Refusal {
  return {
    primitive: 'P-D',
    headline: `This is the federal Davis-Bacon rate, not ${stateCode}’s`,
    rule:
      'A state may have its own prevailing-wage law setting a different rate for the same work on ' +
      'state-funded or state-assisted projects.',
    citation: 'Davis-Bacon Act, 40 U.S.C. 3141 et seq.',
    observableFacts: [{ label: 'State', value: stateCode }],
    declined:
      'Ratepin does not track state determinations outside California, and does not conclude which ' +
      'law governs your contract.',
  };
}
