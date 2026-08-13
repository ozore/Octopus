/**
 * THE ELEVEN FIXTURES OF `ENGINE.md` §12.3 — six class-1, five class-2.
 *
 * "The six class-1 fixtures are the only tests in the codebase whose expected
 * values we are forbidden to regenerate … For class 1 there is no regenerate flag.
 * If DOL is wrong, DOL is still the oracle, because DOL is who audits the customer."
 *
 * All six class-1 fixtures are pinned at `contractValueBand = over_100k`: they are
 * CWHSSA examples, and asserting them under any other band would be asserting
 * something DOL did not publish. §7.0's gate is exercised by the class-2 band
 * fixtures instead.
 *
 * ===========================================================================
 * TWO DISCREPANCIES IN THE SPECIFICATION, RECORDED HERE RATHER THAN ABSORBED
 *
 * 1. F-531's TOTAL. §12.3 states the fixture asserts "$21.93 + $6.27 = $28.60", and
 *    §6 quotes 5.31(b)(2) as "$28.60 ($21.93 basic hourly rate plus $6.27 for fringe
 *    benefits)". Those addends sum to $28.20, not $28.60, and §7.6 uses $28.20 for
 *    the same determination row ("the excess over the WD's $28.20 total"). The
 *    fixture therefore pins the sum of the two published ADDENDS — which are
 *    unambiguous and appear identically in both places — and does not pin a total
 *    that does not reconcile with them. Flagged upstream.
 *
 * 2. F-FOH-15k11b-M2 CANNOT BE CLASS 1 TODAY. §7.5 conditions Method 2 on the
 *    project carrying `section7g2Agreement: true`; `PayrollWeek` (`src/lib/types.ts`)
 *    has no such field, and this module does not own that file. §7.5's own rule
 *    settles what the engine must do: "If any fails, the engine computes Method 1
 *    and says so on the exception report." So the case is class 2 and pins the
 *    Method-1 fallback, recording DOL's $24.00 as the figure it will assert once the
 *    field exists. Labelling it class 1 against a Method-1 expectation would put
 *    DOL's name on our fallback.
 */

import type { ObligationValues } from '../arithmetic/rates';
import { buildCase, daysFrom } from './build';
import { dollars, hours, microDollars, rate, type CanaryCase } from './case';
import { isoDate } from '@/lib/types';
import { Cents } from '@/lib/money';

// ===========================================================================
// The obligation values, as the corpus would supply them
// ===========================================================================

/**
 * The two dollar figures the engine refuses to hold as constants, plus 29 CFR 3.5's
 * paragraph set — all with effective dates and sources, because all three are
 * things the Secretary and Congress have moved.
 *
 * The paragraph TEXTS: (i) and (j) are verbatim, as `ENGINE.md` §9.2 quotes them
 * from the eCFR API on 2026-08-13, "quoted verbatim so a builder never has to
 * reconstruct them from a summary" — and they are the two the engine actually
 * prints, because they are the two whose conditions it declines to evaluate
 * (§9.2.1). The other eight carry the substance line §9.1's table records. THAT IS
 * NOT A VERBATIM QUOTE AND IS MARKED AS SUCH: in production the Monday eCFR ingest
 * supplies the paragraph text, and this fixture stands in for it offline.
 */
