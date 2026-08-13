/**
 * THE EXCEPTION REPORT — every refusal the arithmetic produces, as one of exactly
 * four primitives.
 *
 * AUTHORITY: `USER_JOURNEY.md` §0.3 (P-A blocked line/closed choice, P-B DRAFT —
 * NOT CERTIFIABLE, P-C narrowed claim, P-D declined conclusion), `ENGINE.md` §7.0,
 * §7.7, §9.2.1, §13 (the table of what the deterministic core refuses to compute),
 * `PLAN.md` A3 (no escalation path to a human, anywhere).
 *
 * ===========================================================================
 * WHY THIS FILE EXISTS AT ALL
 *
 * §13's table is a list of things the engine will not compute. Each row has a
 * behaviour and a primitive, and every one of them has to become a sentence a
 * customer reads on a Friday afternoon with a filing due. If those sentences were
 * written at the renderer, three things would drift: the arithmetic's reason, the
 * regulation's words, and whether we drew a conclusion we said we would decline.
 * Deriving them here — from the computation, deterministically, with the quotes as
 * constants — means the exception report and the numbers are the same artifact.
 *
 * ===========================================================================
 * P-C IS ABSENT FROM THIS MODULE, DELIBERATELY
 *
 * P-C narrows a claim about CURRENCY — how old our knowledge of newer revisions is
 * — and that is a fact about the corpus clock, not about the payroll. The engine
 * has no clock (E1), so it cannot construct one, and it should not: `freshnessOf`
 * is a different function from `rateFor` precisely so a filing needs a rate and
 * does not need freshness. The corpus layer owns P-C.
 *
 * ===========================================================================
 * WHAT THESE SENTENCES MAY NEVER CONTAIN (A3, CORRECTIONS.md)
 *
 * No support address, no contact form, no "we'll get back to you", no escalation
 * path. `Refusal` has no field in which one could travel (`src/lib/types.ts`), and
 * that absence is the mechanism rather than the intention. And no unmeasured claim:
 * nothing here says our arithmetic is accurate, that an artifact will be accepted,
 * that the corpus is complete, or that anything was saved. What each refusal says
 * is what we did, what the regulation says, and what we decline to conclude.
 */

import { Cents, Hours } from '@/lib/money';
import { blockedLine, declinedConclusion, draftNotCertifiable } from '@/lib/result';
import type {
  BlockReason,
  PayrollWeek,
  Refusal,
  RefusalChoice,
  ViolationFlag,
} from '@/lib/types';

import type { FilingComputation, ViolationFinding, WorkerComputation } from './arithmetic/model';
import type { ObligationValues } from './arithmetic/rates';
import { CITE, QUOTE } from './citations';

export interface ExceptionInput {
  readonly week: PayrollWeek;
  readonly computation: FilingComputation;
  /** Corpus rows with effective dates. The engine holds no dollar threshold and no
   *  liquidated-damages figure of its own; both have moved within living memory of
   *  the Field Operations Handbook. */
  readonly obligations: ObligationValues;
}

// ===========================================================================
// P-B — the whole filing is DRAFT — NOT CERTIFIABLE
// ===========================================================================

/**
 * §7.0 — `contractValueBand === 'unknown'`.
 *
 * Not a guess in either direction. Guessing COVERED computes a premium that is not
 * owed, applies a floor that does not apply, prints hours in a CWHSSA column on a
 * contract with no CWHSSA column, and can raise a flag naming a statute the
 * contract is not subject to — telling a compliant contractor they underpaid.
 * Guessing NOT COVERED silently deletes a real federal overtime obligation from a
 * document signed under 18 U.S.C. 1001.
 */
export function cwhssaCoverageUndetermined(obligations: ObligationValues): Refusal {
  const threshold = Cents.toDollarString(obligations.cwhssaContractThreshold.value);
  return draftNotCertifiable({
    blockReasons: ['CWHSSA_COVERAGE_UNDETERMINED'],
    headline: 'The contract value band for this project has not been recorded.',
    detail:
      'The overtime clauses of the Contract Work Hours and Safety Standards Act are inserted in ' +
      `contracts in an amount in excess of ${threshold}. Ratepin does not hold the contract amount, ` +
      'so no overtime premium is computed either way and the signature block is withheld. Recording ' +
      'the band on the project settles it for every future week on this project.',
    exceptionReport: [
      `${CITE.cwhssaClauseInsertion}: "${QUOTE.cwhssaClauseInsertion}"`,
      `${CITE.davisBaconThreshold}: "${QUOTE.davisBaconThreshold}"`,
      `Threshold as recorded in the corpus, effective ${obligations.cwhssaContractThreshold.effectiveDate}: ` +
        `${threshold} (${obligations.cwhssaContractThreshold.sourceUrl}).`,
      'Ratepin does not determine whether the Contract Work Hours and Safety Standards Act applies ' +
        'to this contract.',
    ],
  });
}

