/**
 * The pieces the golden set exercises only incidentally: date arithmetic at the
 * boundaries, the CE calculator, and the honesty rule as a function.
 *
 * `specs/05` §Edge cases names leap day and month-end clamping explicitly, and
 * both are the kind of bug that is invisible for eleven months and then wrong.
 */

import { describe, expect, it } from 'vitest';

import {
  addBusinessDays,
  addDays,
  addMonths,
  assessValue,
  computeCe,
  daysBetween,
  isCivilDate,
  judgeGoverning,
  nextMonthDay,
  nextMonthDayWithParity,
  parseCeWindow,
  parseExpiryRule,
  STALENESS_DAYS,
} from '../src/lib/rules';
import type { ContinuingEducation, SourcedValue } from '../src/lib/kb/types';

describe('civil-date arithmetic', () => {
  it('clamps to month end rather than rolling over', () => {
    // 31 January + 1 month is 28 February, not 3 March. JavaScript's setMonth
    // rolls; this does not.
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29');
    expect(addMonths('2026-03-31', 1)).toBe('2026-04-30');
  });

  it('handles the leap day on a twelve-month anniversary', () => {
    // `specs/05`: a licence issued 29 February 2028 expires 28 February 2029.
    expect(addMonths('2028-02-29', 12)).toBe('2029-02-28');
  });

  it('crosses years correctly in both directions', () => {
    expect(addMonths('2026-12-31', 12)).toBe('2027-12-31');
    expect(addMonths('2026-08-15', 24)).toBe('2028-08-15');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(daysBetween('2026-01-01', '2027-01-01')).toBe(365);
    expect(daysBetween('2027-01-01', '2026-01-01')).toBe(-365);
  });

  it('finds the next fixed date STRICTLY after the anchor', () => {
    expect(nextMonthDay('2026-03-14', 12, 31)).toBe('2026-12-31');
    // On the day itself, the answer is next year — "strictly after" is what
    // stops a licence issued on 31 December expiring the same evening.
    expect(nextMonthDay('2026-12-31', 12, 31)).toBe('2027-12-31');
    // 29 February in a non-leap year clamps to the 28th.
    expect(nextMonthDay('2026-03-01', 2, 29)).toBe('2027-02-28');
  });

  it('finds the next fixed date with the right year parity', () => {
    expect(nextMonthDayWithParity('2026-03-14', 8, 31, 'even')).toBe('2026-08-31');
    expect(nextMonthDayWithParity('2026-09-01', 8, 31, 'even')).toBe('2028-08-31');
    expect(nextMonthDayWithParity('2026-03-14', 8, 31, 'odd')).toBe('2027-08-31');
  });

  it('counts business days over weekends', () => {
    // Friday 4 September 2026 + 1 business day is Monday 7 September.
    expect(addBusinessDays('2026-09-04', 1)).toBe('2026-09-07');
    // Tuesday 1 September + 30 business days is Tuesday 13 October.
    expect(addBusinessDays('2026-09-01', 30)).toBe('2026-10-13');
  });

  it('validates civil dates', () => {
    expect(isCivilDate('2026-02-29')).toBe(false);
    expect(isCivilDate('2028-02-29')).toBe(true);
    expect(isCivilDate('2026-13-01')).toBe(false);
    expect(isCivilDate('2026-1-1')).toBe(false);
  });
});

describe('the expiry-rule vocabulary is closed', () => {
  it('parses exactly the three tokens the engine implements', () => {
    expect(parseExpiryRule('anniversary')).toEqual({ kind: 'anniversary' });
    expect(parseExpiryRule('fixed_date:12-31')).toEqual({ kind: 'fixed_date', month: 12, day: 31 });
    expect(parseExpiryRule('fixed_date_parity:08-31:even')).toEqual({
      kind: 'fixed_date_parity',
      month: 8,
      day: 31,
      parity: 'even',
    });
  });

  it('refuses everything else rather than guessing — including the unimplemented fourth rule', () => {
    // `fixed_date_offset` (birth-month states) is deliberately NOT implemented:
    // implementing an unused rule is how a vocabulary silently diverges from
    // the data.
    expect(parseExpiryRule('fixed_date_offset:birth_month')).toBeNull();
    expect(parseExpiryRule('fixed_date:13-01')).toBeNull();
    expect(parseExpiryRule(null)).toBeNull();
    expect(parseExpiryRule(12)).toBeNull();
  });

  it('reads a CE window only from a token, never from prose', () => {
    expect(parseCeWindow('calendar_window:06-30')).toEqual({ kind: 'calendar_window', endMonth: 6, endDay: 30 });
    expect(parseCeWindow(12)).toEqual({ kind: 'licence_term' });
    expect(parseCeWindow('The CE licence period runs 1 July to 30 June')).toEqual({ kind: 'licence_term' });
  });
});

