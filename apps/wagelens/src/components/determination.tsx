/**
 * The determination view: the header facts, the modification control, the
 * classification table and the disclaimer (WL-00).
 *
 * EVERY RATE IN HERE GOES THROUGH `<Rate>` (gate G8), so every figure on the
 * page carries `data-wd-number` and `data-modification` and a reader can check
 * any of them against SAM.gov in ten seconds. That is the trust argument
 * executed rather than asserted, and it is the reason the public lookup is a
 * Must and not a marketing asset.
 */

import Link from 'next/link';

import { ProvenanceCard, Rate, formatDay, formatMoney, type Provenance } from './provenance';
import { StandingDisclaimer } from './disclaimer';
import type { ClassificationRow, DeterminationCandidate } from '@/lib/kb';

export function DeterminationHeader({
  determination,
  provenance,
}: {
  determination: DeterminationCandidate;
  provenance: Provenance;
}) {
  return (
    <section className="wl-panel">
      <div className="wl-panel__body wl-stack">
        <div className="wl-row wl-row--between">
          <div>
            <h1 className="wl-mono">{determination.wdNumber}</h1>
            <p className="wl-lead">
              Modification {determination.modificationNumber} · published{' '}
              {formatDay(determination.publicationDate)}
            </p>
          </div>
          <ProvenanceCard
            provenance={provenance}
            scope={`${
              determination.countyCount === 1
                ? `${determination.countyNames[0]} County`
                : `${determination.countyCount} counties`
            } · ${determination.constructionTypes.join(', ')} construction`}
            classification={`${determination.classificationCount} classifications`}
          />
        </div>
        <dl className="wl-facts">
          <div>
            <dt>Construction types</dt>
            <dd>{determination.constructionTypes.join(', ')}</dd>
          </div>
          <div>
            <dt>Counties covered</dt>
            <dd>
              {determination.countyCount === 0
                ? 'Statewide'
                : determination.countyNames.slice(0, 4).join(', ') +
                  (determination.countyCount > 4 ? ` and ${determination.countyCount - 4} more` : '')}
            </dd>
          </div>
          <div>
            <dt>Classifications</dt>
            <dd>{determination.classificationCount}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{determination.isActive ? 'Active' : 'Superseded'}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

/**
 * "My contract locked an earlier one ▾" — the public half of the
 * differentiator (LANDING_SPEC §5.1, WL-00).
 *
 * Populated from `kb_wd_modifications` and NEVER invented, never interpolated:
 * a determination with one revision shows one option and says so. Choosing an
 * earlier modification re-renders the whole table at that modification; it does
 * not show the active modification's rates under an older heading, ever.
 */
export function ModificationControl({
  wdNumber,
  current,
  modifications,
}: {
  wdNumber: string;
  current: number;
  modifications: Array<{ modificationNumber: number; publicationDate: string; active: boolean; textHeld: boolean }>;
}) {
  if (modifications.length <= 1) {
    return (
      <p className="wl-xs wl-muted" data-testid="modification-control-single">
        This determination has one modification on record
        {modifications[0] ? ` (modification ${modifications[0].modificationNumber}, published ${formatDay(modifications[0].publicationDate)})` : ''}
        . Nothing earlier exists to read.
      </p>
    );
  }
  return (
    <div className="wl-stack-2" data-testid="modification-control">
      <p className="wl-sm wl-strong">My contract locked an earlier one</p>
      <ul className="wl-row" role="list">
        {modifications.map((m) => (
          <li key={m.modificationNumber}>
            <Link
              className={m.modificationNumber === current ? 'wl-btn wl-btn--secondary wl-btn--sm' : 'wl-btn wl-btn--ghost wl-btn--sm'}
              href={`/wd/${wdNumber}/${m.modificationNumber}`}
              aria-current={m.modificationNumber === current ? 'page' : undefined}
              data-testid={`modification-option-${m.modificationNumber}`}
              data-from-mod={current}
              data-to-mod={m.modificationNumber}
            >
              Mod {m.modificationNumber} · {formatDay(m.publicationDate)}
              {m.active ? ' · current' : ''}
            </Link>
          </li>
        ))}
      </ul>
      <p className="wl-2xs wl-muted">
        29 CFR 1.6 fixes the applicable determination at solicitation or award, so the modification
        your contract names governs your job even after a newer one is published.
      </p>
    </div>
  );
}

export function ClassificationTable({
  rows,
  total,
  provenance,
  query,
}: {
  rows: ClassificationRow[];
  total: number;
  provenance: Provenance;
  query?: string;
}) {
  return (
    <section className="wl-panel">
      <header className="wl-panel__head">
        <h2>
          {total} classification{total === 1 ? '' : 's'}
          {query ? ` matching “${query}”` : ''}
        </h2>
      </header>
      <div className="wl-table-wrap wl-scroll-x">
        <table className="wl-table wl-class-table" data-testid="classification-table">
          <thead>
            <tr>
              <th scope="col">Classification</th>
              <th scope="col" className="wl-num">
                Rate
              </th>
              <th scope="col" className="wl-num">
                Fringe
              </th>
              <th scope="col" className="wl-num">
                Total
              </th>
              <th scope="col">Rate group</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} data-testid="classification-row">
                <td>
                  {row.classificationLabel}
                  {row.footnoteText ? (
                    <span className="wl-2xs wl-muted"> {row.footnoteText}</span>
                  ) : null}
                </td>
                <td className="wl-num">
                  <Rate base={row.baseRate} provenance={provenance} label="Base rate" />
                </td>
                <td className="wl-num">
                  <Rate base={row.fringeRate} provenance={provenance} label="Fringe" />
                </td>
                <td className="wl-num">
                  <Rate
                    base={Number(row.baseRate) + Number(row.fringeRate)}
                    provenance={provenance}
                    label="Total"
                  />
                </td>
                <td className="wl-xs wl-mono">
                  {row.rateGroupIdentifier}
                  <span className="wl-muted"> · {row.rateGroupKind.replace('_', ' ')}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 ? (
        <div className="wl-panel__body">
          <p className="wl-muted">No classification on this determination matches that search.</p>
        </div>
      ) : null}
    </section>
  );
}

