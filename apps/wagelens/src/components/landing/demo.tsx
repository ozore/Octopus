/**
 * §2 — THE LIVE LOOKUP, and V1 / V1b (LANDING_SPEC §5, §6).
 *
 * The second element on the page and the only one the buyer can falsify
 * himself. **It is not a differentiator** — at least two free Davis-Bacon
 * lookups already exist, one of them our nearest competitor's — so nothing
 * here claims it is new, and the page spends its persuasion on the
 * modification instead (§5.5).
 *
 * No login, no card, no email, no cookie wall. A plain GET form that lands
 * back on `/`, so the widget works with JavaScript off, is back-buttonable,
 * and pushes its result down the page rather than swapping it in.
 *
 * V1 is the result: the determination rendered the way the determination
 * itself prints it — the rate-group header with its effective date, the
 * classification, the base rate and the fringe, and the source chip beneath.
 * The chip settles **last**, 220ms after the final row: the number arrives,
 * then its receipt, and that ordering is the whole point.
 *
 * V1b is the 1-in-8 case, designed (KNOWLEDGE_BASE F3: 1,483 of 12,185
 * combinations map to more than one determination). Nothing is preselected,
 * nothing is ordered by "likelihood", nothing is marked "recommended" — there
 * is no such heuristic in this codebase and there must not be one on this page.
 */

import Link from 'next/link';

import { CorpusUnavailable } from '@/components/determination';
import { LookupForm } from '@/components/lookup-form';
import { Rate, SourceChip, formatDay } from '@/components/provenance';
import { LOOKUP } from './copy';
import type { DemoDeterminationView, DemoResult, LandingData } from './demo-data';
import { DeterminationTimeline } from './visuals/timeline';

function queryFor(view: DemoDeterminationView, selection: LandingData['selection'], mod: number): string {
  const params = new URLSearchParams();
  if (selection.state) params.set('state', selection.state);
  if (selection.county) params.set('county', selection.county);
  if (selection.type) params.set('type', selection.type);
  params.set('mod', String(mod));
  params.set('wd', view.determination.wdNumber);
  return `/?${params.toString()}#rates`;
}

