/**
 * THE PROJECTION — the columns, and the one that is most often got wrong.
 *
 * AUTHORITY: `ENGINE.md` §6 (6B and 6C are WEEKLY TOTALS; only 6A is hourly), §5
 * (column 6A excludes cash in lieu), §4 (columns 4 and 5), §9 (column 8 and net),
 * `DESIGN_SYSTEM.md` §8.8.1 (the column set).
 *
 * ===========================================================================
 * 6B AND 6C ARE WEEKLY TOTALS. THIS WAS A REVIEW FINDING.
 *
 * WHD's instructions, quoted in `ENGINE.md` §6: column 6B is "the TOTAL of the
 * contractor's or subcontractor's contributions" and 6C is "the TOTAL AMOUNT IN
 * CASH provided in lieu of fringe benefits to the worker DURING THE WORKWEEK".
 * Only 6A is per hour.
 *
 * The failure mode is quiet and expensive. A per-hour figure printed in 6B on a
 * 37.25-hour week understates the claimed fringe credit by a factor of thirty-seven
 * on a document the contractor signs under 18 U.S.C. 1001 — and it looks entirely
 * plausible on the page, because $6.30 is a believable number to see in a money
 * column. So the assertion below is not "6B has the right value"; it is "6B is the
 * per-hour credit TIMES TOTAL HOURS, and is not the per-hour credit".
 */

import { describe, expect, it } from 'vitest';

import { hoursCell, hoursTotal, money, projectWh347, rateCell, weekDates, wh347Fields } from '@/artifacts';

import {
  CERTIFIABLE_VERDICT,
  FEDERAL_IDENTITIES,
  GOLDEN_COMPUTATION,
  HEADER,
  PROVENANCE,
  SIGNATORY,
  WEEK_ENDING,
} from './fixtures';

const artifact = projectWh347({
  layout: 'wh347_rev_2025_01',
  computation: GOLDEN_COMPUTATION,
  verdict: CERTIFIABLE_VERDICT,
  provenance: PROVENANCE,
  header: HEADER,
  workers: FEDERAL_IDENTITIES,
  signatory: SIGNATORY,
  remarks: '',
  exceptions: [],
  bandRecordedOn: PROVENANCE.publishDate,
  contractLock: null,
  verifyUrl: null,
});

describe('columns 6B and 6C are weekly totals, not hourly rates', () => {
  const line1 = artifact.workers[0]?.lines[0];
  const line2 = artifact.workers[1]?.lines[0];

  it('6B is the per-hour credit times TOTAL hours', () => {
    // $6.30/hr × 37.25 h = $234.675 → half-up at N1 → $234.68
    expect(line1?.col6BFringeCredit).toBe('234.68');
    expect(line1?.col5TotalHours).toBe('37.25');
    expect(line1?.col6BFringeCredit).not.toBe('6.30');

    // $3.00/hr × 46 h = $138.00 exactly
    expect(line2?.col6BFringeCredit).toBe('138.00');
    expect(line2?.col5TotalHours).toBe('46.00');
    expect(line2?.col6BFringeCredit).not.toBe('3.00');
  });

  it('6C is the cash-in-lieu rate times TOTAL hours, including overtime hours', () => {
    // $1.00/hr × 46 h = $46.00. DOL's Prevailing Wage Resource Book: fringe
    // benefits are owed for ALL hours worked, including overtime hours.
    expect(line2?.col6CInLieu).toBe('46.00');
    expect(line2?.col6CInLieu).not.toBe('1.00');
    expect(line1?.col6CInLieu).toBe('0.00');
  });

  it('6A IS an hourly rate, and excludes cash paid in lieu', () => {
    // $26.00 cash rate less $1.00 in lieu = $25.00 in column 6A's top row, per
    // WHD: "do not include cash payments in lieu of fringe benefits in this column".
    expect(line2?.col6AStraightTime).toBe('25.00');
    expect(line2?.col6AOvertime).toBe('39.00');
    expect(line1?.col6AStraightTime).toBe('18.62');
  });

  it('leaves the overtime rate NULL rather than zero when no premium is proven', () => {
    // Null is not zero: "we cannot prove a premium was paid" and "nothing was paid"
    // are different facts with different outcomes.
    expect(line1?.col6AOvertime).toBeNull();
    expect(line1?.col6AOvertime).not.toBe('0.00');
  });
});

