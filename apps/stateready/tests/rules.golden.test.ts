/**
 * The golden set — `specs/05` §Test plan: *a fixture licence per (state, trade,
 * licence type) × three issue dates, with the expected deadline set committed.*
 *
 * **69 cases: 9 records × 23 licence types × 3 issue dates.** Every licence type
 * in the knowledge base is covered, including the three that correctly derive
 * nothing.
 *
 * THIS FILE DOES TWO DIFFERENT JOBS AND BOTH MATTER:
 *
 *  1. **Change detection.** The committed expectations fail when the knowledge
 *     base moves — which is exactly what should happen. A board changing a
 *     renewal cycle must break a test before it reaches a customer.
 *  2. **Independent verification.** For every case the expected renewal date is
 *     ALSO recomputed by `oracle()` below — a twenty-line implementation of the
 *     three rule tokens written from `specs/05`'s own table, importing nothing
 *     from `src/lib/rules`. Two implementations agreeing is evidence; one
 *     implementation agreeing with a recording of itself is not.
 *
 * The correctness of the *behaviours* — flags, notes, CE, refusals — is
 * `rules.acceptance.test.ts`, written from the acceptance criteria.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { getKbRecord } from '../src/lib/kb/accessors';
import { derive } from '../src/lib/rules';

type GoldenCase = {
  caseId: string;
  recordId: string;
  state: string;
  trade: string;
  licenceTypeId: string;
  licenceTypeName: string;
  issuedOn: string;
  today: string;
  expiryRuleToken: string | null;
  cycleMonths: number | null;
  expected: {
    renewal: null | {
      dueOn: string;
      rule: string | null;
      confidence: string;
      needsHumanCheck: boolean;
      flagReasons: string[];
      noteCount: number;
      citationUrl: string | null;
    };
    ce: null | {
      dueOn: string;
      rule: string | null;
      hoursRequired: number;
      hoursOutstanding: number;
      confidence: string;
      needsHumanCheck: boolean;
      noteCount: number;
    };
    explanations: { kind: string; reason: string }[];
  };
};

const fixture = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fixtures', 'rules-golden.json'), 'utf8'),
) as { today: string; issueDates: string[]; cases: GoldenCase[] };

/**
 * The ORACLE. `specs/05` §Renewal rules, implemented from the table:
 *
 *   anniversary                     issue + cycle months, clamped to month end
 *   fixed_date:MM-DD                next MM-DD strictly after issue
 *   fixed_date_parity:MM-DD:even    next MM-DD after issue whose year has that parity
 *
 * Deliberately naive and deliberately separate. If this and the engine ever
 * disagree, one of them is wrong and the test says which case.
 */
function oracle(token: string | null, issuedOn: string, cycleMonths: number | null): string | null {
  if (!token) return null;
  const [y, m, d] = issuedOn.split('-').map(Number) as [number, number, number];
  const lastDay = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  const fmt = (year: number, month: number, day: number) => `${pad(year, 4)}-${pad(month)}-${pad(day)}`;

  if (token === 'anniversary') {
    if (cycleMonths === null) return null;
    const total = y * 12 + (m - 1) + cycleMonths;
    const year = Math.floor(total / 12);
    const month = (total % 12) + 1;
    return fmt(year, month, Math.min(d, lastDay(year, month)));
  }

  const fixed = /^fixed_date:(\d{2})-(\d{2})$/.exec(token);
  if (fixed) {
    const month = Number(fixed[1]);
    const day = Number(fixed[2]);
    for (let year = y; year < y + 8; year += 1) {
      const candidate = fmt(year, month, Math.min(day, lastDay(year, month)));
      if (candidate > issuedOn) return candidate;
    }
    return null;
  }

  const parity = /^fixed_date_parity:(\d{2})-(\d{2}):(even|odd)$/.exec(token);
  if (parity) {
    const month = Number(parity[1]);
    const day = Number(parity[2]);
    const wanted = parity[3] === 'even' ? 0 : 1;
    for (let year = y; year < y + 8; year += 1) {
      if (year % 2 !== wanted) continue;
      const candidate = fmt(year, month, Math.min(day, lastDay(year, month)));
      if (candidate > issuedOn) return candidate;
    }
  }
  return null;
}

describe('golden set — every licence type in the knowledge base, three issue dates each', () => {
  it('covers all 9 records and all 23 licence types', () => {
    expect(fixture.cases).toHaveLength(69);
    expect(new Set(fixture.cases.map((c) => c.recordId)).size).toBe(9);
    expect(new Set(fixture.cases.map((c) => c.licenceTypeId)).size).toBe(23);
    expect(fixture.issueDates).toEqual(['2026-01-31', '2026-03-14', '2026-12-31']);
  });

  for (const testCase of fixture.cases) {
    it(`${testCase.caseId}`, () => {
      const record = getKbRecord(testCase.state, testCase.trade);
      expect(record, `${testCase.recordId} must be publishable`).not.toBeNull();

      const result = derive(
        {
          state: testCase.state,
          trade: testCase.trade,
          kbLicenceTypeId: testCase.licenceTypeId,
          issuedOn: testCase.issuedOn,
        },
        record,
        testCase.today,
      );

      // 1. The engine matches the committed expectation.
      const renewal = result.renewal
        ? {
            dueOn: result.renewal.dueOn,
            rule: result.renewal.rule,
            confidence: result.renewal.confidence,
            needsHumanCheck: result.renewal.needsHumanCheck,
            flagReasons: result.renewal.flagReasons,
            noteCount: result.renewal.notes.length,
            citationUrl: result.renewal.citation.url,
          }
        : null;
      expect(renewal).toEqual(testCase.expected.renewal);

      const ce = result.ce
        ? {
            dueOn: result.ce.dueOn,
            rule: result.ce.rule,
            hoursRequired: Number(result.ce.detail['hoursRequired'] ?? 0),
            hoursOutstanding: Number(result.ce.detail['hoursOutstanding'] ?? 0),
            confidence: result.ce.confidence,
            needsHumanCheck: result.ce.needsHumanCheck,
            noteCount: result.ce.notes.length,
          }
        : null;
      expect(ce).toEqual(testCase.expected.ce);
      expect(result.explanations.map((e) => ({ kind: e.kind, reason: e.reason }))).toEqual(
        testCase.expected.explanations,
      );

      // 2. And the expectation matches an INDEPENDENT reading of the spec.
      expect(testCase.expected.renewal?.dueOn ?? null).toBe(
        oracle(testCase.expiryRuleToken, testCase.issuedOn, testCase.cycleMonths),
      );

      // 3. Invariant 1, on every derived row in the set.
      if (result.renewal?.source === 'derived') expect(result.renewal.citation.url).toBeTruthy();
      if (result.ce?.source === 'derived') expect(result.ce.citation.url).toBeTruthy();
    });
  }

  it('is idempotent: running twice supersedes nothing', () => {
    for (const testCase of fixture.cases.slice(0, 12)) {
      const record = getKbRecord(testCase.state, testCase.trade);
      const input = {
        state: testCase.state,
        trade: testCase.trade,
        kbLicenceTypeId: testCase.licenceTypeId,
        issuedOn: testCase.issuedOn,
      };
      expect(JSON.stringify(derive(input, record, testCase.today))).toBe(
        JSON.stringify(derive(input, record, testCase.today)),
      );
    }
  });
});
