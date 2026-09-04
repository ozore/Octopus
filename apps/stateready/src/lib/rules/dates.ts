/**
 * Civil-date arithmetic for the rules engine.
 *
 * EVERY DATE IN THIS FILE IS A CIVIL DATE — `YYYY-MM-DD`, no time, no zone —
 * because a licence expires on a day, not at an instant (`specs/05` §Edge
 * cases). Deriving a deadline in UTC and alerting in local time is how a
 * "7-day" alert becomes a 6-day alert, and the way to make that impossible is
 * to have no clock in the derivation at all. `Date` is used only as a calendar,
 * always through `Date.UTC`, never through the local-time constructor.
 *
 * Two behaviours are load-bearing and both have explicit tests:
 *
 *  - **Month-end clamping.** 31 January + 1 month is 28 (or 29) February, not
 *    3 March. JavaScript's `setMonth` rolls over; this does not.
 *  - **Leap day.** 29 February 2028 + 12 months is 28 February 2029.
 */

export type CivilDate = string;

const CIVIL = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isCivilDate(value: string): boolean {
  const m = CIVIL.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (mo < 1 || mo > 12 || d < 1) return false;
  return d <= daysInMonth(y, mo);
}

export function parseCivil(value: CivilDate): { year: number; month: number; day: number } {
  const m = CIVIL.exec(value);
  if (!m) throw new RangeError(`not a civil date: ${value}`);
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

export function formatCivil(year: number, month: number, day: number): CivilDate {
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${p(year, 4)}-${p(month)}-${p(day)}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Months added with the day clamped into the target month. See the header. */
export function addMonths(date: CivilDate, months: number): CivilDate {
  const { year, month, day } = parseCivil(date);
  const zeroBased = year * 12 + (month - 1) + months;
  const targetYear = Math.floor(zeroBased / 12);
  const targetMonth = (zeroBased % 12) + 1;
  return formatCivil(targetYear, targetMonth, Math.min(day, daysInMonth(targetYear, targetMonth)));
}

export function addDays(date: CivilDate, days: number): CivilDate {
  const { year, month, day } = parseCivil(date);
  const t = Date.UTC(year, month - 1, day) + days * 86_400_000;
  const d = new Date(t);
  return formatCivil(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** `b - a` in whole days. Negative when `b` is before `a`. */
export function daysBetween(a: CivilDate, b: CivilDate): number {
  const pa = parseCivil(a);
  const pb = parseCivil(b);
  return Math.round(
    (Date.UTC(pb.year, pb.month - 1, pb.day) - Date.UTC(pa.year, pa.month - 1, pa.day)) / 86_400_000,
  );
}

export function compareCivil(a: CivilDate, b: CivilDate): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Business days, Monday–Friday, no public holidays.
 *
 * Public holidays are deliberately NOT applied: the federal calendar is not the
 * calendar every state board keeps, and a holiday table we cannot cite is an
 * estimate — which the product does not make (`specs/12`). Counting only
 * weekends is the conservative direction: the derived date is never later than
 * the board's, so an alert is never late because of this.
 */
export function addBusinessDays(date: CivilDate, days: number): CivilDate {
  let cursor = date;
  let remaining = days;
  while (remaining > 0) {
    cursor = addDays(cursor, 1);
    const { year, month, day } = parseCivil(cursor);
    const dow = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
    if (dow !== 0 && dow !== 6) remaining -= 1;
  }
  return cursor;
}

/** The next occurrence of `MM-DD` STRICTLY after `after`. */
export function nextMonthDay(after: CivilDate, month: number, day: number): CivilDate {
  const { year } = parseCivil(after);
  for (let y = year; y <= year + 8; y += 1) {
    const candidate = formatCivil(y, month, Math.min(day, daysInMonth(y, month)));
    if (compareCivil(candidate, after) > 0) return candidate;
  }
  /* c8 ignore next */
  throw new RangeError(`no occurrence of ${month}-${day} after ${after}`);
}

/** The next occurrence of `MM-DD` strictly after `after` whose year has the given parity. */
export function nextMonthDayWithParity(
  after: CivilDate,
  month: number,
  day: number,
  parity: 'even' | 'odd',
): CivilDate {
  const { year } = parseCivil(after);
  const wanted = parity === 'even' ? 0 : 1;
  for (let y = year; y <= year + 8; y += 1) {
    if (y % 2 !== wanted) continue;
    const candidate = formatCivil(y, month, Math.min(day, daysInMonth(y, month)));
    if (compareCivil(candidate, after) > 0) return candidate;
  }
  /* c8 ignore next */
  throw new RangeError(`no ${parity}-year occurrence of ${month}-${day} after ${after}`);
}
