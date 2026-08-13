/**
 * §10 — LIVENESS PROBES.
 *
 * AUTHORITY: `CORPUS_DESIGN.md` §10.1–§10.4. R1(c) specifies three independent
 * probes "any of which freezes new rate assertions and raises a dated in-product
 * banner". All three are implemented as specified. A fourth is added, because
 * Challenge C4 shows the first three share a failure domain: paths A, B and C share
 * `sam.gov` DNS, the same TLS termination, the same CloudFront distribution and the
 * same GSA authorization plane, so N-version reasoning does not apply to them. Only
 * path D — the determination's own text — is written by the publisher, and probe 4
 * is the only probe that can tell us the serving infrastructure is BEHIND the
 * publisher.
 *
 * NONE OF THESE BLOCKS A FILING. `HELD` advances the freshness clock and narrows a
 * sentence; `FROZEN` suppresses NEW rate assertions and serves every pinned one.
 * That asymmetry is why §10.6 runs them armed from night one despite their red
 * rates being unmeasurable from a single day's corpus (H10): a false positive costs
 * a dated banner and, past 72 hours, a credit we owe anyway under D7; a false
 * negative costs a customer a rate we never verified.
 */

import type { Sha256Hex } from '@/lib/types';

import type { IndexResponse, ProbeOutcome } from './types';
import type { IndexPreconditionResult } from './sam/parse';

/** G3's threshold. */
export const COUNT_DELTA_CEILING = 0.005;
/** A drop this large is more likely an upstream reindex mid-flight than 800
 *  determinations expiring in one night. */
export const COUNT_DROP_FREEZE = 0.2;
/** §10.2. The observed reindex cadence is frequent; a frozen alias may mean the
 *  pipeline behind it has stopped, which would make the index quietly stale while
 *  returning 200s. */
export const ALIAS_STALE_DAYS = 21;
/** The baseline recorded 2026-08-13 and re-verified while building this. */
export const BASELINE_ACTIVE = 4236;
export const BASELINE_TOTAL = 85_426;

// ===========================================================================
// Probe 1 — record count against the last good run
// ===========================================================================

export interface CountProbeInput {
  readonly preconditions: IndexPreconditionResult;
  readonly response: IndexResponse;
  readonly lastGoodActive: number | null;
}

export function probeCount(input: CountProbeInput): ProbeOutcome {
  const observedActive = input.response.page.totalElements;
  const expected = { lastGoodActive: input.lastGoodActive, ceilingPct: COUNT_DELTA_CEILING * 100 };

  // Preconditions first, and a failure is NEVER a delta. `totalElements: 0` with
  // HTTP 200 is the failure this exists to catch (C3).
  if (!input.preconditions.ok) {
    return {
      probe: 'count',
      result: 'fail',
      observed: { precondition: input.preconditions.precondition, detail: input.preconditions.detail },
      expected,
      deltaPct: null,
      detail: `precondition ${input.preconditions.precondition} failed: ${input.preconditions.detail}`,
    };
  }

  if (input.lastGoodActive === null || input.lastGoodActive === 0) {
    return {
      probe: 'count',
      result: 'pass',
      observed: { activeTotal: observedActive },
      expected,
      deltaPct: null,
      detail: `first good run: baseline set at ${observedActive} active determinations`,
    };
  }

  // The denominator is the LAST GOOD RUN, never the new value: writing it as
  // abs(new-old)/new divides by zero on exactly the C3 response.
  const delta = (observedActive - input.lastGoodActive) / input.lastGoodActive;
  const deltaPct = delta * 100;

  if (delta <= -COUNT_DROP_FREEZE) {
    return {
      probe: 'count',
      result: 'freeze',
      observed: { activeTotal: observedActive },
      expected,
      deltaPct,
      detail:
        `active count dropped ${Math.abs(deltaPct).toFixed(2)}% (${input.lastGoodActive} -> ` +
        `${observedActive}) — a sudden shrink of this size is more likely a reindex mid-flight ` +
        'than determinations expiring',
    };
  }
  if (Math.abs(delta) > COUNT_DELTA_CEILING) {
    return {
      probe: 'count',
      result: 'fail',
      observed: { activeTotal: observedActive },
      expected,
      deltaPct,
      detail:
        `active count moved ${deltaPct.toFixed(3)}% (${input.lastGoodActive} -> ${observedActive}), ` +
        `over the ${(COUNT_DELTA_CEILING * 100).toFixed(1)}% G3 ceiling`,
    };
  }
  return {
    probe: 'count',
    result: 'pass',
    observed: { activeTotal: observedActive },
    expected,
    deltaPct,
    detail: `active count ${observedActive}, delta ${deltaPct.toFixed(3)}%`,
  };
}