export const CANARY_OBLIGATIONS: ObligationValues = {
  cwhssaContractThreshold: {
    value: Cents.of(100_000_00),
    effectiveDate: isoDate('2023-10-23'),
    citation: '29 CFR 5.5(b)',
    sourceUrl: 'https://www.ecfr.gov/api/versioner/v1/full/2026-08-13/title-29.xml?part=5',
  },
  liquidatedDamagesPerDay: {
    value: Cents.of(33_00),
    effectiveDate: isoDate('2023-10-23'),
    citation: '29 CFR 5.5(b)(2)',
    sourceUrl: 'https://www.ecfr.gov/api/versioner/v1/full/2026-08-13/title-29.xml?part=5',
  },
  deductionParagraphs: {
    value: [
      { letter: 'a', text: '[substance, ENGINE.md §9.1] Federal/State/local law: withholding income taxes, FICA.' },
      { letter: 'b', text: '[substance, ENGINE.md §9.1] Repayment of a prepayment made without discount or interest.' },
      { letter: 'c', text: '[substance, ENGINE.md §9.1] Amounts required by court process, not in favour of the contractor.' },
      { letter: 'd', text: '[substance, ENGINE.md §9.1] Contributions to medical/pension/vacation funds, meeting four tests.' },
      { letter: 'e', text: '[substance, ENGINE.md §9.1] Repayment of loans to, or purchase of shares in, a credit union.' },
      { letter: 'f', text: '[substance, ENGINE.md §9.1] Voluntary contributions to governmental or quasi-governmental agencies.' },
      { letter: 'g', text: '[substance, ENGINE.md §9.1] Voluntary contributions to 26 U.S.C. 501(c)(3) organisations.' },
      { letter: 'h', text: '[substance, ENGINE.md §9.1] Regular initiation fees and membership dues, per a CBA.' },
      {
        letter: 'i',
        text:
          'Any deduction not more than for the "reasonable cost" of board, lodging, or other facilities ' +
          'meeting the requirements of section 3(m) of the Fair Labor Standards Act of 1938, as amended, ' +
          'and 29 CFR part 531. When such a deduction is made the additional records required under ' +
          '29 CFR 516.25(a) must be kept.',
      },
      {
        letter: 'j',
        text:
          'Any deduction for the cost of safety equipment of nominal value purchased by the laborer or ' +
          'mechanic as their own property for their personal protection in their work, such as safety ' +
          'shoes, safety glasses, safety gloves, and hard hats, if such equipment is not required by law ' +
          'to be furnished by the contractor, if such deduction does not violate the Fair Labor Standards ' +
          'Act or any other law, if the cost on which the deduction is based does not exceed the actual ' +
          'cost to the contractor where the equipment is purchased from the contractor and does not ' +
          'include any direct or indirect monetary return to the contractor where the equipment is ' +
          'purchased from a third person, and if the deduction is either: (1) Voluntarily consented to by ' +
          'the laborer or mechanic in writing and in advance of the period in which the work is to be ' +
          'done and such consent is not a condition either for the obtaining of employment or its ' +
          'continuance; or (2) Provided for in a bona fide collective bargaining agreement between the ' +
          'contractor or subcontractor and representatives of its laborers and mechanics.',
      },
    ],
    effectiveDate: isoDate('2023-08-23'),
    citation: '29 CFR 3.5 [88 FR 57730, Aug. 23, 2023]',
    sourceUrl: 'https://www.ecfr.gov/api/versioner/v1/full/2026-08-13/title-29.xml?part=3',
  },
} as const;

// ===========================================================================
// F-531 — 29 CFR 5.31(b)(1)(2)(3), the three discharge methods (class 1)
// ===========================================================================

const LABORER = { className: 'LABORER:  COMMON OR GENERAL', wdBase: '21.93', wdFringe: '6.27' } as const;

/** Method (1) — basic hourly rate in cash, fringe by contribution. The
 *  contribution dollars appear in column 6B and are ABSENT from column 7A: they are
 *  not wages paid to the worker in the pay period. */
const F531_METHOD1: CanaryCase = {
  caseId: 'F-531/method-1-contributions',
  oracleClass: 1,
  source: '29 CFR 5.31(b)(1)',
  asserts:
    'Straight-time $21.93 plus contributions of $6.27/hr discharges the obligation. col6B carries the ' +
    'contributions; col7A does not.',
  wdSnapshotId: 'VA20260195:2',
  stateCode: 'VA',
  constructionType: 'heavy',
  input: buildCase({
    band: 'over_100k',
    workers: [{ lines: [{ ...LABORER, cashRate: '21.93', st: '40', plans: [{ name: 'Health & Welfare', credit: '6.27' }] }] }],
  }),
  expected: {
    'worker[0].line[0].col6B': dollars('250.80'),
    'worker[0].line[0].col6C': dollars('0.00'),
    'worker[0].line[0].straightTimeCash': dollars('877.20'),
    'worker[0].line[0].requiredTotal': dollars('1128.00'),
    'worker[0].line[0].paidTotal': dollars('1128.00'),
    'worker[0].col7A': dollars('877.20'),
    'worker[0].cwhssaPremium': dollars('0.00'),
    'filing.findings': '',
    'filing.soc.box5': true,
  },
};

/** Method (2) — all cash, with an additional cash payment in lieu of the benefits.
 *  The in-lieu dollars appear in column 6C and are counted ONCE inside column 7A —
 *  the CRIT-2 placement rule. */
const F531_METHOD2: CanaryCase = {
  caseId: 'F-531/method-2-cash-in-lieu',
  oracleClass: 1,
  source: '29 CFR 5.31(b)(2)',
  asserts:
    '$21.93 basic plus $6.27 in lieu, paid entirely in cash, discharges the obligation. col6C discloses ' +
    'the $6.27/hr; col7A counts it once.',
  wdSnapshotId: 'VA20260195:2',
  stateCode: 'VA',
  constructionType: 'heavy',
  input: buildCase({
    band: 'over_100k',
    workers: [{ lines: [{ ...LABORER, cashRate: '28.20', cashInLieu: '6.27', st: '40' }] }],
  }),
  expected: {
    'worker[0].line[0].col6A.st': rate('21.93'),
    'worker[0].line[0].col6B': dollars('0.00'),
    'worker[0].line[0].col6C': dollars('250.80'),
    'worker[0].line[0].straightTimeCash': dollars('1128.00'),
    'worker[0].line[0].baseRate': rate('21.93'),
    'worker[0].line[0].requiredTotal': dollars('1128.00'),
    'worker[0].line[0].paidTotal': dollars('1128.00'),
    'worker[0].col7A': dollars('1128.00'),
    'filing.findings': '',
    'filing.soc.box5': false,
  },
};

