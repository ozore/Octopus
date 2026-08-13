/**
 * STAGE F — DEDUCTIONS (column 8) AND NET (column 9).
 *
 * AUTHORITY: `ENGINE.md` §9.1 (the TEN permissible categories — this is the single
 * authority on `DeductionCategory` and `ARCHITECTURE.md` §3.2 defers, ES-2), §9.2.1
 * (the conditions inside (i) and (j) are named, never enforced, and MAY NEVER
 * BLOCK), §9.3 (the three rules that make column 8 safe).
 *
 * ===========================================================================
 * TEN PARAGRAPHS, NOT EIGHT — AND WHY THE COUNT IS NOT PEDANTRY
 *
 * 29 CFR 3.5's lead-in, verbatim from the eCFR API on 2026-08-13: "Deductions made
 * under the circumstances or in the situations described in the paragraphs of this
 * section may be made without application to and approval of the Secretary of
 * Labor." The section as published carries TEN lettered paragraphs, (a) through
 * (j), last amended at 88 FR 57730 (Aug. 23, 2023). Deep dive 04 §1.5 and
 * `ARCHITECTURE.md` §3.2 both said eight; ENGINE supersedes both (ES-2).
 *
 * The two that were missing:
 *
 *   (i) "Any deduction not more than for the 'reasonable cost' of board, lodging,
 *       or other facilities meeting the requirements of section 3(m) of the Fair
 *       Labor Standards Act of 1938, as amended, and 29 CFR part 531. …"
 *   (j) "Any deduction for the cost of safety equipment of nominal value purchased
 *       by the laborer or mechanic as their own property for their personal
 *       protection in their work, such as safety shoes, safety glasses, safety
 *       gloves, and hard hats, …"
 *
 * Boot, glove and hard-hat deductions are routine on a field crew, and
 * employer-provided housing on remote heavy/highway work is common enough to
 * matter. Under an eight-category model every one of them lands in `UNMAPPED` and
 * BLOCKS THE LINE — the product telling a compliant contractor that a lawful
 * deduction is unlawful, in the one place the product's whole value is being
 * trusted.
 *
 * ===========================================================================
 * THE RULE THAT KEEPS A CORRECT TEN-MEMBER ENUM FROM STILL BLOCKING HARD HATS
 *
 * Both (i) and (j) are conditional, and every one of their conditions is a fact
 * about the employment relationship that no payroll CSV contains: whether the
 * equipment is "required by law to be furnished by the contractor"; whether there
 * is "direct or indirect monetary return"; whether written advance consent exists
 * or a CBA provides for it; whether the 29 CFR 516.25(a) records are kept.
 *
 * > A deduction whose category is a member of the enum NEVER blocks a line on our
 * > inability to verify that category's conditions. It maps, it renders in column 8
 * > under its paragraph, and the conditions are printed on the exception report as
 * > a P-D declined conclusion.
 *
 * Only `UNMAPPED` blocks, and `UNMAPPED` means THE LABEL MATCHED NO PARAGRAPH AT
 * ALL — not "the label matched a paragraph whose conditions we could not check".
 * Collapsing those two into one outcome is exactly how a correct ten-member enum
 * still ends up blocking hard-hat deductions. P-21 is that rule as a property.
 *
 * ===========================================================================
 * THE THREE RULES OF COLUMN 8
 *
 * D1 — AN UNMAPPED DEDUCTION BLOCKS THE LINE AND IS NEVER SWEPT INTO "OTHER".
 * Column 8's "Other" bucket on a signed form is an implicit assertion that the
 * deduction is permissible under Part 3, which is precisely what the statement of
 * compliance certifies: 29 CFR 5.5(a)(3)(ii)(C)(2) requires certification "that no
 * deductions have been made either directly or indirectly from the full wages
 * earned, other than permissible deductions as set forth in 29 CFR part 3."
 * Guessing a category is forging a certification.
 *
 * D2 — DEDUCTIONS ARE AGAINST 7B, NOT 7A. WHD: "Enter all deductions made from
 * worker's total gross amount earned for ALL work." A subcontractor with a worker
 * on two projects in one week has one set of deductions covering both. Netting them
 * against the project-only gross is the most common arithmetic error in
 * hand-completed WH-347s, and it produces a net figure that does not match the
 * cheque.
 *
 * D3 — NET IS RECONCILED, NOT COMPUTED. We compute `col7B − Σ deductions` and
 * compare it to the customer's column 9. On a mismatch the line is blocked with
 * `NET_RECONCILIATION_FAILED` and both figures are shown. We do not overwrite
 * their net with ours: their number came from a cheque that was actually written,
 * and if the two disagree the input is wrong somewhere upstream — the correct
 * product behaviour is to refuse rather than to paper over it.
 */

import { Cents } from '@/lib/money';
import {
  DEDUCTION_PARAGRAPH,
  type DeductionCategory,
  type DeductionEntry,
  type WorkerWeek,
} from '@/lib/types';

import type { DeductionTotal } from './model';

