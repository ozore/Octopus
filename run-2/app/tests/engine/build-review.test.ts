/**
 * LAYER 1b — THE BUILD-REVIEW REGRESSIONS.
 *
 * Every test below is an executed defect from
 * `phase-2-build/build-review/correctness-arithmetic.md`, written so that it FAILS
 * against the code as it shipped and passes against the correction. Each one names
 * the finding, the primary source the correction was verified against, and the
 * quantity that moved.
 *
 * These are deliberately not folded into `boundaries.test.ts`. That file is the
 * executable form of §12.1's enumerated sentence and its shape belongs to the
 * specification; this file is the record of what got past it, which is a different
 * document with a different reason to exist. §12.1's enumeration was not wrong — the
 * defects lived in the gaps BETWEEN its clauses, and a reader deciding what to
 * enumerate next should be able to read the gaps in one place.
 *
 * All offline and deterministic: no clock, no network, no database.
 */

import { describe, expect, it } from 'vitest';

import { Cents, Hours, MicroDollars, MilliRate } from '@/lib/money';
import type { ArtifactVerdict, ViolationFlag } from '@/lib/types';
import { computeFiling } from '@/engine/arithmetic/week';
import { deriveStatus, deriveStatusForFiling } from '@/engine/status';
import { buildCase, type LineSpec, type WeekSpec } from '@/engine/canary/build';
import { CANARY_FRESHNESS } from '@/engine/canary/case';
import { CANARY_OBLIGATIONS } from '@/engine/canary/fixtures';
import {
  buildExceptionReport,
  explainedBlockReasons,
  explainedViolationFlags,
  type ExceptionInput,
} from '@/engine/exceptions';

/** The one flattener both the paid and the free path use to turn a refusal into a
 *  line of the printed exception report. Reimplemented here rather than imported
 *  from `src/app/(free)/_lib/generate.ts` so this suite stays inside the engine's
 *  own import boundary — the shape is asserted against that module by the web
 *  tests, and what matters here is that a P-D renders headline + citation + rule +
 *  declined and DISCARDS `observableFacts`. A figure that is only in the facts array
 *  never reaches paper. */
function sentences(refusals: readonly ReturnType<typeof buildExceptionReport>[number][]): string[] {
  return refusals.map((refusal) =>
    refusal.primitive === 'P-D'
      ? `${refusal.headline} ${refusal.citation}: "${refusal.rule}" ${refusal.declined}`
      : refusal.primitive === 'P-A' || refusal.primitive === 'P-B'
        ? `${refusal.headline} ${refusal.detail}`
        : refusal.headline,
  );
}

/** Narrow the verdict to its DRAFT arm. `ArtifactVerdict` is a discriminated union
 *  and `blocks` / `signatureBlockWithheld` exist only there — which is the type
 *  system saying the same thing `status.ts` says: those fields describe a withheld
 *  certification, so a CERTIFIABLE verdict cannot carry them. */
function draft(verdict: ArtifactVerdict) {
  if (verdict.status !== 'DRAFT_NOT_CERTIFIABLE') {
    throw new Error(`expected DRAFT_NOT_CERTIFIABLE, got ${verdict.status}`);
  }
  return verdict;
}

function run(spec: WeekSpec) {
  const input = buildCase(spec);
  const computation = computeFiling(input);
  const verdict = deriveStatusForFiling(computation, CANARY_FRESHNESS);
  const exceptionInput: ExceptionInput = {
    week: input.week,
    computation,
    obligations: CANARY_OBLIGATIONS,
  };
  const refusals = buildExceptionReport(exceptionInput);
  return {
    computation,
    worker: computation.workers[0],
    line: computation.workers[0]?.lines[0],
    verdict,
    refusals,
    sentences: sentences(refusals),
    flags: computation.findings.map((f) => f.flag),
  };
}

const WD_30_10: Omit<LineSpec, 'cashRate'> = {
  className: 'LABORER:  COMMON OR GENERAL',
  wdBase: '30.00',
  wdFringe: '10.00',
};

