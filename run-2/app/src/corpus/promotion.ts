/**
 * §9 — THE NIGHTLY JOB AND THE PROMOTION STATE MACHINE.
 *
 * AUTHORITY: `CORPUS_DESIGN.md` §9.2 (the stages), §9.3 (the machine), §9.4 (the
 * ten gates), §9.5 (the blocking rule), §9.6 (rollback).
 *
 *   OPEN -> INDEXED -> FETCHED -> PARSED -> RECONCILED -> CANARIED -> PROMOTED
 *                \        \         \           \             \
 *                 `------- HELD -----'           `- QUARANTINE  `- HELD
 *                  (or FROZEN, which is product-scoped)   (per WD)
 *
 * ---------------------------------------------------------------------------
 * THE DISTINCTION THE WHOLE MACHINE IS BUILT AROUND
 *
 * **`HELD` is about THIS SNAPSHOT. `FROZEN` is about THE PRODUCT.**
 *
 * A held snapshot is an ordinary event — a WD arrived malformed, a parse rule
 * tripped — and the customer sees nothing except an older `corpus_verified_at`. A
 * frozen product is an emergency: we have evidence the upstream is behaving in a
 * way we do not understand, so we stop making NEW claims while continuing to serve
 * OLD ones. Neither state routes to a human, and neither blocks a filing on an
 * already-pinned project.
 *
 * A per-WD QUARANTINE is narrower still: that determination's previous promoted
 * revision stays the mirror's answer, its rate assertions narrow to that revision
 * with its date, and the rest of the snapshot proceeds.
 *
 * ---------------------------------------------------------------------------
 * WHY THE FRESHNESS CLOCK KEEPS RUNNING ON HELD (§9.2, `HELD`)
 *
 * This is the crucial detail and it is easy to get backwards: **a job that fails
 * every night for four days must produce the same customer-visible outcome as a job
 * that did not run at all**, or the staleness guarantee is a lie. So HELD writes no
 * `promoted_at`, and `corpus_verified_at` — which is `max(promoted_at)` — does not
 * move. The banner ages, the credit accrues, and nobody has to notice.
 *
 * ---------------------------------------------------------------------------
 * WHY PROMOTION IS ONE TRANSACTION
 *
 * There is no window in which half a snapshot is readable. The Merkle root, the
 * `snapshot_member` rows, the state flip, the previous snapshot's supersession and
 * the materialized-view refresh all commit together, and
 * `corpus_snapshot_current` — a unique partial index on `state = 'promoted'` —
 * makes two simultaneous promotions impossible at the database level rather than by
 * the job's own care.
 */

import { sql } from 'drizzle-orm';

import type { Db } from '@/db';
import type { WdNumber } from '@/lib/types';

import { canonicalise, decomposeWdNumber } from './canonical';
import { refreshCountyClassIndex } from './county-index';
import {
  evaluateParseQuarantine,
  parseDetermination,
  validateModTable,
} from './determination';
import { dispositionOf, probeAlias, probeCount, type ProbeDisposition } from './probes';
import { assertBlockingSetFrozen, reconcile } from './reconcile';
import { assertRegisterConsistent } from './register';
import { SamClient } from './sam/client';
import { buildMerkleTree, snapshotRefFor } from './snapshot';
import * as store from './store';
import type {
  CanaryRunner,
  DocumentRecord,
  FetchedBlob,
  IndexRecord,
  ParsedDetermination,
  ProbeOutcome,
  QuarantineReason,
  SnapshotLeaf,
} from './types';

export interface IngestOptions {
  readonly db: Db;
  readonly client: SamClient;
  /** G1's gate, injected: the golden payroll suite belongs to the engine, and
   *  `promotion/**` must not import `engine/**`. */
  readonly canary: CanaryRunner;
  readonly now?: () => Date;
  /** Bounds the per-night document work in tests and in the first runs. */
  readonly maxDocumentsPerRun?: number;
  /** Path C is fetched for every revision that will become current (§9.5's
   *  missing-path rules permit `single_path` for BACKFILL only). */
  readonly fetchArchive?: boolean;
  /** `ingest.sam.backfill` only: walk from revision 0 rather than from the index's
   *  current revision. The nightly job never sets it — see the walk below. */
  readonly backfillHistory?: boolean;
}

export interface QuarantinedWd {
  readonly wdNumber: WdNumber;
  readonly revision: number;
  readonly reason: QuarantineReason | 'parse_rule_breach';
  readonly detail: string;
}