// ===========================================================================
// Probe 2 — the index alias string
// ===========================================================================

export interface AliasProbeInput {
  readonly observedAlias: string | null;
  readonly lastAlias: string | null;
  readonly lastAliasChangedAt: Date | null;
  readonly countDeltaPct: number | null;
  readonly now: Date;
}

/**
 * Deliberately ASYMMETRIC (§10.2):
 *   alias changed, count within 0.5%          -> normal. GSA reindexes.
 *   alias unchanged for > 21 days             -> warn. The pipeline behind it may
 *                                                have stopped, leaving the index
 *                                                quietly stale while returning 200s.
 *   alias changed AND count moved > 0.5%      -> FROZEN. Two correlated changes at
 *                                                once is a reindex we may be
 *                                                reading mid-flight, and reading a
 *                                                partially populated index is
 *                                                exactly how a completeness check
 *                                                passes while the corpus is wrong.
 */
export function probeAlias(input: AliasProbeInput): ProbeOutcome {
  const observed = { alias: input.observedAlias };
  const expected = { alias: input.lastAlias, staleDays: ALIAS_STALE_DAYS };

  if (input.observedAlias === null) {
    return {
      probe: 'alias',
      result: 'fail',
      observed,
      expected,
      deltaPct: null,
      detail: 'no _index alias present on any record',
    };
  }
  if (input.lastAlias === null) {
    return {
      probe: 'alias',
      result: 'pass',
      observed,
      expected,
      deltaPct: null,
      detail: `first observation: alias baseline ${input.observedAlias}`,
    };
  }

  const changed = input.observedAlias !== input.lastAlias;
  const countMoved =
    input.countDeltaPct !== null && Math.abs(input.countDeltaPct) > COUNT_DELTA_CEILING * 100;

  if (changed && countMoved) {
    return {
      probe: 'alias',
      result: 'freeze',
      observed,
      expected,
      deltaPct: input.countDeltaPct,
      detail:
        `alias rolled ${input.lastAlias} -> ${input.observedAlias} AND the active count moved ` +
        `${(input.countDeltaPct ?? 0).toFixed(3)}% — two correlated changes at once`,
    };
  }
  if (changed) {
    return {
      probe: 'alias',
      result: 'pass',
      observed,
      expected,
      deltaPct: input.countDeltaPct,
      detail: `alias rolled ${input.lastAlias} -> ${input.observedAlias}; count within tolerance`,
    };
  }

  if (input.lastAliasChangedAt) {
    const days = (input.now.getTime() - input.lastAliasChangedAt.getTime()) / 86_400_000;
    if (days > ALIAS_STALE_DAYS) {
      return {
        probe: 'alias',
        result: 'warn',
        observed,
        expected,
        deltaPct: input.countDeltaPct,
        detail:
          `alias unchanged for ${days.toFixed(0)} days — a frozen alias may mean the indexing ` +
          'pipeline has stopped while the endpoint keeps returning 200s',
      };
    }
  }
  return {
    probe: 'alias',
    result: 'pass',
    observed,
    expected,
    deltaPct: input.countDeltaPct,
    detail: `alias unchanged (${input.observedAlias})`,
  };
}

// ===========================================================================
// Probe 3 — per-WD content hash
// ===========================================================================

export interface ContentHashObservation {
  readonly wdNumber: string;
  readonly knownRevision: number;
  readonly observedRevision: number | null;
  readonly knownCanonicalSha256: Sha256Hex;
  readonly observedCanonicalSha256: Sha256Hex | null;
  readonly httpStatus: number;
}

/**
 * The dangerous case is the third one: **hash changed AND revision unchanged** is
 * SILENT REPUBLICATION, the single most dangerous thing SAM could do to us, and it
 * is also what `wd_revision_guard()` catches from the other direction. There is no
 * code path in which a republished revision quietly replaces the one we already
 * footered onto a filed WH-347.
 */
