/**
 * THE PINNED RATE TABLE, AND THE OBLIGATION VALUES THAT ARE NOT CONSTANTS.
 *
 * AUTHORITY: `ENGINE.md` §5 (the two ladders), §7.0 (the $100,000 CWHSSA
 * threshold is a corpus value), §10 (so is the $33/day liquidated-damages
 * figure), §13 / ES-4 (the union-group narrowing).
 *
 * ---------------------------------------------------------------------------
 * WHY THE ENGINE TAKES A RATE TABLE RATHER THAN READING ONE
 *
 * `ARCHITECTURE.md` §3.9: `engine/arithmetic/**` "may read `domain/**` only" and
 * "may never import anything with an I/O surface, INCLUDING `mirror`". So the
 * arithmetic cannot call `rateFor(pin, classificationId)`; the caller resolves
 * every rate the week needs from the pinned mirror and hands the arithmetic a
 * value. Two things fall out of that, both load-bearing:
 *
 *   - A filing is producible with networking disabled, because the arithmetic
 *     has no edge along which a network call could be added (I3).
 *   - A canary case is a VALUE. `(payroll week, rate table)` is the whole input,
 *     so a case pinned to a WD snapshot in 2026 recomputes byte-identically in
 *     2028 without a database (E9, §24's pinning rule).
 *
 * ---------------------------------------------------------------------------
 * WHY THE TABLE CARRIES ITS OWN (wdNumber, revision)
 *
 * A rate table built from the wrong revision is the one input error that cannot
 * be detected downstream: every number it produces is well-formed, plausible and
 * wrong, on a document signed under 18 U.S.C. 1001. `assertTableMatchesPin`
 * compares the table's identity against the week's pin and throws — an Error, not
 * a `Refusal`, because a customer can neither see it nor act on it
 * (`src/lib/result.ts`), and because it means a caller wired two pins together.
 *
 * ---------------------------------------------------------------------------
 * WHY THE THRESHOLD AND THE PENALTY ARE ARGUMENTS
 *
 * `ENGINE.md` §7.0: "The $100,000 is a corpus value, not a constant — the same
 * discipline §10 applies to the $33/day liquidated damages, and for the same
 * reason." 29 CFR 5.5(b)(2)'s current text says $33; the Field Operations
 * Handbook, Rev. 660 (10/25/2010), quotes the identical sentence with $10. Same
 * rule, same words, a figure that has tripled through inflation adjustment. A
 * hard-coded one guarantees a stale figure in customer-facing copy within a year
 * or two, so both arrive as `CorpusValue`s with an effective date and a source,
 * and the Monday eCFR section-version diff watches them.
 *
 * Note what the threshold is NOT used for: the engine never compares a contract
 * amount to it. `contractValueBand` is the customer's assertion (§7.0) and the
 * gate turns on the band. The figure exists here so the exception report can
 * state the threshold it is naming, with its citation, rather than asserting a
 * number from memory.
 */

import type { Cents, MilliRate } from '@/lib/money';
import type { ClassificationId, IsoDate, SnapshotRef, WdNumber, WdPin } from '@/lib/types';

// ===========================================================================
// One classification's rate of record
// ===========================================================================

/**
 * The determination's own row for one classification, as the arithmetic sees it.
 *
 * This is the `BHR_WD` / `FRINGE_WD` ladder of `ENGINE.md` §5 — what the wage
 * determination REQUIRES. It is never printed in WH-347 column 6A, which asks
 * what the contractor PAID; it appears in the header's Wage Determination No.
 * field, in the provenance footer, and in the §10 comparison.
 */
export interface WdRate {
  readonly classificationId: ClassificationId;
  /** `BHR_WD` — 29 CFR 5.32(a)'s "basic hourly rate (i.e. cash rate)". */
  readonly basicHourlyRate: MilliRate;
  /** `FRINGE_WD` — the determination's aggregate fringe figure. Eight of the ten
   *  rows in ENGINE §15.3's live extract carry `0.00`, so the zero-fringe branch
   *  of §6 is the common case rather than an edge. */
  readonly fringeRate: MilliRate;
  /**
   * Parsed from the rate identifier's group (`ELEC0080-011` union vs
   * `SUVA2016-080` survey). Drives ES-4's NARROWED refusal: a union-identified
   * classification is refused only when a 6B credit is claimed against it, never
   * at setup. A contractor paying `$36.85 + $14.13` entirely in cash under
   * 5.31(b)(2) needs no CBA schedule at all, and refusing them would refuse a
   * paying customer with no compliance problem to solve.
   */
  readonly isUnionGroup: boolean;
  /** `ELEC0080-011`, `SUVA2016-080`. Printed beside a candidate in the picker. */
  readonly rateIdentifier: string;
  /** The determination's OWN words, newlines preserved. Ratepin never authors
   *  scope text; the exception report quotes with a citation. */
  readonly classNameVerbatim: string;
  readonly sourceLineStart: number;
  readonly sourceLineEnd: number;
}

