/**
 * SCREEN FORMATTING AND THE PROGRAMMATIC SLUG.
 *
 * AUTHORITY: `DESIGN_SYSTEM.md` §5.3–§5.4 (the numeral stack, and why a column of
 * dollars must align on the decimal), `USER_JOURNEY.md` §2 (the programmatic page
 * set), `src/artifacts/wh347/project.ts` (integer in, characters out, no locale).
 *
 * ===========================================================================
 * NO `toLocaleString`, ANYWHERE, EVER
 *
 * The same discipline the artifact renderer holds itself to, held on the screen for
 * the same reason: a page whose numbers depend on the machine's ICU data renders
 * differently on two machines, and this product's central promise is that a figure
 * is reproducible eighteen months later. The formatters below split integers.
 *
 * These functions FORMAT VALUES THE MIRROR STORED. They do not compute: a delta
 * printed on a diff page arrives already subtracted from the query, and a rate
 * arrives as the determination's own integer milli-rate.
 */

import type { MilliRate } from '@/lib/money';

/** `36.85` — a rate to the cent, which is the precision a determination publishes. */
export function rate(value: MilliRate | number): string {
  const magnitude = Math.abs(Number(value));
  const cents = Math.round(magnitude / 100);
  const dollars = Math.trunc(cents / 100);
  const remainder = cents - dollars * 100;
  const sign = Number(value) < 0 ? '-' : '';
  return `${sign}${group(dollars)}.${String(remainder).padStart(2, '0')}`;
}

/** A signed delta, with an explicit `+`. On a diff page the sign is the message. */
export function signedRate(value: number): string {
  if (value === 0) return '0.00';
  return `${value > 0 ? '+' : '−'}${rate(Math.abs(value))}`;
}

export function money(cents: number): string {
  const magnitude = Math.abs(cents);
  const dollars = Math.trunc(magnitude / 100);
  const remainder = magnitude - dollars * 100;
  return `${cents < 0 ? '-' : ''}${group(dollars)}.${String(remainder).padStart(2, '0')}`;
}

export function hours(hundredths: number): string {
  const whole = Math.trunc(Math.abs(hundredths) / 100);
  const fraction = Math.abs(hundredths) - whole * 100;
  return `${hundredths < 0 ? '-' : ''}${whole}.${String(fraction).padStart(2, '0')}`;
}

function group(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** `2026-08-13 02:41 UTC`. UTC with an explicit label, never a converted zone: the
 *  timezone database ships with the runtime and changes between releases, and a
 *  dated claim that silently re-renders is a diff nobody can explain. */
export function stamp(at: Date | null): string {
  if (at === null) return 'never';
  return `${at.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}

export function day(at: Date | null): string {
  if (at === null) return 'never';
  return at.toISOString().slice(0, 10);
}

// ===========================================================================
// Slugs — the programmatic page set's addresses
// ===========================================================================

/**
 * A URL segment from a county or classification name, and its inverse-by-lookup.
 *
 * DELIBERATELY LOSSY, AND NEVER USED AS A KEY. The slug addresses a page; the
 * MIRROR's `county_name_norm` / `class_name_norm` decide what the page shows. A
 * route resolves by scanning the county's own rows for one whose slug matches,
 * which means two classifications that slug identically are a disambiguation
 * problem on one page rather than a wrong rate on two.
 */
export function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function slugMatches(value: string, candidate: string): boolean {
  return slug(value) === candidate.toLowerCase();
}