describe('the seven-day grid', () => {
  it('runs from the workweek start to the week-ending date, derived and not localised', () => {
    expect(weekDates(WEEK_ENDING)).toEqual([
      '2026-08-02',
      '2026-08-03',
      '2026-08-04',
      '2026-08-05',
      '2026-08-06',
      '2026-08-07',
      '2026-08-08',
    ]);
  });

  it('labels the days from the dates', () => {
    const days = artifact.workers[0]?.lines[0]?.col4Days ?? [];
    expect(days.map((day) => day.dayLabel)).toEqual(['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']);
  });

  it('leaves an untouched day blank rather than printing 0.00', () => {
    const days = artifact.workers[0]?.lines[0]?.col4Days ?? [];
    expect(days[0]?.st).toBe('');
    expect(days[1]?.st).toBe('8.00');
    expect(days[5]?.st).toBe('5.25');
    expect(days[6]?.st).toBe('');
  });

  it('keeps overtime in its own sub-row', () => {
    const days = artifact.workers[1]?.lines[0]?.col4Days ?? [];
    expect(days[6]?.st).toBe('');
    expect(days[6]?.ot).toBe('6.00');
    expect(days[6]?.dt).toBe('');
  });
});

describe('column 8', () => {
  const cell = artifact.workers[0]?.col8Deductions;

  it('refuses to guess which statutory tax a label names', () => {
    // 29 CFR 3.5(a) covers FICA and income-tax withholding with one paragraph. The
    // form has a sub-column for each. Nothing derives the split from a payroll
    // export's free text, so neither sub-column is filled.
    expect(cell?.fica).toBeNull();
    expect(cell?.withholdingTax).toBeNull();
  });

  it('adds to the total exactly', () => {
    expect(cell?.otherTotal).toBe('89.25');
    expect(cell?.total).toBe('89.25');
  });

  it('itemises by paragraph letter, for the statement page', () => {
    expect(cell?.other).toEqual([
      { label: 'Tax withholding (3.5(a))', amount: '84.25' },
      { label: 'Charitable (3.5(g))', amount: '5.00' },
    ]);
  });
});

describe('formatting', () => {
  it('groups thousands and always carries two decimals', () => {
    expect(money(0 as never)).toBe('0.00');
    expect(money(5 as never)).toBe('0.05');
    expect(money(196_460 as never)).toBe('1,964.60');
    expect(money(-1_234_567 as never)).toBe('-12,345.67');
  });

  it('prints hours in hundredths and rates to the cent', () => {
    expect(hoursTotal(3_725 as never)).toBe('37.25');
    expect(hoursCell(0 as never)).toBe('');
    expect(rateCell(186_200 as never)).toBe('18.62');
    expect(rateCell(250_000 as never)).toBe('25.00');
  });
});

describe('the header field the Rev. January 2025 form added', () => {
  it('identifies the rate by determination AND revision AND publication date', () => {
    // A WD number without a revision does not identify a rate.
    expect(artifact.header.wageDeterminationNumber).toBe('CA20260012 rev. 4 (published 2026-07-31)');
  });
});

describe('the comparable field map', () => {
  it('covers every column ENGINE §25 names', () => {
    const fields = wh347Fields(artifact);
    for (const key of [
      'worker.0.col1A',
      'worker.0.col1B',
      'worker.0.col1C',
      'worker.0.col1D',
      'worker.0.col1E',
      'worker.0.col2',
      'worker.0.line.0.col3',
      'worker.0.line.0.col4.0.st',
      'worker.0.line.0.col4.6.dt',
      'worker.0.line.0.col5',
      'worker.0.line.0.col6A.st',
      'worker.0.line.0.col6A.ot',
      'worker.0.line.0.col6B',
      'worker.0.line.0.col6C',
      'worker.0.col7A',
      'worker.0.col7B',
      'worker.0.col8.total',
      'worker.0.col9',
      'soc.box1',
      'soc.box6',
      'provenance.canonicalSha256',
      'provenance.merkleRoot',
    ]) {
      expect(Object.keys(fields)).toContain(key);
    }
  });

  it('reports the six statement-of-compliance box states as the engine derived them', () => {
    const fields = wh347Fields(artifact);
    expect(fields['soc.box4']).toBe(true); // an apprentice is on the crew
    expect(fields['soc.box5']).toBe(true); // Σ col6B > 0
  });
});

describe('column 9', () => {
  it('shows the customer\'s figure and never overwrites it', () => {
    expect(artifact.workers[0]?.col9NetPaid).toBe('604.35');
    expect(artifact.workers[0]?.netMismatch).toBeNull();
  });

  it('shows both figures when the reconciliation disagrees', () => {
    const mismatched = {
      ...GOLDEN_COMPUTATION,
      workers: GOLDEN_COMPUTATION.workers.map((worker, index) =>
        index === 0 ? { ...worker, netPaid: 60_000 as never } : worker,
      ),
    };
    const built = projectWh347({
      layout: 'wh347_rev_2025_01',
      computation: mismatched,
      verdict: CERTIFIABLE_VERDICT,
      provenance: PROVENANCE,
      header: HEADER,
      workers: FEDERAL_IDENTITIES,
      signatory: SIGNATORY,
      remarks: '',
      exceptions: [],
      bandRecordedOn: PROVENANCE.publishDate,
      contractLock: null,
      verifyUrl: null,
    });
    expect(built.workers[0]?.col9NetPaid).toBe('600.00');
    expect(built.workers[0]?.netMismatch).toBe('computed 604.35');
  });
});
