/**
 * THE PAID SURFACE'S READ OF THE GLOBAL MIRROR.
 *
 * AUTHORITY: `ARCHITECTURE.md` §3.3 (the mirror read model), §6.1–§6.2 (the pin is
 * established once and nothing after it consults SAM), `CORPUS_DESIGN.md` §8
 * (snapshot provenance and the inclusion proof), `USER_JOURNEY.md` §4.2 (find-my-WD
 * reads the LAST PROMOTED SNAPSHOT and makes no live SAM call, ever).
 *
 * ===========================================================================
 * WHY THIS IMPORTS `classificationsOf` RATHER THAN REIMPLEMENTING IT
 *
 * `ClassificationId` is branded with a private symbol whose only constructor is
 * `classificationIdFromMirrorRow` (`src/lib/types.ts`, invariant I2). A second
 * projection of `wd_classification_current` on the paid side would be a second place
 * that mints those ids, and the two would eventually disagree about `ordinal`,
 * `parser_version` or the verbatim label — at which point a picker candidate and a
 * rate-table row for the same classification would carry different identities and
 * `assertTableMatchesPin` would start refusing filings for a reason nothing prints.
 * One minting site is the invariant; sharing it across tiers is also what makes the
 * degraded path (`ARCHITECTURE.md` §3.8) the same code the free tier exercises daily.
 *
 * Nothing in this file touches a tenant table, and nothing in it writes.
 */

import { sql } from 'drizzle-orm';

import {
  activeDetermination,
  classificationsOf,
  corpusState,
  determinationsForCounty,
  revisionDiff,
  revisionsHeld,
  type ClassDiffRow,
  type CorpusState,
  type DeterminationRow,
} from '../../(free)/_data/mirror';
import { rowsOf, type Db, type Tx } from '@/db';
import { inclusionProof } from '@/corpus';
import {
  isoDate,
  sha256Hex,
  wdNumber as toWdNumber,
  type Classification,
  type IsoDate,
  type Sha256Hex,
  type SnapshotRef,
  type WdNumber,
} from '@/lib/types';

export {
  activeDetermination,
  classificationsOf,
  corpusState,
  determinationsForCounty,
  revisionDiff,
  revisionsHeld,
};
export type { ClassDiffRow, CorpusState, DeterminationRow };

// ===========================================================================
// The promoted snapshot — the identity every pin and every artifact carries
// ===========================================================================

export interface PromotedSnapshot {
  readonly snapshotId: number;
  readonly snapshotRef: SnapshotRef;
  readonly merkleRoot: Sha256Hex | null;
  readonly promotedAt: Date;
}

/**
 * The most recently promoted snapshot.
 *
 * `null` means nothing has ever passed every gate, which is a real state on a fresh
 * database and is why `createProject` can save a project without a pin rather than
 * failing. A pin references `corpus_snapshot(snapshot_id)` by foreign key, so this
 * returns the numeric id and not only the ref.
 */
export async function promotedSnapshot(db: Db | Tx): Promise<PromotedSnapshot | null> {
  const row = rowsOf<{
    snapshot_id: number | string;
    snapshot_ref: string;
    merkle_root: Buffer | Uint8Array | null;
    promoted_at: Date | string;
  }>(
    await db.execute(sql`
      SELECT snapshot_id, snapshot_ref, merkle_root, promoted_at
        FROM corpus_snapshot
       WHERE state IN ('promoted', 'superseded') AND promoted_at IS NOT NULL
       ORDER BY promoted_at DESC
       LIMIT 1
    `),
  )[0];
  if (!row) return null;
  return {
    snapshotId: Number(row.snapshot_id),
    snapshotRef: row.snapshot_ref as SnapshotRef,
    merkleRoot:
      row.merkle_root == null ? null : sha256Hex(Buffer.from(row.merkle_root).toString('hex')),
    promotedAt: row.promoted_at instanceof Date ? row.promoted_at : new Date(String(row.promoted_at)),
  };
}

// ===========================================================================
// Find-my-WD — S11
// ===========================================================================

export interface WdCandidate extends DeterminationRow {
  /** §4.2: each row shows "how many of YOUR crafts it lists". Computed from the
   *  account's own confirmed classification memory, never from anyone else's. */
  readonly yourCraftsListed: number;
  /** §4.3: the union-group warning is raised at PIN TIME rather than at generation,
   *  so a union shop is turned away at minute 3 instead of at minute 40 on a Friday. */
  readonly unionGroups: readonly string[];
  readonly groupCount: number;
}

/**
 * Candidate determinations for a county and construction type, from the last
 * promoted snapshot. No live SAM call — ADR-003, and the sequence diagram in §4.2
 * says so twice.
 */