/** Method (3) — a combination. Cash $25.00/hr of which $3.07 is in lieu, plus
 *  $3.20/hr of contributions: basic cash $21.93, fringe $6.27, total $28.20. */
const F531_METHOD3: CanaryCase = {
  caseId: 'F-531/method-3-combination',
  oracleClass: 1,
  source: '29 CFR 5.31(b)(3)',
  asserts: 'A combination of cash in lieu and contributions discharges the same obligation.',
  wdSnapshotId: 'VA20260195:2',
  stateCode: 'VA',
  constructionType: 'heavy',
  input: buildCase({
    band: 'over_100k',
    workers: [
      {
        lines: [
          {
            ...LABORER,
            cashRate: '25.00',
            cashInLieu: '3.07',
            st: '40',
            plans: [{ name: 'Pension', credit: '3.20' }],
          },
        ],
      },
    ],
  }),
  expected: {
    'worker[0].line[0].col6B': dollars('128.00'),
    'worker[0].line[0].col6C': dollars('122.80'),
    'worker[0].line[0].baseRate': rate('21.93'),
    'worker[0].line[0].requiredTotal': dollars('1128.00'),
    'worker[0].line[0].paidTotal': dollars('1128.00'),
    'worker[0].col7A': dollars('1000.00'),
    'filing.findings': '',
  },
};

// ===========================================================================
// F-532abc — 29 CFR 5.32(c)(1)(2)(3), the three contractors (class 1)
// ===========================================================================

const WD_3_00 = { className: 'LABORER:  COMMON OR GENERAL', wdBase: '3.00', wdFringe: '0.50' } as const;

/** Contractor W: $3.50 all cash, $0.50 of it in lieu. DOL: "computed on a regular
 *  or basic rate of $3.00 an hour". */
const F532_W: CanaryCase = {
  caseId: 'F-532abc/contractor-W',
  oracleClass: 1,
  source: '29 CFR 5.32(c)(1)',
  asserts: 'baseRate = $3.00 — the cash-in-lieu portion is excluded from the overtime base.',
  wdSnapshotId: 'VA20260195:2',
  stateCode: 'VA',
  constructionType: 'building',
  input: buildCase({
    band: 'over_100k',
    workers: [{ lines: [{ ...WD_3_00, cashRate: '3.50', cashInLieu: '0.50', st: '40' }] }],
  }),
  expected: { 'worker[0].line[0].baseRate': rate('3.00') },
};

/** Contractor X: $3.25 cash plus $0.50 of contributions. DOL: the base "would be
 *  $3.25, the rate actually paid as a basic cash wage". This is the row that kills
 *  "the premium is half the WD's basic hourly rate". */
const F532_X: CanaryCase = {
  caseId: 'F-532abc/contractor-X',
  oracleClass: 1,
  source: '29 CFR 5.32(c)(2)',
  asserts: 'baseRate = $3.25 — cash above the WD basic rate raises the overtime base.',
  wdSnapshotId: 'VA20260195:2',
  stateCode: 'VA',
  constructionType: 'building',
  input: buildCase({
    band: 'over_100k',
    workers: [
      { lines: [{ ...WD_3_00, cashRate: '3.25', st: '40', plans: [{ name: 'Health', credit: '0.50' }] }] },
    ],
  }),
  expected: { 'worker[0].line[0].baseRate': rate('3.25') },
};

/** Contractor Y: $2.75 cash plus $1.00 of benefit cost. DOL: the base "would
 *  continue to be $3 an hour". This is the row that kills "the premium is half the
 *  rate actually paid". */
const F532_Y: CanaryCase = {
  caseId: 'F-532abc/contractor-Y',
  oracleClass: 1,
  source: '29 CFR 5.32(c)(3)',
  asserts: 'baseRate = $3.00 — the WD basic hourly rate is a floor, and here it binds.',
  wdSnapshotId: 'VA20260195:2',
  stateCode: 'VA',
  constructionType: 'building',
  input: buildCase({
    band: 'over_100k',
    workers: [
      { lines: [{ ...WD_3_00, cashRate: '2.75', st: '40', plans: [{ name: 'Health', credit: '1.00' }] }] },
    ],
  }),
  expected: { 'worker[0].line[0].baseRate': rate('3.00') },
};

// ===========================================================================
// F-FOH-15k11a — the 44-hour electrician, two fringe treatments (class 1)
// ===========================================================================

