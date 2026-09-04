/**
 * Turning a `SourcedValue` into the words the buyer reads — and refusing to,
 * where the board published nothing.
 *
 * This module is where "we never estimate a fee, an hour count or a processing
 * time" (`specs/12`, `PLAN.md` A10) becomes code rather than discipline:
 * `renderValue` has no branch that can produce a number from a `null`, and the
 * two refusal strings it returns instead are constants with no digit in them.
 *
 * It is PURE and it has no clock. `today` is always an argument.
 */

import { assessValue, type ValueAssessment } from '../rules/assess';
import type { SourcedValue } from '../kb/types';

/** The board publishes no such value. A statement about the board. */
export const NOT_PUBLISHED = 'not published';
/** Past the 180-day rule, or never verified. A statement about us. */
export const NOT_YET_VERIFIED = 'not yet verified';

const MONEY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * The unit vocabulary the committed records actually use — `USD`, `months`,
 * `hours`, `days`, `business_days`, `per_occurrence_usd` — and nothing else. An
 * unknown unit is printed after the number rather than dropped, because a
 * silently dropped unit is how "600000" becomes a dollar figure in a reader's
 * head.
 */
export function formatNumber(value: number, unit?: string): string {
  switch (unit) {
    case 'USD':
      return MONEY.format(value).replace(/\.00$/, '');
    case 'per_occurrence_usd':
      return `${MONEY.format(value).replace(/\.00$/, '')} per occurrence`;
    case 'months':
      return plural(value, 'month', 'months');
    case 'hours':
      return plural(value, 'hour', 'hours');
    case 'days':
      return plural(value, 'day', 'days');
    case 'business_days':
      return plural(value, 'business day', 'business days');
    default:
      return unit ? `${value} ${unit}` : String(value);
  }
}

/**
 * A boolean is rendered with the FIELD'S OWN words, never as "true".
 * `bond.required: false` must read "no bond is required" and
 * `bond.required: null` must read "not published" — two facts a shared "No"
 * would flatten into one.
 */
export type BooleanWords = { yes: string; no: string };

export function formatRaw(
  value: SourcedValue['value'],
  unit: string | undefined,
  words: BooleanWords,
): string {
  if (typeof value === 'boolean') return value ? words.yes : words.no;
  if (typeof value === 'number') return formatNumber(value, unit);
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return formatList(value, unit);
  return NOT_PUBLISHED;
}

/** `continuing_education.subject_breakdown` is the only array in the data. */
function formatList(items: ReadonlyArray<unknown>, unit: string | undefined): string {
  return items
    .map((item) => {
      if (item !== null && typeof item === 'object' && 'hours' in item && 'subject' in item) {
        const row = item as { hours: number; subject: string };
        return `${formatNumber(row.hours, 'hours')} — ${row.subject}`;
      }
      return typeof item === 'number' ? formatNumber(item, unit) : String(item);
    })
    .join('; ');
}

export type RenderedValue = {
  text: string;
  assessment: ValueAssessment;
  /** `published | needs_human_check | not_published | not_yet_verified`. */
  state: 'published' | 'needs_human_check' | 'not_published' | 'not_yet_verified';
  flagReason: string | null;
};

/**
 * THE RULE, in one function.
 *
 *  - no value at all, or `value: null` → **not published**;
 *  - usable but the 180-day rule (or `status: unverified`) bit → **not yet verified**;
 *  - verified and `high` → the value;
 *  - verified and below `high` → the value, flagged, with the reason in the
 *    customer's words. `specs/08` AC2: *"anything below high forces
 *    needs_human_check on any expansion playbook that uses it"*.
 *
 * There is deliberately no path from a `null` to a number.
 */
export function renderValue(
  value: SourcedValue | undefined | null,
  today: string,
  words: BooleanWords = { yes: 'yes', no: 'no' },
): RenderedValue {
  const assessment = assessValue(value, today);

  if (!assessment.usable) {
    return { text: NOT_PUBLISHED, assessment, state: 'not_published', flagReason: null };
  }

  if (assessment.effectiveStatus !== 'verified') {
    return {
      text: NOT_YET_VERIFIED,
      assessment,
      state: 'not_yet_verified',
      flagReason: assessment.stale
        ? 'We last confirmed this on the board’s page more than 180 days ago, so we have stopped showing it as verified and we show you the board’s page instead.'
        : 'Our second verification pass did not find this value on the board’s page, so we do not assert it.',
    };
  }

  const text = formatRaw(value!.value, value!.unit, words);

  if (assessment.confidence === 'high') {
    return { text, assessment, state: 'published', flagReason: null };
  }

  return {
    text,
    assessment,
    state: 'needs_human_check',
    flagReason:
      assessment.confidence === 'medium'
        ? 'We read this on the board’s page but the page does not state it plainly for this licence class, so it carries our reading as well as the board’s words. Confirm it with the board before you rely on it.'
        : 'We could not fully verify this rule. Confirm it with the board before you rely on it.',
  };
}