export interface IngestResult {
  readonly snapshotId: number;
  readonly snapshotRef: string;
  readonly state: 'promoted' | 'held' | 'frozen';
  readonly disposition: ProbeDisposition;
  readonly probes: readonly ProbeOutcome[];
  readonly newRevisions: number;
  readonly blockingVariances: number;
  readonly quarantined: readonly QuarantinedWd[];
  readonly merkleRoot: string | null;
  readonly holdReason: string | null;
  readonly goldenSuite: { readonly pass: boolean; readonly lines: number } | null;
}

/**
 * THE NIGHTLY RUN.
 *
 * Returns rather than throws on every gate outcome: a held snapshot is a data
 * state, not an exception (invariant 4). It throws only on a programming error —
 * an unrecognised upstream shape, a database failure — because a caller who can
 * neither show it nor act on it has no business pattern-matching on it.
 */
export async function runIngest(options: IngestOptions): Promise<IngestResult> {
  // The CI assertions, executed again at run time. They cost microseconds and they
  // are the difference between "the blocking set is three fields" being a property
  // of the system and being a property of a document nobody re-reads.
  assertBlockingSetFrozen();
  assertRegisterConsistent();

  const now = options.now ?? ((): Date => new Date());
  const db = options.db;
  const snapshotRef = snapshotRefFor(now());
  const snapshotId = await store.openSnapshot(db, snapshotRef);

  const probes: ProbeOutcome[] = [];
  const quarantined: QuarantinedWd[] = [];
  let blockingVariances = 0;
  let newRevisions = 0;

  const held = async (reason: string, state: 'held' | 'frozen' = 'held'): Promise<IngestResult> => {
    await store.setSnapshotState(db, snapshotId, state === 'frozen' ? 'held' : 'held', {
      holdReason: reason,
      probeResults: probes,
      blockingVariances,
      quarantined: quarantined.length,
    });
    return {
      snapshotId,
      snapshotRef,
      state,
      disposition: state === 'frozen' ? 'frozen' : 'held',
      probes,
      newRevisions,
      blockingVariances,
      quarantined,
      merkleRoot: null,
      holdReason: reason,
      goldenSuite: null,
    };
  };

  // ---------------------------------------------------------------- INDEXED
  const indexFetch = await options.client.fetchActiveIndex();
  await store.insertBlob(db, indexFetch.blob);

  const lastGood = await store.lastGoodActiveCount(db);
  const countProbe = probeCount({
    preconditions: indexFetch.preconditions,
    response: indexFetch.response,
    lastGoodActive: lastGood,
  });
  probes.push(countProbe);
  await store.insertProbeRun(db, snapshotId, countProbe);

  if (!indexFetch.preconditions.ok) {
    return held(
      `path A precondition ${indexFetch.preconditions.precondition}: ${indexFetch.preconditions.detail}`,
    );
  }

  const observedAlias = indexFetch.response.records.find((r) => r.indexAlias !== null)?.indexAlias ?? null;
  const aliasProbe = probeAlias({
    observedAlias,
    lastAlias: await store.lastIndexAlias(db),
    lastAliasChangedAt: null,
    countDeltaPct: countProbe.deltaPct,
    now: now(),
  });
  probes.push(aliasProbe);
  const aliasRunId = await store.insertProbeRun(db, snapshotId, aliasProbe);

  await store.setSnapshotState(db, snapshotId, 'indexed', {
    indexAlias: observedAlias,
    indexTotalActive: indexFetch.response.page.totalElements,
  });
  await store.insertIndexRecords(db, snapshotId, indexFetch.response.records);

  // `totalPages > 1` is NOT an error — it means the active set has outgrown `size`,
  // which is corpus growth. The single-request path stays the design and the
  // state-partitioned walk stays a tested fallback (§2.1 consequence 3).
  if (!indexFetch.singlePage.ok) {
    return held(`index: ${indexFetch.singlePage.detail}`);
  }

  const disposition = dispositionOf(probes);
  if (disposition === 'frozen') {
    const frozen = probes.find((p) => p.result === 'freeze');
    await store.openFreeze(db, {
      probe: frozen?.probe ?? 'count',
      probeRunId: aliasRunId,
      bannerText: frozen?.detail ?? 'upstream behaviour is not understood',
    });
    return held(frozen?.detail ?? 'probe freeze', 'frozen');
  }
  if (disposition === 'held') {
    return held(probes.find((p) => p.result === 'fail')?.detail ?? 'probe failure');
  }

  // ---------------------------------------------------------------- FETCHED
  const marks = await store.highWaterMarks(db);
  const behind = indexFetch.response.records.filter((record) => {
    const mark = marks.get(record.wdNumber);
    return mark === undefined || record.revisionNumber > mark.revision;
  });
  const budget = options.maxDocumentsPerRun ?? behind.length;

  interface Candidate {
    readonly index: IndexRecord;
    readonly document: DocumentRecord;
    readonly blobB: FetchedBlob;
    readonly blobC: FetchedBlob | null;
    readonly archiveCanonical: string | null;
  }
  const candidates: Candidate[] = [];

  for (const record of behind.slice(0, budget)) {
    const mark = marks.get(record.wdNumber);
    /**
     * WHERE THE WALK STARTS, AND WHY IT IS NOT ZERO ON A FIRST SIGHTING.
     *
     * §9.2 `FETCHED` says "walk path B from our high-water + 1 upward until 404",
     * which assumes a prior mark. On a WD we have never seen there is none, and
     * starting at 0 would make the NIGHTLY job pull every historical revision of
     * every determination — 9,424 documents on night one, and ~348,000 across all
     * history. `ARCHITECTURE.md` §7.1 already separates that work:
     * `ingest.sam.backfill` is a continuous, throttled, lowest-priority job sliced
     * by state x fiscal year, with no promotion coupling. So the nightly job takes
     * the CURRENT revision and the backfill fills in history behind it.
     *
     * `backfillHistory` flips this for that job.
     */
    const from =
      mark !== undefined
        ? mark.revision + 1
        : options.backfillHistory === true
          ? 0
          : record.revisionNumber;
    const walk = await options.client.walkRevisions(record.wdNumber, from, record.revisionNumber);

    for (const fetch of walk.fetched) {
      await store.insertBlob(db, fetch.blob);
      if (!fetch.found) {
        // A 404 terminates the walk. A 404 for a revision the INDEX CLAIMS EXISTS
        // is `G-fetch`, and it quarantines that WD rather than holding the snapshot.
        if (fetch.httpStatus === 404 && from <= record.revisionNumber) {
          const reached = walk.fetched.filter((f) => f.found).length;
          if (reached === 0) {
            quarantined.push({
              wdNumber: record.wdNumber,
              revision: from,
              reason: 'document_missing',
              detail: `path B returned 404 for revision ${from}, which path A claims exists`,
            });
          }
        }
        continue;
      }

      let blobC: FetchedBlob | null = null;
      let archiveCanonical: string | null = null;
      if (options.fetchArchive !== false) {
        const archive = await options.client.fetchArchive(record.wdNumber, fetch.record.revisionNumber);
        if (archive) {
          await store.insertBlob(db, archive.blob);
          blobC = archive.blob;
          archiveCanonical = canonicalise(archive.text).sha256;
        }
      }

      candidates.push({
        index: record,
        document: fetch.record,
        blobB: fetch.blob,
        blobC,
        archiveCanonical,
      });
    }
  }
  await store.setSnapshotState(db, snapshotId, 'fetched');

  // ------------------------------------------------------- PARSED + RECONCILED
  interface Accepted {
    readonly candidate: Candidate;
    readonly parsed: ParsedDetermination;
  }
  const accepted: Accepted[] = [];

  for (const candidate of candidates) {
    const { document, index } = candidate;
    const parse = parseDetermination(document.canonicalText);
    if (!parse.ok) {
      quarantined.push({
        wdNumber: document.wdNumber,
        revision: document.revisionNumber,
        reason: 'parse_rule_breach',
        detail: parse.reason,
      });
      continue;
    }
    const parsed = parse.parsed;

    // G-modtable, in the SUFFIX form. The row-count form was red on 17% of the
    // live corpus and, being a CHECK, would have aborted the transaction (C6).
    const modTableCheck = validateModTable({
      table: parsed.modTable,
      revision: document.revisionNumber,
      headerDate: parsed.header.headerDate,
    });
    if (!modTableCheck.ok) {
      quarantined.push({
        wdNumber: document.wdNumber,
        revision: document.revisionNumber,
        reason: 'modtable_invalid',
        detail: modTableCheck.reason,
      });
      continue;
    }

    const mark = marks.get(document.wdNumber);
    const parseCheck = evaluateParseQuarantine({
      classifications: parsed.classifications,
      residue: parsed.residue,
      priorClassCount: mark?.classCount ?? null,
      canonicalLength: document.canonicalLength,
      priorCanonicalLength: mark?.canonicalLength ?? null,
    });
    if (!parseCheck.ok) {
      quarantined.push({
        wdNumber: document.wdNumber,
        revision: document.revisionNumber,
        reason: 'parse_rule_breach',
        detail: `${parseCheck.rule}: ${parseCheck.reason}`,
      });
      continue;
    }

    const verdict = reconcile({
      requestedWdNumber: document.wdNumber,
      revision: document.revisionNumber,
      index,
      document,
      headerWdNumber: parsed.header.wdNumber,
      headerDate: parsed.header.headerDate,
      modTable: parsed.modTable,
      archiveCanonicalSha256: candidate.archiveCanonical,
      isCurrentRevision: document.revisionNumber === index.revisionNumber,
      countyNamesFromProse:
        parsed.countyScope.kind === 'counties'
          ? parsed.countyScope.counties.map((c) => c.countyNameNorm)
          : [],
    });

    if (verdict.quarantine !== null) {
      quarantined.push({
        wdNumber: document.wdNumber,
        revision: document.revisionNumber,
        reason: verdict.quarantine,
        detail: verdict.detail ?? verdict.quarantine,
      });
      continue;
    }
    if (verdict.blocking.length > 0) {
      // TIER 1. Never publish either side of a disagreement: the snapshot HELDs and
      // the previous promoted revision stays the mirror's answer.
      blockingVariances += verdict.blocking.length;
      continue;
    }

    // Advisory variances are recorded and reported, never blocking, never shown.
    if (verdict.advisory.length > 0) {
      await store.insertAdvisoryVariances(
        db,
        snapshotId,
        document.wdNumber,
        document.revisionNumber,
        verdict.advisory,
      );
    }

    const identity = decomposeWdNumber(document.wdNumber);
    await store.insertRevision(db, {
      wdNumber: document.wdNumber,
      revision: document.revisionNumber,
      stateCode: identity.stateCode,
      wdYear: identity.year,
      shortName: document.shortName,
      sequenceNo: identity.sequence,
      // Path D's header, NOT path B's `publishDate`: on a superseded revision the
      // latter is the last day of effect. `wd_rev_dates` requires the two to agree.
      publishDate: parsed.header.headerDate,
      headerDate: parsed.header.headerDate,
      isActiveUpstream: document.active,
      canonicalSha256: document.canonicalSha256,
      canonicalLength: document.canonicalLength,
      blobA: indexFetch.blob.sha256,
      blobB: candidate.blobB.sha256,
      blobC: candidate.blobC?.sha256 ?? null,
      modTable: parsed.modTable,
      agreement: verdict.agreement,
      varianceDetail: verdict.advisory,
      parseStatus: 'parsed',
      classCount: parsed.classifications.length,
      standardIndex: index?.isStandard ?? null,
      standardDocument: document.standard,
      constructionTypes: document.constructionTypes,
    });
    await store.insertClassifications(
      db,
      document.wdNumber,
      document.revisionNumber,
      document.canonicalSha256,
      parsed.classifications,
    );
    await store.insertResidue(db, document.wdNumber, document.revisionNumber, parsed.residue);

    if (parsed.countyScope.kind === 'counties') {
      const codeByName = new Map(
        (index?.counties ?? []).map((c) => [
          c.value.replace(/\*+/g, '').trim().toUpperCase(),
          c.code,
        ]),
      );
      await store.insertCountyScope(
        db,
        document.wdNumber,
        document.revisionNumber,
        identity.stateCode,
        parsed.countyScope.counties.map((county) => ({
          countyName: county.countyName,
          countyNameNorm: county.countyNameNorm,
          independentCity: county.independentCity,
          countyCode: codeByName.get(county.countyNameNorm) ?? null,
          agreedWithIndex: codeByName.has(county.countyNameNorm),
        })),
        false,
      );
    } else if (parsed.countyScope.kind === 'statewide') {
      await store.insertCountyScope(db, document.wdNumber, document.revisionNumber, identity.stateCode, [], true);
    }
    // `unresolved` writes NO scope rows: the WD is excluded from the lookup index
    // and a project pinning it renders DRAFT — NOT CERTIFIABLE with the reason
    // shown. It does NOT fall back to a structured array measured wrong on 5.5%.

    if (mark && document.revisionNumber > mark.revision) {
      await store.markSuperseded(db, document.wdNumber, mark.revision, parsed.header.headerDate);
    }

    newRevisions += 1;
    accepted.push({ candidate, parsed });
  }

  await store.setSnapshotState(db, snapshotId, 'reconciled', {
    newRevisions,
    blockingVariances,
    quarantined: quarantined.length,
  });

  if (blockingVariances > 0) {
    return held(
      `${blockingVariances} blocking variance(s) on the three-field set ` +
        '{revision_number, publish_date, active_flag}; neither side published',
    );
  }

  // --------------------------------------------------------------- CANARIED
  // G1: 100% exact match against the golden payroll suite, re-scored against the
  // CANDIDATE corpus. This is the gate that catches "the corpus changed in a way
  // that changes money", which is the only kind of corpus change that can hurt a
  // customer.
  const canary = await options.canary();
  await store.setSnapshotState(db, snapshotId, 'canaried', {
    goldenSuitePass: canary.pass,
    goldenSuiteLines: canary.lines,
  });
  if (!canary.pass) {
    return held(`golden payroll suite: ${canary.detail}`);
  }

  // --------------------------------------------------------------- PROMOTED
  const leaves: readonly SnapshotLeaf[] = await store.promotedSnapshotLeaves(db);
  if (leaves.length === 0) {
    return held('no promotable determinations in the candidate corpus');
  }
  const tree = buildMerkleTree(leaves);

  await db.transaction(async (tx) => {
    await tx.execute(sql`
      UPDATE corpus_snapshot SET state = 'superseded', superseded_at = now()
      WHERE state = 'promoted'
    `);
    let leafIndex = 0;
    for (const leaf of leaves) {
      const { hashBytes } = await import('./canonical');
      const { leafHash } = await import('./snapshot');
      await tx.execute(sql`
        INSERT INTO snapshot_member (snapshot_id, leaf_index, wd_number, revision, leaf_hash)
        VALUES (${snapshotId}, ${leafIndex}, ${leaf.wdNumber}, ${leaf.revision},
                ${hashBytes(leafHash(leaf))})
        ON CONFLICT (snapshot_id, leaf_index) DO NOTHING
      `);
      leafIndex += 1;
    }
    const { hashBytes } = await import('./canonical');
    await tx.execute(sql`
      UPDATE corpus_snapshot SET
        state = 'promoted',
        promoted_at = now(),
        merkle_root = ${hashBytes(tree.root)},
        wd_revision_count = ${leaves.length},
        active_wd_count = ${indexFetch.response.page.totalElements},
        classification_count = (SELECT count(*)::int FROM wd_classification_current),
        probe_results = ${JSON.stringify(probes)}::jsonb,
        golden_suite_pass = true,
        golden_suite_lines = ${canary.lines}
      WHERE snapshot_id = ${snapshotId}
    `);
    await refreshCountyClassIndex(tx);
  });

  return {
    snapshotId,
    snapshotRef,
    state: 'promoted',
    disposition: 'promote',
    probes,
    newRevisions,
    blockingVariances,
    quarantined,
    merkleRoot: tree.root,
    holdReason: null,
    goldenSuite: { pass: canary.pass, lines: canary.lines },
  };
}

/**
 * §9.6 — ROLLBACK.
 *
 * **Artifacts already emitted are never revoked.** `artifact_provenance` rows point
 * at the rolled-back `snapshot_id`, and that is CORRECT: the artifact says what the
 * corpus said at generation time, which is the true and useful statement. What the
 * product does instead is surface the affected filings in the account's
 * rate-of-record archive with a dated note and a one-click regenerate. Rewriting
 * history to make a past artifact look right would destroy the only property that
 * makes the artifact worth anything.
 */
export async function rollbackSnapshot(db: Db, snapshotId: number, reason: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.execute(sql`
      UPDATE corpus_snapshot SET state = 'rolled_back', hold_reason = ${reason}
      WHERE snapshot_id = ${snapshotId} AND state = 'promoted'
    `);
    await tx.execute(sql`
      UPDATE corpus_snapshot SET state = 'promoted', superseded_at = NULL
      WHERE snapshot_id = (
        SELECT snapshot_id FROM corpus_snapshot
        WHERE state = 'superseded' ORDER BY promoted_at DESC NULLS LAST LIMIT 1
      )
    `);
  });
}