/**
 * A NOTE ON `PREMIUM_BELOW_STATUTORY` IN DOL'S OWN EXAMPLES.
 *
 * FOH 15k11(a) and the PWRB 44-hour example both describe a 44-hour week and state
 * no overtime RATE paid — DOL is computing what is owed, not transcribing a payroll
 * register. `premiumPaidTotal` (§10, N8) asks a different question: what does the
 * row show the contractor actually paid in premium? With no `otRate` on the line the
 * answer is nothing, so the flag fires with the full statutory premium as its
 * shortfall, and P-18 requires exactly that.
 *
 * That is the honest reading rather than an artifact of the fixture. A payroll export
 * with no overtime-rate column does not show a premium being paid, and the flag says
 * so with the arithmetic beside it; the premium Ratepin computed is already inside
 * column 7A, so the customer sees both the observation and its resolution. Suppressing
 * it would mean treating "we cannot see it" as "it was paid", which is the CRIT-4
 * error class in a different column.
 *
 * `WD_UNDERPAYMENT` is what §7.4 says must NOT fire here, and the pinned
 * `requiredTotal` / `paidTotal` pair is what proves it does not.
 */

const ELECTRICIAN = {
  className: 'ELECTRICIAN, INCLUDES TRAFFIC SIGNALIZATION',
  wdBase: '12.00',
  wdFringe: '2.50',
} as const;

/**
 * (a)(1) — $12.00 cash and $2.50 in fringe benefits. DOL publishes: "44 hours x
 * $2.50 = $110.00 in fringe benefits; 44 hours x $12.00 = $528.00 for prevailing
 * wages; 4 hours x ½ x $12.00 = $24.00 for CWHSSA earnings; $662.00 Total."
 */
const F_FOH_15K11A_1: CanaryCase = {
  caseId: 'F-FOH-15k11a/case-1',
  oracleClass: 1,
  source: 'FOH 15k11(a)(1)',
  asserts: 'col6B $110.00; straight-time cash $528.00; cwhssaPremium $24.00; DBA total due $662.00.',
  wdSnapshotId: 'VA20260195:2',
  stateCode: 'VA',
  constructionType: 'building',
  input: buildCase({
    band: 'over_100k',
    workers: [
      { lines: [{ ...ELECTRICIAN, cashRate: '12.00', st: '44', plans: [{ name: 'Fringe', credit: '2.50' }] }] },
    ],
  }),
  expected: {
    'worker[0].line[0].col6B': dollars('110.00'),
    'worker[0].line[0].straightTimeCash': dollars('528.00'),
    'worker[0].line[0].baseRate': rate('12.00'),
    'worker[0].hoursWorked': hours('44'),
    'worker[0].statutoryOtHours': hours('4'),
    'worker[0].regularRate': dollars('12.00'),
    'worker[0].cwhssaPremium': dollars('24.00'),
    'worker[0].dbaCompensationDue': dollars('662.00'),
    'worker[0].line[0].requiredTotal': dollars('638.00'),
    'worker[0].line[0].paidTotal': dollars('638.00'),
    'filing.findings': `PREMIUM_BELOW_STATUTORY:-:${dollars('24.00')}`,
  },
};

/**
 * (a)(2) — $10.00 cash and $4.50 in fringe benefits. DOL publishes the IDENTICAL
 * $662.00 total with the same $24.00 premium: the premium is unchanged even though
 * cash wages fell by $2.00/hour, because the 5.32(a) floor is doing the work.
 *
 * §7.4's second note is part of the fixture: §10 must NOT fire here. Total
 * straight-time compensation is $10.00 + $4.50 = $14.50/hr against a required
 * $12.00 + $2.50 = $14.50/hr — compliant by the combination method of 5.31(b)(3),
 * and the corrected `paidTotal` of `compliance.ts` is what keeps it that way.
 */
const F_FOH_15K11A_2: CanaryCase = {
  caseId: 'F-FOH-15k11a/case-2',
  oracleClass: 1,
  source: 'FOH 15k11(a)(2)',
  asserts:
    'col6B $198.00; straight-time cash $440.00; cwhssaPremium $24.00 (the floor binds); DBA total due ' +
    '$662.00; and no WD_UNDERPAYMENT.',
  wdSnapshotId: 'VA20260195:2',
  stateCode: 'VA',
  constructionType: 'building',
  input: buildCase({
    band: 'over_100k',
    workers: [
      { lines: [{ ...ELECTRICIAN, cashRate: '10.00', st: '44', plans: [{ name: 'Fringe', credit: '4.50' }] }] },
    ],
  }),
  expected: {
    'worker[0].line[0].col6B': dollars('198.00'),
    'worker[0].line[0].straightTimeCash': dollars('440.00'),
    'worker[0].line[0].baseRate': rate('12.00'),
    'worker[0].line[0].requiredTotal': dollars('638.00'),
    'worker[0].line[0].paidTotal': dollars('638.00'),
    'worker[0].regularRate': dollars('12.00'),
    'worker[0].cwhssaPremium': dollars('24.00'),
    'worker[0].dbaCompensationDue': dollars('662.00'),
    'worker[0].col7A': dollars('464.00'),
    'filing.findings': `PREMIUM_BELOW_STATUTORY:-:${dollars('24.00')}`,
  },
};