// ===========================================================================
// C-1 — the cash term is a straight-time equivalent
// ===========================================================================

describe('C-1 — `paidTotal`’s cash term prices every hour at its straight-time equivalent', () => {
  /**
   * THE SHIPPED DEFECT, EXECUTED. `paidTotal` was `cashRate × (st + ot + dt)`, so it
   * asserted that eight double-time hours had been paid at $45.00/hr when the row
   * shows $0.00/hr — a mis-mapped per-diem or shift-differential column, which is
   * exactly the export defect §4 A2 exists to catch.
   *
   * Under forty hours, so P-A cannot fire; `dtRate = $0.00` is not `null`, so
   * `MISSING_REQUIRED_FIELD` cannot fire either. Before the correction this rendered
   * CERTIFIABLE with an empty block list and no finding.
   */
  const shortByDtRate: WeekSpec = {
    band: 'over_100k',
    workers: [{ lines: [{ ...WD_30_10, cashRate: '45.00', dtRate: '0.00', st: '20', dt: '8' }] }],
  };

  it('raises WD_UNDERPAYMENT on 20 ST + 8 DT at $45.00 cash with a $0.00 double-time rate', () => {
    const { line, flags } = run(shortByDtRate);
    // 28 h × ($30.00 + $10.00) = $1,120.00 required.
    expect(line?.requiredTotal).toBe(Cents.of(112_000));
    // 20 h × $45.00 + 8 h × min($45.00, $0.00) = $900.00 — the same $900.00 the form
    // prints as column 7A, which is the whole point.
    expect(line?.straightTimeEquivalentCash).toBe(Cents.of(90_000));
    expect(line?.paidTotal).toBe(Cents.of(90_000));
    expect(flags).toContain<ViolationFlag>('WD_UNDERPAYMENT');
    const finding = run(shortByDtRate).computation.findings.find(
      (f) => f.flag === 'WD_UNDERPAYMENT',
    );
    expect(finding?.shortfall).toBe(Cents.of(22_000));
  });

  it('column 7A and the cash term describe the same double-time hours identically', () => {
    const { worker, line } = run(shortByDtRate);
    expect(worker?.col7A).toBe(Cents.of(90_000));
    expect(line?.straightTimeEquivalentCash).toBe(worker?.col7A);
  });

  /**
   * THE MIRROR DEFECT the obvious repair would have introduced. Composing the cash
   * term from §8's own terms (`straightTimeCash + doubleTimeCash`) would credit
   * $70.00/hr of double-time pay against a straight-time obligation, report
   * $1,960.00 against a required $1,920.00, and raise nothing — while the worker's
   * straight-time rate is $35.00 against a required $40.00.
   *
   * 29 CFR 5.31(b), eCFR versioner API, fetched 2026-08-13 (title-29 issue
   * 2026-08-11): all three discharge methods are denominated in a "straight time
   * hourly rate". Premium dollars do not discharge it.
   */
  it('does not let a genuine double-time premium discharge the straight-time obligation', () => {
    const { line, flags } = run({
      band: 'over_100k',
      workers: [{ lines: [{ ...WD_30_10, cashRate: '35.00', dtRate: '70.00', st: '40', dt: '8' }] }],
    });
    expect(line?.requiredTotal).toBe(Cents.of(192_000)); // 48 h × $40.00
    // 40 h × $35.00 + 8 h × min($35.00, $70.00) = $1,680.00. NOT $1,960.00.
    expect(line?.straightTimeEquivalentCash).toBe(Cents.of(168_000));
    expect(flags).toContain<ViolationFlag>('WD_UNDERPAYMENT');
  });

  it('an unpriceable double-time bucket credits nothing and never credits the cash rate', () => {
    const { line } = run({
      band: 'over_100k',
      workers: [{ lines: [{ ...WD_30_10, cashRate: '45.00', dtRate: null, st: '20', dt: '8' }] }],
    });
    // The line is blocked for the missing rate; the cash term must not silently
    // price those hours at $45.00 while the block is being surfaced.
    expect(line?.blockReasons).toContain('MISSING_REQUIRED_FIELD');
    expect(line?.straightTimeEquivalentCash).toBe(Cents.of(90_000));
  });

  /**
   * THE TWO BOUNDS, AS PROPERTIES over an enumerated cross-product rather than one
   * example. Together they pin the cash term from both sides, and each is violated
   * by one of the two wrong formulas:
   *
   *   paidTotal − col6B ≤ straightTimeCash + doubleTimeCash   (the shipped defect)
   *   paidTotal − col6B ≤ Cents(cashRate × allHours)          (the obvious repair)
   */
  it('the cash term never exceeds either bound, over every rate ordering', () => {
    const rates = ['0.00', '10.00', '35.00', '45.00', '90.00'];
    const hourSets: readonly (readonly [string, string, string])[] = [
      ['20', '0', '8'],
      ['36', '8', '0'],
      ['30', '6', '10'],
      ['0', '0', '12'],
    ];
    for (const cashRate of rates) {
      for (const dtRate of [...rates, null]) {
        for (const [st, ot, dt] of hourSets) {
          const { worker } = run({
            band: 'over_100k',
            workers: [{ lines: [{ ...WD_30_10, cashRate, dtRate, st, ot, dt }] }],
          });
          for (const line of worker?.lines ?? []) {
            const grossTerms = Cents.add(line.straightTimeCash, line.doubleTimeCash);
            const atCashRate = Cents.fromMicroDollars(
              MicroDollars.fromRateHours(
                MilliRate.fromDecimalString(cashRate),
                line.totalHours,
              ),
            );
            expect(line.straightTimeEquivalentCash).toBeLessThanOrEqual(grossTerms);
            expect(line.straightTimeEquivalentCash).toBeLessThanOrEqual(atCashRate);
            expect(Cents.sub(line.paidTotal, line.col6B)).toBe(line.straightTimeEquivalentCash);
          }
        }
      }
    }
  });
});