// ===========================================================================
// P-D — declined conclusions
// ===========================================================================

/**
 * §7.0 — the `at_or_under_100k` path.
 *
 * The exception report carries a DECLINED CONCLUSION, not a clearance. Silence
 * would read as a clean bill, and the sentence that fills the silence must not
 * assert that CWHSSA does or does not apply: that claim is on the DO-NOT-ASSERT
 * list. The band is the customer's assertion, printed as an assertion, exactly as
 * `cashInLieu` is.
 */
export function cwhssaNotComputedBelowThreshold(obligations: ObligationValues): Refusal {
  const threshold = Cents.toDollarString(obligations.cwhssaContractThreshold.value);
  return declinedConclusion({
    headline: `This project is recorded as a contract at or under ${threshold}.`,
    rule: QUOTE.cwhssaClauseInsertion,
    citation: CITE.cwhssaClauseInsertion,
    observableFacts: [
      { label: 'Contract value band (recorded by the customer)', value: 'at or under the threshold' },
      { label: 'Threshold', value: threshold },
      { label: 'Threshold effective from', value: obligations.cwhssaContractThreshold.effectiveDate },
      { label: 'Source', value: obligations.cwhssaContractThreshold.sourceUrl },
      { label: 'CWHSSA overtime premium computed', value: 'none' },
    ],
    declined:
      'No overtime premium under the Contract Work Hours and Safety Standards Act is computed here. ' +
      'Overtime obligations arising under the Fair Labor Standards Act are not computed by Ratepin. ' +
      'Ratepin does not determine whether the Contract Work Hours and Safety Standards Act applies to ' +
      'this contract.',
  });
}

/**
 * §10 — the liquidated-damages rule, stated on `over_100k` projects only.
 *
 * 5.5(b)(2) is a clause inserted by the same preamble that carries the threshold,
 * so on a contract at or under it there are no CWHSSA liquidated damages to
 * describe, and describing them would cite a regime the contract is not subject to.
 * No amount is ever computed: an assessment is made by the federal agency
 * (FOH 15k11(c)).
 */
export function liquidatedDamagesRule(obligations: ObligationValues): Refusal {
  const perDay = Cents.toDollarString(obligations.liquidatedDamagesPerDay.value);
  return declinedConclusion({
    headline: 'Liquidated damages under the Contract Work Hours and Safety Standards Act.',
    rule:
      'liquidated damages in the sum of ' +
      perDay +
      ' for each calendar day on which such individual was required or permitted to work in excess ' +
      'of the standard workweek of forty hours without payment of the overtime wages required',
    citation: CITE.cwhssaLiquidatedDamages,
    observableFacts: [
      { label: 'Amount per worker per calendar day', value: perDay },
      { label: 'Effective from', value: obligations.liquidatedDamagesPerDay.effectiveDate },
      { label: 'Source', value: obligations.liquidatedDamagesPerDay.sourceUrl },
    ],
    declined:
      'Ratepin states the rule and computes no amount. An assessment of liquidated damages is made ' +
      'by the federal agency.',
  });
}

/**
 * §6.1 — annualization, when any fringe credit is claimed.
 *
 * The annualized rate is NOT COMPUTABLE from our inputs: a certified-payroll CSV
 * contains covered hours for one week on one project, not total private hours or
 * annual plan cost. Approximating it by dividing plan cost by covered hours only
 * would inflate the credit for exactly the open-shop contractor this product is
 * for, which is the commonest way a contractor gets this wrong. We would be
 * automating the error.
 */
export function annualizationDeclined(totalCredit: Cents): Refusal {
  return declinedConclusion({
    headline: 'Fringe benefit credits are printed as claimed, not verified.',
    rule: QUOTE.annualization,
    citation: CITE.annualization,
    observableFacts: [
      { label: 'Fringe credit claimed this week (column 6B)', value: Cents.toDollarString(totalCredit) },
      { label: 'Source of the hourly credit', value: 'entered by the contractor, per plan' },
      { label: 'Private (non-DBRA) hours available to Ratepin', value: 'none' },
      { label: 'Annual plan cost available to Ratepin', value: 'none' },
    ],
    declined:
      'Ratepin neither computed nor verified annualization of these contributions, and does not ' +
      'determine whether a plan is bona fide.',
  });
}

/**
 * §7.6 — cash in lieu of fringe benefits.
 *
 * 29 CFR 5.32(c) makes whether a cash payment is in lieu of a fringe "a question of
 * fact". It moves the overtime base: on M3, asserting the whole excess in lieu
 * rather than $6.27 drops `baseRate` from $23.73 to $21.93 and the premium from
 * $94.92 to $87.72 — $7.20 on one worker-week. So the assertion and its consequence
 * are shown side by side and the engine declines to characterise the payment.
 */