// ===========================================================================
// F-FOH-15k11b — painter and electrician in one week (class 1) — THE E4 CASE
// ===========================================================================

const PAINTER = { className: 'PAINTER', wdBase: '10.00', wdFringe: '3.00' } as const;

/**
 * Method 1, the weighted average. DOL publishes: "24 hours at the painter's rate of
 * $10.00 = $240.00; 20 hours at the electrician's rate of $12.00 = $240.00; Total
 * straight time wages = $480.00. … ($480.00 / 44 hours worked) = $10.91 'regular
 * rate'. … ½($10.91) x 4 overtime hours worked = $21.82."
 *
 * $10.91 is BELOW the electrician's $12.00. An implementation that floors the
 * weighted average produces $24.00 — a 10% overstatement and an entirely
 * plausible-looking number. THIS IS THE SINGLE CASE MOST WORTH STEALING FROM
 * `ENGINE.md`, and it is why the floor lives inside `baseRate` and nowhere else.
 */
const F_FOH_15K11B_M1: CanaryCase = {
  caseId: 'F-FOH-15k11b-M1',
  oracleClass: 1,
  source: 'FOH 15k11(b)(1)',
  asserts: 'stEarnings $480.00; regularRate $10.91; cwhssaPremium $21.82 — the E4 case.',
  wdSnapshotId: 'VA20260195:2',
  stateCode: 'VA',
  constructionType: 'building',
  input: buildCase({
    band: 'over_100k',
    workers: [
      {
        lines: [
          { ...PAINTER, cashRate: '10.00', days: daysFrom([{}, { st: '8' }, { st: '8' }, { st: '8' }]) },
          {
            ...ELECTRICIAN,
            cashRate: '12.00',
            days: daysFrom([{}, {}, {}, {}, { st: '8' }, { st: '8' }, { st: '4' }]),
          },
        ],
      },
    ],
  }),
  expected: {
    'worker[0].line[0].totalHours': hours('24'),
    'worker[0].line[1].totalHours': hours('20'),
    'worker[0].line[0].baseRate': rate('10.00'),
    'worker[0].line[1].baseRate': rate('12.00'),
    'worker[0].hoursWorked': hours('44'),
    'worker[0].statutoryOtHours': hours('4'),
    'worker[0].straightTimeEarnings': microDollars('480.00'),
    'worker[0].regularRate': dollars('10.91'),
    'worker[0].premiumOwed': dollars('21.82'),
    'worker[0].cwhssaPremium': dollars('21.82'),
  },
};

/**
 * Method 2 — "rate in effect". DOL: "In this example the four overtime hours
 * occurred on a Saturday. The overtime premium could be computed as follows:
 * ½($12.00) x 4 = $24."
 *
 * CLASS 2, not class 1, and the docblock at the top of this file explains why:
 * §7.5 conditions Method 2 on `section7g2Agreement: true`, a project field that
 * `PayrollWeek` does not carry, so condition (i) fails and §7.5's own fallback rule
 * governs — "the engine computes Method 1 and says so on the exception report."
 *
 * Condition (iii) is ours, not DOL's, and deliberately conservative: §7(g)(2) is an
 * alternative computation, not a discount, and it is the contractor who bears the
 * risk if the agreement turns out not to exist. Falling back to the method that
 * pays more when the two disagree is the only choice that cannot manufacture an
 * underpayment out of a paperwork assumption. Here $24.00 ≥ $21.82, so (iii) would
 * hold and only the missing assertion stands in the way.
 */
const F_FOH_15K11B_M2: CanaryCase = {
  caseId: 'F-FOH-15k11b-M2',
  oracleClass: 2,
  source: 'FOH 15k11(b)(2); ENGINE.md §7.5 fallback rule',
  asserts:
    'With no representable §7(g)(2) assertion, the engine computes Method 1: cwhssaPremium $21.82. ' +
    "DOL's Method-2 figure is $24.00 and becomes this case's expectation once the project field exists.",
  wdSnapshotId: 'VA20260195:2',
  stateCode: 'VA',
  constructionType: 'building',
  input: buildCase({
    band: 'over_100k',
    workers: [
      {
        lines: [
          { ...PAINTER, cashRate: '10.00', days: daysFrom([{}, { st: '8' }, { st: '8' }, { st: '8' }]) },
          {
            ...ELECTRICIAN,
            cashRate: '12.00',
            days: daysFrom([{}, {}, {}, {}, { st: '8' }, { st: '8' }, { st: '4' }]),
          },
        ],
      },
    ],
  }),
  expected: {
    'worker[0].regularRate': dollars('10.91'),
    'worker[0].cwhssaPremium': dollars('21.82'),
  },
};

