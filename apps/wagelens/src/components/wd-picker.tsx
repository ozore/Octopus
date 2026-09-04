'use client';

/**
 * WL-02's step 2, as components: the two entry paths and the candidate list.
 *
 * **THE ONE RULE THIS FILE EXISTS TO ENFORCE (V6): when more than one
 * determination covers the county, nothing is preselected and the form cannot
 * be submitted until a human chooses.** 12.17% of (state, county, construction
 * type) combinations map to more than one active determination, so a screen
 * that promised one answer would be wrong in a way the user cannot detect —
 * every rate downstream would look authoritative and come from the wrong
 * document. There is no "most likely" heuristic in this file and there is
 * nowhere in the codebase to put one.
 *
 * **Geography narrows; it does not decide.** The typed-number path is offered
 * FIRST, because 29 CFR 5.5(a)(1)(i) makes the governing determination the one
 * the contracting officer incorporated into the contract — not the one we would
 * have chosen from a map.
 *
 * Everything here is a client component only because a radio has to disable a
 * button and a select has to change the URL. The resolution, the candidates and
 * the confirm card are all rendered on the server from the corpus.
 */

import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';

export type CandidateView = {
  wdNumber: string;
  modificationNumber: number;
  publicationDate: string;
  constructionTypes: string[];
  countyNames: string[];
  countyCount: number;
  classificationCount: number;
  publicUrl: string;
};

export type WdPickerDraft = {
  name: string;
  projectOrContractNo: string;
  locationDescription: string;
  ourRole: string;
  primeContractorName: string;
  awardingAgency: string;
};

const DRAFT_FIELDS: Array<keyof WdPickerDraft> = [
  'name',
  'projectOrContractNo',
  'locationDescription',
  'ourRole',
  'primeContractorName',
  'awardingAgency',
];

/**
 * The step-1 answers travel in the URL when step 2 re-renders, so a search
 * never costs the user the four fields they already typed. Read from the live
 * form rather than from props: what is on the screen is the truth.
 */
function draftFromForm(formId: string): URLSearchParams {
  const params = new URLSearchParams();
  const form = typeof document === 'undefined' ? null : document.getElementById(formId);
  if (form instanceof HTMLFormElement) {
    const data = new FormData(form);
    for (const field of DRAFT_FIELDS) {
      const value = data.get(field);
      if (typeof value === 'string' && value.length > 0) params.set(field, value);
    }
  }
  return params;
}

function formatDay(value: string): string {
  if (!value) return 'unknown';
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.valueOf())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/** Entry path (A) — "my contract names a wage determination number". */
export function WdNumberEntry({
  formId,
  wdNumber,
  modificationNumber,
}: {
  formId: string;
  wdNumber: string;
  modificationNumber: string;
}) {
  const router = useRouter();
  const [number, setNumber] = useState(wdNumber);
  const [modification, setModification] = useState(modificationNumber);

  function check() {
    const params = draftFromForm(formId);
    if (number.trim()) params.set('wd', number.trim());
    if (modification.trim()) params.set('mod', modification.trim());
    router.push(`/projects/new?${params.toString()}`);
  }

  return (
    <div className="wl-stack-2" data-testid="wd-number-entry">
      <p className="wl-strong">My contract names a wage determination number</p>
      <div className="wl-row">
        <div className="wl-field">
          <label className="wl-field__label" htmlFor="wdNumber">
            Wage determination number
          </label>
          <input
            className="wl-input wl-mono"
            id="wdNumber"
            name="wdNumber"
            form={formId}
            value={number}
            onChange={(event) => setNumber(event.target.value)}
            placeholder="TX20260253"
            autoComplete="off"
          />
          <p className="wl-field__help">
            Exactly as your contract prints it. Short forms resolve too —{' '}
            <span className="wl-mono">TX260253</span>, <span className="wl-mono">TX0253</span>.
          </p>
        </div>
        <div className="wl-field">
          <label className="wl-field__label" htmlFor="wdModificationNumber">
            Modification (optional)
          </label>
          <input
            className="wl-input wl-input--num"
            id="wdModificationNumber"
            name="wdModificationNumber"
            form={formId}
            value={modification}
            onChange={(event) => setModification(event.target.value)}
            inputMode="numeric"
            placeholder="current"
            autoComplete="off"
          />
          <p className="wl-field__help">
            Leave it blank for the current one. Name an older modification and we pin that one —
            29 CFR 1.6 fixes the determination at solicitation or award, so your contract governs.
          </p>
        </div>
      </div>
      <p>
        <button
          className="wl-btn wl-btn--secondary"
          type="button"
          onClick={check}
          data-testid="wd-check"
        >
          Check this number
        </button>
      </p>
    </div>
  );
}

