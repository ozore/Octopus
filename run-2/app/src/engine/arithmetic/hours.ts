/**
 * STAGE A — HOURS BY CLASSIFICATION (WH-347 columns 4 and 5).
 *
 * AUTHORITY: `ENGINE.md` §4, and in particular rule **A2 as corrected**, which the
 * document calls "the most dangerous sentence in this document" in its withdrawn
 * form.
 *
 * ---------------------------------------------------------------------------
 * THE CORRECTION THIS MODULE EXISTS TO HOLD (R-CRIT4)
 *
 * An earlier revision of §4 said double-time hours are "excluded from the CWHSSA
 * computation". 29 CFR 5.5(b)(1) is denominated in HOURS WORKED — "to work in
 * excess of forty hours in such workweek" — and a double-time hour is an hour
 * worked. Excluding `dt` from the threshold silently assumed that exactly `dt` of
 * the over-40 hours had already been discharged at ≥1.5×, on a field whose rate is
 * an arbitrary customer-supplied number that nothing in the engine tested.
 *
 * A worker logging 36 ST + 8 DT produced `coveredHours = 36`, `otHours = 0`,
 * `cwhssaPremium = $0.00`. Any payroll export routing a shift differential, a
 * per-diem bucket or a mis-mapped column into DT at $1.00/hr therefore erased four
 * hours of statutory overtime from a certified payroll with no flag, no block and
 * no exception line — $40.00 on one worker in one week, five figures across a
 * 30-worker crew over a year, and every filing that carried it looked perfect.
 *
 * So: `hoursWorked = Σ(st + ot + dt)`. There is no column label that removes an
 * hour from the CWHSSA denominator. The rule is stated over HOURS WORKED rather
 * than over a list of column names, so any future premium bucket the CSV mapper
 * learns to read inherits it by construction.
 *
 * ---------------------------------------------------------------------------
 * THE ONE EXCLUSION THAT SURVIVES
 *
 * COVERED vs PRIVATE. FOH 15k03(a): "only the hours actually spent on a covered
 * contract or combination of covered contracts need be considered in computing the
 * OT pay." That is a fact about WHICH CONTRACT the hour was worked on, which the
 * CSV carries and the regulation expressly authorises us to act on. Straight-vs-
 * double time was a fact about WHAT THE PAYROLL SYSTEM CALLED an hour it agrees
 * was worked on this contract, which authorises nothing. Both look like "hours we
 * leave out of the threshold" from a distance; only one of them is legitimate, and
 * §7.7 names the FLSA gap the other leaves rather than filling it with a guess.
 */

import { Hours } from '@/lib/money';
import type { DayHours, PayrollLine } from '@/lib/types';

/** Σ over the seven day columns of one bucket. */
function sumBucket(days: readonly DayHours[], pick: (d: DayHours) => Hours): Hours {
  return Hours.sum(days.map(pick));
}

export function stHours(line: PayrollLine): Hours {
  return sumBucket(line.dayHours, (d) => d.st);
}

export function otHours(line: PayrollLine): Hours {
  return sumBucket(line.dayHours, (d) => d.ot);
}

/** Double time. The DOLLARS are a pass-through from the CSV (a state daily-overtime
 *  obligation needs a second corpus we do not ship — D9); the HOURS are ours to
 *  count, and they count toward the federal forty. */
export function dtHours(line: PayrollLine): Hours {
  return sumBucket(line.dayHours, (d) => d.dt);
}

/** WH-347 column 5 — total hours on this line. */
export function totalHours(line: PayrollLine): Hours {
  return Hours.of(stHours(line) + otHours(line) + dtHours(line));
}

/**
 * The CWHSSA threshold, in hours: forty.
 *
 * 29 CFR 5.5(b)(1), verbatim (the typo `conract` is DOL's, in the current eCFR
 * text; we quote it as published): "No contractor or subcontractor contracting for
 * any part of the conract work … shall require or permit any such laborer or
 * mechanic in any workweek in which he or she is employed on such work to work in
 * excess of forty hours in such workweek unless such laborer or mechanic receives
 * compensation at a rate not less than one and one-half times the basic rate of pay
 * for all hours worked in excess of forty hours in such workweek."
 *
 * Forty is in the statute's own words rather than in a corpus row, which is why it
 * is a constant here while the $100,000 threshold and the $33/day liquidated
 * damages are not: those are dollar figures Congress and the Secretary have moved,
 * and one of them has tripled within the Field Operations Handbook's own lifetime.
 */
export const CWHSSA_THRESHOLD_HOURS: Hours = Hours.of(40 * 100);

export function statutoryOtHours(hoursWorked: Hours): Hours {
  const excess = hoursWorked - CWHSSA_THRESHOLD_HOURS;
  return Hours.of(excess > 0 ? excess : 0);
}