// ===========================================================================
// F-PWRB-44h — the Prevailing Wage Resource Book 44-hour example (class 1)
// ===========================================================================

/**
 * 44 h at $27.00 + $18.00: straight-time wage `44 × $45.00 = $1,980.00`;
 * `cwhssaPremium` `4 × .5 × $27.00 = $54.00`; total DBA compensation due $2,034.00.
 *
 * "WHICH IS NOT WH-347 COLUMN 7A and must be asserted against `dbaCompensationDue`,
 * never against `col7A`." Column 7A on this week is $1,242.00, because 7A is gross
 * earned in cash on this project and the $18.00 is a contribution, not a wage.
 */
const F_PWRB_44H: CanaryCase = {
  caseId: 'F-PWRB-44h',
  oracleClass: 1,
  source: 'DOL Prevailing Wage Resource Book, Davis-Bacon compliance principles',
  asserts: 'requiredTotal $1,980.00; premiumOwed $54.00; dbaCompensationDue $2,034.00 — not col7A.',
  wdSnapshotId: 'VA20260195:2',
  stateCode: 'VA',
  constructionType: 'highway',
  input: buildCase({
    band: 'over_100k',
    workers: [
      {
        lines: [
          {
            className: 'IRONWORKER, STRUCTURAL',
            wdBase: '27.00',
            wdFringe: '18.00',
            cashRate: '27.00',
            st: '44',
            plans: [{ name: 'Fringe', credit: '18.00' }],
          },
        ],
      },
    ],
  }),
  expected: {
    'worker[0].line[0].requiredTotal': dollars('1980.00'),
    'worker[0].line[0].paidTotal': dollars('1980.00'),
    'worker[0].premiumOwed': dollars('54.00'),
    'worker[0].cwhssaPremium': dollars('54.00'),
    'worker[0].dbaCompensationDue': dollars('2034.00'),
    'worker[0].col7A': dollars('1242.00'),
    'filing.findings': `PREMIUM_BELOW_STATUTORY:-:${dollars('54.00')}`,
  },
};

// ===========================================================================
// F-M3-CIL — §7.6's M3, cash in lieu above the basic hourly rate (class 2)
// ===========================================================================

/**
 * 48 hours, $30.00/hr all cash, $6.27 asserted in lieu, WD $21.93 + $6.27.
 *
 * PINS R-CRIT2. `col6C` is $300.96 and `col7A` is $1,534.92 — the in-lieu dollars
 * counted ONCE. The withdrawn §8 formula added `col6C` to gross and printed
 * $1,835.88 against a cheque for $1,534.92: a $300.96 overstatement on ONE
 * worker-week, on the gross-earned column of a document signed under 18 U.S.C. 1001,
 * growing linearly with crew size.
 *
 * The excess over the WD's $28.20 total is straight-time WAGE, not extra fringe, so
 * it RAISES the overtime base (5.32(c)(2)): `baseRate` is $23.73 and the premium
 * $94.92. Had the contractor asserted the whole $8.07 excess as cash in lieu,
 * `baseRate` would fall to $21.93 and the premium to $87.72 — the assertion moves
 * the number by $7.20 on one worker-week, which is exactly why "that a cash payment
 * is genuinely in lieu of a fringe" is on the DO-NOT-ASSERT list.
 */
const F_M3_CIL: CanaryCase = {
  caseId: 'F-M3-CIL',
  oracleClass: 2,
  source: 'ENGINE.md §7.6 M3, authored',
  asserts: 'col6C $300.96; col7A $1,534.92; baseRate $23.73; cwhssaPremium $94.92.',
  wdSnapshotId: 'VA20260195:2',
  stateCode: 'VA',
  constructionType: 'heavy',
  input: buildCase({
    band: 'over_100k',
    workers: [{ lines: [{ ...LABORER, cashRate: '30.00', cashInLieu: '6.27', st: '48' }] }],
  }),
  expected: {
    'worker[0].line[0].col6A.st': rate('23.73'),
    'worker[0].line[0].col6B': dollars('0.00'),
    'worker[0].line[0].col6C': dollars('300.96'),
    'worker[0].line[0].straightTimeCash': dollars('1440.00'),
    'worker[0].line[0].baseRate': rate('23.73'),
    'worker[0].hoursWorked': hours('48'),
    'worker[0].statutoryOtHours': hours('8'),
    'worker[0].regularRate': dollars('23.73'),
    'worker[0].cwhssaPremium': dollars('94.92'),
    'worker[0].col7A': dollars('1534.92'),
  },
};

