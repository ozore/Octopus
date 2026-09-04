/**
 * THE STATUS PILL — the four-signal encoding. `IDENTITY.md` §6.4, §12.7.
 *
 * **Word + glyph + fill pattern + hue. Never fewer than four.**
 *
 * Because every chromatic status foreground has to clear 4.5:1 against the same
 * white, their luminances are forced together — the four chromatic fills sit
 * within 1.47:1 of each other in greyscale. That is arithmetic, not a flaw to
 * fix, and it means **colour cannot be the carrier of meaning in this system**.
 * A greyscale print of a gap report — which is what a board packet or an audit
 * file actually is — has to stay readable, so the glyph and the word survive
 * the photocopier.
 *
 * `identity/contrast.py` hard-fails if the glyph, the pattern or the word is
 * ever duplicated across two states, so the guarantee extends automatically to
 * any state added later. The seven glyphs are transcribed from
 * `identity/samples.html`, which that script certifies; do not redraw them
 * here.
 *
 * P3, from `IDENTITY.md` §5: **the pill is never rendered without a nearby
 * date.** `asOf` is not optional decoration — a status with no date is a claim
 * with no expiry, which is the thing this product exists not to make. Pass
 * `asOf={null}` deliberately (a legend, a filter chip) and the component omits
 * the stamp; omit the prop and TypeScript stops you.
 */

import type { ReactElement } from 'react';

import { STATUS_MODIFIER, STATUS_WORD, type StatusState } from '@/lib/status';

const GLYPH: Record<StatusState, ReactElement> = {
  // A check inside a FILLED disc.
  meets: (
    <>
      <circle cx="7" cy="7" r="6.25" fill="currentColor" />
      <path d="M4 7.2l2 2 4-4.4" fill="none" stroke="var(--c-ok-bg)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  // A clock inside a RING.
  expiring: (
    <>
      <circle cx="7" cy="7" r="5.6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 4v3.3l2.1 1.4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  // A HALF-FILLED disc: LANDING_SPEC §5 V1 calls this the product's
  // logo-equivalent, so it is drawn rather than tinted.
  asserted_only: (
    <>
      <path d="M7 .75a6.25 6.25 0 010 12.5z" fill="currentColor" />
      <circle cx="7" cy="7" r="6.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </>
  ),
  // A slash inside a HOLLOW, dashed disc — the absence is the point.
  gap: (
    <>
      <circle cx="7" cy="7" r="5.6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2.4 2" />
      <path d="M4.4 9.6l5.2-5.2" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </>
  ),
  // A question mark in a SQUARE.
  needs_review: (
    <>
      <rect x="1.2" y="1.2" width="11.6" height="11.6" rx="1.6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.3 5.2a1.75 1.75 0 113 1.2c-.55.45-.8.8-.8 1.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="7.5" cy="10.2" r=".85" fill="currentColor" />
    </>
  ),
  // An em dash with NO CONTAINER — the only one, so the seven silhouettes stay
  // separable at 12px: three discs, one ring, one square, one document, one
  // bare rule.
  not_checked: <path d="M2.5 7h9" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />,
  // An EMPTY DOCUMENT OUTLINE.
  no_certificate: (
    <>
      <path d="M3 1.4h5l3 3v8.2H3z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M8 1.4v3h3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </>
  ),
};

export type StatusPillProps = {
  state: StatusState;
  /**
   * Overrides the word. The one legitimate use is the vendor state `expired`,
   * which renders in the `gap` ramp with its OWN word because "Expired"
   * (lapsed) and "Gap" (short) carry different facts (`specs/05` §2.1).
   */
  word?: string;
  /** A count or a countdown, set in the tabular face: `9d`, `3`. */
  detail?: string;
  /** The date the status was true. `null` only where no status is asserted. */
  asOf: string | null;
  className?: string;
};

export function StatusPill({ state, word, detail, asOf, className }: StatusPillProps) {
  const label = word ?? STATUS_WORD[state];
  const modifier = STATUS_MODIFIER[state];

  return (
    <span className="c-gap-2" style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--c-space-2)' }}>
      <span
        className={`c-pill c-pill--${modifier}${className ? ` ${className}` : ''}`}
        data-status={state}
        data-testid={`status-pill-${state}`}
      >
        <svg className="c-pill__glyph" viewBox="0 0 14 14" aria-hidden="true">
          {GLYPH[state]}
        </svg>
        {label}
        {detail ? <span className="c-pill__n">{detail}</span> : null}
      </span>
      {asOf ? (
        <span className="c-asof">
          as of <time dateTime={asOf}>{asOf}</time>
        </span>
      ) : null}
    </span>
  );
}

/**
 * The dot, for places too small for a pill. **Always accompanied by text** —
 * a bare dot is colour alone, which this system does not permit.
 */
export function StatusDot({ state, label }: { state: StatusState; label: string }) {
  return (
    <span className="c-gap-2">
      <span className={`c-dot c-dot--${STATUS_MODIFIER[state]}`} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
