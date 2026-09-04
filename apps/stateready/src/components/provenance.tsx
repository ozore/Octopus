/**
 * Provenance, refusal and the disclaimer — the three components that carry this
 * product's honesty, and therefore the three that no screen may skip.
 *
 * `UX.md` C4: **every rendered rule carries a `.sr-source` provenance line. No
 * provenance, no value: render "not yet verified" and link the board instead.**
 * `UX.md` C7: **the disclaimer appears in the footer of every app screen and
 * every generated document.**
 */

import type { ReactNode } from 'react';

/**
 * The line under every value we took from a board: the page, the day we last
 * checked it, and — when the value is anything below `high` — the note that
 * says what we read and what we inferred (`specs/05` invariant 2).
 */
export function Provenance({
  url,
  title,
  lastVerified,
  confidence,
  unverified,
  notes,
}: {
  url: string | null;
  title?: string | null;
  lastVerified?: string | null;
  confidence?: 'high' | 'medium' | 'low' | null;
  unverified?: boolean;
  notes?: readonly string[];
}) {
  if (!url) {
    return (
      <span className="sr-source" data-confidence="unverified">
        <span className="sr-source__conf">Unverified</span> — we have no published page for this.
      </span>
    );
  }
  const host = url.replace(/^https?:\/\//, '').split('/')[0];
  return (
    <>
      <span className="sr-source" data-confidence={unverified ? 'unverified' : (confidence ?? 'high')}>
        {unverified ? <span className="sr-source__conf">Unverified</span> : null}
        <a href={url} rel="noreferrer noopener" target="_blank">
          {title ?? host}
        </a>
        {lastVerified ? <span> · checked {lastVerified}</span> : null}
        {confidence && confidence !== 'high' ? (
          <span className="sr-source__conf"> · {confidence} confidence</span>
        ) : null}
      </span>
      {(notes ?? []).map((note) => (
        <span className="sr-note" key={note}>
          {note}
        </span>
      ))}
    </>
  );
}

/**
 * The refusal state.
 *
 * Where we could not establish a value from a public source, this renders
 * **instead of a number** — never an estimate, never a blank, never a zero. It
 * says what we read and where to ask. Refusal is a first-class outcome and a
 * proof point, not an error (`UX.md` §2, `specs/12`).
 */
export function NotYetVerified({
  what,
  why,
  boardUrl,
  boardName,
}: {
  what?: string;
  why?: string | null;
  boardUrl?: string | null;
  boardName?: string | null;
}) {
  return (
    <span className="sr-refusal" data-testid="refusal">
      <span>not yet verified</span>
      <span className="sr-refusal__why">
        {why ?? `The board does not publish ${what ?? 'this'} on any page we have read.`}{' '}
        {boardUrl ? (
          <a href={boardUrl} rel="noreferrer noopener" target="_blank">
            Ask {boardName ?? 'the board'}
          </a>
        ) : null}
      </span>
    </span>
  );
}

/**
 * THE CANONICAL DISCLAIMER — `specs/12`, verbatim.
 *
 * Two shapes, one text: `short` for the footer of every screen and the head of
 * every document, `full` for `/legal/disclaimer`.
 *
 * **It contains no cadence claim** (wave-1b **M12**). "We check every source
 * daily and re-verify monthly" is a promise about our own uptime, made to a
 * consumer, on the page a state UDAP action would be built from — and
 * `specs/14` itself contemplates the cron failing. The cadence is a TARGET and
 * lives on `/help/methodology` beside the live figures that show whether we are
 * meeting it. `tests/legal.test.ts` greps this text for "daily", "monthly" and
 * "every month" and fails on a match.
 */
export const DISCLAIMER_SHORT =
  'StateReady is a tracking and research tool. It is not legal advice and it is not a licensing service. ' +
  'Every value shows the board page it came from and the date we last checked it; anything we could not ' +
  'establish from a public source is shown as unestablished, never estimated. The licensing board, not ' +
  'StateReady, is the authority on your licence.';

export const DISCLAIMER_SECTIONS: { heading: string; body: string }[] = [
  {
    heading: 'What StateReady is',
    body:
      'StateReady is a tracking and research tool. It is not legal advice and it is not a licensing service. ' +
      "The licensing information in StateReady is compiled from state licensing boards' own published pages " +
      'and from state statutes and administrative rules. Every value we show you carries the web address it ' +
      'came from and the date we last checked it, and every value we could not establish from a public ' +
      'source is shown as unestablished rather than estimated. Where a value has not been re-checked in 180 ' +
      "days we stop showing it as verified and show you the board's page instead. Our coverage, and the age " +
      'of every value in it, is published live at /coverage.',
  },
  {
    heading: 'What we do not do',
    body:
      'We do not file applications, renewals or continuing-education records on your behalf. We do not cover ' +
      'county or city licensing, permits or registrations, which exist in most states in addition to the ' +
      'state licence. We cover HVAC, plumbing and electrical only, in the states listed on our coverage ' +
      'page. Where we could not establish a fact from a public source, we say so and leave it blank — we ' +
      'never estimate a fee, a fee-free period, an hour count or a processing time.',
  },
  {
    heading: 'What you must still do',
    body:
      'Confirm anything that carries a "needs checking" flag with the board before you rely on it. Rules ' +
      'change between our checks. The licensing board, not StateReady, is the authority on your licence.',
  },
];

export function Disclaimer({ children }: { children?: ReactNode }) {
  return (
    <p className="sr-disclaimer" data-testid="disclaimer">
      {children ?? DISCLAIMER_SHORT}{' '}
      <a href="/legal/disclaimer">Read the full disclaimer.</a>
    </p>
  );
}