// ===========================================================================
// F-DT-UNPROVEN / F-DT-PROVEN — §7.3.1's M4a and M4b (class 2)
// ===========================================================================

const DT_CLASS = { className: 'LABORER:  ASPHALT', wdBase: '20.00', wdFringe: '0.00' } as const;

/**
 * M4a — THE FAILURE THE OLD RULE HID. 36 ST + 8 DT, export codes the DT bucket at
 * $1.00/hr.
 *
 * Under the withdrawn rule: `coveredHours = 36`, `otHours = 0`,
 * `cwhssaPremium = $0.00`, and the filing rendered CERTIFIABLE. Four hours of
 * statutory overtime, worth $40.00 of premium on one worker in one week, vanished
 * with no flag. On a 30-worker crew over a year the class of error is five figures,
 * and every filing that carried it looked perfect.
 *
 * Corrected: `hoursWorked = 44.00`, `statutoryOtHours = 4.00`, and because
 * $1.00 < 1.5 × $20.00 the premium is UNPROVEN — the line blocks with P-A and the
 * artifact is DRAFT — NOT CERTIFIABLE with the signature block withheld.
 */
const F_DT_UNPROVEN: CanaryCase = {
  caseId: 'F-DT-UNPROVEN',
  oracleClass: 2,
  source: 'ENGINE.md §7.3.1 M4a, authored',
  asserts:
    'hoursWorked 44.00; statutoryOtHours 4.00; line blocked PREMIUM_HOURS_UNPROVEN; artifact DRAFT — ' +
    'NOT CERTIFIABLE with no signature block.',
  wdSnapshotId: 'VA20260195:2',
  stateCode: 'VA',
  constructionType: 'highway',
  input: buildCase({
    band: 'over_100k',
    workers: [{ lines: [{ ...DT_CLASS, cashRate: '20.00', dtRate: '1.00', st: '36', dt: '8' }] }],
  }),
  expected: {
    'worker[0].hoursWorked': hours('44'),
    'worker[0].statutoryOtHours': hours('4'),
    'worker[0].regularRate': dollars('20.00'),
    'worker[0].premiumOwed': dollars('40.00'),
    'worker[0].premiumCredit': dollars('0.00'),
    'worker[0].cwhssaPremium': dollars('40.00'),
    'worker[0].line[0].blockReasons': 'PREMIUM_HOURS_UNPROVEN',
    'worker[0].line[0].resolutionState': 'blocked',
    'filing.status': 'DRAFT_NOT_CERTIFIABLE',
    'filing.signatureBlockRendered': false,
  },
};

/**
 * M4b — genuine double time, credited rather than double-charged. 36 ST + 8 DT at
 * $40.00/hr.
 *
 * $40.00 ≥ 1.5 × $20.00 = $30.00, so all eight hours are proven. The raw credit is
 * `8 × ($40.00 − $20.00) = $160.00`, capped at the $40.00 owed, and the premium is
 * zero FOR A REASON THE ENGINE CAN STATE rather than because a column label removed
 * the hours from the count. Same output as the old rule on this week, arrived at by
 * arithmetic instead of by omission — and the exception report can show the working.
 */
const F_DT_PROVEN: CanaryCase = {
  caseId: 'F-DT-PROVEN',
  oracleClass: 2,
  source: 'ENGINE.md §7.3.1 M4b, authored',
  asserts: 'premiumOwed $40.00; premiumCredit $40.00 (capped from $160.00); cwhssaPremium $0.00; no block.',
  wdSnapshotId: 'VA20260195:2',
  stateCode: 'VA',
  constructionType: 'highway',
  input: buildCase({
    band: 'over_100k',
    workers: [{ lines: [{ ...DT_CLASS, cashRate: '20.00', dtRate: '40.00', st: '36', dt: '8' }] }],
  }),
  expected: {
    'worker[0].hoursWorked': hours('44'),
    'worker[0].statutoryOtHours': hours('4'),
    'worker[0].regularRate': dollars('20.00'),
    'worker[0].premiumOwed': dollars('40.00'),
    'worker[0].premiumCredit': dollars('40.00'),
    'worker[0].cwhssaPremium': dollars('0.00'),
    'worker[0].line[0].blockReasons': '',
    'worker[0].line[0].resolutionState': 'resolved',
    'worker[0].col7A': dollars('1040.00'),
    'filing.status': 'CERTIFIABLE',
    'filing.signatureBlockRendered': true,
  },
};

// ===========================================================================
// F-BAND-SUB100K / F-BAND-UNKNOWN — §7.0's gate (class 2)
// ===========================================================================