export function cashInLieuDeclined(facts: readonly { label: string; value: string }[]): Refusal {
  return declinedConclusion({
    headline: 'Part of the cash rate is recorded as paid in lieu of fringe benefits.',
    rule: `Whether a cash payment is made in lieu of a fringe benefit may be presented as "${QUOTE.cashInLieuQuestionOfFact}".`,
    citation: CITE.cashInLieuQuestionOfFact,
    observableFacts: facts,
    declined:
      'Ratepin does not determine whether these payments were made in lieu of fringe benefits. The ' +
      'amount is the contractor’s assertion; the columns show what follows from it.',
  });
}

/**
 * §9.2.1 — the conditions inside 29 CFR 3.5(i) and (j).
 *
 * Every one of them is a fact about the employment relationship that no payroll CSV
 * contains. They are NAMED and never enforced, and — this is the half that matters
 * — they NEVER BLOCK. Only `UNMAPPED` blocks, and `UNMAPPED` means the label matched
 * no paragraph at all, not that it matched a paragraph whose conditions we could
 * not check. Collapsing those two is how a correct ten-member enum still ends up
 * blocking a hard-hat deduction and telling a compliant contractor that a lawful
 * deduction is unlawful.
 */
export function deductionConditionsDeclined(input: {
  readonly letter: string;
  readonly text: string;
  readonly amount: Cents;
  readonly labels: readonly string[];
}): Refusal {
  return declinedConclusion({
    headline: `Deduction recorded under 29 CFR 3.5(${input.letter}).`,
    rule: input.text,
    citation: `29 CFR 3.5(${input.letter})`,
    observableFacts: [
      { label: 'Amount', value: Cents.toDollarString(input.amount) },
      { label: 'Labels on the payroll export', value: input.labels.join('; ') },
    ],
    declined:
      'Ratepin does not determine whether the conditions in that paragraph are met. The deduction is ' +
      'mapped to the paragraph and printed; the conditions are stated here.',
  });
}

// ===========================================================================
// P-D — the violation findings, R-BUILD C-2
// ===========================================================================

/**
 * THE THREE VIOLATION FLAGS, AS SENTENCES.
 *
 * WHAT WAS WRONG. `buildExceptionReport` produced no sentence for any member of
 * `ViolationFlag`. `computation.findings` — which carries `shortfall`, `required`,
 * `paid` and `citation` per finding — was read by nothing here, and the only other
 * consumer flattened the findings to a bare flag-name array written into
 * `filings.violation_flags`, a column nothing reads. Executed end to end and
 * text-extracted from the PDF bytes: a week with `WD_UNDERPAYMENT $72.00`,
 * `WD_UNDERPAYMENT $50.00` and `PREMIUM_BELOW_STATUTORY $21.82` rendered ONE
 * exception sentence (the liquidated-damages rule) and contained the string "72.00"
 * nowhere, "shortfall" nowhere, "underpa" nowhere — status CERTIFIABLE, signature
 * block rendered. A $122.00 wage shortfall against the pinned determination,
 * computed correctly, discarded before ink.
 *
 * That is worse than not computing it. `ENGINE.md` §10 is the product — "the engine
 * performs one comparison that no incumbent form-filler performs" — and a contractor
 * who bought Ratepin so the comparison would be made received a clean form. The
 * product's own promise made the silence read as a pass.
 *
 * WHAT THESE ARE. P-D, not P-A and not P-B. §10 is explicit that the check never
 * blocks and never characterises a shortfall as a violation of law: "Two things this
 * module never does: it never characterises a shortfall as a violation of law, and it
 * never computes liquidated damages for a customer. It states the arithmetic and
 * names the rule." So each sentence shows required, paid and the difference, quotes
 * the regulation, and declines the conclusion. The artifact stays CERTIFIABLE unless
 * something else blocks it — which is the half of §10 that WAS implemented.
 *
 * VERIFIED AGAINST. 29 CFR 5.31(b) (the discharge methods, whose "straight time
 * hourly rate" is what `WD_UNDERPAYMENT` compares), 29 CFR 5.32(a) (the overtime
 * base), 29 CFR 5.5(b)(1) (the CWHSSA obligation) — all fetched from the eCFR
 * versioner API on 2026-08-13, title-29 issue 2026-08-11, and already transcribed
 * verbatim in `citations.ts`.
 */
/**
 * THE ARITHMETIC RIDES IN THE HEADLINE, NOT IN `observableFacts`.
 *
 * `exceptionSentences` — the one flattener both the paid and the free path use to
 * turn a `Refusal` into a line of the printed exception report — renders a P-D as
 * `headline + citation + rule + declined` and DISCARDS `observableFacts`. So a
 * refusal that carried its figures only in the facts array would satisfy every test
 * about refusals existing and still put no number on the paper, which is the exact
 * shape of the defect this is closing. The three figures are therefore in the
 * sentence, and the facts array carries the same values for the richer screens.
 *
 * Each label is a statement of arithmetic. None of them says "violation",
 * "underpaid" or "owes": §10 forbids characterising a shortfall as a violation of
 * law, and `CORRECTIONS.md` forbids writing a conclusion we did not measure.
 */
