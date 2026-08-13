'use client';

/**
 * THE CLASSIFICATION PICKER — J6, the screen the whole autonomy argument rests on.
 *
 * AUTHORITY: `USER_JOURNEY.md` §6.1 (three candidates, **none selected**, each with
 * the group id, the verbatim label, the verbatim scope text, base and fringe, and the
 * line span; "None of these" opens the full list; **below that, nothing**), §6.3.1
 * (the permission table: the aggregate may ORDER and nothing else — no count of other
 * companies' confirmations appears beside any candidate), §6.4 (L-E's banner, L-F's
 * conformance path), `ENGINE.md` §18.2, `DESIGN_SYSTEM.md` §8.6.
 *
 * ===========================================================================
 * WHAT THIS COMPONENT MAY NOT DO, AND HOW THE PROPS ENFORCE IT
 *
 * - It cannot show a confirmation count, because there is no prop for one.
 * - It cannot pre-select from a model or an aggregate: `preSelectedOrdinal` is
 *   supplied by the server only at L-C1, where the determination's OWN verbatim
 *   label matched exactly, and `blockedLine()` throws upstream if that is violated.
 * - It cannot offer a person. There is no contact affordance in this file and no
 *   field on a `Refusal` in which one could travel. The last thing on the card is
 *   the determination's own class list, and after it there is nothing.
 */

import { useState } from 'react';

import { RefusalView } from '@/app/_components/refusal';

export interface PickerCandidate {
  readonly ordinal: number;
  readonly className: string;
  readonly classNameVerbatim: string;
  readonly rateIdentifier: string;
  readonly baseRate: string;
  readonly fringeRate: string;
  readonly sourceLineStart: number;
  readonly sourceLineEnd: number;
  readonly wdNumber: string;
  readonly revision: number;
}

export interface PickerProps {
  readonly action: (formData: FormData) => void | Promise<void>;
  /** Ids the server needs back — the week and the import. Supplied by the server
   *  component rather than reconstructed on the client, so a crafted post names a
   *  week this session can see or nothing at all. */
  readonly hidden: Readonly<Record<string, string>>;
  readonly rawTitle: string;
  readonly workers: readonly string[];
  readonly hours: string;
  readonly headline: string;
  readonly detail: string;
  readonly level: string;
  readonly banner: string | null;
  /** Non-null at L-C1 and nowhere else. */
  readonly preSelectedOrdinal: number | null;
  readonly candidates: readonly PickerCandidate[];
  /** Every parsed row of this revision, behind "None of these". */
  readonly fullList: readonly PickerCandidate[];
  readonly footnote: string;
  /** L-F only: the conformance path, and the plain statement that Ratepin does not
   *  prepare or file SF-1444s. */
  readonly conformance: {
    readonly rule: string;
    readonly citation: string;
    readonly path: string;
    readonly declined: string;
  } | null;
}

export function Picker(props: PickerProps): React.ReactElement {
  const [chosen, setChosen] = useState<number | null>(props.preSelectedOrdinal);
  const [showAll, setShowAll] = useState(props.candidates.length === 0);
  const [query, setQuery] = useState('');

  const list = showAll
    ? props.fullList.filter((candidate) =>
        query.trim() === ''
          ? true
          : `${candidate.className} ${candidate.rateIdentifier}`
              .toLowerCase()
              .includes(query.trim().toLowerCase()),
      )
    : props.candidates;

  return (
    <form className="rp-pick" action={props.action}>
      <input type="hidden" name="rawTitle" value={props.rawTitle} />
      {Object.entries(props.hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}

      <div className="rp-pick__legend">
        <p className="rp-pick__title">{props.rawTitle}</p>
        <p className="rp-pick__stakes">
          {props.workers.join(', ')} · <span className="rp-num">{props.hours}</span> hours on this
          week
        </p>
        <p className="rp-alert__title">{props.headline}</p>
      </div>

      {props.detail.split('\n\n').map((paragraph) => (
        <p key={paragraph.slice(0, 40)}>{paragraph}</p>
      ))}

      {/* L-E: "Candidate ranking is in reduced mode right now." Neutral ink — this is
          not an error, it is the free generator's own path, which is the most
          exercised code in the product. */}
      {props.banner === null ? null : <p className="rp-pick__reduced">{props.banner}</p>}

      {props.conformance === null ? null : (
        <RefusalView
          refusal={{
            primitive: 'P-D',
            headline: 'Whether this work requires a conformance request',
            rule: props.conformance.rule,
            citation: props.conformance.citation,
            observableFacts: [],
            declined: `${props.conformance.path} ${props.conformance.declined}`,
          }}
        />
      )}

      {showAll ? (
        <div className="rp-field">
          <label className="rp-field__label" htmlFor={`search-${props.rawTitle}`}>
            Search this determination’s classifications
          </label>
          <input
            id={`search-${props.rawTitle}`}
            className="rp-input"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            autoComplete="off"
          />
        </div>
      ) : null}

      <div className="rp-pick__options" role="radiogroup" aria-label={`Classification for ${props.rawTitle}`}>
        {list.map((candidate) => (
          <label
            className="rp-pick__option"
            key={candidate.ordinal}
            data-checked={chosen === candidate.ordinal ? 'true' : undefined}
          >
            <input
              type="radio"
              name="chosenOrdinal"
              value={String(candidate.ordinal)}
              checked={chosen === candidate.ordinal}
              onChange={() => setChosen(candidate.ordinal)}
            />
            <span className="rp-pick__body">
              <span className="rp-pick__head">
                <span className="rp-pick__class">{candidate.className}</span>
                <span className="rp-pick__group">{candidate.rateIdentifier}</span>
              </span>
              <blockquote className="rp-pick__scope">{candidate.classNameVerbatim}</blockquote>
              <dl className="rp-pick__rates">
                <span className="rp-pick__rate-pair">
                  <dt>Base</dt>
                  <dd>{candidate.baseRate}</dd>
                </span>
                <span className="rp-pick__rate-pair">
                  <dt>Fringe</dt>
                  <dd>{candidate.fringeRate}</dd>
                </span>
              </dl>
              <span className="rp-pick__source rp-num">
                {candidate.wdNumber} revision {candidate.revision} · lines{' '}
                {candidate.sourceLineStart}–{candidate.sourceLineEnd}
              </span>
              {props.preSelectedOrdinal === candidate.ordinal ? (
                <span className="rp-pick__preselect">
                  Pre-selected because this determination’s own label matches your title exactly.
                  It is still blocked until you click.
                </span>
              ) : null}
            </span>
          </label>
        ))}
      </div>

      <div className="rp-pick__escape">
        {showAll ? null : (
          <button type="button" className="rp-btn rp-btn--quiet" onClick={() => setShowAll(true)}>
            None of these — show the determination’s full classification list
          </button>
        )}
        <div className="rp-btn-row">
          <button
            type="submit"
            className="rp-btn rp-btn--primary"
            aria-disabled={chosen === null ? true : undefined}
            disabled={chosen === null}
          >
            Use this classification
          </button>
        </div>
        {chosen === null ? (
          <p className="rp-btn__why">
            Nothing is chosen. Ratepin does not pick a classification for you, and no other
            company’s answer is ever applied to your filing. Read the scope text and choose the one
            whose work this is — or leave the row blocked and the filing renders as a draft with
            this row flagged.
          </p>
        ) : null}
        <p className="rp-t-micro">{props.footnote}</p>
      </div>
    </form>
  );
}