// ===========================================================================
// C-2 — every finding becomes a sentence
// ===========================================================================

describe('C-2 — no violation finding reaches an artifact without a sentence explaining it', () => {
  /** FOH 15k11(b)'s painter/electrician week with the WD fringes intact and only
   *  cash paid — the week the reviewer drove through `renderWh347` and found had
   *  produced one exception sentence, about liquidated damages, and nothing else. */
  const painterElectrician: WeekSpec = {
    band: 'over_100k',
    workers: [
      {
        lines: [
          { className: 'PAINTER', wdBase: '10.00', wdFringe: '3.00', cashRate: '10.00', st: '24' },
          {
            className: 'ELECTRICIAN, INCLUDES TRAFFIC SIGNALIZATION',
            wdBase: '12.00',
            wdFringe: '2.50',
            cashRate: '12.00',
            st: '20',
          },
        ],
      },
    ],
  };

  it('THE CLASS-CLOSING ASSERTION: every flag in `findings` appears in the report', () => {
    for (const spec of [
      painterElectrician,
      {
        band: 'over_100k',
        workers: [{ lines: [{ ...WD_30_10, cashRate: '45.00', dtRate: '0.00', st: '20', dt: '8' }] }],
      } satisfies WeekSpec,
      {
        band: 'over_100k',
        workers: [
          { lines: [{ ...WD_30_10, cashRate: '40.00', otRate: '41.00', st: '36', ot: '8' }] },
        ],
      } satisfies WeekSpec,
    ]) {
      const { computation, refusals } = run(spec);
      const explained = explainedViolationFlags(refusals);
      for (const finding of computation.findings) {
        expect(explained).toContain(finding.flag);
      }
    }
  });

  it('the shortfall, the required total and the paid total all reach the printed sentence', () => {
    const { computation, sentences: lines } = run(painterElectrician);
    const findings = computation.findings.filter((f) => f.flag === 'WD_UNDERPAYMENT');
    expect(findings.length).toBe(2);
    const printed = lines.join('\n');
    for (const finding of findings) {
      // Not `observableFacts` — the flattener discards those. If these three strings
      // are absent the customer receives a clean form with a shortfall on it.
      expect(printed).toContain(Cents.toDollarString(finding.shortfall));
      expect(printed).toContain(Cents.toDollarString(finding.required));
      expect(printed).toContain(Cents.toDollarString(finding.paid));
    }
    expect(printed).toContain('$72.00');
    expect(printed).toContain('$50.00');
  });

  it('states the arithmetic without characterising it as a violation of law', () => {
    const { sentences: lines } = run(painterElectrician);
    const printed = lines.join('\n');
    expect(printed).toMatch(/does not determine whether this is a violation of the Davis-Bacon Act/);
    expect(printed).not.toMatch(/\bviolated\b|\bunlawful\b|\bowes\b|back wages of/i);
  });

  it('the observation never blocks and never withholds the signature', () => {
    const { verdict, computation } = run(painterElectrician);
    expect(computation.findings.length).toBeGreaterThan(0);
    expect(computation.allBlockReasons).toEqual([]);
    expect(verdict.status).toBe('CERTIFIABLE');
  });
});