/** Entry path (B) — "help me find it". State and county narrow; the
 *  construction type is a picker with definitions, because choosing Building
 *  for a water-line job is the most common way to end up on a plausible-looking
 *  and entirely wrong payroll. */
export function GeographySearch({
  formId,
  states,
  counties,
  constructionTypes,
  selected,
}: {
  formId: string;
  states: Array<{ stateCode: string; countyCount: number }>;
  counties: Array<{ samCountyCode: number; countyName: string }>;
  constructionTypes: Array<{ value: string; description: string }>;
  selected: { stateCode: string; samCountyCode: string; constructionType: string };
}) {
  const router = useRouter();
  const [stateCode, setStateCode] = useState(selected.stateCode);
  const [samCountyCode, setSamCountyCode] = useState(selected.samCountyCode);
  const [constructionType, setConstructionType] = useState(selected.constructionType);

  function go(next: { stateCode?: string; samCountyCode?: string; constructionType?: string }) {
    const params = draftFromForm(formId);
    const state = next.stateCode ?? stateCode;
    const county = next.samCountyCode ?? samCountyCode;
    const type = next.constructionType ?? constructionType;
    if (state) params.set('state', state);
    if (county) params.set('county', county);
    if (type) params.set('type', type);
    params.set('search', '1');
    router.push(`/projects/new?${params.toString()}`);
  }

  const description = constructionTypes.find((t) => t.value === constructionType)?.description;

  return (
    <div className="wl-stack-2" data-testid="geography-search">
      <p className="wl-strong">Help me find it</p>
      <div className="wl-row">
        <div className="wl-field">
          <label className="wl-field__label" htmlFor="stateCode">
            State
          </label>
          <select
            className="wl-select"
            id="stateCode"
            name="stateCode"
            form={formId}
            value={stateCode}
            onChange={(event) => {
              setStateCode(event.target.value);
              setSamCountyCode('');
            }}
          >
            <option value="">Choose a state</option>
            {states.map((state) => (
              <option key={state.stateCode} value={state.stateCode}>
                {state.stateCode} ({state.countyCount} counties)
              </option>
            ))}
          </select>
        </div>
        <div className="wl-field">
          <label className="wl-field__label" htmlFor="samCountyCode">
            County
          </label>
          <select
            className="wl-select"
            id="samCountyCode"
            name="samCountyCode"
            form={formId}
            value={samCountyCode}
            onChange={(event) => setSamCountyCode(event.target.value)}
            disabled={counties.length === 0}
          >
            <option value="">
              {counties.length === 0 ? 'Choose a state first' : 'Choose a county'}
            </option>
            {counties.map((county) => (
              <option key={county.samCountyCode} value={String(county.samCountyCode)}>
                {county.countyName}
              </option>
            ))}
          </select>
          <p className="wl-field__help">
            Picked from the list, never typed: a county name matches SAM.gov on its numeric code,
            and a name string returns nothing at all.
          </p>
        </div>
        <div className="wl-field">
          <label className="wl-field__label" htmlFor="constructionType">
            Construction type
          </label>
          <select
            className="wl-select"
            id="constructionType"
            name="constructionType"
            form={formId}
            value={constructionType}
            onChange={(event) => setConstructionType(event.target.value)}
          >
            <option value="">Choose a type</option>
            {constructionTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.value}
              </option>
            ))}
          </select>
          <p className="wl-field__help" data-testid="construction-type-description">
            {description ??
              'Building, Residential, Highway or Heavy — the four DOL types, each with its own determination.'}
          </p>
        </div>
      </div>
      <dl className="wl-facts" data-testid="construction-type-definitions">
        {constructionTypes.map((type) => (
          <div key={type.value}>
            <dt>{type.value}</dt>
            <dd>{type.description}</dd>
          </div>
        ))}
      </dl>
      <p>
        <button
          className="wl-btn wl-btn--secondary"
          type="button"
          onClick={() => go({})}
          disabled={!stateCode || !samCountyCode}
          data-testid="wd-search"
        >
          Find determinations
        </button>
      </p>
    </div>
  );
}