const VIOLATION_LABEL: Readonly<Record<ViolationFlag, string>> = {
  WD_UNDERPAYMENT:
    'total straight-time compensation for these hours is below what the determination requires',
  FRINGE_BELOW_WD:
    'fringe contributions are below the determination’s fringe rate, with the total met in cash',
  PREMIUM_BELOW_STATUTORY:
    'the premium rates stated on this payroll are below the overtime premium computed for the week',
} as const;

function violationHeadline(finding: ViolationFinding): string {
  const scope = finding.lineId === null ? 'This worker-week' : `Line ${finding.lineId}`;
  return (
    `${scope}: ${VIOLATION_LABEL[finding.flag]} — ` +
    `required ${Cents.toDollarString(finding.required)}, ` +
    `reported as paid ${Cents.toDollarString(finding.paid)}, ` +
    `difference ${Cents.toDollarString(finding.shortfall)}.`
  );
}

const VIOLATION_RULE: Readonly<Record<ViolationFlag, { rule: string; citation: string }>> = {
  WD_UNDERPAYMENT: { rule: QUOTE.dischargeMethods, citation: CITE.dischargeMethods },
  FRINGE_BELOW_WD: { rule: QUOTE.dischargeMethods, citation: CITE.dischargeMethods },
  PREMIUM_BELOW_STATUTORY: { rule: QUOTE.cwhssaOvertime, citation: CITE.cwhssaOvertime },
} as const;

const VIOLATION_DECLINED: Readonly<Record<ViolationFlag, string>> = {
  WD_UNDERPAYMENT:
    'Ratepin states the arithmetic and names the rule. Ratepin does not determine whether this is ' +
    'a violation of the Davis-Bacon Act, computes no back wages and computes no liquidated ' +
    'damages. Nothing here blocks this filing.',
  FRINGE_BELOW_WD:
    'Discharging the obligation partly in cash and partly in fringe contributions is one of the ' +
    'three methods 29 CFR 5.31(b) permits, so this is an observation and not a finding. Ratepin ' +
    'does not determine whether a plan is bona fide and does not verify annualization. Nothing ' +
    'here blocks this filing.',
  PREMIUM_BELOW_STATUTORY:
    'The premium Ratepin computed is already inside column 7A on this form. Ratepin states the ' +
    'arithmetic and names the rule; it does not determine whether the Contract Work Hours and ' +
    'Safety Standards Act was contravened, and computes no liquidated damages. Nothing here ' +
    'blocks this filing.',
} as const;

/** One violation finding, as a declined conclusion with the arithmetic beside it. */
export function violationObserved(finding: ViolationFinding): Refusal {
  const { rule, citation } = VIOLATION_RULE[finding.flag];
  return declinedConclusion({
    headline: violationHeadline(finding),
    rule,
    citation: `${citation} (finding cites ${finding.citation})`,
    observableFacts: [
      { label: 'Required', value: Cents.toDollarString(finding.required) },
      { label: 'Paid, as this payroll reports it', value: Cents.toDollarString(finding.paid) },
      { label: 'Difference', value: Cents.toDollarString(finding.shortfall) },
      { label: 'Scope', value: finding.lineId === null ? 'worker-week' : `line ${finding.lineId}` },
    ],
    declined: VIOLATION_DECLINED[finding.flag],
  });
}

/**
 * R-BUILD H-4's replacement for the accusation. A week with statutory overtime whose
 * export states no premium rate anywhere: there is nothing to compare, so nothing is
 * claimed. The sentence says what column 7A contains and stops.
 */
export function premiumRateNotReported(input: {
  readonly premiumOwed: Cents;
  readonly statutoryOtHours: Hours;
}): Refusal {
  return declinedConclusion({
    headline: 'This payroll export states no overtime rate for a week with statutory overtime.',
    rule: QUOTE.cwhssaOvertime,
    citation: CITE.cwhssaOvertime,
    observableFacts: [
      { label: 'Hours over forty', value: Hours.toDecimalString(input.statutoryOtHours) },
      { label: 'Overtime premium Ratepin computed', value: Cents.toDollarString(input.premiumOwed) },
      { label: 'Where that premium appears', value: 'inside column 7A on this form' },
      { label: 'Premium rate reported by the payroll export', value: 'none' },
    ],
    declined:
      'Ratepin does not determine whether that premium was paid. No premium rate is stated on any ' +
      'row of this week, so there is nothing to compare it against, and Ratepin will not read the ' +
      'absence of a rate column as either payment or non-payment.',
  });
}