/**
 * The enum's order of record: the lettered paragraphs (a)–(j), then the sentinel.
 *
 * Column 8 renders in this order on every artifact, so two filings of the same week
 * cannot differ by object-key iteration order — the `NONDETERMINISM` failure §27
 * ranks above `ARITHMETIC_DIFF`, because a wrong-but-stable answer is a bug we can
 * find while a different answer on each run leaves every other result unproven.
 */
export const DEDUCTION_ORDER: readonly DeductionCategory[] = [
  'STATUTORY',
  'BONA_FIDE_PREPAYMENT',
  'COURT_PROCESS',
  'BENEFIT_FUND',
  'CREDIT_UNION',
  'GOVERNMENTAL',
  'CHARITABLE_501C3',
  'UNION_DUES',
  'BOARD_LODGING_FACILITIES',
  'SAFETY_EQUIPMENT',
  'UNMAPPED',
] as const;

/** The two paragraphs whose conditions are facts about the employment relationship.
 *  Their presence drives a P-D declined conclusion on the exception report and
 *  NOTHING ELSE — never a block (§9.2.1). */
export const CONDITION_BEARING_CATEGORIES: readonly DeductionCategory[] = [
  'BOARD_LODGING_FACILITIES',
  'SAFETY_EQUIPMENT',
] as const;

export interface DeductionResult {
  readonly totals: readonly DeductionTotal[];
  readonly total: Cents;
  /** `col7B − Σ deductions`. */
  readonly netComputed: Cents;
  readonly netPaid: Cents;
  readonly reconciles: boolean;
  /** `netComputed − netPaid`, signed, so the exception report can show the
   *  direction rather than an absolute value with no meaning. */
  readonly netDifference: Cents;
  readonly hasUnmapped: boolean;
  readonly conditionBearing: readonly DeductionCategory[];
}

function paragraphOf(category: DeductionCategory): string | null {
  return category === 'UNMAPPED' ? null : DEDUCTION_PARAGRAPH[category];
}

/**
 * Column 8 by category, plus the column 9 reconciliation.
 *
 * Note there is no narrowing site here and there cannot be one: a `DeductionEntry`
 * arrives as `Cents` from the customer's own payroll export. It is a figure they
 * already rounded and already paid, not a rate × hours product of ours, so
 * re-deriving it would be inventing precision we do not have (§11.2's table has ten
 * rows and none of them is column 8).
 */
export function computeDeductions(worker: WorkerWeek): DeductionResult {
  const byCategory = new Map<DeductionCategory, { amounts: Cents[]; labels: string[] }>();
  for (const entry of worker.deductions as readonly DeductionEntry[]) {
    const bucket = byCategory.get(entry.category) ?? { amounts: [], labels: [] };
    bucket.amounts.push(entry.amount);
    bucket.labels.push(entry.rawLabel);
    byCategory.set(entry.category, bucket);
  }

  const totals: DeductionTotal[] = [];
  for (const category of DEDUCTION_ORDER) {
    const bucket = byCategory.get(category);
    if (bucket === undefined) continue;
    totals.push({
      category,
      paragraph: paragraphOf(category),
      amount: Cents.sum(bucket.amounts),
      labels: bucket.labels,
    });
  }

  const total = Cents.sum(totals.map((t) => t.amount));
  const netComputed = Cents.sub(worker.allWorkGross, total);
  const netDifference = Cents.sub(netComputed, worker.netPaid);

  return {
    totals,
    total,
    netComputed,
    netPaid: worker.netPaid,
    reconciles: netDifference === 0,
    netDifference,
    hasUnmapped: byCategory.has('UNMAPPED'),
    conditionBearing: CONDITION_BEARING_CATEGORIES.filter((c) => byCategory.has(c)),
  };
}

/**
 * The CI assertion §9.2.1 requires, as a pure function.
 *
 * "`DeductionCategory`'s paragraph letters must equal exactly the letters recorded
 * in the current `obligation_changelog` entry for 29 CFR 3.5. A future paragraph
 * (k) fails the build rather than silently blocking lines, and a paragraph removed
 * by amendment fails it too."
 *
 * The lesson §9.2.1 draws is procedural as much as substantive: an enumerated list
 * from a regulation is A CORPUS VALUE WITH AN AMENDMENT DATE, not a constant to be
 * remembered. This function is where the corpus's answer and the code's enum are
 * compared; the Monday eCFR section-version diff is what supplies the former.
 */
export function deductionParagraphsMatch(corpusParagraphs: readonly string[]): {
  readonly matches: boolean;
  readonly inCodeNotCorpus: readonly string[];
  readonly inCorpusNotCode: readonly string[];
} {
  const code = new Set(Object.values(DEDUCTION_PARAGRAPH));
  const corpus = new Set(corpusParagraphs);
  const inCodeNotCorpus = [...code].filter((p) => !corpus.has(p)).sort();
  const inCorpusNotCode = [...corpus].filter((p) => !code.has(p)).sort();
  return {
    matches: inCodeNotCorpus.length === 0 && inCorpusNotCode.length === 0,
    inCodeNotCorpus,
    inCorpusNotCode,
  };
}
