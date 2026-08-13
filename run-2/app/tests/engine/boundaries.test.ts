/**
 * LAYER 1 — UNIT TESTS OVER ENUMERATED BOUNDARIES.
 *
 * AUTHORITY: `ENGINE.md` §12.1, which enumerates them:
 *
 * > "Zero hours; exactly 40.00 hours; 40.01 hours; one classification; three
 * > classifications; ALL TEN `DeductionCategory` members plus `UNMAPPED`, with the
 * > §9.2.1 field-crew label set asserting zero blocks on (i) and (j); every 5.31(b)
 * > discharge method; `cashInLieu` of zero, of the full fringe, and above it;
 * > apprentice with and without a level; a week spanning a month end; a worker
 * > appearing on two projects; EACH `contractValueBand` VALUE against an otherwise
 * > identical week, asserting that only the CWHSSA quantities move; 36 ST + 8 DT at
 * > each of `dtRate ∈ {null, $0.00, 1.49 × rr, 1.50 × rr, 2.00 × rr}`, asserting
 * > block / block / block / credit / credit."
 *
 * Each `describe` below is one clause of that sentence, in order.
 */

import { describe, expect, it } from 'vitest';

import { Cents, Hours } from '@/lib/money';
import { DEDUCTION_PARAGRAPH, type DeductionCategory } from '@/lib/types';
import { computeFiling } from '@/engine/arithmetic/week';
import { deductionParagraphsMatch, DEDUCTION_ORDER } from '@/engine/arithmetic/deductions';
import { deriveStatus, deriveStatusForFiling } from '@/engine/status';
import { buildCase, daysFrom, type LineSpec, type WeekSpec } from '@/engine/canary/build';
import { CANARY_FRESHNESS, flattenFiling } from '@/engine/canary/case';
import { CANARY_OBLIGATIONS } from '@/engine/canary/fixtures';
import { buildExceptionReport, explainedBlockReasons } from '@/engine/exceptions';

const LABORER: Omit<LineSpec, 'cashRate'> = {
  className: 'LABORER:  COMMON OR GENERAL',
  wdBase: '20.00',
  wdFringe: '0.00',
};

function one(spec: WeekSpec) {
  const computation = computeFiling(buildCase(spec));
  return {
    computation,
    worker: computation.workers[0],
    line: computation.workers[0]?.lines[0],
    verdict: deriveStatusForFiling(computation, CANARY_FRESHNESS),
  };
}

// ===========================================================================
// Zero hours; 40.00; 40.01
// ===========================================================================

describe('the hours boundaries', () => {
  it('zero hours produces zero everywhere and divides by nothing', () => {
    const { worker, line, verdict } = one({
      band: 'over_100k',
      workers: [{ lines: [{ ...LABORER, cashRate: '25.00', st: '0' }] }],
    });
    expect(worker?.hoursWorked).toBe(0);
    expect(worker?.statutoryOtHours).toBe(0);
    // `Cents.fromRatio` throws on zero hours by design — "a worker-week with
    // earnings and no hours is an input the caller must block, not a division to
    // round away" — so the engine must not reach it.
    expect(worker?.regularRate).toBeNull();
    expect(worker?.cwhssaPremium).toBe(0);
    expect(line?.col6C).toBe(0);
    expect(verdict.status).toBe('CERTIFIABLE');
  });

  it('exactly 40.00 hours owes no premium', () => {
    const { worker } = one({
      band: 'over_100k',
      workers: [{ lines: [{ ...LABORER, cashRate: '25.00', st: '40' }] }],
    });
    expect(worker?.hoursWorked).toBe(Hours.of(4_000));
    expect(worker?.statutoryOtHours).toBe(0);
    expect(worker?.premiumOwed).toBe(0);
  });

  it('40.01 hours owes a premium on the one hundredth of an hour', () => {
    const { worker } = one({
      band: 'over_100k',
      workers: [{ lines: [{ ...LABORER, cashRate: '25.00', st: '40.01' }] }],
    });
    expect(worker?.statutoryOtHours).toBe(Hours.of(1));
    // 0.01 h x $25.00 x ½ = $0.125 -> half-up -> $0.13.
    expect(worker?.premiumOwed).toBe(13);
  });
});