/**
 * The same 44-hour week at $20.00 cash under each of the two non-`over_100k` bands.
 *
 * The WD basic hourly rate is set ABOVE the cash rate deliberately, so
 * `WD_UNDERPAYMENT` actually fires: the assertion "WD_UNDERPAYMENT evaluated
 * unchanged" is only observable on a week where it has something to say. The
 * Davis-Bacon obligation attaches at $2,000 and does not move with the CWHSSA gate
 * — losing the premium below $100,000 must not lose the one comparison no incumbent
 * form-filler performs (P-22).
 */
const SUB100K_WORKERS = [
  {
    lines: [
      { className: 'CARPENTER, INCLUDES FORM WORK', wdBase: '22.00', wdFringe: '0.00', cashRate: '20.00', st: '44' },
    ],
  },
] as const;

const F_BAND_SUB100K: CanaryCase = {
  caseId: 'F-BAND-SUB100K',
  oracleClass: 2,
  source: 'ENGINE.md §7.0, authored',
  asserts:
    'at_or_under_100k: cwhssaPremium $0.00, regularRate absent, no PREMIUM_BELOW_STATUTORY, and ' +
    'WD_UNDERPAYMENT evaluated unchanged.',
  wdSnapshotId: 'VA20260195:2',
  stateCode: 'CA',
  constructionType: 'residential',
  input: buildCase({ band: 'at_or_under_100k', workers: [...SUB100K_WORKERS] }),
  expected: {
    'filing.contractValueBand': 'at_or_under_100k',
    'worker[0].hoursWorked': hours('44'),
    'worker[0].statutoryOtHours': hours('4'),
    'worker[0].regularRate': null,
    'worker[0].line[0].baseRate': null,
    'worker[0].premiumOwed': dollars('0.00'),
    'worker[0].cwhssaPremium': dollars('0.00'),
    'worker[0].line[0].requiredTotal': dollars('968.00'),
    'worker[0].line[0].paidTotal': dollars('880.00'),
    'filing.findings': `WD_UNDERPAYMENT:w0l0:${dollars('88.00')}`,
    'filing.status': 'CERTIFIABLE',
    'filing.signatureBlockRendered': true,
  },
};

/**
 * The same week with `unknown`. P-B: `CWHSSA_COVERAGE_UNDETERMINED` once for the
 * filing, DRAFT — NOT CERTIFIABLE, SIGNATURE BLOCK ABSENT. The artifact still
 * renders in full — a filing is never withheld — and the underpayment comparison
 * still runs, because the Davis-Bacon obligation is not the question the band
 * answers.
 */
const F_BAND_UNKNOWN: CanaryCase = {
  caseId: 'F-BAND-UNKNOWN',
  oracleClass: 2,
  source: 'ENGINE.md §7.0, authored',
  asserts:
    'unknown: CWHSSA_COVERAGE_UNDETERMINED, DRAFT — NOT CERTIFIABLE, signature block absent, ' +
    'WD_UNDERPAYMENT unchanged.',
  wdSnapshotId: 'VA20260195:2',
  stateCode: 'CA',
  constructionType: 'residential',
  input: buildCase({ band: 'unknown', workers: [...SUB100K_WORKERS] }),
  expected: {
    'filing.contractValueBand': 'unknown',
    'filing.filingBlockReasons': 'CWHSSA_COVERAGE_UNDETERMINED',
    'filing.status': 'DRAFT_NOT_CERTIFIABLE',
    'filing.signatureBlockRendered': false,
    'worker[0].regularRate': null,
    'worker[0].cwhssaPremium': dollars('0.00'),
    'worker[0].line[0].requiredTotal': dollars('968.00'),
    'worker[0].line[0].paidTotal': dollars('880.00'),
    'filing.findings': `WD_UNDERPAYMENT:w0l0:${dollars('88.00')}`,
  },
};

// ===========================================================================

/** The eleven fixtures of §12.3, in the order that document lists them. */
export const REGULATORY_FIXTURES: readonly CanaryCase[] = [
  F531_METHOD1,
  F531_METHOD2,
  F531_METHOD3,
  F532_W,
  F532_X,
  F532_Y,
  F_FOH_15K11A_1,
  F_FOH_15K11A_2,
  F_FOH_15K11B_M1,
  F_FOH_15K11B_M2,
  F_PWRB_44H,
  F_M3_CIL,
  F_DT_UNPROVEN,
  F_DT_PROVEN,
  F_BAND_SUB100K,
  F_BAND_UNKNOWN,
] as const;

/** Class-1 cases have no regenerate flag and never will. Exposed so the suite can
 *  assert the property rather than rely on nobody adding one. */
export const CLASS_1_CASE_IDS: readonly string[] = REGULATORY_FIXTURES.filter(
  (c) => c.oracleClass === 1,
).map((c) => c.caseId);