// ===========================================================================
// H-1 — column 7A may not exceed column 7B
// ===========================================================================

describe('H-1 — a form on which 7A exceeds a non-zero 7B cannot be certified', () => {
  /** 36 ST + 8 OT at $20.00 cash with a $22.00 overtime rate. Actual cash is
   *  36×20 + 8×22 = $896.00; the computed 7A is 44×$20.00 + a $40.00 half-time
   *  premium = $920.00. */
  const spec: WeekSpec = {
    band: 'over_100k',
    workers: [
      {
        allWorkGross: '896.00',
        lines: [
          {
            className: 'LABORER:  COMMON OR GENERAL',
            wdBase: '20.00',
            wdFringe: '0.00',
            cashRate: '20.00',
            otRate: '22.00',
            st: '36',
            ot: '8',
          },
        ],
      },
    ],
  };

  it('blocks, and withholds the signature block', () => {
    const { worker, verdict } = run(spec);
    expect(worker?.col7A).toBe(Cents.of(92_000));
    expect(worker?.col7B).toBe(Cents.of(89_600));
    expect(worker?.blockReasons).toContain('GROSS_EXCEEDS_ALL_WORK_GROSS');
    expect(draft(verdict).signatureBlockWithheld).toBe(true);
  });

  it('puts both figures side by side in a closed choice', () => {
    const { refusals } = run(spec);
    const refusal = refusals.find(
      (r) => r.primitive === 'P-A' && r.blockReason === 'GROSS_EXCEEDS_ALL_WORK_GROSS',
    );
    expect(refusal).toBeDefined();
    if (refusal?.primitive !== 'P-A') throw new Error('expected a P-A');
    expect(refusal.detail).toContain('$920.00');
    expect(refusal.detail).toContain('$896.00');
    expect(refusal.choices.length).toBe(2);
    // A3 — no escalation path anywhere in the compliance flow.
    expect(`${refusal.headline} ${refusal.detail}`).not.toMatch(/contact|support|email us|ticket/i);
  });

  it('does not fire when column 7B is blank, which WHD permits', () => {
    // "If part of a worker's weekly wage was earned on projects or work other than
    // the project described on this payroll … enter in column 7B" — a blank 7B is an
    // all-work-on-this-project week, not a zero to compare against.
    const { worker, verdict } = run({
      ...spec,
      workers: [{ ...spec.workers[0]!, allWorkGross: undefined }],
    });
    expect(worker?.col7B).toBe(Cents.of(0));
    expect(worker?.blockReasons).not.toContain('GROSS_EXCEEDS_ALL_WORK_GROSS');
    expect(verdict.status).toBe('CERTIFIABLE');
  });

  it('does not fire when 7B properly contains 7A', () => {
    const { worker } = run({
      ...spec,
      workers: [{ ...spec.workers[0]!, allWorkGross: '1200.00' }],
    });
    expect(worker?.blockReasons).not.toContain('GROSS_EXCEEDS_ALL_WORK_GROSS');
  });
});

// ===========================================================================
// H-2 — worker-scoped blocks survive a worker with no payroll lines
// ===========================================================================