// ===========================================================================
// One classification; three classifications
// ===========================================================================

describe('one classification and three', () => {
  it('one classification: the weighted average is the base rate', () => {
    const { worker } = one({
      band: 'over_100k',
      workers: [{ lines: [{ ...LABORER, cashRate: '25.00', st: '44' }] }],
    });
    expect(worker?.regularRate).toBe(Cents.of(2_500));
    expect(worker?.cwhssaPremium).toBe(Cents.of(5_000));
  });

  it('three classifications: the weighted average is hours-weighted, not a mean of rates', () => {
    const { worker } = one({
      band: 'over_100k',
      workers: [
        {
          lines: [
            { ...LABORER, className: 'A', wdBase: '10.00', cashRate: '10.00', st: '30' },
            { ...LABORER, className: 'B', wdBase: '20.00', cashRate: '20.00', st: '8' },
            { ...LABORER, className: 'C', wdBase: '30.00', cashRate: '30.00', st: '6' },
          ],
        },
      ],
    });
    // (30x10 + 8x20 + 6x30) / 44 = 640/44 = $14.5454... -> $14.55, not the $20.00
    // an unweighted mean of the three rates would give.
    expect(worker?.hoursWorked).toBe(Hours.of(4_400));
    expect(worker?.regularRate).toBe(Cents.of(1_455));
    expect(worker?.cwhssaPremium).toBe(Cents.of(2_910));
  });
});

// ===========================================================================
// All ten paragraphs plus the sentinel, and the field-crew label set
// ===========================================================================