export function probeContentHash(observations: readonly ContentHashObservation[]): ProbeOutcome {
  const republished: string[] = [];
  const vanished: string[] = [];
  const advanced: string[] = [];

  for (const o of observations) {
    if (o.httpStatus === 404) {
      vanished.push(o.wdNumber);
      continue;
    }
    if (o.observedCanonicalSha256 === null) continue;
    if (o.observedCanonicalSha256 === o.knownCanonicalSha256) continue;
    if (o.observedRevision !== null && o.observedRevision > o.knownRevision) {
      advanced.push(`${o.wdNumber}@${o.knownRevision}->${o.observedRevision}`);
      continue;
    }
    republished.push(`${o.wdNumber}@${o.knownRevision}`);
  }

  const observed = { canarySize: observations.length, republished, vanished, advanced };
  const expected = { republished: [], vanished: [] };

  if (republished.length > 0) {
    return {
      probe: 'content_hash',
      result: 'freeze',
      observed,
      expected,
      deltaPct: null,
      detail:
        `silent republication: ${republished.join(', ')} — the canonical text changed at an ` +
        'unchanged revision. New rate assertions stop product-wide until three consecutive ' +
        'fetches reproduce a stable hash.',
    };
  }
  if (vanished.length > 0) {
    return {
      probe: 'content_hash',
      result: 'fail',
      observed,
      expected,
      deltaPct: null,
      detail: `404 on determinations that answered 200 yesterday: ${vanished.join(', ')}`,
    };
  }
  return {
    probe: 'content_hash',
    result: 'pass',
    observed,
    expected,
    deltaPct: null,
    detail: `${observations.length} canary determinations, hashes stable`,
  };
}

// ===========================================================================
// Probe 4 — the publisher's own assertion (added; C4's answer)
// ===========================================================================

export interface PublisherRevisionObservation {
  readonly wdNumber: string;
  readonly indexRevision: number;
  /** The result of fetching `revision + 1` on path B. */
  readonly nextRevisionFound: boolean;
  readonly nextModTableLast: number | null;
  readonly nextHeaderDate: string | null;
  readonly currentHeaderDate: string | null;
}

/**
 * **BY DESIGN THIS PROBE NEVER BLOCKS ANYTHING.** A fresher-than-expected revision
 * is good news: it raises the WD-change alert immediately (D4, D8 channel 3) and
 * pulls that WD's ingest forward rather than waiting for path A to catch up.
 *
 * Its second use is measuring index lag. The distribution of
 * `(path A indexed date) − (path D publication date)` across the canary set is a
 * directly observed quality metric for our own upstream, and the honest denominator
 * for any future latency claim — which is, notably, the central latency claim of
 * the whole product, and which ships measured or not at all (H9).
 */
export function probePublisherRevision(
  observations: readonly PublisherRevisionObservation[],
): ProbeOutcome {
  const ahead = observations.filter(
    (o) =>
      o.nextRevisionFound &&
      o.nextModTableLast === o.indexRevision + 1 &&
      o.nextHeaderDate !== null &&
      o.currentHeaderDate !== null &&
      o.nextHeaderDate > o.currentHeaderDate,
  );

  return {
    probe: 'publisher_revision',
    result: ahead.length > 0 ? 'warn' : 'pass',
    observed: {
      canarySize: observations.length,
      indexBehindOn: ahead.map((o) => `${o.wdNumber}@${o.indexRevision + 1}`),
    },
    expected: { indexBehindOn: [] },
    deltaPct: null,
    detail:
      ahead.length > 0
        ? `${ahead.length} determination(s) have a revision the index has not yet caught: ` +
          `${ahead.map((o) => `${o.wdNumber} r${o.indexRevision + 1}`).join(', ')}. ` +
          'Ingest is pulled forward; nothing is blocked.'
        : `${observations.length} canary determinations; the index and the publisher agree`,
  };
}

// ===========================================================================
// Aggregation
// ===========================================================================

export type ProbeDisposition = 'promote' | 'held' | 'frozen';

/** `HELD` is about THIS SNAPSHOT; `FROZEN` is about THE PRODUCT. A held snapshot is
 *  an ordinary event and the customer sees nothing but an older
 *  `corpus_verified_at`; a frozen product is an emergency in which we stop making
 *  NEW claims while continuing to serve old ones. Neither routes to a human. */
export function dispositionOf(outcomes: readonly ProbeOutcome[]): ProbeDisposition {
  if (outcomes.some((o) => o.result === 'freeze')) return 'frozen';
  if (outcomes.some((o) => o.result === 'fail')) return 'held';
  return 'promote';
}