describe('H-2 — a worker with zero payroll lines cannot lose a worker-scoped block', () => {
  it('an unmapped deduction and a failed net reconciliation both reach the status', () => {
    const { worker, verdict } = run({
      band: 'over_100k',
      workers: [
        {
          lines: [],
          allWorkGross: '1000.00',
          deductions: [{ label: 'GARNISH?', category: 'UNMAPPED', amount: '200.00' }],
          netPaid: '100.00',
        },
      ],
    });
    expect(worker?.lines).toEqual([]);
    expect(worker?.workerScopedBlockReasons).toEqual([
      'UNMAPPED_DEDUCTION',
      'NET_RECONCILIATION_FAILED',
    ]);
    // Before the third channel existed this returned CERTIFIABLE with the signature
    // block rendered: the blocks reached the artifact only by being spliced into
    // lines, and there were none. 29 CFR 5.5(a)(3)(ii)(C)(2) is the certification
    // that would have been signed.
    expect(draft(verdict).signatureBlockWithheld).toBe(true);
    expect(draft(verdict).blocks).toContain('UNMAPPED_DEDUCTION');
    expect(draft(verdict).blocks).toContain('NET_RECONCILIATION_FAILED');
  });

  it('a line-less apprentice with no level of progression blocks too', () => {
    const { verdict } = run({
      band: 'over_100k',
      workers: [{ status: 'RA', lines: [] }],
    });
    expect(draft(verdict).blocks).toContain('MISSING_REQUIRED_FIELD');
  });

  it('`deriveStatus` treats the worker channel exactly as it treats the filing channel', () => {
    const unmapped = deriveStatus({
      lines: [],
      workerBlockReasons: ['UNMAPPED_DEDUCTION'],
      freshness: CANARY_FRESHNESS,
    });
    expect(draft(unmapped).blocks).toEqual(['UNMAPPED_DEDUCTION']);
    // And an empty channel changes nothing, so the addition is not a new way to fail.
    expect(deriveStatus({ lines: [], workerBlockReasons: [], freshness: CANARY_FRESHNESS }).status)
      .toBe('CERTIFIABLE');
  });

  it('a worker WITH lines still carries the block on its rows, for the ink', () => {
    const { worker, verdict } = run({
      band: 'over_100k',
      workers: [
        {
          lines: [{ ...WD_30_10, cashRate: '45.00', st: '8' }],
          allWorkGross: '1000.00',
          deductions: [{ label: 'GARNISH?', category: 'UNMAPPED', amount: '200.00' }],
        },
      ],
    });
    expect(worker?.lines[0]?.blockReasons).toContain('UNMAPPED_DEDUCTION');
    expect(worker?.lines[0]?.resolutionState).toBe('blocked');
    expect(verdict.status).toBe('DRAFT_NOT_CERTIFIABLE');
  });
});

// ===========================================================================
// H-4 — the premium flag requires evidence
// ===========================================================================