/** §13 — apprenticeship ratios are an opinion about programme compliance. The
 *  status and the level of progression are recorded and printed; no ratio is
 *  computed. */
export function apprenticeRatioDeclined(count: number): Refusal {
  return declinedConclusion({
    headline: 'Workers are recorded as registered apprentices.',
    rule: QUOTE.statementOfComplianceRates,
    citation: CITE.statementOfCompliance,
    observableFacts: [
      { label: 'Workers with status (RA) on this payroll', value: String(count) },
      { label: 'Apprentice-to-journeyworker ratio computed', value: 'none' },
    ],
    declined:
      'Ratepin records the status, the registered programme and the level of progression, and ' +
      'computes no apprentice-to-journeyworker ratio.',
  });
}

/**
 * §7.7 — the gap we name but do not fill.
 *
 * CWHSSA fires above 40 hours ON COVERED CONTRACTS (FOH 15k03(a)). FLSA fires above
 * 40 hours IN THE WORKWEEK (29 CFR 778.101). A worker with covered hours at or under
 * forty and gross earnings covering work elsewhere may have an FLSA obligation and no
 * CWHSSA one. That is a true statement of a limit, and it is more useful than either
 * silence or a guess.
 *
 * §7.7's illustrative sentence quotes an hours figure for all work ("45.0 hours of
 * work across all projects this week"). `WorkerWeek` carries `allWorkGross` in cents
 * and no all-work hours field, and hours are not derivable from gross, so the facts
 * below are the ones Ratepin can actually observe. Reported upstream as a gap
 * between §7.7's sentence and §3's model.
 */
export function flsaGapDeclined(input: {
  readonly hoursOnThisProject: Hours;
  readonly col7A: Cents;
  readonly col7B: Cents;
}): Refusal {
  return declinedConclusion({
    headline: 'This worker has gross earnings for work outside this project.',
    rule: QUOTE.coveredHoursOnly,
    citation: CITE.coveredHoursOnly,
    observableFacts: [
      { label: 'Hours on this project', value: Hours.toDecimalString(input.hoursOnThisProject) },
      { label: 'Gross earned on this project (column 7A)', value: Cents.toDollarString(input.col7A) },
      { label: 'Gross earned for all work (column 7B)', value: Cents.toDollarString(input.col7B) },
      { label: 'Hours worked outside this project', value: 'not reported to Ratepin' },
    ],
    declined:
      'Overtime obligations arising under the Fair Labor Standards Act on hours worked outside this ' +
      'project are not computed by Ratepin.',
  });
}

// ===========================================================================
// P-A — blocked lines with closed choices
// ===========================================================================

/**
 * §7.3's closed choice, verbatim in shape: "these hours were ordinary hours
 * mis-labelled by the export", or "these hours were paid at a premium rate of ___".
 * The engine does not choose, and does not proceed on either reading.
 */
function premiumChoices(): readonly RefusalChoice[] {
  return [
    {
      value: 'ordinary_hours_mislabelled',
      label: 'These were ordinary hours that the payroll export labelled as premium.',
      verbatimSource: QUOTE.cwhssaOvertime,
      sourceCitation: CITE.cwhssaOvertime,
    },
    {
      value: 'premium_rate_stated',
      label: 'These hours were paid at a premium rate, which I will enter.',
      verbatimSource: QUOTE.cwhssaOvertime,
      sourceCitation: CITE.cwhssaOvertime,
    },
  ];
}

function deductionChoices(obligations: ObligationValues): readonly RefusalChoice[] {
  return obligations.deductionParagraphs.value.map((paragraph) => ({
    value: paragraph.letter,
    label: `29 CFR 3.5(${paragraph.letter})`,
    verbatimSource: paragraph.text,
    sourceCitation: `29 CFR 3.5(${paragraph.letter})`,
  }));
}

/**
 * Every P-A the ARITHMETIC owns.
 *
 * `UNMAPPED_TRADE`, `UNPARSED_CLASSIFICATION` and the corpus-scoped blocks are
 * deliberately absent: their closed choice is a list of candidate classifications
 * drawn from the pinned determination's own parsed class list, with verbatim scope
 * text and line numbers. That list belongs to the classification ladder, which owns
 * L-A…L-F and the one licence to pre-select. The engine reports the block; it does
 * not author a picker it cannot populate.
 */