/** V1 — the provenance card, which is the widget's result. */
function DeterminationResult({
  view,
  selection,
}: {
  view: DemoDeterminationView;
  selection: LandingData['selection'];
}) {
  const { provenance, rows, total } = view;
  let lastGroup: string | null = null;

  return (
    <div className="wl-land__result" data-testid="demo-result" data-origin={view.origin}>
      <div
        data-wordcount="exclude"
        data-testid="demo-determination"
        data-wd-number={provenance.wdNumber}
        data-modification={provenance.modificationNumber}
        data-published={provenance.publicationDate}
      >
        <p className="wl-land__widget-title">
          General Decision {provenance.wdNumber} · Modification {provenance.modificationNumber} ·
          published {formatDay(provenance.publicationDate)}
        </p>
        <p className="wl-land__note">
          {view.scope}
          {provenance.newerModification ? (
            <>
              {' '}
              · a newer modification ({provenance.newerModification.modificationNumber}) was
              published on {formatDay(provenance.newerModification.publicationDate)}. Your contract
              governs; we will not move this for you.
            </>
          ) : null}
        </p>

        <dl className="wl-land__ratelist">
          {rows.map((row, i) => {
            const header =
              row.rateGroupIdentifier !== lastGroup ? (
                <div className="wl-land__group" key={`g-${row.rateGroupIdentifier}-${i}`}>
                  {row.rateGroupIdentifier} · effective {formatDay(row.rateGroupEffectiveDate)}
                </div>
              ) : null;
            lastGroup = row.rateGroupIdentifier;
            return (
              <div key={row.id} style={{ display: 'contents' }}>
                {header}
                <div
                  className="wl-land__rateline"
                  style={{ '--wl-i': i } as React.CSSProperties}
                  data-testid="demo-rate-line"
                >
                  <dt>{row.classificationLabel}</dt>
                  <dd>
                    <Rate
                      base={row.baseRate}
                      fringe={row.fringeRate}
                      provenance={provenance}
                      label={row.classificationLabel}
                    />
                  </dd>
                </div>
              </div>
            );
          })}
        </dl>

        <p
          className="wl-land__chip"
          style={{ '--wl-rows': rows.length } as React.CSSProperties}
          data-wl-click="lookup_official_link_clicked"
          data-wl-prop-wd-number={provenance.wdNumber}
          data-wl-prop-surface="landing"
        >
          <SourceChip
            provenance={provenance}
            label={`${provenance.wdNumber} · mod ${provenance.modificationNumber} · published ${formatDay(provenance.publicationDate)}`}
          />{' '}
          <Link href={view.resultHref} data-testid="demo-full-determination">
            {total} classifications on this determination →
          </Link>
        </p>
      </div>

      {/* The modification control — the part no competitor has (§5.1). Its
          options are exactly the rows in `kb_wd_modifications`, never invented. */}
      {view.modifications.length > 1 ? (
        <div data-testid="modification-picker">
          <p className="wl-land__widget-title">{LOOKUP.modifications}</p>
          <ul className="wl-land__mods" data-wordcount="exclude">
            {view.modifications.map((m) => {
              const selected = m.modificationNumber === view.pinned;
              return (
                <li key={m.modificationNumber}>
                  <Link
                    className={
                      selected
                        ? 'wl-btn wl-btn--secondary wl-btn--sm'
                        : 'wl-btn wl-btn--ghost wl-btn--sm'
                    }
                    href={queryFor(view, selection, m.modificationNumber)}
                    aria-current={selected ? 'true' : undefined}
                    data-testid={`demo-modification-${m.modificationNumber}`}
                    data-wl-click="modification_pin_used"
                    data-wl-prop-wd-ref={view.determination.wdNumber}
                    data-wl-prop-from-mod={String(view.pinned)}
                    data-wl-prop-to-mod={String(m.modificationNumber)}
                  >
                    mod {m.modificationNumber} · {formatDay(m.publicationDate)}
                    {m.active ? ' · current' : ''}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="wl-land__note" data-wordcount="exclude" data-testid="modification-picker-single">
          One modification of {view.determination.wdNumber} is on record. Nothing earlier exists to
          read.
        </p>
      )}

      <DeterminationTimeline
        wdNumber={view.determination.wdNumber}
        modifications={view.modifications}
        pinned={view.pinned}
        current={view.current}
        divergence={view.divergence}
      />
    </div>
  );
}

/** V1b — the candidate list. No default, no order but the determination's own. */
function Candidates(props: {
  candidates: Extract<DemoResult, { kind: 'candidates' }>['candidates'];
  countyLabel: string;
}) {
  return (
    <div className="wl-land__result" data-testid="demo-candidates">
      <p>{LOOKUP.ambiguous}</p>
      <div className="wl-candidates" data-wordcount="exclude">
        {props.candidates.map((candidate) => (
          <article className="wl-candidate" key={candidate.wdId} data-testid="demo-candidate">
            <div className="wl-row wl-row--between">
              <Link className="wl-mono wl-strong" href={`/wd/${candidate.wdNumber}`}>
                {candidate.wdNumber}
              </Link>
              <span className="wl-xs wl-muted">
                mod {candidate.modificationNumber} · published{' '}
                {formatDay(candidate.publicationDate)}
              </span>
            </div>
            <p className="wl-sm">
              {candidate.constructionTypes.join(', ')} · {candidate.classificationCount}{' '}
              classifications · {props.countyLabel}
            </p>
            <p className="wl-2xs wl-muted">
              {candidate.countyNames.slice(0, 8).join(', ')}
              {candidate.countyCount > 8 ? ` and ${candidate.countyCount - 8} more` : ''}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function LandingDemo({ data }: { data: LandingData }) {
  const { result, selection } = data;
  return (
    <>
      {result.kind === 'determination' ? (
        <DeterminationResult view={result} selection={selection} />
      ) : null}
      {result.kind === 'candidates' ? (
        <Candidates candidates={result.candidates} countyLabel={result.countyLabel} />
      ) : null}
      {result.kind === 'empty' ? (
        <div className="wl-land__result" data-testid="demo-empty">
          <p>{LOOKUP.empty}</p>
          <p className="wl-land__note" data-wordcount="exclude">
            <Link href={result.href}>See all four construction types for {result.countyLabel}</Link>{' '}
            ·{' '}
            <a href="https://sam.gov/search/?index=dbra" target="_blank" rel="noreferrer noopener">
              Search SAM.gov directly ↗
            </a>
          </p>
        </div>
      ) : null}
      {result.kind === 'rate_limited' ? (
        <div className="wl-land__result" data-wordcount="exclude" data-testid="demo-rate-limited">
          <p className="wl-strong">Too many lookups from this connection.</p>
          <p className="wl-land__note">
            Try again in about {result.retryAfterMinutes} minutes. The determinations are public and
            searchable at the source in the meantime:{' '}
            <a href="https://sam.gov/search/?index=dbra" target="_blank" rel="noreferrer noopener">
              SAM.gov ↗
            </a>
          </p>
        </div>
      ) : null}
      {result.kind === 'unavailable' ? (
        <div data-wordcount="exclude" data-testid="demo-unavailable">
          <CorpusUnavailable reason="Our copy of the determination corpus is empty or still loading." />
        </div>
      ) : null}
    </>
  );
}

/** The widget itself: three fields, in the order the determination is keyed on. */
export function LandingWidget({ data }: { data: LandingData }) {
  return (
    <div className="wl-land__widget" data-testid="landing-widget">
      <p className="wl-land__widget-title" data-wordcount="exclude">
        Look up a rate
      </p>
      <div data-wl-click="lookup_started" data-wl-prop-field-first-touched="state">
        <LookupForm
          states={data.states}
          counties={data.counties}
          action="/"
          {...(data.selection.state ? { selectedState: data.selection.state } : {})}
          {...(data.selection.county ? { selectedCounty: data.selection.county } : {})}
          {...(data.selection.type ? { selectedType: data.selection.type } : {})}
        />
      </div>
      <p className="wl-land__note" data-wordcount="exclude" data-testid="corpus-stat">
        {data.health.activeDeterminations} active determinations ·{' '}
        {data.health.supersededRevisionsHeld} superseded revisions held ·{' '}
        {data.health.classifications} classification rows.
      </p>
    </div>
  );
}