describe('H-4 — PREMIUM_BELOW_STATUTORY does not accuse DOL’s own compliant oracle', () => {
  /** FOH 15k11(a)(1): 44 h at $12.00 cash plus $2.50 fringe against WD $12.00 +
   *  $2.50. DOL publishes "$24.00 for CWHSSA earnings; $662.00 Total" as CORRECT. */
  const foh15k11a1: WeekSpec = {
    band: 'over_100k',
    workers: [
      {
        lines: [
          {
            className: 'ELECTRICIAN, INCLUDES TRAFFIC SIGNALIZATION',
            wdBase: '12.00',
            wdFringe: '2.50',
            cashRate: '12.00',
            st: '44',
            plans: [{ name: 'Fringe', credit: '2.50' }],
          },
        ],
      },
    ],
  };

  it('raises no flag on a week whose export states no premium rate at all', () => {
    const { worker, flags } = run(foh15k11a1);
    expect(worker?.premiumOwed).toBe(Cents.of(2_400));
    expect(worker?.premiumRatesStated).toBe(false);
    expect(flags).not.toContain<ViolationFlag>('PREMIUM_BELOW_STATUTORY');
  });

  it('is not silent either: the P-D says what column 7A contains and declines the rest', () => {
    const { sentences: lines } = run(foh15k11a1);
    const printed = lines.join('\n');
    expect(printed).toContain('states no overtime rate for a week with statutory overtime');
    expect(printed).toContain('does not determine whether that premium was paid');
    expect(printed).not.toMatch(/premium rates stated on this payroll are below/);
  });

  it('the artifact never says of one premium both "earned" and "not paid"', () => {
    const { worker, sentences: lines } = run(foh15k11a1);
    // The $24.00 is inside column 7A: $528.00 straight-time cash + $24.00 premium.
    expect(worker?.col7A).toBe(Cents.of(55_200));
    const printed = lines.join('\n');
    const accusesShortfall = /premium rates stated on this payroll are below/.test(printed);
    expect(accusesShortfall).toBe(false);
  });

  it('still fires when the export DOES state a premium rate and it falls short', () => {
    // $40.00 straight time, $41.00 overtime on 36 + 8. The regular rate is $40.00, so
    // the stated premium of $1.00/hr over 8 h is $8.00 against $80.00 owed.
    const { worker, flags, sentences: lines } = run({
      band: 'over_100k',
      workers: [
        {
          allWorkGross: '2000.00',
          lines: [
            {
              className: 'LABORER:  COMMON OR GENERAL',
              wdBase: '20.00',
              wdFringe: '0.00',
              cashRate: '40.00',
              otRate: '41.00',
              st: '36',
              ot: '8',
            },
          ],
        },
      ],
    });
    expect(worker?.premiumRatesStated).toBe(true);
    expect(flags).toContain<ViolationFlag>('PREMIUM_BELOW_STATUTORY');
    expect(lines.join('\n')).toContain('premium rates stated on this payroll are below');
  });

  it('a stated $0.00 premium rate counts as evidence, not as silence', () => {
    const { worker, flags } = run({
      band: 'over_100k',
      workers: [
        {
          allWorkGross: '2000.00',
          lines: [
            {
              className: 'LABORER:  COMMON OR GENERAL',
              wdBase: '20.00',
              wdFringe: '0.00',
              cashRate: '40.00',
              otRate: '0.00',
              st: '36',
              ot: '8',
            },
          ],
        },
      ],
    });
    expect(worker?.premiumRatesStated).toBe(true);
    expect(flags).toContain<ViolationFlag>('PREMIUM_BELOW_STATUTORY');
  });
});

// ===========================================================================
// H-3 — an unfunded plan credit is refused, not credited
// ===========================================================================