export function blockedLineRefusals(input: ExceptionInput): readonly Refusal[] {
  const refusals: Refusal[] = [];
  const linesById = new Map(input.week.workers.flatMap((w) => w.lines).map((l) => [l.lineId, l]));

  for (const worker of input.computation.workers) {
    for (const line of worker.lines) {
      const source = linesById.get(line.lineId);
      if (source === undefined) continue;

      if (line.blockReasons.includes('PREMIUM_HOURS_UNPROVEN')) {
        refusals.push(
          blockedLine({
            blockReason: 'PREMIUM_HOURS_UNPROVEN',
            lineId: line.lineId,
            headline: 'This week has statutory overtime and premium hours we cannot price.',
            detail:
              `${Hours.toDecimalString(line.dtHours)} hours on this line are labelled as premium, and ` +
              'the row does not show they were paid at one and one-half times the week’s regular rate. ' +
              'Every hour worked counts toward the forty-hour threshold whatever column it arrived in, ' +
              'so Ratepin cannot treat the label as discharging the obligation and will not choose ' +
              'between the two readings.',
            choices: premiumChoices(),
            ladderLevel: 'L_F',
          }),
        );
      }

      if (line.blockReasons.includes('AMBIGUOUS_RATE_BASIS')) {
        refusals.push(
          blockedLine({
            blockReason: 'AMBIGUOUS_RATE_BASIS',
            lineId: line.lineId,
            headline: 'The cash-in-lieu amount is larger than the cash rate it is part of.',
            detail:
              'A cash payment in lieu of fringe benefits is a portion of the straight-time cash rate, ' +
              'so it cannot exceed it. As recorded, the straight-time rate net of cash in lieu would be ' +
              'negative and the amount disclosed in column 6C would be more than the cash the worker ' +
              'received.',
            choices: [
              {
                value: 'cash_rate_is_gross',
                label: 'The cash rate is the gross straight-time rate; the in-lieu amount is part of it.',
                verbatimSource: QUOTE.regularRateFloor,
                sourceCitation: CITE.regularRateFloor,
              },
              {
                value: 'cash_in_lieu_restated',
                label: 'The cash-in-lieu amount is wrong and I will restate it.',
                verbatimSource: QUOTE.dischargeMethodsShort,
                sourceCitation: CITE.dischargeMethods,
              },
            ],
            ladderLevel: 'L_F',
          }),
        );
      }

      if (line.blockReasons.includes('UNFUNDED_PLAN_CREDIT')) {
        refusals.push(
          blockedLine({
            blockReason: 'UNFUNDED_PLAN_CREDIT',
            lineId: line.lineId,
            headline: 'A fringe credit on this line is claimed against an unfunded plan.',
            detail:
              'An unfunded plan pays its benefits from the contractor’s general assets rather than ' +
              'from contributions irrevocably made to a trustee or a third person. 29 CFR 5.28(b) ' +
              'sets five conditions on such a plan, and the fifth is approval by the Secretary. ' +
              'Whether that approval was requested and received is not in any payroll export, so ' +
              'Ratepin cannot evaluate the credit and will not place it in column 6B. 29 CFR ' +
              '5.28(c) sets out how approval is requested: a written request to the Wage and Hour ' +
              'Division demonstrating that the plan is bona fide and meets 5.28(b)(1) through (4).',
            choices: [
              {
                value: 'plan_is_funded',
                label:
                  'The plan is funded — contributions are irrevocably made to a trustee or third ' +
                  'person — and was recorded as unfunded in error.',
                verbatimSource: QUOTE.unfundedPlanApproval,
                sourceCitation: CITE.unfundedPlanApproval,
              },
              {
                value: 'withdraw_unfunded_credit',
                label: 'Remove the credit claimed on this line and discharge the obligation in cash.',
                verbatimSource: QUOTE.dischargeMethodsShort,
                sourceCitation: CITE.dischargeMethods,
              },
            ],
            ladderLevel: 'L_F',
          }),
        );
      }

      if (line.blockReasons.includes('UNION_GROUP_REFUSED')) {
        refusals.push(
          blockedLine({
            blockReason: 'UNION_GROUP_REFUSED',
            lineId: line.lineId,
            headline: 'A fringe credit is claimed against a union-identified classification.',
            detail:
              'The determination publishes an aggregate fringe figure for this classification and not ' +
              'the collectively bargained schedule behind it, so Ratepin cannot evaluate a credit ' +
              'claimed against that schedule. Discharging the obligation in cash, or in cash in lieu ' +
              'of the fringe, needs no schedule and is unaffected.',
            choices: [
              {
                value: 'discharge_all_cash',
                label: 'The obligation was discharged in cash under 29 CFR 5.31(b)(2).',
                verbatimSource: QUOTE.dischargeMethodsShort,
                sourceCitation: CITE.dischargeMethods,
              },
              {
                value: 'withdraw_credit',
                label: 'Remove the fringe credit claimed on this line.',
                verbatimSource: QUOTE.dischargeMethodsShort,
                sourceCitation: CITE.dischargeMethods,
              },
            ],
            ladderLevel: 'L_F',
          }),
        );
      }
    }

    if (worker.blockReasons.includes('UNMAPPED_DEDUCTION')) {
      const unmapped = worker.deductions.find((d) => d.category === 'UNMAPPED');
      refusals.push(
        blockedLine({
          blockReason: 'UNMAPPED_DEDUCTION',
          lineId: worker.lines[0]?.lineId ?? String(worker.workerRef),
          headline: 'A deduction on this payroll matches no paragraph of 29 CFR 3.5.',
          detail:
            `Labels: ${(unmapped?.labels ?? []).join('; ')}. Column 8 on a signed form asserts that ` +
            'every deduction is permissible under 29 CFR part 3, so Ratepin will not place an ' +
            'unrecognised deduction in it. Choosing the paragraph once records the mapping for this ' +
            'account.',
          choices: deductionChoices(input.obligations),
          ladderLevel: 'L_F',
        }),
      );
    }

    if (worker.blockReasons.includes('GROSS_EXCEEDS_ALL_WORK_GROSS')) {
      refusals.push(
        blockedLine({
          blockReason: 'GROSS_EXCEEDS_ALL_WORK_GROSS',
          lineId: worker.lines[0]?.lineId ?? String(worker.workerRef),
          headline: 'Column 7A is larger than column 7B on this worker.',
          detail:
            `Gross earned on this project (column 7A) is ${Cents.toDollarString(worker.col7A)}; gross ` +
            `earned for all work in the week (column 7B) is ${Cents.toDollarString(worker.col7B)}. The ` +
            'first is part of the second, so a form carrying both of these figures cannot be true, and ' +
            'column 9’s net will not reconcile against it. Ratepin cannot tell which figure is wrong: ' +
            'column 7A is computed from the hours, the rates and the overtime premium on these rows, ' +
            'and column 7B came from your payroll system.',
          choices: [
            {
              value: 'all_work_gross_restated',
              label: 'Column 7B is understated; the gross for all work needs correcting.',
              verbatimSource: QUOTE.statementOfComplianceDeductions,
              sourceCitation: CITE.statementOfCompliance,
            },
            {
              value: 'premium_rate_restated',
              label: 'The overtime or premium rate on these rows is wrong and I will restate it.',
              verbatimSource: QUOTE.cwhssaOvertime,
              sourceCitation: CITE.cwhssaOvertime,
            },
          ],
          ladderLevel: 'L_F',
        }),
      );
    }

    if (worker.blockReasons.includes('NET_RECONCILIATION_FAILED')) {
      const difference = Cents.sub(worker.netComputed, worker.netPaid);
      refusals.push(
        blockedLine({
          blockReason: 'NET_RECONCILIATION_FAILED',
          lineId: worker.lines[0]?.lineId ?? String(worker.workerRef),
          headline: 'Column 9 does not reconcile with column 7B less the deductions.',
          detail:
            `Column 7B less column 8 is ${Cents.toDollarString(worker.netComputed)}; column 9 is ` +
            `${Cents.toDollarString(worker.netPaid)}; the difference is ` +
            `${Cents.toDollarString(difference)}. Ratepin does not overwrite the net paid: that figure ` +
            'came from a cheque that was actually written, so a disagreement means an input is wrong ' +
            'somewhere upstream.',
          choices: [
            {
              value: 'net_paid_correct',
              label: 'Column 9 is right; the deductions or column 7B need correcting.',
              verbatimSource: QUOTE.statementOfComplianceDeductions,
              sourceCitation: CITE.statementOfCompliance,
            },
            {
              value: 'deductions_correct',
              label: 'The deductions are right; column 9 needs correcting.',
              verbatimSource: QUOTE.statementOfComplianceDeductions,
              sourceCitation: CITE.statementOfCompliance,
            },
          ],
          ladderLevel: 'L_F',
        }),
      );
    }
  }

  return refusals;
}

