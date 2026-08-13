/**
 * §10 — THE PROBES AND §10.6's BLOCKING-PROBE REGISTER.
 *
 * Invariant 7: **no probe blocks without a measured red rate recorded in the
 * register.** The register is the mechanism that keeps G1, G3 and G5 measuring what
 * they claim to measure — a probe that quarantines the corpus makes G3 report a
 * 100% delta, makes G1's canary run against nothing, and leaves G5's human-minutes
 * counter as the only signal.
 */

import { describe, expect, it } from 'vitest';

import {
  assertRegisterConsistent,
  BLOCKING_PROBE_REGISTER,
  COUNT_DELTA_CEILING,
  dispositionOf,
  parseIndexResponse,
  probeAlias,
  probeContentHash,
  probeCount,
  probePublisherRevision,
  RED_RATE_CEILING_PCT,
  registerRow,
  RegisterError,
  type RegisterRow,
} from '@/corpus';
import { sha256Hex } from '@/lib/types';

import { fixtureJson } from './fixtures';

const NOW = new Date('2026-08-13T06:00:00Z');

function goodResponse(): ReturnType<typeof parseIndexResponse> {
  return parseIndexResponse(fixtureJson('index/active-page0-size5.json'));
}

describe('probe 1 — record count', () => {
  it('passes inside the 0.5% G3 ceiling', () => {
    const probe = probeCount({
      preconditions: { ok: true },
      response: goodResponse(),
      lastGoodActive: 4230,
    });
    expect(probe.result).toBe('pass');
    expect(probe.deltaPct).toBeCloseTo(0.142, 2);
  });

  it('HOLDs above the ceiling in either direction', () => {
    for (const lastGood of [4000, 4500]) {
      const probe = probeCount({
        preconditions: { ok: true },
        response: goodResponse(),
        lastGoodActive: lastGood,
      });
      expect(probe.result).toBe('fail');
      expect(Math.abs(probe.deltaPct ?? 0)).toBeGreaterThan(COUNT_DELTA_CEILING * 100);
    }
  });

  it('FREEZEs on a drop over 20% — more likely a reindex than 800 expirations', () => {
    const probe = probeCount({
      preconditions: { ok: true },
      response: goodResponse(),
      lastGoodActive: 6000,
    });
    expect(probe.result).toBe('freeze');
  });

  it('takes the last good run as the denominator, never the new value', () => {
    // Written as abs(new-old)/new this divides by zero on exactly the C3 response.
    const probe = probeCount({
      preconditions: { ok: true },
      response: goodResponse(),
      lastGoodActive: 4236,
    });
    expect(probe.deltaPct).toBe(0);
    expect(Number.isFinite(probe.deltaPct ?? 0)).toBe(true);
  });

  it('sets a baseline on the first good run rather than inventing a delta', () => {
    const probe = probeCount({
      preconditions: { ok: true },
      response: goodResponse(),
      lastGoodActive: null,
    });
    expect(probe.result).toBe('pass');
    expect(probe.deltaPct).toBeNull();
  });
});

describe('probe 2 — the index alias, asymmetric on purpose', () => {
  const alias = 'db-prod-samdotgovsearch-wdol-dba_idxref_08112026';

  it('a roll with a stable count is normal — GSA reindexes', () => {
    const probe = probeAlias({
      observedAlias: 'db-prod-samdotgovsearch-wdol-dba_idxref_08182026',
      lastAlias: alias,
      lastAliasChangedAt: null,
      countDeltaPct: 0.1,
      now: NOW,
    });
    expect(probe.result).toBe('pass');
  });

  it('a roll WITH a count move FREEZEs — a reindex we may be reading mid-flight', () => {
    const probe = probeAlias({
      observedAlias: 'db-prod-samdotgovsearch-wdol-dba_idxref_08182026',
      lastAlias: alias,
      lastAliasChangedAt: null,
      countDeltaPct: 3,
      now: NOW,
    });
    expect(probe.result).toBe('freeze');
    expect(probe.detail).toContain('two correlated changes at once');
  });

  it('warns when the alias has been frozen for over 21 days', () => {
    const probe = probeAlias({
      observedAlias: alias,
      lastAlias: alias,
      lastAliasChangedAt: new Date('2026-07-01T00:00:00Z'),
      countDeltaPct: 0,
      now: NOW,
    });
    expect(probe.result).toBe('warn');
    expect(probe.detail).toContain('indexing pipeline has stopped');
  });
});

