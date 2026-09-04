/**
 * THE COVERAGE BAR'S ARITHMETIC — `IDENTITY.md` §9.2, `UX.md` S11.
 *
 * A band of TIME, twelve months wide, with today marked once. Each segment is a
 * stretch of that window in one status state, and the component draws each state
 * so it survives greyscale: solid, hatched, dot-grid, hairline — and, for a
 * **gap, a hole**.
 *
 * THE GAP IS THE ABSENCE OF A SEGMENT, and that is the whole idea. A gap is the
 * absence of cover on the record, so it is drawn as an outlined opening in the
 * band rather than a red block. A red block says "here is a bad thing"; a hole
 * says "here is nothing", which is the true statement — and the true statement
 * is the one this product exists to make.
 *
 * Pure, and `today` is an argument, for the same reason the engine's
 * `evaluationDate` is: a band whose boundary depends on the ambient clock cannot
 * be tested at its boundary.
 */

import type { CoverageSegment } from '@/components/CoverageBar';
import { EXPIRING_WINDOW_DAYS, daysBetween } from '@/lib/engine';
import { VENDOR_STATUS, type VendorState } from '@/lib/status';

export const WINDOW_DAYS = 365;

export type CoverageWindow = {
  segments: CoverageSegment[];
  /** Where "today" falls in the band, 0–100. Drawn once per screen. */
  todayAt: number;
  /** The whole-band sentence. A bar with no sentence is a picture. */
  ariaLabel: string;
  axis: string[];
};

function addDays(iso: string, days: number): string {
  const ms = Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)) + days * 86_400_000;
  return new Date(ms).toISOString().slice(0, 10);
}

/**
 * The band for one vendor.
 *
 * The window starts 30 days behind today so that a certificate which lapsed
 * last week still shows the stretch it covered — a band that begins at today
 * would draw an expired vendor and a never-seen vendor identically, and those
 * are different facts.
 */
export function coverageWindow(input: {
  status: VendorState;
  earliestRequiredExpiry: string | null;
  today: string;
  vendorName: string;
}): CoverageWindow {
  const start = addDays(input.today, -30);
  const end = addDays(start, WINDOW_DAYS);
  const todayAt = (30 / WINDOW_DAYS) * 100;
  const axis = [start, input.today, end];

  if (input.status === 'no_certificate') {
    return {
      segments: [{ state: 'no_certificate', width: 100 }],
      todayAt,
      axis,
      // `IDENTITY.md` R3 I-8: a statement about the RECORD, never about the
      // policy. "No certificate on record", not "no coverage".
      ariaLabel: `${input.vendorName}: no certificate on record for this window.`,
      };
  }

  const expiry = input.earliestRequiredExpiry;
  if (!expiry) {
    const state = VENDOR_STATUS[input.status];
    return {
      segments: [{ state, width: 100 }],
      todayAt,
      axis,
      ariaLabel: `${input.vendorName}: ${state.replace(/_/g, ' ')} across the window; no expiry date on record.`,
    };
  }

  const coveredDays = Math.max(0, Math.min(WINDOW_DAYS, daysBetween(start, expiry)));
  const inForceWidth = (coveredDays / WINDOW_DAYS) * 100;
  const holeWidth = 100 - inForceWidth;

  // Which state the IN-FORCE stretch is drawn in. `expired` renders in the gap
  // ramp with its own word (`specs/05` §2.1), and an expired certificate leaves
  // no in-force stretch ahead of today at all.
  const daysToExpiry = daysBetween(input.today, expiry);
  const inForce =
    input.status === 'expired'
      ? 'gap'
      : input.status === 'gap'
        ? 'gap'
        : daysToExpiry <= EXPIRING_WINDOW_DAYS
          ? 'expiring'
          : VENDOR_STATUS[input.status];

  const segments: CoverageSegment[] = [];
  if (inForceWidth > 0) segments.push({ state: inForce, width: inForceWidth });
  // After the earliest required expiry, the record says nothing. That stretch
  // is the hole.
  if (holeWidth > 0) segments.push({ state: 'gap', width: holeWidth });

  const tail =
    holeWidth > 0
      ? ` After ${expiry} there is nothing on record, drawn as a hole.`
      : '';
  return {
    segments,
    todayAt,
    axis,
    ariaLabel: `${input.vendorName}: on record as ${inForce.replace(/_/g, ' ')} until ${expiry}.${tail}`,
  };
}