// ===========================================================================
// The whole report
// ===========================================================================

/** Every refusal for one filing, in a stable order: the filing-scoped P-B first,
 *  then the blocked lines, then the declined conclusions. Deterministic, because
 *  the exception report is compared field-by-field by the canary (§25). */
export function buildExceptionReport(input: ExceptionInput): readonly Refusal[] {
  const { computation, obligations } = input;
  const refusals: Refusal[] = [];

  if (computation.contractValueBand === 'unknown') {
    refusals.push(cwhssaCoverageUndetermined(obligations));
  }

  refusals.push(...blockedLineRefusals(input));

  if (computation.contractValueBand === 'at_or_under_100k') {
    refusals.push(cwhssaNotComputedBelowThreshold(obligations));
  }
  if (computation.contractValueBand === 'over_100k') {
    refusals.push(liquidatedDamagesRule(obligations));
  }

  const totalCredit = Cents.sum(
    computation.workers.flatMap((w) => w.lines.map((l) => l.col6B)),
  );
  if (totalCredit > 0) refusals.push(annualizationDeclined(totalCredit));

  const inLieuFacts = computation.workers.flatMap((worker) =>
    worker.lines
      .filter((line) => line.col6C > 0)
      .map((line) => ({
        label: `Line ${line.lineId} — cash in lieu disclosed in column 6C`,
        value: Cents.toDollarString(line.col6C),
      })),
  );
  if (inLieuFacts.length > 0) refusals.push(cashInLieuDeclined(inLieuFacts));

  const conditionBearing = new Map<string, { amount: Cents; labels: string[] }>();
  for (const worker of computation.workers) {
    for (const deduction of worker.deductions) {
      if (deduction.paragraph !== 'i' && deduction.paragraph !== 'j') continue;
      const bucket = conditionBearing.get(deduction.paragraph) ?? { amount: Cents.of(0), labels: [] };
      conditionBearing.set(deduction.paragraph, {
        amount: Cents.add(bucket.amount, deduction.amount),
        labels: [...bucket.labels, ...deduction.labels],
      });
    }
  }
  for (const letter of ['i', 'j']) {
    const bucket = conditionBearing.get(letter);
    if (bucket === undefined) continue;
    const paragraph = obligations.deductionParagraphs.value.find((p) => p.letter === letter);
    if (paragraph === undefined) continue;
    refusals.push(
      deductionConditionsDeclined({
        letter,
        text: paragraph.text,
        amount: bucket.amount,
        labels: bucket.labels,
      }),
    );
  }

  /**
   * R-BUILD C-2 — every violation finding becomes a sentence, in the order the
   * arithmetic discovered it. There is no filter and no threshold: a finding that
   * exists and is not rendered is a finding the customer paid us to make and did not
   * receive, and `explainedViolationFlags` below is that promise as a test.
   */
  for (const finding of computation.findings) {
    refusals.push(violationObserved(finding));
  }

  /**
   * R-BUILD H-4 — the evidence-free week. Fires exactly where
   * `PREMIUM_BELOW_STATUTORY` no longer does, so a week with statutory overtime is
   * never silent about the premium: either the stated rates fall short and the
   * finding above says by how much, or no rate is stated and this says so.
   */
  for (const worker of computation.workers) {
    if (computation.contractValueBand !== 'over_100k') continue;
    if (worker.statutoryOtHours <= 0 || worker.premiumOwed <= 0) continue;
    if (worker.premiumRatesStated) continue;
    refusals.push(
      premiumRateNotReported({
        premiumOwed: worker.premiumOwed,
        statutoryOtHours: worker.statutoryOtHours,
      }),
    );
  }

  const apprentices = computation.workers.filter((w) => w.status === 'RA').length;
  if (apprentices > 0) refusals.push(apprenticeRatioDeclined(apprentices));

  for (const worker of computation.workers) {
    if (worker.col7B > worker.col7A && worker.hoursWorked <= Hours.of(40 * 100)) {
      refusals.push(
        flsaGapDeclined({
          hoursOnThisProject: worker.hoursWorked,
          col7A: worker.col7A,
          col7B: worker.col7B,
        }),
      );
    }
  }

  return refusals;
}