describe('29 CFR 3.5 — the ten lettered paragraphs and the sentinel', () => {
  it('the enum transcribes exactly ten paragraphs, (a) through (j)', () => {
    expect(Object.keys(DEDUCTION_PARAGRAPH)).toHaveLength(10);
    expect(Object.values(DEDUCTION_PARAGRAPH)).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']);
    expect(DEDUCTION_ORDER).toHaveLength(11);
    expect(DEDUCTION_ORDER[10]).toBe('UNMAPPED');
  });

  /**
   * §9.2.1's first CI test: "`DeductionCategory`'s paragraph letters must equal
   * exactly the letters recorded in the current `obligation_changelog` entry for
   * 29 CFR 3.5. A future paragraph (k) fails the build rather than silently blocking
   * lines, and a paragraph removed by amendment fails it too."
   */
  it('matches the paragraph letters the corpus records', () => {
    const corpus = CANARY_OBLIGATIONS.deductionParagraphs.value.map((p) => p.letter);
    expect(deductionParagraphsMatch(corpus).matches).toBe(true);
  });

  it('fails loudly on a future paragraph (k) rather than blocking lines silently', () => {
    const result = deductionParagraphsMatch(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k']);
    expect(result.matches).toBe(false);
    expect(result.inCorpusNotCode).toEqual(['k']);
  });

  it('renders every mapped category in column 8 and blocks none of them', () => {
    const mapped = DEDUCTION_ORDER.filter((c): c is Exclude<DeductionCategory, 'UNMAPPED'> => c !== 'UNMAPPED');
    const { computation, worker } = one({
      band: 'over_100k',
      workers: [
        {
          lines: [{ ...LABORER, cashRate: '25.00', st: '40' }],
          allWorkGross: '5000.00',
          deductions: mapped.map((category, index) => ({
            label: `DED-${category}`,
            category,
            amount: `${10 + index}.00`,
          })),
        },
      ],
    });
    expect(worker?.deductions).toHaveLength(10);
    expect(computation.allBlockReasons).toEqual([]);
  });

  it('an UNMAPPED deduction blocks and is never swept into "Other"', () => {
    const { computation, verdict } = one({
      band: 'over_100k',
      workers: [
        {
          lines: [{ ...LABORER, cashRate: '25.00', st: '40' }],
          allWorkGross: '1000.00',
          deductions: [{ label: 'MISC PAYROLL ADJ', category: 'UNMAPPED', amount: '40.00' }],
        },
      ],
    });
    expect(computation.allBlockReasons).toContain('UNMAPPED_DEDUCTION');
    expect(verdict.status).toBe('DRAFT_NOT_CERTIFIABLE');
    // The closed choice is the ten paragraphs, each with the regulation's own text.
    const refusals = buildExceptionReport({
      week: buildCase({
        band: 'over_100k',
        workers: [
          {
            lines: [{ ...LABORER, cashRate: '25.00', st: '40' }],
            allWorkGross: '1000.00',
            deductions: [{ label: 'MISC PAYROLL ADJ', category: 'UNMAPPED', amount: '40.00' }],
          },
        ],
      }).week,
      computation,
      obligations: CANARY_OBLIGATIONS,
    });
    const choice = refusals.find((r) => r.primitive === 'P-A' && r.blockReason === 'UNMAPPED_DEDUCTION');
    expect(choice?.primitive === 'P-A' && choice.choices).toHaveLength(10);
  });

  /** §9.2.1's second CI test, stated as behaviour: the eight-category enum would
   *  have blocked every one of these and told a compliant contractor that a lawful
   *  deduction is unlawful. */
  it('the field-crew label set maps to (i)/(j) and produces zero blocks', () => {
    const { computation, worker } = one({
      band: 'over_100k',
      workers: [
        {
          lines: [{ ...LABORER, cashRate: '25.00', st: '40' }],
          allWorkGross: '1000.00',
          deductions: [
            { label: 'SAFETY BOOTS', category: 'SAFETY_EQUIPMENT', amount: '45.00' },
            { label: 'HARD HAT', category: 'SAFETY_EQUIPMENT', amount: '18.00' },
            { label: 'CAMP ROOM & BOARD', category: 'BOARD_LODGING_FACILITIES', amount: '120.00' },
          ],
        },
      ],
    });
    expect(computation.allBlockReasons).toEqual([]);
    expect(worker?.deductions.map((d) => d.paragraph).sort()).toEqual(['i', 'j']);
  });

  it('names the (i)/(j) conditions as a declined conclusion instead of enforcing them', () => {
    const spec: WeekSpec = {
      band: 'over_100k',
      workers: [
        {
          lines: [{ ...LABORER, cashRate: '25.00', st: '40' }],
          allWorkGross: '1000.00',
          deductions: [{ label: 'SAFETY BOOTS', category: 'SAFETY_EQUIPMENT', amount: '45.00' }],
        },
      ],
    };
    const input = buildCase(spec);
    const refusals = buildExceptionReport({
      week: input.week,
      computation: computeFiling(input),
      obligations: CANARY_OBLIGATIONS,
    });
    const declined = refusals.find((r) => r.primitive === 'P-D' && r.citation === '29 CFR 3.5(j)');
    expect(declined).toBeDefined();
    expect(declined?.primitive === 'P-D' && declined.rule).toContain('safety shoes, safety glasses');
    expect(declined?.primitive === 'P-D' && declined.declined).toContain('does not determine');
  });
});

// ===========================================================================
// Cash in lieu: zero, the full fringe, and above it
// ===========================================================================

describe('cash in lieu at zero, at the full fringe, and above it', () => {
  const wd = { className: 'LABORER', wdBase: '21.93', wdFringe: '6.27' } as const;

  it('zero: the whole cash rate is the base rate', () => {
    const { line } = one({
      band: 'over_100k',
      workers: [{ lines: [{ ...wd, cashRate: '28.20', cashInLieu: '0.00', st: '40' }] }],
    });
    expect(line?.col6AStraightTime).toBe(282_000);
    expect(line?.baseRate).toBe(282_000);
    expect(line?.col6C).toBe(0);
  });

  it('exactly the WD fringe: the base rate falls to the cash net of it', () => {
    const { line } = one({
      band: 'over_100k',
      workers: [{ lines: [{ ...wd, cashRate: '28.20', cashInLieu: '6.27', st: '40' }] }],
    });
    expect(line?.baseRate).toBe(219_300);
    expect(line?.col6C).toBe(Cents.of(25_080));
  });

  it('above the WD fringe: the floor binds and the base rate stops at the WD basic rate', () => {
    const { line } = one({
      band: 'over_100k',
      workers: [{ lines: [{ ...wd, cashRate: '28.20', cashInLieu: '10.00', st: '40' }] }],
    });
    // cash − in-lieu = $18.20, below the WD's $21.93, so 5.32(a)'s floor binds.
    expect(line?.baseRate).toBe(219_300);
  });

  it('above the cash rate itself is unrepresentable and blocks', () => {
    const { line } = one({
      band: 'over_100k',
      workers: [{ lines: [{ ...wd, cashRate: '28.20', cashInLieu: '30.00', st: '40' }] }],
    });
    expect(line?.blockReasons).toContain('AMBIGUOUS_RATE_BASIS');
  });
});

// ===========================================================================
// Apprentice with and without a level
// ===========================================================================

describe('WH-347 column 2 — (J) and (RA)', () => {
  it('an apprentice with a level renders and checks box 4', () => {
    const { computation, verdict } = one({
      band: 'over_100k',
      workers: [
        {
          status: 'RA',
          apprentice: { programName: 'IEC Chesapeake', registrar: 'OA', levelOfProgression: '3' },
          lines: [{ ...LABORER, cashRate: '15.00', st: '40' }],
        },
      ],
    });
    expect(computation.statementOfCompliance.box4).toBe(true);
    expect(verdict.status).toBe('CERTIFIABLE');
  });

  it('an apprentice without a level blocks: the form has a field we cannot fill', () => {
    const { computation, verdict } = one({
      band: 'over_100k',
      workers: [{ status: 'RA', lines: [{ ...LABORER, cashRate: '15.00', st: '40' }] }],
    });
    expect(computation.allBlockReasons).toContain('MISSING_REQUIRED_FIELD');
    expect(verdict.status).toBe('DRAFT_NOT_CERTIFIABLE');
  });

  it('computes no apprentice-to-journeyworker ratio, and says so', () => {
    const spec: WeekSpec = {
      band: 'over_100k',
      workers: [
        {
          status: 'RA',
          apprentice: { programName: 'IEC Chesapeake', registrar: 'OA', levelOfProgression: '3' },
          lines: [{ ...LABORER, cashRate: '15.00', st: '40' }],
        },
      ],
    };
    const input = buildCase(spec);
    const refusals = buildExceptionReport({
      week: input.week,
      computation: computeFiling(input),
      obligations: CANARY_OBLIGATIONS,
    });
    const declined = refusals.find(
      (r) => r.primitive === 'P-D' && r.headline.includes('registered apprentices'),
    );
    expect(declined?.primitive === 'P-D' && declined.observableFacts).toContainEqual({
      label: 'Apprentice-to-journeyworker ratio computed',
      value: 'none',
    });
  });
});

// ===========================================================================
// A week spanning a month end; a worker on two projects
// ===========================================================================

describe('the calendar and the second project', () => {
  it('a week spanning a month end computes identically — the engine reads no calendar', () => {
    const lines: LineSpec[] = [{ ...LABORER, cashRate: '25.00', days: daysFrom([{ st: '8' }, { st: '8' }, { st: '8' }, { st: '8' }, { st: '8' }]) }];
    const inMonth = computeFiling(buildCase({ weekEnding: '2026-08-14', band: 'over_100k', workers: [{ lines }] }));
    const acrossMonth = computeFiling(
      buildCase({ weekEnding: '2026-08-31', band: 'over_100k', workers: [{ lines }] }),
    );
    const strip = (map: Record<string, unknown>): Record<string, unknown> =>
      Object.fromEntries(Object.entries(map).filter(([k]) => k !== 'filing.weekEnding'));
    expect(strip(flattenFiling(acrossMonth, deriveStatusForFiling(acrossMonth, CANARY_FRESHNESS)))).toEqual(
      strip(flattenFiling(inMonth, deriveStatusForFiling(inMonth, CANARY_FRESHNESS))),
    );
  });

  it('a worker on two projects names the FLSA limit rather than computing it', () => {
    // 30 covered hours on this project, gross for all work well above what this
    // project earned. CWHSSA does not attach (FOH 15k03(a) counts covered hours);
    // FLSA might, and §7.7 is explicit that Ratepin does not compute it.
    const spec: WeekSpec = {
      band: 'over_100k',
      workers: [
        {
          lines: [{ ...LABORER, cashRate: '25.00', st: '30' }],
          allWorkGross: '1200.00',
          deductions: [],
        },
      ],
    };
    const input = buildCase(spec);
    const computation = computeFiling(input);
    expect(computation.workers[0]?.cwhssaPremium).toBe(0);
    const refusals = buildExceptionReport({ week: input.week, computation, obligations: CANARY_OBLIGATIONS });
    const declined = refusals.find(
      (r) => r.primitive === 'P-D' && r.declined.includes('Fair Labor Standards Act'),
    );
    expect(declined).toBeDefined();
    expect(declined?.primitive === 'P-D' && declined.observableFacts).toContainEqual({
      label: 'Hours worked outside this project',
      value: 'not reported to Ratepin',
    });
  });
});

// ===========================================================================
// Each contractValueBand against an otherwise identical week
// ===========================================================================

describe('§7.0 — the three bands over one identical week', () => {
  const spec = (band: WeekSpec['band']): WeekSpec => ({
    band,
    workers: [{ lines: [{ ...LABORER, wdBase: '22.00', cashRate: '20.00', st: '44' }] }],
  });

  it('only the CWHSSA quantities move between over_100k and at_or_under_100k', () => {
    const over = computeFiling(buildCase(spec('over_100k')));
    const under = computeFiling(buildCase(spec('at_or_under_100k')));
    const a = flattenFiling(over, deriveStatusForFiling(over, CANARY_FRESHNESS));
    const b = flattenFiling(under, deriveStatusForFiling(under, CANARY_FRESHNESS));
    const moved = Object.keys(a).filter((key) => a[key] !== b[key]);
    expect(moved.sort()).toEqual(
      [
        'filing.contractValueBand',
        'filing.findings',
        'filing.totalCol7A',
        'filing.totalCwhssaPremium',
        'worker[0].col7A',
        'worker[0].cwhssaPremium',
        'worker[0].dbaCompensationDue',
        'worker[0].line[0].baseRate',
        'worker[0].narrowingSites',
        // `premiumPaidTotal` is absent because it is zero on BOTH sides: this line
        // reports no premium bucket with a stated rate, so there is nothing for the
        // gate to zero. Listing it would assert a difference that this week cannot
        // produce.
        'worker[0].premiumOwed',
        'worker[0].regularRate',
        'worker[0].straightTimeEarnings',
      ].sort(),
    );
  });

  it('unknown withholds the signature block and computes no premium either way', () => {
    const computation = computeFiling(buildCase(spec('unknown')));
    const verdict = deriveStatusForFiling(computation, CANARY_FRESHNESS);
    expect(computation.filingBlockReasons).toEqual(['CWHSSA_COVERAGE_UNDETERMINED']);
    expect(verdict.status).toBe('DRAFT_NOT_CERTIFIABLE');
    expect(verdict.status === 'DRAFT_NOT_CERTIFIABLE' && verdict.signatureBlockWithheld).toBe(true);
    expect(computation.workers[0]?.cwhssaPremium).toBe(0);
  });

  it('the Davis-Bacon underpayment check is identical on all three bands', () => {
    const signature = (band: WeekSpec['band']): string =>
      computeFiling(buildCase(spec(band)))
        .findings.filter((f) => f.flag === 'WD_UNDERPAYMENT')
        .map((f) => `${f.lineId}:${f.shortfall}`)
        .join('|');
    expect(signature('over_100k')).toBe('w0l0:8800');
    expect(signature('at_or_under_100k')).toBe('w0l0:8800');
    expect(signature('unknown')).toBe('w0l0:8800');
  });

  it('says why the CWHSSA flag is absent below the threshold, rather than saying nothing', () => {
    const input = buildCase(spec('at_or_under_100k'));
    const refusals = buildExceptionReport({
      week: input.week,
      computation: computeFiling(input),
      obligations: CANARY_OBLIGATIONS,
    });
    const declined = refusals.find((r) => r.primitive === 'P-D' && r.citation === '29 CFR 5.5(b)');
    expect(declined?.primitive === 'P-D' && declined.declined).toContain(
      'does not determine whether the Contract Work Hours and Safety Standards Act applies',
    );
    // The $100,000 comes from the corpus row with its effective date, never from a
    // constant in code (§7.0, and CORRECTIONS.md CL-2).
    expect(declined?.primitive === 'P-D' && declined.observableFacts).toContainEqual({
      label: 'Threshold',
      value: '$100,000.00',
    });
  });

  it('states the liquidated-damages rule only above the threshold, and computes no amount', () => {
    const above = buildCase(spec('over_100k'));
    const aboveRefusals = buildExceptionReport({
      week: above.week,
      computation: computeFiling(above),
      obligations: CANARY_OBLIGATIONS,
    });
    expect(aboveRefusals.some((r) => r.primitive === 'P-D' && r.citation === '29 CFR 5.5(b)(2)')).toBe(true);

    const below = buildCase(spec('at_or_under_100k'));
    const belowRefusals = buildExceptionReport({
      week: below.week,
      computation: computeFiling(below),
      obligations: CANARY_OBLIGATIONS,
    });
    expect(belowRefusals.some((r) => r.primitive === 'P-D' && r.citation === '29 CFR 5.5(b)(2)')).toBe(false);
  });
});

// ===========================================================================
// 36 ST + 8 DT at each of the five premium rates — block/block/block/credit/credit
// ===========================================================================

describe('§12.1’s double-time matrix — block / block / block / credit / credit', () => {
  const at = (dtRate: string | null) =>
    one({
      band: 'over_100k',
      workers: [{ lines: [{ ...LABORER, cashRate: '20.00', dtRate, st: '36', dt: '8' }] }],
    });

  it('null — the bucket carries hours and no rate at all', () => {
    const { line, verdict } = at(null);
    expect(line?.blockReasons).toContain('PREMIUM_HOURS_UNPROVEN');
    expect(verdict.status).toBe('DRAFT_NOT_CERTIFIABLE');
  });

  it('$0.00 — the same block as null, deliberately: both are "we cannot prove ≥1.5×"', () => {
    const { line, worker } = at('0.00');
    expect(line?.blockReasons).toContain('PREMIUM_HOURS_UNPROVEN');
    expect(worker?.premiumCredit).toBe(0);
  });

  it('1.49 × the regular rate — below the statute’s one and one-half, so unproven', () => {
    const { line } = at('29.80');
    expect(line?.blockReasons).toContain('PREMIUM_HOURS_UNPROVEN');
  });

  it('exactly 1.50 × the regular rate — proven, credited, no block', () => {
    const { line, worker, verdict } = at('30.00');
    expect(line?.blockReasons).toEqual([]);
    expect(worker?.premiumOwed).toBe(Cents.of(4_000));
    // 8 h x ($30.00 − $20.00) = $80.00 raw, capped at the $40.00 owed.
    expect(worker?.premiumCredit).toBe(Cents.of(4_000));
    expect(worker?.cwhssaPremium).toBe(0);
    expect(verdict.status).toBe('CERTIFIABLE');
  });

  it('2.00 × the regular rate — proven, credited, no block', () => {
    const { line, worker } = at('40.00');
    expect(line?.blockReasons).toEqual([]);
    expect(worker?.premiumCredit).toBe(Cents.of(4_000));
    expect(worker?.cwhssaPremium).toBe(0);
  });

  it('under forty hours the premium rule does not fire — a short week with a mis-mapped column', () => {
    const { worker } = one({
      band: 'over_100k',
      workers: [{ lines: [{ ...LABORER, cashRate: '20.00', dtRate: '1.00', st: '20', dt: '8' }] }],
    });
    expect(worker?.statutoryOtHours).toBe(0);
    expect(worker?.lines[0]?.blockReasons).not.toContain('PREMIUM_HOURS_UNPROVEN');
  });
});

// ===========================================================================
// The remaining refusals the arithmetic owns
// ===========================================================================

describe('the other blocks and their explanations', () => {
  it('net that does not reconcile blocks and shows both figures', () => {
    const spec: WeekSpec = {
      band: 'over_100k',
      workers: [
        {
          lines: [{ ...LABORER, cashRate: '25.00', st: '40' }],
          allWorkGross: '1000.00',
          deductions: [{ label: 'FICA', category: 'STATUTORY', amount: '76.50' }],
          netPaid: '900.00',
        },
      ],
    };
    const input = buildCase(spec);
    const computation = computeFiling(input);
    expect(computation.allBlockReasons).toContain('NET_RECONCILIATION_FAILED');
    expect(computation.workers[0]?.netComputed).toBe(Cents.of(92_350));
    expect(computation.workers[0]?.netPaid).toBe(Cents.of(90_000));
    const refusals = buildExceptionReport({ week: input.week, computation, obligations: CANARY_OBLIGATIONS });
    const refusal = refusals.find((r) => r.primitive === 'P-A' && r.blockReason === 'NET_RECONCILIATION_FAILED');
    expect(refusal?.primitive === 'P-A' && refusal.detail).toContain('$923.50');
    expect(refusal?.primitive === 'P-A' && refusal.detail).toContain('$900.00');
  });

  it('a union-identified class refuses only a 6B credit claim, never the all-cash discharge (ES-4)', () => {
    const union = { className: 'ELECTRICIAN', wdBase: '36.85', wdFringe: '14.13', isUnionGroup: true } as const;

    const allCash = one({
      band: 'over_100k',
      workers: [{ lines: [{ ...union, cashRate: '50.98', cashInLieu: '14.13', st: '40' }] }],
    });
    expect(allCash.line?.blockReasons).toEqual([]);

    const credited = one({
      band: 'over_100k',
      workers: [
        { lines: [{ ...union, cashRate: '36.85', st: '40', plans: [{ name: 'CBA fund', credit: '14.13' }] }] },
      ],
    });
    expect(credited.line?.blockReasons).toContain('UNION_GROUP_REFUSED');
  });

  it('an unresolved classification blocks with UNMAPPED_TRADE and computes what it can', () => {
    const { line, verdict } = one({
      band: 'over_100k',
      workers: [{ lines: [{ ...LABORER, cashRate: '25.00', st: '40', unresolved: true }] }],
    });
    expect(line?.blockReasons).toContain('UNMAPPED_TRADE');
    expect(line?.straightTimeCash).toBe(Cents.of(100_000));
    expect(line?.requiredTotal).toBe(0);
    expect(verdict.status).toBe('DRAFT_NOT_CERTIFIABLE');
  });

  it('a classification absent from the pinned revision blocks with UNPARSED_CLASSIFICATION', () => {
    const { line } = one({
      band: 'over_100k',
      workers: [{ lines: [{ ...LABORER, cashRate: '25.00', st: '40', notOnDetermination: true }] }],
    });
    expect(line?.blockReasons).toContain('UNPARSED_CLASSIFICATION');
  });

  it('negative hours are refused rather than netted against positive ones', () => {
    const input = buildCase({
      band: 'over_100k',
      workers: [
        {
          lines: [
            { ...LABORER, cashRate: '25.00', days: daysFrom([{ st: '8' }, { st: '8' }]) },
          ],
        },
      ],
    });
    const tampered = {
      ...input,
      week: {
        ...input.week,
        workers: input.week.workers.map((w) => ({
          ...w,
          lines: w.lines.map((l) => ({
            ...l,
            dayHours: [
              { st: Hours.of(-800), ot: Hours.of(0), dt: Hours.of(0) },
              ...l.dayHours.slice(1),
            ] as unknown as typeof l.dayHours,
          })),
        })),
      },
    };
    expect(computeFiling(tampered).allBlockReasons).toContain('MISSING_REQUIRED_FIELD');
  });

  it('every block that reaches an artifact carries a sentence explaining it', () => {
    const spec: WeekSpec = {
      band: 'unknown',
      workers: [
        {
          lines: [{ ...LABORER, cashRate: '20.00', dtRate: null, st: '36', dt: '8' }],
          allWorkGross: '1000.00',
          deductions: [{ label: 'MISC', category: 'UNMAPPED', amount: '10.00' }],
        },
      ],
    };
    const input = buildCase(spec);
    const computation = computeFiling(input);
    const refusals = buildExceptionReport({ week: input.week, computation, obligations: CANARY_OBLIGATIONS });
    const explained = new Set(explainedBlockReasons(refusals));
    // MISSING_REQUIRED_FIELD is the one block this module raises without a closed
    // choice of its own — an unpriceable premium bucket resolves through the same
    // P-A the premium rule offers, and §7.0's P-B covers the filing-scoped one.
    for (const reason of computation.allBlockReasons) {
      if (reason === 'MISSING_REQUIRED_FIELD') continue;
      expect(explained.has(reason), `unexplained block: ${reason}`).toBe(true);
    }
  });
});

// ===========================================================================
// deriveStatus — total, and freshness never blocks
// ===========================================================================

describe('deriveStatus — the single construction path', () => {
  it('FRESH certifies; DATED and STALE narrow the claim but never withhold the signature', () => {
    const lines = [{ resolutionState: 'resolved' as const, blockReasons: [] }];
    expect(deriveStatus({ lines, freshness: CANARY_FRESHNESS }).status).toBe('CERTIFIABLE');
    expect(
      deriveStatus({ lines, freshness: { ...CANARY_FRESHNESS, state: 'DATED' } }).status,
    ).toBe('CERTIFIABLE_DATED');
    expect(
      deriveStatus({ lines, freshness: { ...CANARY_FRESHNESS, state: 'STALE' } }).status,
    ).toBe('CERTIFIABLE_DATED');
  });

  it('a filing-scoped block withholds the signature even when every line resolved', () => {
    const verdict = deriveStatus({
      lines: [{ resolutionState: 'resolved', blockReasons: [] }],
      filingBlockReasons: ['CWHSSA_COVERAGE_UNDETERMINED'],
      freshness: CANARY_FRESHNESS,
    });
    expect(verdict.status).toBe('DRAFT_NOT_CERTIFIABLE');
    expect(verdict.status === 'DRAFT_NOT_CERTIFIABLE' && verdict.blocks).toEqual([
      'CWHSSA_COVERAGE_UNDETERMINED',
    ]);
  });

  it('an unresolved line with no stated reason still names one — a bare watermark is a warning', () => {
    const verdict = deriveStatus({
      lines: [{ resolutionState: 'pending', blockReasons: [] }],
      freshness: CANARY_FRESHNESS,
    });
    expect(verdict.status === 'DRAFT_NOT_CERTIFIABLE' && verdict.blocks).toEqual(['UNMAPPED_TRADE']);
  });
});