describe('the honesty rule', () => {
  const base = (overrides: Partial<SourcedValue>): SourcedValue => ({
    value: 12,
    status: 'verified',
    confidence: 'high',
    source_url: 'https://www.tdlr.texas.gov/acr/',
    evidence: 'Licenses are valid for a period of 1 year',
    last_verified: '2026-09-03',
    verified_by: ['a', 'b'],
    ...overrides,
  });

  it('a null value is never usable — invariant 3', () => {
    const a = assessValue(base({ value: null, status: 'unknown', note: 'not on any page we read' }), '2026-09-03');
    expect(a.usable).toBe(false);
    expect(a.note).toBe('not on any page we read');
  });

  it('applies the 180-day staleness rule at READ time, without touching the record', () => {
    const fresh = assessValue(base({}), '2026-09-03');
    expect(fresh.stale).toBe(false);
    expect(fresh.effectiveStatus).toBe('verified');

    const stale = assessValue(base({}), '2027-03-03'); // 181 days later
    expect(stale.staleDays).toBe(STALENESS_DAYS + 1);
    expect(stale.stale).toBe(true);
    // It stops being ASSERTED. It is not deleted and the record does not change.
    expect(stale.effectiveStatus).toBe('unverified');
    expect(stale.usable).toBe(true);
  });

  it('a stale value flips needsHumanCheck on anything derived from it', () => {
    const verdict = judgeGoverning([assessValue(base({}), '2027-03-03')]);
    expect(verdict.needsHumanCheck).toBe(true);
    expect(verdict.reasons).toContain('value_stale');
  });

  it('confidence is the WEAKEST of the governing values, never the strongest', () => {
    const verdict = judgeGoverning([
      assessValue(base({ confidence: 'high' }), '2026-09-03'),
      assessValue(base({ confidence: 'medium', note: 'one inference' }), '2026-09-03'),
    ]);
    expect(verdict.confidence).toBe('medium');
    expect(verdict.needsHumanCheck).toBe(false);
    expect(verdict.notes).toEqual(['one inference']);
  });

  it('fails closed on a non-high value nobody explained', () => {
    const verdict = judgeGoverning([assessValue(base({ confidence: 'medium' }), '2026-09-03')]);
    expect(verdict.needsHumanCheck).toBe(true);
    expect(verdict.reasons).toContain('unexplained_inference');
  });

  it('low confidence always flags, note or not', () => {
    const verdict = judgeGoverning([assessValue(base({ confidence: 'low', note: 'from statute' }), '2026-09-03')]);
    expect(verdict.needsHumanCheck).toBe(true);
    expect(verdict.reasons).toContain('confidence_low');
  });

  it('an unverified value always flags', () => {
    const verdict = judgeGoverning([
      assessValue(base({ status: 'unverified', note: 'one pass only' }), '2026-09-03'),
    ]);
    expect(verdict.needsHumanCheck).toBe(true);
    expect(verdict.reasons).toContain('value_unverified');
  });
});

describe('the CE shortfall calculator', () => {
  const ce = (subjects: { hours: number; subject: string }[], hours: number): ContinuingEducation => ({
    required: { value: true, status: 'verified', confidence: 'high' },
    hours: { value: hours, status: 'verified', confidence: 'high' },
    period: { value: 12, status: 'verified', confidence: 'high' },
    subject_breakdown: { value: subjects, status: 'verified', confidence: 'high' },
    approved_provider_rule: { value: 'board approved', status: 'verified', confidence: 'high' },
  });

  const florida = ce(
    [
      { hours: 1, subject: 'workplace safety' },
      { hours: 1, subject: 'business practices' },
      { hours: 9, subject: 'any board-approved construction-related instruction' },
    ],
    11,
  );

  it('is not required minus recorded', () => {
    const result = computeCe(florida, [{ hours: 11, subject: 'general' }]);
    expect(result.hoursRecorded).toBe(11);
    expect(result.hoursOutstanding).toBe(11);
  });

  it('itemises by subject and matches case- and punctuation-insensitively', () => {
    const result = computeCe(florida, [
      { hours: 1, subject: 'Workplace Safety' },
      { hours: 9, subject: 'any board approved construction related instruction' },
    ]);
    expect(result.subjectShortfall).toEqual([
      { subject: 'business practices', required: 1, recorded: 0, outstanding: 1 },
    ]);
    expect(result.hoursOutstanding).toBe(1);
  });

  it('applies unmatched hours only to the residual requirement, never to a named mandate', () => {
    // Texas: 8 hours of which 1 is state law and rules. Seven general hours
    // satisfy the residual; the mandate is still outstanding.
    const texas = ce([{ hours: 1, subject: 'Texas state law and rules regulating licensee conduct' }], 8);
    const result = computeCe(texas, [{ hours: 7, subject: 'refrigerant handling' }]);
    expect(result.residualRequired).toBe(7);
    expect(result.residualOutstanding).toBe(0);
    expect(result.hoursOutstanding).toBe(1);
  });

  it('counts carried-in hours against the residual', () => {
    const texas = ce([{ hours: 1, subject: 'state law' }], 8);
    const result = computeCe(texas, [{ hours: 1, subject: 'state law' }], 7);
    expect(result.hoursOutstanding).toBe(0);
  });

  it('reports zero outstanding when CE is not required at all', () => {
    const none: ContinuingEducation = {
      required: { value: false, status: 'verified', confidence: 'high' },
      hours: { value: 0, status: 'verified', confidence: 'high' },
      period: { value: null, status: 'unknown', confidence: 'low', note: 'not applicable' },
      approved_provider_rule: { value: 'not applicable', status: 'verified', confidence: 'high' },
    };
    const result = computeCe(none, []);
    expect(result.required).toBe(false);
    expect(result.hoursOutstanding).toBe(0);
    expect(result.subjectShortfall).toEqual([]);
  });

  it('separates classroom hours so a delivery constraint can be shown against them', () => {
    const nc = ce([], 8);
    const result = computeCe(nc, [
      { hours: 4, deliveryMode: 'classroom' },
      { hours: 4, deliveryMode: 'online' },
    ]);
    expect(result.classroomHours).toBe(4);
    expect(result.hoursOutstanding).toBe(0);
  });
});
