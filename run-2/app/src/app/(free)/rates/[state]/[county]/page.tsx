/**
 * `/rates/[state]/[county]` — the active determinations covering one county, and
 * every classification they list.
 *
 * AUTHORITY: `USER_JOURNEY.md` §2.1 ("the classification exactly as the
 * determination writes it, the base hourly rate, the fringe rate, the group
 * identifier, the wage determination number, revision and publication date, the
 * construction type"), §2.2 (disambiguation by construction type, using the
 * determination's own type strings), §2.3 (the honest empty state, dated, with the
 * three real causes).
 *
 * THE EMPTY STATE IS THE MOST CAREFULLY WRITTEN THING ON THIS PAGE. It names the
 * three real causes and it declines the conclusion a blank screen would otherwise
 * invite — that the work is not covered. **We never interpolate a rate from a
 * neighbouring county**, and the page says so rather than leaving the reader to
 * infer it.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { lookupCountyRates } from '@/corpus';
import { getDb } from '@/db';

import { CorpusNotice, SnapshotLine } from '../../../_components/corpus-notice';
import { RefusalView } from '../../../_components/refusal';
import { corpusState, countiesInState, determinationsForCounty } from '../../../_data/mirror';
import { rate, slug } from '../../../_lib/format';

export const dynamic = 'force-dynamic';

interface Params {
  readonly params: Promise<{ readonly state: string; readonly county: string }>;
}

export async function generateMetadata({ params }: Params): Promise<{ title: string }> {
  const { state, county } = await params;
  return {
    title: `${titleCase(county)} County, ${state.toUpperCase()} prevailing wage rates — Ratepin`,
  };
}

export default async function CountyPage({ params }: Params): Promise<React.ReactElement> {
  const { state, county } = await params;
  const stateCode = state.toUpperCase();
  if (!/^[A-Z]{2}$/.test(stateCode)) notFound();

  const db = await getDb();
  const now = new Date();
  const counties = await countiesInState(db, stateCode);
  const match = counties.find((row) => slug(row.countyName) === county.toLowerCase());

  const [corpus, determinations, rows] = await Promise.all([
    corpusState(db, now),
    match
      ? determinationsForCounty(db, { stateCode, countyName: match.countyName })
      : Promise.resolve([]),
    match
      ? lookupCountyRates(db, { stateCode, countyName: match.countyName })
      : Promise.resolve([]),
  ]);

  if (!match) {
    return (
      <div className="rp-stack rp-stack--section rp-measure">
        <nav aria-label="Breadcrumb">
          <Link href={`/rates/${state.toLowerCase()}`}>{stateCode}</Link>
        </nav>
        <h1>
          No active determination in this snapshot lists {titleCase(county)}, {stateCode}
        </h1>
        <RefusalView refusal={noCoverage(titleCase(county), stateCode)} />
        <ul className="rp-stack rp-stack--tight">
          <li>
            <Link href={`/rates/${state.toLowerCase()}`}>
              Counties this snapshot does cover in {stateCode}
            </Link>
          </li>
          <li>
            <Link href="/wh347">
              Generate a WH-347 from the determination number on your contract
            </Link>
          </li>
        </ul>
        <SnapshotLine corpus={corpus} />
      </div>
    );
  }

  const byType = new Map<string, typeof rows>();
  for (const row of rows) {
    byType.set(row.constructionType, [...(byType.get(row.constructionType) ?? []), row]);
  }

  return (
    <div className="rp-stack rp-stack--section">
      <nav aria-label="Breadcrumb">
        <Link href="/rates">All states</Link> · <Link href={`/rates/${state.toLowerCase()}`}>{stateCode}</Link>
      </nav>

      <section className="rp-stack rp-measure">
        <h1>
          {match.countyName}, {stateCode} — Davis-Bacon rates
        </h1>
        {match.independentCity ? (
          <p>
            {match.countyName} is an <strong>independent city</strong>. It is not inside the county
            it adjoins, and a determination covering that county does not cover work here unless it
            names this city.
          </p>
        ) : null}
        <p>
          Determinations are published per construction type. If your contract names a type
          different from the one you expect, the contract governs — read the determination number
          off it and use that.
        </p>
      </section>

      <CorpusNotice corpus={corpus} />

      <section className="rp-stack rp-measure">
        <h2>Active determinations covering this county</h2>
        <div className="rp-tablewrap">
          <table className="rp-table">
            <caption className="rp-sr-only">
              Wage determinations covering {match.countyName}, {stateCode}
            </caption>
            <thead>
              <tr>
                <th scope="col">Construction type</th>
                <th scope="col">Determination</th>
                <th scope="col" className="rp-th--num">
                  Revision
                </th>
                <th scope="col" className="rp-th--num">
                  Published
                </th>
                <th scope="col" className="rp-th--num">
                  Classifications
                </th>
              </tr>
            </thead>
            <tbody>
              {determinations.map((determination) => (
                <tr key={`${determination.wdNumber}:${determination.constructionType}`}>
                  <th scope="row">{determination.constructionType}</th>
                  <td className="rp-td--id rp-num">{determination.wdNumber}</td>
                  <td className="rp-td--num rp-num">{determination.revision}</td>
                  <td className="rp-td--num rp-num">{determination.publishDate}</td>
                  <td className="rp-td--num rp-num">{determination.classCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {[...byType.entries()].map(([constructionType, typeRows]) => (
        <section key={constructionType} className="rp-stack">
          <h2>{constructionType}</h2>
          <div className="rp-tablewrap">
            <table className="rp-table">
              <caption className="rp-sr-only">
                {constructionType} classifications and rates for {match.countyName}, {stateCode}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Classification, as the determination writes it</th>
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
                {typeRows.map((row) => (
                  <tr key={`${row.rateIdentifier}:${row.classNameNorm}`}>
                    <th scope="row">
                      <Link
                        href={`/rates/${state.toLowerCase()}/${county.toLowerCase()}/${slug(row.className)}`}
                      >
                        {row.className}
                      </Link>
                    </th>
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
        </section>
      ))}

      <section className="rp-stack rp-measure">
        <h2>What these rates are, and what they are not</h2>
        <p>
          These are federal Davis-Bacon rates from the determinations named above. A state may have
          its own prevailing-wage law setting a different rate for the same work; Ratepin does not
          track state determinations outside California.
        </p>
        <p>
          Where a classification&rsquo;s group identifier marks a collective bargaining agreement,
          the fringe figure shown is the determination&rsquo;s own aggregate. The agreement&rsquo;s
          fringe schedule is not published in the determination, so Ratepin will not compute a
          fringe credit against it.
        </p>
        <p>
          <Link href="/wh347">Generate a WH-347 using one of these determinations</Link>
        </p>
      </section>

      <SnapshotLine corpus={corpus} />
    </div>
  );
}

function titleCase(value: string): string {
  return value
    .split('-')
    .map((part) => (part === '' ? part : `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`))
    .join(' ');
}

/**
 * §2.3's named empty state, as a **P-D**: the three real causes, and an explicit
 * refusal to conclude that the work is not covered.
 */
function noCoverage(countyName: string, stateCode: string): import('@/lib/types').Refusal {
  return {
    primitive: 'P-D',
    headline: `No active determination in this corpus snapshot lists ${countyName}, ${stateCode}`,
    rule:
      'General wage determinations are published per county and per construction type. Three things ' +
      'produce this screen: the county may be covered under a construction type this snapshot does ' +
      'not hold; the contract may carry a project wage determination issued to the contracting ' +
      'agency and never published; or the work may not be Davis-Bacon covered at all.',
    citation: '29 CFR 1.5',
    observableFacts: [
      { label: 'County as addressed', value: `${countyName}, ${stateCode}` },
      { label: 'Rows in this snapshot for this county', value: '0' },
    ],
    declined:
      'Ratepin does not conclude which of the three applies, and does not interpolate a rate from a ' +
      'neighbouring county. The determination named in your contract governs.',
  };
}