/**
 * The candidate list and the submit button, together, because V6 is a
 * relationship between them: **`disabled` is true exactly while more than one
 * candidate is on screen and none has been chosen.** Nothing is checked by
 * default when `candidates.length > 1`; a single candidate is offered as a
 * confirm card that still says "check this against your contract".
 */
export function CandidateChoice({
  formId,
  candidates,
  confirmCard,
  resolvedByNumber,
  children,
}: {
  formId: string;
  candidates: CandidateView[];
  confirmCard?: ReactNode;
  resolvedByNumber: boolean;
  children?: ReactNode;
}) {
  const ambiguous = candidates.length > 1;
  const [chosen, setChosen] = useState<string>(
    candidates.length === 1 && candidates[0]
      ? `${candidates[0].wdNumber}|${candidates[0].modificationNumber}|1`
      : '',
  );
  const blocked = ambiguous && chosen === '';

  return (
    <div className="wl-stack" data-testid="candidate-choice">
      {ambiguous ? (
        <div className="wl-alert wl-alert--info" role="note">
          <div>
            <p className="wl-alert__title">
              {candidates.length} determinations cover this county and type.
            </p>
            <p className="wl-alert__body">
              About one county-and-type combination in eight has more than one, so nothing is
              chosen for you. The determination that governs is the one your contract names; the
              county list below is what tells them apart.
            </p>
          </div>
        </div>
      ) : null}

      {candidates.length > 0 ? (
        <fieldset className="wl-candidates" data-testid="candidate-list">
          <legend className="wl-visually-hidden">Choose the determination your contract names</legend>
          {candidates.map((candidate, index) => {
            const value = `${candidate.wdNumber}|${candidate.modificationNumber}|${candidates.length}`;
            return (
              <article className="wl-candidate" key={value} data-testid="candidate">
                <label className="wl-row wl-row--between">
                  <span className="wl-row">
                    <input
                      type="radio"
                      name="candidate"
                      form={formId}
                      value={value}
                      checked={chosen === value}
                      onChange={() => setChosen(value)}
                      data-testid={`candidate-radio-${index}`}
                    />
                    <span className="wl-mono wl-strong">{candidate.wdNumber}</span>
                  </span>
                  <span className="wl-xs wl-muted">
                    Modification {candidate.modificationNumber} · published{' '}
                    {formatDay(candidate.publicationDate)}
                  </span>
                </label>
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
                  <a
                    className="wl-source"
                    href={candidate.publicUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    ⧉ View {candidate.wdNumber} on SAM.gov
                  </a>
                </p>
              </article>
            );
          })}
        </fieldset>
      ) : null}

      {confirmCard}
      {children}

      {blocked ? (
        <p className="wl-sm wl-muted" data-testid="candidate-required">
          Choose the determination your contract names to continue. We will not pick one for you.
        </p>
      ) : null}

      <div className="wl-row">
        <button
          className="wl-btn wl-btn--primary"
          type="submit"
          form={formId}
          disabled={blocked}
          data-testid="create-project"
        >
          Create project
        </button>
        {!resolvedByNumber && candidates.length === 0 ? (
          <span className="wl-xs wl-muted">
            Enter the determination number from your contract, or search by county.
          </span>
        ) : null}
      </div>
    </div>
  );
}
