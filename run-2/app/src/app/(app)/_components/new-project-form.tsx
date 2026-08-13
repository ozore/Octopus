'use client';

/**
 * S10 — the six required fields, and the sixth is the one this component exists for.
 *
 * AUTHORITY: `USER_JOURNEY.md` §4.1 (the six fields and the three refinements behind
 * progressive disclosure), §4.4.1 (**the contract-value question, exactly as it is
 * asked — no option pre-selected, and the primary button is inert until one is
 * chosen**), §4.5 (the funding source that ends the flow honestly),
 * `DESIGN_SYSTEM.md` §8.2 (a disabled button with no adjacent reason is a review
 * failure), §8.3 (form controls).
 *
 * ===========================================================================
 * WHY THIS IS A CLIENT COMPONENT AND ALMOST NOTHING ELSE IS
 *
 * Two behaviours require state on the client and neither can be faked server-side
 * without a round trip that would defeat it:
 *
 * 1. **The primary button is inert until the band is chosen.** Not "submits and
 *    shows an error" — inert, with the reason beside it. A server-side check would
 *    let the click happen, and the click is the thing being prevented.
 * 2. **Choosing "state or local money only" ends the flow immediately**, in place,
 *    with the P-D. Refusing an unqualified buyer at minute three is the point;
 *    refusing them after a submit is a slower version of the same refusal.
 *
 * THERE IS NO DEFAULT ON THE BAND AND THERE MUST NEVER BE ONE. `defaultChecked` on
 * any of the three radios is a review failure: both guesses are harmful on a
 * document signed under 18 U.S.C. 1001, and `unknown` is a real answer rather than a
 * skip.
 */

import { useState } from 'react';

import {
  BAND_OPTIONS,
  BAND_QUESTION,
  BAND_WHAT_WE_DONT_DO,
  BAND_WHERE_TO_READ,
  BAND_WHY_WE_ASK,
  CALIFORNIA_IDENTIFIERS,
  LOCK_EXPLANATION,
  LOCK_IS_YOURS,
  STATE_ONLY_REFUSAL,
} from '../_lib/copy';
import { CONSTRUCTION_TYPES, FUNDING_SOURCES } from '../_lib/projects';

export interface NewProjectFormProps {
  readonly action: (formData: FormData) => void | Promise<void>;
  readonly states: readonly string[];
  readonly counties: readonly string[];
  readonly initialWdNumber: string | null;
  readonly initialState: string | null;
  readonly initialCounty: string | null;
  readonly initialConstructionType: string | null;
}