/** Every block reason the exception report accounts for. Used by the offline test
 *  that asserts no block can reach an artifact without a sentence explaining it —
 *  an unexplained watermark is a warning, and a warning can be clicked past. */
export function explainedBlockReasons(refusals: readonly Refusal[]): readonly BlockReason[] {
  const reasons: BlockReason[] = [];
  for (const refusal of refusals) {
    if (refusal.primitive === 'P-A') reasons.push(refusal.blockReason);
    if (refusal.primitive === 'P-B') reasons.push(...refusal.blockReasons);
  }
  return reasons;
}

/**
 * Every violation flag the exception report accounts for — the finding-side twin of
 * `explainedBlockReasons`, and the test that closes R-BUILD C-2's class: every
 * `ViolationFlag` in `computation.findings` must appear here.
 *
 * The flag is recovered from the headline rather than carried on the refusal because
 * `Refusal` has no field for it and widening that union to carry an engine concept
 * would put an arithmetic type into the shape every renderer switches over. The
 * labels are constants in this module, so the recovery is total and cannot drift: a
 * new flag with no `VIOLATION_LABEL` entry fails to compile.
 */
export function explainedViolationFlags(refusals: readonly Refusal[]): readonly ViolationFlag[] {
  const flags: ViolationFlag[] = [];
  for (const refusal of refusals) {
    if (refusal.primitive !== 'P-D') continue;
    for (const [flag, label] of Object.entries(VIOLATION_LABEL) as [ViolationFlag, string][]) {
      if (refusal.headline.includes(label)) flags.push(flag);
    }
  }
  return flags;
}

/** Workers whose deductions carry an (i) or (j) category — never blocked, always
 *  explained. Exposed so P-21's test can assert the pairing directly. */
export function workersWithConditionBearingDeductions(
  computation: FilingComputation,
): readonly WorkerComputation[] {
  return computation.workers.filter((worker) =>
    worker.deductions.some((d) => d.paragraph === 'i' || d.paragraph === 'j'),
  );
}