/**
 * Every rate one filing needs, pinned to one revision, as a pure value.
 *
 * `lookup` returns `null` rather than throwing: a classification absent from the
 * pinned revision is a blocked line with a stated reason, not a crash — the
 * engine's whole posture is that a missing record produces a refusal the customer
 * can act on (§4 A1).
 */
export interface PinnedRateTable {
  readonly wdNumber: WdNumber;
  readonly revision: number;
  readonly publishDate: IsoDate;
  readonly snapshotRef: SnapshotRef;
  readonly size: number;
  lookup(classificationId: ClassificationId): WdRate | null;
}

/**
 * Build a rate table from rows the caller resolved out of the pinned mirror.
 *
 * The `Map` is built once and never mutated; `lookup` is a pure function of the
 * value. A duplicate classification id throws, because two rates for one class on
 * one revision means the parser emitted the same ordinal twice and every number
 * downstream would depend on iteration order — which is exactly the
 * `NONDETERMINISM` failure §27 ranks above `ARITHMETIC_DIFF`.
 */
export function pinnedRateTable(input: {
  readonly wdNumber: WdNumber;
  readonly revision: number;
  readonly publishDate: IsoDate;
  readonly snapshotRef: SnapshotRef;
  readonly rates: readonly WdRate[];
}): PinnedRateTable {
  const byId = new Map<string, WdRate>();
  for (const rate of input.rates) {
    if (byId.has(rate.classificationId)) {
      throw new Error(
        `pinnedRateTable: duplicate classification ${rate.classificationId} on ` +
          `${input.wdNumber} rev ${input.revision}. Two rates for one class on one ` +
          'revision makes every downstream number depend on iteration order.',
      );
    }
    byId.set(rate.classificationId, rate);
  }
  return {
    wdNumber: input.wdNumber,
    revision: input.revision,
    publishDate: input.publishDate,
    snapshotRef: input.snapshotRef,
    size: byId.size,
    lookup(classificationId: ClassificationId): WdRate | null {
      return byId.get(classificationId) ?? null;
    },
  };
}

/**
 * The one check that a rate table belongs to the week it is being applied to.
 *
 * Throws rather than refusing. A mismatched pin is not a fact about the
 * customer's payroll — it is a caller that wired two pins together, and the fix
 * is a deploy, not a message (`src/lib/result.ts`'s rule).
 */
export function assertTableMatchesPin(table: PinnedRateTable, pin: WdPin): void {
  if (table.wdNumber !== pin.wdNumber || table.revision !== pin.revision) {
    throw new Error(
      `Rate table (${table.wdNumber} rev ${table.revision}) does not match the ` +
        `filing's pin (${pin.wdNumber} rev ${pin.revision}). Every artifact carries a ` +
        'WD number, revision and publication date, and they must be the ones the ' +
        'arithmetic actually used (I6).',
    );
  }
}

// ===========================================================================
// Obligation values — corpus rows with an effective date, never constants
// ===========================================================================

export interface CorpusValue<T> {
  readonly value: T;
  /** When this figure began to govern. A figure without one is a memory. */
  readonly effectiveDate: IsoDate;
  readonly citation: string;
  readonly sourceUrl: string;
}

/**
 * One lettered paragraph of 29 CFR 3.5, as the corpus holds it.
 *
 * The TEXT travels with the letter because the engine quotes the regulation and
 * never authors it. §9.2.1's conditions inside (i) and (j) are printed on the
 * exception report as a P-D declined conclusion, and a P-D's `rule` field is
 * documented as verbatim regulatory text — so the sentence has to come from the
 * Monday eCFR ingest rather than from a developer's memory of it. An enumerated
 * list from a regulation is a corpus value with an amendment date, not a constant.
 */
export interface DeductionParagraph {
  readonly letter: string;
  readonly text: string;
}

export interface ObligationValues {
  /** 29 CFR 5.5(b)'s preamble: the CWHSSA clauses are inserted "in any contract
   *  in an amount in excess of $100,000". Named in the exception report; never
   *  compared against a contract amount, because the engine holds no contract
   *  amount — only the customer's band (§7.0). */
  readonly cwhssaContractThreshold: CorpusValue<Cents>;
  /** 29 CFR 5.5(b)(2). Stated with its effective date on `over_100k` projects
   *  only; no amount is ever computed for a customer (§10, §13). */
  readonly liquidatedDamagesPerDay: CorpusValue<Cents>;
  /** The lettered paragraphs of 29 CFR 3.5 as the corpus currently records them.
   *  `DeductionCategory` is checked against this, so a future paragraph (k) fails
   *  the build rather than silently blocking hard-hat deductions (§9.2.1). */
  readonly deductionParagraphs: CorpusValue<readonly DeductionParagraph[]>;
}