export async function findWdCandidates(
  db: Db | Tx,
  input: {
    readonly stateCode: string;
    readonly countyName: string;
    readonly constructionType?: string | null;
    /** Normalized payroll titles this account has already confirmed somewhere. */
    readonly yourClassNorms?: readonly string[];
  },
): Promise<readonly WdCandidate[]> {
  const rows = await determinationsForCounty(db as Db, {
    stateCode: input.stateCode,
    countyName: input.countyName,
  });
  const wanted =
    input.constructionType == null || input.constructionType === ''
      ? rows
      : rows.filter((row) => row.constructionType === input.constructionType);

  const yours = new Set(input.yourClassNorms ?? []);
  const out: WdCandidate[] = [];
  for (const row of wanted) {
    const classifications = await classificationsOf(db as Db, row.wdNumber, row.revision);
    const unionGroups = [
      ...new Set(
        classifications
          .filter((c) => c.identifierKind === 'union' || c.identifierKind === 'union_average')
          .map((c) => c.rateIdentifier),
      ),
    ].sort();
    const groups = new Set(classifications.map((c) => c.rateIdentifier));
    out.push({
      ...row,
      unionGroups,
      groupCount: groups.size,
      yourCraftsListed: classifications.filter((c) => yours.has(c.classNameNorm)).length,
    });
  }
  return out;
}

// ===========================================================================
// Supersession — J8's input
// ===========================================================================

export interface NewerRevision {
  readonly revision: number;
  readonly publishDate: IsoDate;
}

/** The newest active revision of a determination, when it is later than the pinned
 *  one. `null` means the pin is current, which is the common case and the quiet one. */
export async function newerRevisionThan(
  db: Db | Tx,
  wd: WdNumber,
  pinnedRevision: number,
): Promise<NewerRevision | null> {
  const row = rowsOf<{ revision: number | string; publish_date: string | Date }>(
    await db.execute(sql`
      SELECT revision, publish_date
        FROM wd_revision
       WHERE wd_number = ${String(wd)}
         AND superseded_on IS NULL
         AND is_active_upstream
         AND parse_status = 'parsed'
       ORDER BY revision DESC
       LIMIT 1
    `),
  )[0];
  if (!row) return null;
  const revision = Number(row.revision);
  if (revision <= pinnedRevision) return null;
  return {
    revision,
    publishDate: isoDate(
      row.publish_date instanceof Date
        ? row.publish_date.toISOString().slice(0, 10)
        : String(row.publish_date).slice(0, 10),
    ),
  };
}

// ===========================================================================
// Provenance — the inclusion proof stamped into every paid artifact
// ===========================================================================

export interface LeafProof {
  readonly leafIndex: number;
  readonly siblings: readonly Sha256Hex[];
}

/**
 * The Merkle inclusion proof for one determination revision inside one snapshot.
 *
 * `CORPUS_DESIGN.md` §8: the proof is what lets a reader check, eighteen months
 * later and with no Ratepin code, that the determination the artifact names was in
 * the snapshot the artifact names. It is computed from `snapshot_member` rather than
 * stored, because the tree is a pure function of the membership and a stored proof
 * is a second copy that can rot.
 *
 * A snapshot with no membership yields `leafIndex: -1` and an empty proof rather
 * than throwing: a fresh database legitimately has one, and the artifact prints the
 * absence rather than failing to render.
 */
export async function proofFor(
  db: Db | Tx,
  input: { readonly snapshotId: number; readonly wdNumber: WdNumber; readonly revision: number },
): Promise<LeafProof> {
  const rows = rowsOf<{ wd_number: string; revision: number | string; canonical_sha256: string }>(
    await db.execute(sql`
      SELECT m.wd_number, m.revision, encode(r.canonical_sha256, 'hex') AS canonical_sha256
        FROM snapshot_member m
        JOIN wd_revision r ON r.wd_number = m.wd_number AND r.revision = m.revision
       WHERE m.snapshot_id = ${input.snapshotId}
       ORDER BY m.wd_number, m.revision
    `),
  );
  if (rows.length === 0) return { leafIndex: -1, siblings: [] };

  const leaves = rows.map((row) => ({
    wdNumber: toWdNumber(row.wd_number),
    revision: Number(row.revision),
    canonicalSha256: sha256Hex(row.canonical_sha256),
  }));
  const index = leaves.findIndex(
    (leaf) => leaf.wdNumber === input.wdNumber && leaf.revision === input.revision,
  );
  if (index < 0) return { leafIndex: -1, siblings: [] };

  const proof = inclusionProof(leaves, index);
  return { leafIndex: index, siblings: proof.siblings };
}

/** The determination text's own digest, which the footer prints truncated. */
export async function canonicalShaOf(
  db: Db | Tx,
  wd: WdNumber,
  revision: number,
): Promise<Sha256Hex | null> {
  const row = rowsOf<{ canonical_sha256: string }>(
    await db.execute(sql`
      SELECT encode(canonical_sha256, 'hex') AS canonical_sha256
        FROM wd_revision WHERE wd_number = ${String(wd)} AND revision = ${revision}
    `),
  )[0];
  return row ? sha256Hex(row.canonical_sha256) : null;
}

export type { Classification };