describe('H-3 — a fringe credit against an unfunded plan blocks the line', () => {
  /**
   * WHAT WAS WRONG. `FringePlanCredit` had no `unfunded` field, so an unfunded plan
   * was indistinguishable from a funded one. Its credit was narrowed into column 6B,
   * printed, used to check box 5, and added to `paidTotal` — where it could carry a
   * line over `requiredTotal` and suppress `WD_UNDERPAYMENT` outright.
   *
   * 29 CFR 5.28(b), eCFR versioner API, fetched 2026-08-13: an unfunded plan "may
   * not constitute a fringe benefit within the meaning of the Act unless" five
   * conditions hold, of which (5) is approval by the Secretary — a fact no payroll
   * export carries.
   */
  const spec = (unfunded: boolean): WeekSpec => ({
    band: 'over_100k',
    workers: [
      {
        lines: [
          {
            ...WD_30_10,
            cashRate: '32.00',
            st: '20',
            plans: [{ name: 'Company-paid vacation', credit: '9.00', unfunded }],
          },
        ],
      },
    ],
  });

  it('blocks, and the artifact is DRAFT with the signature withheld', () => {
    const { line, verdict } = run(spec(true));
    expect(line?.blockReasons).toContain('UNFUNDED_PLAN_CREDIT');
    expect(draft(verdict).signatureBlockWithheld).toBe(true);
  });

  it('the credit that would have suppressed the underpayment is exactly the one refused', () => {
    // 20 h × $40.00 required = $800.00. Cash is 20 × $32.00 = $640.00; the $9.00/hr
    // unfunded credit is $180.00, which carries the line to $820.00 and silences the
    // flag. The block is what stops that dollar from doing that work unexamined.
    const { line } = run(spec(true));
    expect(line?.requiredTotal).toBe(Cents.of(80_000));
    expect(line?.col6B).toBe(Cents.of(18_000));
    expect(line?.paidTotal).toBe(Cents.of(82_000));
  });

  it('names 5.28(b)(5) and the 5.28(c) approval path, with a closed choice', () => {
    const { refusals } = run(spec(true));
    const refusal = refusals.find(
      (r) => r.primitive === 'P-A' && r.blockReason === 'UNFUNDED_PLAN_CREDIT',
    );
    expect(refusal).toBeDefined();
    if (refusal?.primitive !== 'P-A') throw new Error('expected a P-A');
    expect(refusal.detail).toContain('29 CFR 5.28(b)');
    expect(refusal.detail).toContain('29 CFR 5.28(c)');
    expect(refusal.choices.length).toBe(2);
    expect(refusal.choices[0]?.verbatimSource).toContain(
      'requests and receives approval of the plan or program from the Secretary',
    );
    expect(`${refusal.headline} ${refusal.detail}`).not.toMatch(/contact|support|ticket/i);
  });

  it('a funded plan is entirely unaffected', () => {
    const { line, verdict } = run(spec(false));
    expect(line?.blockReasons).not.toContain('UNFUNDED_PLAN_CREDIT');
    expect(line?.col6B).toBe(Cents.of(18_000));
    expect(verdict.status).toBe('CERTIFIABLE');
  });
});

// ===========================================================================
// M-1 — the 29 CFR 3.5(j) transcription, byte for byte
// ===========================================================================

describe('M-1 — 29 CFR 3.5(j) is transcribed complete', () => {
  /**
   * Fetched from the eCFR versioner API on 2026-08-13
   * (`/api/versioner/v1/full/2026-08-11/title-29.xml?part=3&section=3.5`), tags
   * stripped, entities unescaped, the two numbered sub-paragraphs joined with a
   * single space. `[88 FR 57730, Aug. 23, 2023]` is the section's amendment note and
   * is not part of the paragraph.
   *
   * The production runtime copy in `src/app/(free)/_lib/obligations.ts` was found
   * truncated at "…the actual cost to the contractor", dropping three of the
   * paragraph's five conditions INCLUDING BOTH CONSENT ALTERNATIVES, while being
   * passed into `Refusal.rule`, which `src/lib/types.ts` documents as verbatim
   * regulatory text. That file is outside this suite's ownership; this test pins the
   * canary fixture — the copy the engine actually quotes offline — against the
   * regulation, so the divergence cannot spread in this direction.
   */
  const ECFR_3_5_J =
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
    'contractor or subcontractor and representatives of its laborers and mechanics.';

  it('matches the eCFR text character for character', () => {
    const paragraph = CANARY_OBLIGATIONS.deductionParagraphs.value.find((p) => p.letter === 'j');
    expect(paragraph?.text).toBe(ECFR_3_5_J);
  });

  it('carries all five conditions, including both consent alternatives', () => {
    const paragraph = CANARY_OBLIGATIONS.deductionParagraphs.value.find((p) => p.letter === 'j');
    expect(paragraph?.text).toContain('(1) Voluntarily consented to');
    expect(paragraph?.text).toContain('(2) Provided for in a bona fide collective bargaining');
    expect(paragraph?.text.endsWith('representatives of its laborers and mechanics.')).toBe(true);
  });

  it('carries exactly ten lettered paragraphs, (a) through (j)', () => {
    expect(CANARY_OBLIGATIONS.deductionParagraphs.value.map((p) => p.letter)).toEqual([
      'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
    ]);
  });
});

// ===========================================================================
// The invariants the corrections must not have broken
// ===========================================================================