export function NewProjectForm(props: NewProjectFormProps): React.ReactElement {
  const [band, setBand] = useState<string | null>(null);
  const [funding, setFunding] = useState<string | null>(null);
  const [stateCode, setStateCode] = useState(props.initialState ?? '');
  const [county, setCounty] = useState(props.initialCounty ?? '');
  const [constructionType, setConstructionType] = useState(props.initialConstructionType ?? '');
  const [name, setName] = useState('');
  const [wdNumber, setWdNumber] = useState(props.initialWdNumber ?? '');

  const stateOnly = funding === 'state_only';
  const missing: string[] = [];
  if (name.trim() === '') missing.push('a project name');
  if (stateCode.trim() === '') missing.push('a state');
  if (county.trim() === '') missing.push('a county');
  if (constructionType === '') missing.push('a construction type');
  if (funding === null) missing.push('a funding source');
  if (band === null) missing.push('an answer to the contract-value question');

  const inert = stateOnly || missing.length > 0;

  return (
    <form className="rp-stack rp-stack--section" action={props.action}>
      <section className="rp-stack">
        <div className="rp-field">
          <label className="rp-field__label" htmlFor="project-name">
            1 · Project name
          </label>
          <input
            id="project-name"
            name="name"
            className="rp-input"
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            autoComplete="off"
          />
          <p className="rp-field__help">
            Yours, not ours. It prints on the WH-347 header and it is how the Friday board names
            this job.
          </p>
        </div>

        <div className="rp-field">
          <label className="rp-field__label" htmlFor="project-state">
            2 · State and county
          </label>
          <div className="rp-row">
            <select
              id="project-state"
              name="stateCode"
              className="rp-select"
              value={stateCode}
              onChange={(event) => setStateCode(event.currentTarget.value)}
            >
              <option value="">— state —</option>
              {props.states.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
            <input
              aria-label="County"
              name="countyName"
              className="rp-input"
              list="county-options"
              value={county}
              onChange={(event) => setCounty(event.currentTarget.value)}
              autoComplete="off"
            />
            <datalist id="county-options">
              {props.counties.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </div>
          <p className="rp-field__help">
            The site’s county decides which determinations cover the work. The list is the counties
            the mirror actually holds rates for.
          </p>
        </div>

        <fieldset className="rp-fieldset">
          <legend className="rp-field__label">3 · Construction type</legend>
          {CONSTRUCTION_TYPES.map((type) => (
            <label className="rp-check" key={type}>
              <input
                type="radio"
                name="constructionType"
                value={type}
                checked={constructionType === type}
                onChange={() => setConstructionType(type)}
              />
              <span className="rp-check__text">{type}</span>
            </label>
          ))}
          <p className="rp-field__help">
            Determinations split on this axis. If you pick wrong, nothing is destroyed — change it
            and the candidates change. A pin can be replaced; the old one is kept.
          </p>
        </fieldset>

        <fieldset className="rp-fieldset">
          <legend className="rp-field__label">4 · Funding source</legend>
          {FUNDING_SOURCES.map((source) => (
            <label className="rp-check" key={source.value}>
              <input
                type="radio"
                name="fundingSource"
                value={source.value}
                checked={funding === source.value}
                onChange={() => setFunding(source.value)}
              />
              <span className="rp-check__text">{source.label}</span>
            </label>
          ))}
        </fieldset>

        {stateOnly ? (
          <div className="rp-alert rp-alert--declined" role="group" aria-label="Ratepin declines">
            <span className="rp-alert__glyph" aria-hidden="true">
              §
            </span>
            <div className="rp-alert__body">
              <p className="rp-alert__title">This is not a Davis-Bacon project</p>
              <p>{STATE_ONLY_REFUSAL}</p>
            </div>
          </div>
        ) : null}

        <div className="rp-field">
          <label className="rp-field__label" htmlFor="project-wd">
            5 · Wage determination
          </label>
          <input
            id="project-wd"
            name="wdNumber"
            className="rp-input rp-input--num"
            value={wdNumber}
            onChange={(event) => setWdNumber(event.currentTarget.value.toUpperCase())}
            placeholder="CA20260012"
            autoComplete="off"
          />
          <p className="rp-field__help">
            The number off your contract. Or{' '}
            <a
              href={`/app/projects/new/wd?state=${encodeURIComponent(stateCode)}&county=${encodeURIComponent(county)}&type=${encodeURIComponent(constructionType)}`}
            >
              find it for me
            </a>{' '}
            — the candidates come from the last promoted snapshot, and Ratepin makes no live call to
            SAM.gov to answer this.
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------------
          FIELD 6 — §4.4.1, verbatim, with no option pre-selected.
          --------------------------------------------------------------- */}
      <section className="rp-stack rp-measure">
        <fieldset className="rp-fieldset">
          <legend className="rp-field__label">6 · Contract value</legend>
          <p className="rp-t-lead">{BAND_QUESTION}</p>
          {BAND_OPTIONS.map((option) => (
            <label className="rp-check" key={option.value}>
              <input
                type="radio"
                name="contractValueBand"
                value={option.value}
                checked={band === option.value}
                onChange={() => setBand(option.value)}
              />
              <span className="rp-check__text">{option.label}</span>
            </label>
          ))}
        </fieldset>

        <details className="rp-disclose">
          <summary>Why we ask, and where to read the answer</summary>
          <div className="rp-disclose__body rp-stack rp-stack--tight">
            <p>
              <strong>Why we ask.</strong> {BAND_WHY_WE_ASK}
            </p>
            <p>
              <strong>Where to read the answer.</strong> {BAND_WHERE_TO_READ}
            </p>
            <p>
              <strong>What we don’t do.</strong> {BAND_WHAT_WE_DONT_DO}
            </p>
          </div>
        </details>
      </section>

      {/* Progressive disclosure — §4.1's three refinements, all optional. */}
      <details className="rp-disclose">
        <summary>Award date, contract number, and the contract lock</summary>
        <div className="rp-disclose__body rp-stack">
          <div className="rp-field">
            <label className="rp-field__label" htmlFor="award-date">
              Award or bid date
            </label>
            <input id="award-date" name="awardDate" type="date" className="rp-input rp-input--num" />
            <p className="rp-field__help">
              Needed for “what changed since award”. Leave it blank and that comparison is simply
              not offered.
            </p>
          </div>
          <div className="rp-field">
            <label className="rp-field__label" htmlFor="contract-number">
              Contract number
            </label>
            <input id="contract-number" name="contractNumber" className="rp-input" />
            <p className="rp-field__help">Printed on the form when you supply it.</p>
          </div>
          <label className="rp-check">
            <input type="checkbox" name="lockedAtAward" value="true" />
            <span className="rp-check__text">
              My contract incorporates this revision at award, and my contracting officer hasn’t
              modified it.
            </span>
          </label>
          <p className="rp-check__note">{LOCK_EXPLANATION}</p>
          <p className="rp-check__note">{LOCK_IS_YOURS}</p>
        </div>
      </details>

      <details className="rp-disclose">
        <summary>California DIR identifiers (optional)</summary>
        <div className="rp-disclose__body rp-stack">
          <p>{CALIFORNIA_IDENTIFIERS}</p>
          <div className="rp-field">
            <label className="rp-field__label" htmlFor="pwcr">
              Contractor registration number (PWCR)
            </label>
            <input id="pwcr" name="contractorPwcr" className="rp-input rp-input--num" />
          </div>
          <div className="rp-field">
            <label className="rp-field__label" htmlFor="dir-project">
              DIR Project ID
            </label>
            <input id="dir-project" name="dirProjectId" className="rp-input rp-input--num" />
          </div>
        </div>
      </details>

      <div className="rp-btn-row">
        <button
          type="submit"
          className="rp-btn rp-btn--primary"
          aria-disabled={inert ? true : undefined}
          disabled={inert}
        >
          Create the project
        </button>
      </div>
      {inert ? (
        <p className="rp-btn__why">
          {stateOnly
            ? 'Ratepin does not take money for a project it cannot serve. Change the funding source, or close this page.'
            : `Still needed: ${missing.join(', ')}. The contract-value question has no default in either direction — over the line we compute a premium, under it we don’t, and both answers land on a document you sign.`}
        </p>
      ) : null}
    </form>
  );
}
