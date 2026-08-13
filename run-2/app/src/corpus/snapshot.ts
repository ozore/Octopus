/**
 * §8 — SNAPSHOTS, HASHING, AND REPRODUCING AN ARTIFACT EIGHTEEN MONTHS LATER.
 *
 * AUTHORITY: `CORPUS_DESIGN.md` §8.1 (the Merkle construction), §8.2 (the DDL),
 * §8.3 (the walkthrough), §8.4 (what the snapshot does NOT promise).
 *
 * ---------------------------------------------------------------------------
 * WHY A HASH TREE AND NOT A ROW COUNT
 *
 * R3 requires that "a dispute eighteen months later is answered from stored data
 * rather than reconstruction". Storing the data is necessary and not sufficient:
 * the customer's counterparty is a general contractor or a WHD investigator who has
 * no reason to trust our database. What makes the answer credible is that the
 * artifact carries, in its footer, **a commitment made before the dispute existed**.
 *
 * Constructed as Certificate Transparency constructs its log, so inclusion proofs
 * are short and standard (RFC 6962 §2.1; Merkle, CRYPTO '87):
 *
 *   leaf     SHA-256(0x00 || wd_number || 0x1f || revision_be16 || 0x1f || canonical_sha256)
 *   interior SHA-256(0x01 || left || right)
 *   odd node promoted unchanged
 *
 * Leaves are sorted by `(wd_number, revision)` so the tree is a deterministic
 * function of the promoted set: the same corpus produces the same root on any
 * machine, in any year, which is what makes the eighteen-month check meaningful.
 *
 * An inclusion proof over the active corpus is `ceil(log2(9,424)) = 14` hashes,
 * about 450 bytes, and `verifyInclusion` needs nothing from Ratepin: a sceptical GC
 * can fetch the determination from `sam.gov` themselves (Challenge C1 turns out to
 * be a feature here — the archive IS public), canonicalise it, and fold the proof.
 *
 * ---------------------------------------------------------------------------
 * WHAT IT DOES NOT PROMISE (§8.4)
 *
 * The snapshot commits to WHAT WE HELD. It does not commit to what SAM published,
 * because we cannot prove a negative about an endpoint we do not control. And it
 * asserts nothing about which determination governs a contract — that turns on the
 * contracting officer's incorporation under FAR 22.404-6, which we cannot observe.
 * There is no `is_effective` column anywhere in this schema, and there is no
 * function in this module that would compute one.
 */

import { createHash } from 'node:crypto';

import { type Sha256Hex, sha256Hex, type WdNumber } from '@/lib/types';

import type { InclusionProof, MerkleTree, SnapshotLeaf } from './types';

const LEAF_PREFIX = 0x00;
const NODE_PREFIX = 0x01;
const SEPARATOR = 0x1f;

/** `SHA-256(0x00 || wd_number || 0x1f || revision_be16 || 0x1f || canonical_sha256)` */
export function leafHash(leaf: SnapshotLeaf): Sha256Hex {
  const revision = Buffer.alloc(2);
  revision.writeUInt16BE(leaf.revision, 0);
  const digest = createHash('sha256')
    .update(Buffer.from([LEAF_PREFIX]))
    .update(Buffer.from(leaf.wdNumber, 'utf8'))
    .update(Buffer.from([SEPARATOR]))
    .update(revision)
    .update(Buffer.from([SEPARATOR]))
    .update(Buffer.from(leaf.canonicalSha256, 'hex'))
    .digest('hex');
  return sha256Hex(digest);
}

function nodeHash(left: Sha256Hex, right: Sha256Hex): Sha256Hex {
  const digest = createHash('sha256')
    .update(Buffer.from([NODE_PREFIX]))
    .update(Buffer.from(left, 'hex'))
    .update(Buffer.from(right, 'hex'))
    .digest('hex');
  return sha256Hex(digest);
}

/** Sorted by `(wd_number, revision)`. The order is part of the commitment. */
export function sortLeaves(leaves: readonly SnapshotLeaf[]): readonly SnapshotLeaf[] {
  return [...leaves].sort((a, b) =>
    a.wdNumber === b.wdNumber
      ? a.revision - b.revision
      : a.wdNumber < b.wdNumber
        ? -1
        : 1,
  );
}

export class EmptySnapshotError extends Error {}

/**
 * Build the tree over the promoted corpus.
 *
 * An empty corpus THROWS rather than producing a root over nothing. A root that
 * commits to zero determinations would satisfy `snap_promoted_complete` and pass
 * every structural check while the product served no rates at all — which is
 * precisely the C5 failure mode (a green-looking system that emits nothing), and it
 * is worth one exception to make unrepresentable.
 */
export function buildMerkleTree(leaves: readonly SnapshotLeaf[]): MerkleTree {
  if (leaves.length === 0) {
    throw new EmptySnapshotError(
      'refusing to build a Merkle root over an empty corpus: a snapshot committing to zero ' +
        'determinations passes every structural check while the product serves no rates',
    );
  }
  const sorted = sortLeaves(leaves);
  const leafHashes = sorted.map(leafHash);

  let level: Sha256Hex[] = [...leafHashes];
  while (level.length > 1) {
    const next: Sha256Hex[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1];
      if (left === undefined) continue;
      // An odd node is promoted unchanged, per §8.1.
      next.push(right === undefined ? left : nodeHash(left, right));
    }
    level = next;
  }

  const root = level[0];
  if (root === undefined) throw new EmptySnapshotError('merkle fold produced no root');
  return { root, leafCount: leafHashes.length, leafHashes };
}