describe('the DOL oracles still hold after every correction', () => {
  it('FOH 15k11(a)(2) is still compliant — the 5.31(b)(3) combination method', () => {
    const { line, flags } = run({
      band: 'over_100k',
      workers: [
        {
          lines: [
            {
              className: 'ELECTRICIAN, INCLUDES TRAFFIC SIGNALIZATION',
              wdBase: '12.00',
              wdFringe: '2.50',
              cashRate: '10.00',
              st: '44',
              plans: [{ name: 'Fringe', credit: '4.50' }],
            },
          ],
        },
      ],
    });
    // $10.00 + $4.50 = $14.50/hr against a required $12.00 + $2.50 = $14.50/hr.
    expect(line?.requiredTotal).toBe(Cents.of(63_800));
    expect(line?.paidTotal).toBe(Cents.of(63_800));
    expect(flags).not.toContain<ViolationFlag>('WD_UNDERPAYMENT');
  });

  it('E4’s un-floored weighted average is untouched — $10.91 and $21.82', () => {
    const { worker } = run({
      band: 'over_100k',
      workers: [
        {
          lines: [
            { className: 'PAINTER', wdBase: '10.00', wdFringe: '0.00', cashRate: '10.00', st: '24' },
            {
              className: 'ELECTRICIAN, INCLUDES TRAFFIC SIGNALIZATION',
              wdBase: '12.00',
              wdFringe: '0.00',
              cashRate: '12.00',
              st: '20',
            },
          ],
        },
      ],
    });
    expect(worker?.regularRate).toBe(Cents.of(1_091));
    expect(worker?.premiumOwed).toBe(Cents.of(2_182));
  });

  it('P-22 holds: WD_UNDERPAYMENT is still ungated by the contract-value band', () => {
    const spec = (band: WeekSpec['band']): WeekSpec => ({
      band,
      workers: [{ lines: [{ ...WD_30_10, cashRate: '20.00', st: '20' }] }],
    });
    for (const band of ['over_100k', 'at_or_under_100k', 'unknown'] as const) {
      expect(run(spec(band)).flags).toContain<ViolationFlag>('WD_UNDERPAYMENT');
    }
  });

  it('the two new block reasons are explained, like every other one', () => {
    // "No block reaches an artifact without a sentence explaining it" — an
    // unexplained watermark is a warning, and a warning can be clicked past.
    for (const spec of [
      {
        band: 'over_100k',
        workers: [
          {
            allWorkGross: '896.00',
            lines: [
              {
                className: 'LABORER:  COMMON OR GENERAL',
                wdBase: '20.00',
                wdFringe: '0.00',
                cashRate: '20.00',
                otRate: '22.00',
                st: '36',
                ot: '8',
              },
            ],
          },
        ],
      } satisfies WeekSpec,
      {
        band: 'over_100k',
        workers: [
          {
            lines: [
              {
                ...WD_30_10,
                cashRate: '32.00',
                st: '20',
                plans: [{ name: 'Company-paid vacation', credit: '9.00', unfunded: true }],
              },
            ],
          },
        ],
      } satisfies WeekSpec,
    ]) {
      const { computation, refusals } = run(spec);
      const explained = new Set(explainedBlockReasons(refusals));
      for (const reason of computation.allBlockReasons) {
        if (reason === 'MISSING_REQUIRED_FIELD') continue;
        expect(explained.has(reason), `unexplained block: ${reason}`).toBe(true);
      }
    }
  });

  it('the engine still reads no clock, no locale and no randomness', () => {
    const spec: WeekSpec = {
      band: 'over_100k',
      workers: [{ lines: [{ ...WD_30_10, cashRate: '45.00', dtRate: '0.00', st: '20', dt: '8' }] }],
    };
    const first = JSON.stringify(run(spec).computation, (_k, v: unknown) =>
      typeof v === 'bigint' ? String(v) : v,
    );
    const second = JSON.stringify(run(spec).computation, (_k, v: unknown) =>
      typeof v === 'bigint' ? String(v) : v,
    );
    expect(first).toBe(second);
    expect(Hours.of(0)).toBe(0);
  });
});
