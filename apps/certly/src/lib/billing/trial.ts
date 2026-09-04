/**
 * The trial's dates and its disclosure, computed in one place.
 *
 * `{date}` IS A REAL DATE, NOT "in 14 days" (`specs/10` §3.1.1). A person
 * reading the page has to be able to see the day the money moves without
 * clicking anything or doing arithmetic, which is the whole point of the
 * disclosure — and the string that is rendered is the string that is stored
 * against the Checkout session (A15), so it is built here and passed through
 * rather than re-derived at two ends.
 */

import { formatDate } from '@/lib/engine';
import { TRIAL_DAYS, TRIAL_DISCLOSURE } from '@/lib/plans';

const DAY_MS = 86_400_000;

/** The moment the card is charged if nobody cancels. */
export function firstChargeAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + TRIAL_DAYS * DAY_MS);
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** `17 September 2026` — the product's one date format (`prose.ts`). */
export function chargeDateLabel(date: Date = firstChargeAt()): string {
  return formatDate(isoDate(date));
}

/** The exact sentence rendered next to every control that collects a card. */
export function trialDisclosure(date: Date = firstChargeAt()): string {
  return TRIAL_DISCLOSURE(chargeDateLabel(date));
}

/** Days between now and the first charge, floored at zero. */
export function daysUntil(target: Date, now: Date = new Date()): number {
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / DAY_MS));
}

/**
 * The trial banner's sentence (`specs/10` §6). THE DATE FORM IS CANONICAL —
 * a countdown answers "how long have I got?" and the customer's actual question
 * is "when does the money move?". From day 7 the days remaining are added,
 * because by then both questions are the same one.
 */
export function trialBannerText(trialEndsAt: Date, now: Date = new Date()): string {
  const left = daysUntil(trialEndsAt, now);
  const base = `Trial — no charge until ${chargeDateLabel(trialEndsAt)}. Cancel any time.`;
  return left <= 7 ? `${base} ${left} day${left === 1 ? '' : 's'} left.` : base;
}