/**
 * The 14-ish sibling hashes that go into `artifact_provenance.inclusion_proof`.
 *
 * Folding rule matches `buildMerkleTree` exactly, including the odd-node promotion:
 * when a node has no sibling it is carried up and NO hash is added to the proof.
 */
export function inclusionProof(leaves: readonly SnapshotLeaf[], leafIndex: number): InclusionProof {
  const tree = buildMerkleTree(leaves);
  if (leafIndex < 0 || leafIndex >= tree.leafCount) {
    throw new RangeError(`leafIndex ${leafIndex} out of range for ${tree.leafCount} leaves`);
  }

  const siblings: Sha256Hex[] = [];
  let level: Sha256Hex[] = [...tree.leafHashes];
  let index = leafIndex;

  while (level.length > 1) {
    const isRight = index % 2 === 1;
    const siblingIndex = isRight ? index - 1 : index + 1;
    const sibling = level[siblingIndex];
    if (sibling !== undefined) siblings.push(sibling);

    const next: Sha256Hex[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1];
      if (left === undefined) continue;
      next.push(right === undefined ? left : nodeHash(left, right));
    }
    level = next;
    index = Math.floor(index / 2);
  }

  const leafHashAtIndex = tree.leafHashes[leafIndex];
  if (leafHashAtIndex === undefined) throw new RangeError('leaf hash missing');
  return { leafIndex, leafHash: leafHashAtIndex, siblings, root: tree.root };
}

/**
 * Verify a proof from the determination text alone.
 *
 * This is the function a third party runs — in a browser, eighteen months later,
 * with no Ratepin code involved beyond these twenty lines.
 *
 * `leafCount` is required because the odd-node promotion makes the FOLD SHAPE a
 * function of the tree's width. Stated precisely rather than broadly: for a leaf
 * whose path crosses a promoted odd node, presenting the wrong width consumes the
 * siblings differently and the proof fails. For a leaf whose path has the same
 * shape at both widths the two are genuinely indistinguishable — that is a property
 * of this construction, not a check that was left out.
 */
export function verifyInclusion(input: {
  readonly leaf: SnapshotLeaf;
  readonly leafIndex: number;
  readonly leafCount: number;
  readonly siblings: readonly Sha256Hex[];
  readonly root: Sha256Hex;
}): boolean {
  let hash = leafHash(input.leaf);
  let index = input.leafIndex;
  let width = input.leafCount;
  let cursor = 0;

  while (width > 1) {
    const hasSibling = index % 2 === 1 || index + 1 < width;
    if (hasSibling) {
      const sibling = input.siblings[cursor];
      cursor += 1;
      if (sibling === undefined) return false;
      hash = index % 2 === 1 ? nodeHash(sibling, hash) : nodeHash(hash, sibling);
    }
    index = Math.floor(index / 2);
    width = Math.ceil(width / 2);
  }

  return hash === input.root && cursor === input.siblings.length;
}

/** `cs_2026-08-13T06:00Z` — the human-readable snapshot reference in the footer. */
export function snapshotRefFor(instant: Date): string {
  return `cs_${instant.toISOString().slice(0, 13)}:00Z`;
}

export interface ReproductionCheck {
  readonly wdNumber: WdNumber;
  readonly revision: number;
  readonly canonicalSha256: Sha256Hex;
  readonly leafIndex: number;
  readonly verified: boolean;
}

/**
 * THE REPRODUCIBILITY GUARANTEE, as a function rather than a promise.
 *
 * Given a snapshot's leaves and the determination text a customer was served, this
 * answers the only question that matters in February 2028: *was this exact text in
 * the corpus at snapshot time?* It re-derives the leaf from the TEXT — not from a
 * stored hash — so a corrupted `wd_revision` row cannot make a false claim pass.
 */
export function reproduceFromSnapshot(input: {
  readonly leaves: readonly SnapshotLeaf[];
  readonly root: Sha256Hex;
  readonly wdNumber: WdNumber;
  readonly revision: number;
  readonly canonicalSha256OfServedText: Sha256Hex;
}): ReproductionCheck {
  const sorted = sortLeaves(input.leaves);
  const leafIndex = sorted.findIndex(
    (leaf) => leaf.wdNumber === input.wdNumber && leaf.revision === input.revision,
  );
  if (leafIndex === -1) {
    return {
      wdNumber: input.wdNumber,
      revision: input.revision,
      canonicalSha256: input.canonicalSha256OfServedText,
      leafIndex: -1,
      verified: false,
    };
  }
  const proof = inclusionProof(sorted, leafIndex);
  const verified =
    proof.root === input.root &&
    verifyInclusion({
      leaf: {
        wdNumber: input.wdNumber,
        revision: input.revision,
        canonicalSha256: input.canonicalSha256OfServedText,
      },
      leafIndex,
      leafCount: sorted.length,
      siblings: proof.siblings,
      root: input.root,
    });

  return {
    wdNumber: input.wdNumber,
    revision: input.revision,
    canonicalSha256: input.canonicalSha256OfServedText,
    leafIndex,
    verified,
  };
}
