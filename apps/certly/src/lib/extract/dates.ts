/**
 * Date parsing — `specs/03` §15's unit list.
 *
 * `04/22/16`, `04/22/2016`, `4/22/16`, `2016-04-22`, and the two-digit-year rule:
 * **a two-digit year ≥ 70 is 19xx.** That cutoff is not arbitrary. A policy that
 * expires in 1970 is a typo; a policy WRITTEN in 1998 and quoted on a historical
 * certificate is not, and `policy_eff` is the field that sees old years.
 *
 * The model is asked to return ISO in `value` and the printed characters in
 * `raw`. This module is the fallback for when it returns the printed form in
 * both — never the primary path, because a date the model normalised is a date
 * the model can be scored on.
 */

const TWO_DIGIT_CENTURY_CUTOFF = 70;

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const SLASH = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2}|\d{4})$/;

function iso(y: number, m: number, d: number): string | null {
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** `null` when the string is not a date we are willing to claim we understood. */
export function parseFormDate(input: string | null | undefined): string | null {
  if (input == null) return null;
  const text = input.trim();
  if (text === '') return null;

  const isoMatch = ISO.exec(text);
  if (isoMatch) return iso(Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3]));

  const slash = SLASH.exec(text);
  if (!slash) return null;
  const month = Number(slash[1]);
  const day = Number(slash[2]);
  const rawYear = slash[3] ?? '';
  const year =
    rawYear.length === 4
      ? Number(rawYear)
      : Number(rawYear) >= TWO_DIGIT_CENTURY_CUTOFF
        ? 1900 + Number(rawYear)
        : 2000 + Number(rawYear);
  return iso(year, month, day);
}

/**
 * `specs/03` §10: `certificate_date` within [insured policy period − 2y, today + 30d].
 * Out of range is a REVIEW, not a rejection — a stale certificate is exactly the
 * thing this product exists to notice.
 */
export function certificateDateOutOfRange(
  certificateDate: string | null,
  policyEffs: readonly (string | null)[],
  today: string,
): boolean {
  if (!certificateDate) return false;
  const cert = Date.parse(`${certificateDate}T00:00:00Z`);
  if (Number.isNaN(cert)) return false;

  const upper = Date.parse(`${today}T00:00:00Z`) + 30 * 86_400_000;
  if (cert > upper) return true;

  const earliestEff = policyEffs
    .filter((d): d is string => Boolean(d))
    .map((d) => Date.parse(`${d}T00:00:00Z`))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b)[0];
  if (earliestEff === undefined) return false;
  return cert < earliestEff - 2 * 365 * 86_400_000;
}
