/**
 * S11 — `/app/projects/new/wd`, find-my-WD.
 *
 * AUTHORITY: `USER_JOURNEY.md` §4.2 (the candidate list and what each row shows;
 * **no live SAM call, ever**), §4.3 (the union-group warning at pin time rather than
 * at generation), §4.5 (the honest empty state with the three real causes, plus the
 * fourth path: paste the determination number from the contract).
 */

import Link from 'next/link';

import { getDb } from '@/db';

import { readAs, requireSession } from '../../../../_lib/auth';
import { findWdCandidates } from '../../../../_lib/mirror';
import { confirmedClassNorms } from '../../../../_lib/resolve';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Find my wage determination — Ratepin' };

export default async function FindWdPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.ReactElement> {
  const session = await requireSession('/app/projects/new/wd');
  const params = await searchParams;
  const db = await getDb();

  const one = (key: string): string =>
    typeof params[key] === 'string' ? (params[key] as string) : '';

  const stateCode = one('state');
  const countyName = one('county');
  const constructionType = one('type');

  const candidates =
    stateCode === '' || countyName === ''
      ? []
      : await readAs(session, async (tx) =>
          findWdCandidates(db, {
            stateCode,
            countyName,
            constructionType: constructionType === '' ? null : constructionType,
            yourClassNorms: await confirmedClassNorms(tx),
          }),
        );

  const back = `/app/projects/new?state=${encodeURIComponent(stateCode)}&county=${encodeURIComponent(countyName)}&type=${encodeURIComponent(constructionType)}`;

  return (
    <div className="rp-stack rp-stack--section">
      <section className="rp-stack rp-measure">
        <h1>Determinations covering {countyName === '' ? 'this county' : countyName}</h1>
        <p className="rp-t-lead">
          These come from the last promoted corpus snapshot. Ratepin makes no live call to SAM.gov
          to answer this question — not here and not at generation time.
        </p>
      </section>

      {candidates.length === 0 ? (
        <div className="rp-empty">
          <p className="rp-empty__title">
            No active determination in the mirror covers {countyName || 'this county'}
            {constructionType === '' ? '' : ` under ${constructionType}`}
          </p>
          <div className="rp-empty__body rp-stack rp-stack--tight">
            <p>There are three ordinary reasons for that, and a fourth path out of it.</p>
            <ul className="rp-stack rp-stack--tight">
              <li>The county may be covered under a different construction type.</li>
              <li>
                The contract may carry a <strong>project wage determination</strong> issued to the
                contracting agency and never published. Those are not in the published record and
                cannot be.
              </li>
              <li>The work may not be Davis-Bacon covered at all.</li>
            </ul>
            <p>
              Ratepin does not interpolate a rate from a neighbouring county and does not conclude
              that this work is uncovered.{' '}
              <Link href={back}>Paste the determination number from your contract</Link> — if it is
              in the mirror we pin it even where our county index did not predict it, because the
              contract governs and our index does not.
            </p>
          </div>
        </div>
      ) : (
        <div className="rp-tablewrap">
          <table className="rp-table">
            <caption className="rp-sr-only">Candidate determinations</caption>
            <thead>
              <tr>
                <th scope="col">Determination</th>
                <th scope="col">Construction type</th>
                <th scope="col" className="rp-th--num">
                  Classifications
                </th>
                <th scope="col" className="rp-th--num">
                  Yours listed
                </th>
                <th scope="col">Use it</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr key={`${String(candidate.wdNumber)}-${candidate.constructionType}`}>
                  <th scope="row" className="rp-num">
                    {String(candidate.wdNumber)} rev {candidate.revision}
                    <span className="rp-t-micro"> published {String(candidate.publishDate)}</span>
                  </th>
                  <td>{candidate.constructionType}</td>
                  <td className="rp-td--num">{candidate.classCount}</td>
                  <td className="rp-td--num">{candidate.yourCraftsListed}</td>
                  <td>
                    <Link
                      className="rp-btn rp-btn--quiet rp-btn--sm"
                      href={`${back}&wd=${encodeURIComponent(String(candidate.wdNumber))}`}
                    >
                      Use this one
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {candidates.some((candidate) => candidate.unionGroups.length > 0) ? (
        <section className="rp-stack rp-measure">
          <h2>Before you pin: collective bargaining groups</h2>
          {candidates
            .filter((candidate) => candidate.unionGroups.length > 0)
            .map((candidate) => (
              <div className="rp-alert rp-alert--declined" key={String(candidate.wdNumber)}>
                <span className="rp-alert__glyph" aria-hidden="true">
                  §
                </span>
                <div className="rp-alert__body">
                  <p className="rp-alert__title">
                    {candidate.unionGroups.length} of this determination’s {candidate.groupCount}{' '}
                    classification groups come from collective bargaining agreements
                  </p>
                  <p className="rp-num">{candidate.unionGroups.join(', ')}</p>
                  <p>
                    Their fringe schedules are not published in the determination, so Ratepin will
                    not compute a fringe credit against them. If your crew works under any of those
                    classifications, those payroll lines will block and the filing will render as{' '}
                    <strong>DRAFT — NOT CERTIFIABLE</strong>. The other groups — survey rates and
                    averages — are fully supported.
                  </p>
                  <p>
                    We would rather tell you at minute three than at minute forty on a Friday.
                  </p>
                </div>
              </div>
            ))}
        </section>
      ) : null}

      <p>
        <Link href={back}>Back to the project form</Link>
      </p>
    </div>
  );
}