/**
 * The honest conversion line: BELOW the table, never above it and never over it
 * (WL-00 V3). The call to action names the trial's length and its charge
 * (WL-09 V16a): the lookup is free, the trial is not, and saying otherwise is
 * the kind of small lie that ends in a chargeback.
 */
export function ConversionLine({ wdNumber }: { wdNumber: string }) {
  return (
    <section className="wl-panel" data-testid="conversion-line">
      <div className="wl-panel__body wl-stack-2">
        <p className="wl-strong">These are the rates. The weekly WH-347 is the work.</p>
        <p className="wl-sm wl-muted">
          Your first two Fridays are free — card on file, $99 on day 15, cancel in one click before
          then and you are not charged.
        </p>
        <p>
          <Link
            className="wl-btn wl-btn--primary"
            href={`/login?next=${encodeURIComponent(`/projects/new?wd=${wdNumber}`)}`}
            data-testid="lookup-cta"
          >
            Start 14-day trial
          </Link>
        </p>
      </div>
    </section>
  );
}

export function CandidateList({
  candidates,
  countyName,
  constructionType,
}: {
  candidates: DeterminationCandidate[];
  countyName: string;
  constructionType?: string;
}) {
  return (
    <section className="wl-stack" data-testid="candidate-list">
      <div className="wl-alert wl-alert--info" role="note">
        <div>
          <p className="wl-alert__title">
            {candidates.length} determinations cover {countyName}
            {constructionType ? ` for ${constructionType} construction` : ''}
          </p>
          <p className="wl-alert__body">
            About one county-and-type combination in eight has more than one. Nothing is selected for
            you: the determination that governs is the one your contract names, and the county list
            below is what tells them apart.
          </p>
        </div>
      </div>
      <div className="wl-candidates">
        {candidates.map((candidate) => (
          <article className="wl-candidate" key={candidate.wdId} data-testid="candidate">
            <div className="wl-row wl-row--between">
              <Link className="wl-mono wl-strong" href={`/wd/${candidate.wdNumber}`}>
                {candidate.wdNumber}
              </Link>
              <span className="wl-xs wl-muted">
                Modification {candidate.modificationNumber} · published{' '}
                {formatDay(candidate.publicationDate)}
              </span>
            </div>
            <p className="wl-sm">
              {candidate.constructionTypes.join(', ')} · {candidate.classificationCount}{' '}
              classifications ·{' '}
              {candidate.countyCount === 1
                ? `${candidate.countyNames[0]} County only`
                : `${candidate.countyCount} counties`}
            </p>
            <p className="wl-2xs wl-muted">
              {candidate.countyNames.slice(0, 8).join(', ')}
              {candidate.countyCount > 8 ? ` and ${candidate.countyCount - 8} more` : ''}
            </p>
            <p>
              <Link className="wl-btn wl-btn--secondary wl-btn--sm" href={`/wd/${candidate.wdNumber}`}>
                Open {candidate.wdNumber}
              </Link>{' '}
              <a
                className="wl-source"
                href={candidate.publicUrl}
                target="_blank"
                rel="noreferrer noopener"
              >
                ⧉ View on SAM.gov
              </a>
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function CorpusUnavailable({ reason }: { reason: string }) {
  return (
    <section className="wl-alert wl-alert--error" role="alert" data-testid="corpus-unavailable">
      <div>
        <p className="wl-alert__title">We can&rsquo;t reach our determination data right now.</p>
        <p className="wl-alert__body">
          {reason} We will not show you a rate we cannot confirm the source of, so this page has no
          rates on it at all.{' '}
          <a href="https://sam.gov/search/?index=dbra" target="_blank" rel="noreferrer noopener">
            Search SAM.gov directly →
          </a>
        </p>
      </div>
    </section>
  );
}

export function PublicPageFooter() {
  return <StandingDisclaimer />;
}

export { formatMoney };