describe('probe 3 — silent republication is the dangerous case', () => {
  const known = sha256Hex('a'.repeat(64));
  const changed = sha256Hex('b'.repeat(64));

  it('passes when hashes are stable', () => {
    const probe = probeContentHash([
      {
        wdNumber: 'VA20260195',
        knownRevision: 2,
        observedRevision: 2,
        knownCanonicalSha256: known,
        observedCanonicalSha256: known,
        httpStatus: 200,
      },
    ]);
    expect(probe.result).toBe('pass');
  });

  it('treats a changed hash WITH a revision bump as an ordinary publication', () => {
    const probe = probeContentHash([
      {
        wdNumber: 'VA20260195',
        knownRevision: 2,
        observedRevision: 3,
        knownCanonicalSha256: known,
        observedCanonicalSha256: changed,
        httpStatus: 200,
      },
    ]);
    expect(probe.result).toBe('pass');
  });

  it('FREEZEs on a changed hash at an UNCHANGED revision', () => {
    const probe = probeContentHash([
      {
        wdNumber: 'VA20260195',
        knownRevision: 2,
        observedRevision: 2,
        knownCanonicalSha256: known,
        observedCanonicalSha256: changed,
        httpStatus: 200,
      },
    ]);
    expect(probe.result).toBe('freeze');
    expect(probe.detail).toContain('silent republication');
  });

  it('HOLDs on a 404 for a determination that answered 200 yesterday', () => {
    const probe = probeContentHash([
      {
        wdNumber: 'VA20260195',
        knownRevision: 2,
        observedRevision: null,
        knownCanonicalSha256: known,
        observedCanonicalSha256: null,
        httpStatus: 404,
      },
    ]);
    expect(probe.result).toBe('fail');
  });
});

describe('probe 4 — the publisher\'s own assertion, which NEVER blocks', () => {
  it('reports an index that is behind the publisher, and blocks nothing', () => {
    const probe = probePublisherRevision([
      {
        wdNumber: 'VA20260195',
        indexRevision: 2,
        nextRevisionFound: true,
        nextModTableLast: 3,
        nextHeaderDate: '2026-09-01',
        currentHeaderDate: '2026-08-06',
      },
    ]);
    expect(probe.result).toBe('warn');
    expect(probe.detail).toContain('nothing is blocked');
    // The disposition of a warn is still `promote`: this is good news.
    expect(dispositionOf([probe])).toBe('promote');
  });

  it('passes when the index and the publisher agree', () => {
    const probe = probePublisherRevision([
      {
        wdNumber: 'VA20260195',
        indexRevision: 2,
        nextRevisionFound: false,
        nextModTableLast: null,
        nextHeaderDate: null,
        currentHeaderDate: '2026-08-06',
      },
    ]);
    expect(probe.result).toBe('pass');
  });
});

describe('disposition — HELD is the snapshot, FROZEN is the product', () => {
  it('freeze beats fail beats pass', () => {
    const make = (result: 'pass' | 'warn' | 'fail' | 'freeze') =>
      ({
        probe: 'count' as const,
        result,
        observed: {},
        expected: {},
        deltaPct: null,
        detail: '',
      });
    expect(dispositionOf([make('pass'), make('warn')])).toBe('promote');
    expect(dispositionOf([make('pass'), make('fail')])).toBe('held');
    expect(dispositionOf([make('fail'), make('freeze')])).toBe('frozen');
  });
});

describe('§10.6 — the register', () => {
  it('is internally consistent', () => {
    expect(() => assertRegisterConsistent()).not.toThrow();
  });

  it('keeps the two withdrawn rows, disarmed, with their measured red rates', () => {
    const standard = registerRow('standard_flag_disagreement');
    expect(standard?.withdrawn).toBe(true);
    expect(standard?.armed).toBe(false);
    expect(standard?.blockingPower).toBe('none');
    expect(standard?.redRatePct).toBe(100);
    expect(standard?.sampleSize).toBe(200);

    const rowCount = registerRow('mod_table_rows_eq_revision_plus_one');
    expect(rowCount?.withdrawn).toBe(true);
    expect(rowCount?.redRatePct).toBe(17);
  });

  /** Found while building the parser, and registered the same way the other two
   *  were: with its rate, its denominator and its date. */
  it('carries the class-name bound as a third withdrawn row', () => {
    const bound = registerRow('class_name_max_200');
    expect(bound?.withdrawn).toBe(true);
    expect(bound?.redRatePct).toBeGreaterThan(RED_RATE_CEILING_PCT);
    expect(bound?.sampleSize).toBe(164);
    expect(bound?.note).toContain('740');
  });

  it('every armed blocking probe is at or under the 1% ceiling, or an honest blank', () => {
    for (const row of BLOCKING_PROBE_REGISTER) {
      if (!row.armed || row.blockingPower === 'none') continue;
      if (row.redRatePct === null) {
        // A blank is permitted only for a probe that fires on a change BETWEEN
        // nights and therefore cannot be sampled from one day's corpus (H10).
        expect(row.note.length).toBeGreaterThan(20);
        continue;
      }
      expect(row.redRatePct, row.probeKey).toBeLessThanOrEqual(RED_RATE_CEILING_PCT);
    }
  });

  it('every stated red rate carries its denominator', () => {
    for (const row of BLOCKING_PROBE_REGISTER) {
      if (row.redRatePct === null) continue;
      if (row.probeKey === 'g_canary_golden_suite') continue;
      expect(row.sampleSize, row.probeKey).not.toBeNull();
    }
  });

  it('the consistency assertion actually fires', () => {
    const bad: RegisterRow[] = [
      {
        probeKey: 'invented',
        specSection: '9.9',
        blockingPower: 'quarantine_wd',
        redRatePct: 42,
        sampleSize: 200,
        measuredOn: '2026-08-13',
        armed: true,
        withdrawn: false,
        note: 'a probe that fires on everything',
      },
    ];
    expect(() => assertRegisterConsistent(bad)).toThrow(RegisterError);
  });
});
