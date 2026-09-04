/**
 * The honesty rule — `specs/05` invariant 2, plus `specs/14` invariant 2.
 *
 * This is the single most consequential function in the product: it decides
 * whether a date is shown as a date or as a flag, and it is what stops an
 * inference reaching a customer as a fact.
 *
 * THE TABLE, from `specs/05` (as iterated — `REVIEW_RESPONSE.md` B6):
 *
 *   | governing value                | deadline | needsHumanCheck | renders               |
 *   | verified + high                | yes      | false           | date + citation       |
 *   | verified + medium, with a note | yes      | false           | date + citation + NOTE|
 *   | verified + medium, no note     | yes      | TRUE            | flagged (fail closed) |
 *   | verified + low                 | yes      | true            | flagged               |
 *   | unverified (any confidence)    | yes      | true            | flagged, UNVERIFIED   |
 *   | unknown (null)                 | NO       | –               | "we could not derive" |
 *
 * Two rules that are not in that table and are not optional:
 *
 *  1. **Staleness (`specs/14` invariant 2, wave-1b m15).** A value whose
 *     `last_verified` is more than 180 days old stops being *asserted*: it
 *     renders exactly as an `unverified` one does and flips `needsHumanCheck`
 *     on every deadline derived from it. The record does not change and the
 *     value is not deleted. 180 days is the runtime rule; gate G13's 400-day
 *     build-breaking backstop is separate and stays.
 *  2. **No component may key on `status` alone** (`specs/05`, `REVIEW_RESPONSE`
 *     M11). `confidence` and `needsHumanCheck` are both carried on every derived
 *     deadline and every renderer takes both. `verified` is a statement about
 *     our process; `confidence` is a statement about the page.
 *
 * FAIL-CLOSED IS EVALUATED OVER THE GOVERNING SET, NOT PER VALUE — and this is
 * a deliberate, recorded deviation from the letter of invariant 2. A renewal
 * date under the `anniversary` token is governed by TWO values (the token and
 * the cycle), and in `tx-plumbing` both are `verified`/`medium` while only the
 * cycle carries the note that explains the inference. Read per value, the
 * spec's own AC7 ("`needsHumanCheck = false` for licence type [0]") is
 * unsatisfiable against the committed data. Read over the set — *the derived
 * date is explained if any of the non-high values that produced it explains
 * itself* — AC7 and AC7b both hold, and the meaning is the one the spec argues
 * for: "a medium reading we cannot explain is not a medium reading". Recorded in
 * `BUILD.md` with the one-line reversal.
 */

import type { Confidence, SourcedValue, ValueStatus } from '../kb/types';
import { daysBetween } from './dates';

/** `specs/14` invariant 2 / `KNOWLEDGE_BASE.md` §14 Q7. */
export const STALENESS_DAYS = 180;

export const CONFIDENCE_ORDER: Record<Confidence, number> = { low: 0, medium: 1, high: 2 };

export type Citation = {
  url: string | null;
  /** The ≤25-word evidence fragment. */
  text: string | null;
  title: string | null;
  lastVerified: string | null;
};

export type ValueAssessment = {
  /** false when the value is null: no deadline at all, ever (invariant 3). */
  usable: boolean;
  /** `unverified` when the value is stale, whatever the record says. */
  effectiveStatus: ValueStatus;
  confidence: Confidence;
  stale: boolean;
  staleDays: number | null;
  note: string | null;
  citation: Citation;
};

export function assessValue(value: SourcedValue | undefined | null, today: string): ValueAssessment {
  const citation: Citation = {
    url: value?.source_url ?? null,
    text: value?.evidence ?? null,
    title: value?.source_title ?? null,
    lastVerified: value?.last_verified ?? null,
  };

  if (!value || value.value === null || value.value === undefined) {
    return {
      usable: false,
      effectiveStatus: 'unknown',
      confidence: value?.confidence ?? 'low',
      stale: false,
      staleDays: null,
      note: value?.note ?? null,
      citation,
    };
  }

  const staleDays = value.last_verified ? daysBetween(value.last_verified, today) : null;
  const stale = staleDays !== null && staleDays > STALENESS_DAYS;

  return {
    usable: true,
    effectiveStatus: stale ? 'unverified' : value.status,
    confidence: value.confidence,
    stale,
    staleDays,
    note: value.note ?? null,
    citation,
  };
}

export type GoverningVerdict = {
  needsHumanCheck: boolean;
  confidence: Confidence;
  /** Every note that must render wherever the derived date appears. */
  notes: string[];
  /** True when any governing value is past the 180-day rule. */
  stale: boolean;
  /** Why the flag fired, in one machine-readable token per reason. */
  reasons: string[];
};

/**
 * Combine the values that produced one derived date into the verdict the
 * customer sees. Confidence is the WEAKEST of them, never the strongest.
 */
export function judgeGoverning(assessments: ValueAssessment[]): GoverningVerdict {
  const reasons: string[] = [];
  let confidence: Confidence = 'high';
  let stale = false;
  const notes: string[] = [];

  for (const a of assessments) {
    if (CONFIDENCE_ORDER[a.confidence] < CONFIDENCE_ORDER[confidence]) confidence = a.confidence;
    if (a.stale) stale = true;
    if (a.confidence !== 'high' && a.note) notes.push(a.note);
    if (a.effectiveStatus !== 'verified') reasons.push(a.stale ? 'value_stale' : 'value_unverified');
    if (a.confidence === 'low') reasons.push('confidence_low');
  }

  const nonHigh = assessments.filter((a) => a.confidence !== 'high');
  if (nonHigh.length > 0 && notes.length === 0) reasons.push('unexplained_inference');

  return {
    needsHumanCheck: reasons.length > 0,
    confidence,
    notes: [...new Set(notes)],
    stale,
    reasons: [...new Set(reasons)],
  };
}
