/**
 * §8 — THE MERKLE SNAPSHOT AND THE EIGHTEEN-MONTH REPRODUCTION.
 *
 * §8.3's walkthrough is February 2028: a GC withholds a progress payment, asserting
 * the electrician rate on a week-ending-2026-08-14 WH-347 was wrong. The sub opens
 * the artifact's provenance page. The determination text is served from `wd_blob` —
 * the bytes we actually read, not a re-fetch — the leaf hash is recomputed FROM THAT
 * TEXT, folded up the siblings, and compared to the root printed on the 2026
 * artifact.
 *
 * The property that makes it worth anything: the commitment was made BEFORE the
 * dispute existed, and it can be checked by anyone holding the root and the text,
 * using no Ratepin code.
 */

import { describe, expect, it } from 'vitest';

import {
  buildMerkleTree,
  canonicalise,
  EmptySnapshotError,
  inclusionProof,
  leafHash,
  reproduceFromSnapshot,
  snapshotRefFor,
  sortLeaves,
  verifyInclusion,
  type SnapshotLeaf,
} from '@/corpus';
import { sha256Hex, wdNumber } from '@/lib/types';

import { fixtureJson } from './fixtures';

function leaf(wd: string, revision: number, hex: string): SnapshotLeaf {
  return { wdNumber: wdNumber(wd), revision, canonicalSha256: sha256Hex(hex) };
}

function syntheticLeaves(count: number): readonly SnapshotLeaf[] {
  return Array.from({ length: count }, (_, i) =>
    leaf(`VA2026${String(i).padStart(4, '0')}`, i % 4, String(i % 10).repeat(64)),
  );
}

describe('the tree', () => {
  it('is a deterministic function of the promoted set, in sorted order', () => {
    const a = leaf('VA20260195', 2, 'a'.repeat(64));
    const b = leaf('LA20260005', 2, 'b'.repeat(64));
    const c = leaf('DC20260001', 5, 'c'.repeat(64));

    // Same set, three different insertion orders, one root.
    const roots = [
      buildMerkleTree([a, b, c]).root,
      buildMerkleTree([c, b, a]).root,
      buildMerkleTree([b, a, c]).root,
    ];
    expect(new Set(roots).size).toBe(1);

    expect(sortLeaves([a, b, c]).map((l) => l.wdNumber)).toEqual([
      'DC20260001',
      'LA20260005',
      'VA20260195',
    ]);
  });

  it('sorts by (wd_number, revision), so revisions of one WD stay ordered', () => {
    const sorted = sortLeaves([
      leaf('VA20260195', 2, 'a'.repeat(64)),
      leaf('VA20260195', 0, 'b'.repeat(64)),
      leaf('VA20260195', 1, 'c'.repeat(64)),
    ]);
    expect(sorted.map((l) => l.revision)).toEqual([0, 1, 2]);
  });

  it('changes the root when any determination text changes', () => {
    const before = buildMerkleTree(syntheticLeaves(9)).root;
    const mutated = [...syntheticLeaves(9)];
    mutated[4] = leaf('VA20260004', 0, 'f'.repeat(64));
    expect(buildMerkleTree(mutated).root).not.toBe(before);
  });

  /** A root over nothing satisfies every structural check while the product serves
   *  no rates — the C5 failure mode. Made unrepresentable. */
  it('refuses to build a root over an empty corpus', () => {
    expect(() => buildMerkleTree([])).toThrow(EmptySnapshotError);
  });

  it('produces a 32-byte root and 32-byte leaves', () => {
    const tree = buildMerkleTree(syntheticLeaves(5));
    expect(tree.root).toMatch(/^[0-9a-f]{64}$/);
    for (const hash of tree.leafHashes) expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('distinguishes two revisions of the same WD with identical text', () => {
    // The revision is inside the leaf preimage, so r1 and r2 of one WD cannot
    // collide even if WHD republished identical bytes.
    const a = leafHash(leaf('VA20260195', 1, 'a'.repeat(64)));
    const b = leafHash(leaf('VA20260195', 2, 'a'.repeat(64)));
    expect(a).not.toBe(b);
  });
});

describe('inclusion proofs', () => {
  it('verifies every leaf at every tree width from 1 to 40', () => {
    // Odd widths are the interesting ones: an odd node is promoted unchanged, so
    // the fold and the verifier must agree about when a sibling exists at all.
    for (let count = 1; count <= 40; count += 1) {
      const leaves = syntheticLeaves(count);
      const sorted = sortLeaves(leaves);
      const tree = buildMerkleTree(leaves);
      for (let index = 0; index < count; index += 1) {
        const proof = inclusionProof(leaves, index);
        const target = sorted[index]!;
        expect(
          verifyInclusion({
            leaf: target,
            leafIndex: index,
            leafCount: count,
            siblings: proof.siblings,
            root: tree.root,
          }),
          `count=${count} index=${index}`,
        ).toBe(true);
      }
    }
  });

  it('rejects a proof for the wrong text', () => {
    const leaves = syntheticLeaves(9);
    const tree = buildMerkleTree(leaves);
    const proof = inclusionProof(leaves, 3);
    expect(
      verifyInclusion({
        leaf: leaf('VA20260003', 3, 'e'.repeat(64)),
        leafIndex: 3,
        leafCount: 9,
        siblings: proof.siblings,
        root: tree.root,
      }),
    ).toBe(false);
  });

  /**
   * `leafCount` is a required input to `verifyInclusion`, and this is why. Stated
   * precisely rather than broadly: the odd-node promotion makes the FOLD SHAPE a
   * function of the tree's width, so for a leaf whose path crosses a promoted odd
   * node, presenting the wrong width consumes the siblings differently and the
   * proof fails. (For a leaf whose path happens to have the same shape at both
   * widths — index 3 at widths 9 and 10, say — the two are genuinely
   * indistinguishable, which is a property of the construction and not a check we
   * can add.)
   */
  it('rejects a proof replayed at a width that changes the fold shape', () => {
    const leaves = syntheticLeaves(9);
    const tree = buildMerkleTree(leaves);
    const proof = inclusionProof(leaves, 8);
    expect(
      verifyInclusion({
        leaf: sortLeaves(leaves)[8]!,
        leafIndex: 8,
        leafCount: 9,
        siblings: proof.siblings,
        root: tree.root,
      }),
    ).toBe(true);
    expect(
      verifyInclusion({
        leaf: sortLeaves(leaves)[8]!,
        leafIndex: 8,
        leafCount: 10,
        siblings: proof.siblings,
        root: tree.root,
      }),
    ).toBe(false);
  });

  it('is about 14 hashes at the active corpus size of ~9,424 revisions', () => {
    const proof = inclusionProof(syntheticLeaves(9424), 5000);
    expect(proof.siblings.length).toBeLessThanOrEqual(14);
    expect(proof.siblings.length).toBeGreaterThanOrEqual(13);
  });
});

describe('THE EIGHTEEN-MONTH REPRODUCTION', () => {
  it('re-derives the leaf from the SERVED TEXT, not from a stored hash', () => {
    // The bytes a customer was served in 2026, replayed in 2028.
    const served = canonicalise(
      fixtureJson<{ document: string }>('document/VA20260195-r2.json').document,
    );
    expect(served.sha256).toBe(
      'afd535b9762364ebe4941b870ee975bca9f59b90418e16c12fd7b5fe3aac7cd0',
    );

    const corpus: readonly SnapshotLeaf[] = [
      ...syntheticLeaves(200),
      { wdNumber: wdNumber('VA20260195'), revision: 2, canonicalSha256: served.sha256 },
    ];
    const root = buildMerkleTree(corpus).root;

    const check = reproduceFromSnapshot({
      leaves: corpus,
      root,
      wdNumber: wdNumber('VA20260195'),
      revision: 2,
      canonicalSha256OfServedText: served.sha256,
    });
    expect(check.verified).toBe(true);
    expect(check.leafIndex).toBeGreaterThanOrEqual(0);
  });

  it('fails when the text served does not match what the snapshot committed to', () => {
    const corpus: readonly SnapshotLeaf[] = [
      ...syntheticLeaves(50),
      leaf('VA20260195', 2, 'a'.repeat(64)),
    ];
    const root = buildMerkleTree(corpus).root;
    const check = reproduceFromSnapshot({
      leaves: corpus,
      root,
      wdNumber: wdNumber('VA20260195'),
      revision: 2,
      canonicalSha256OfServedText: sha256Hex('b'.repeat(64)),
    });
    expect(check.verified).toBe(false);
  });

  it('fails for a determination the snapshot never contained', () => {
    const corpus = syntheticLeaves(50);
    const check = reproduceFromSnapshot({
      leaves: corpus,
      root: buildMerkleTree(corpus).root,
      wdNumber: wdNumber('WA20200002'),
      revision: 0,
      canonicalSha256OfServedText: sha256Hex('a'.repeat(64)),
    });
    expect(check.verified).toBe(false);
    expect(check.leafIndex).toBe(-1);
  });
});

describe('snapshot references', () => {
  it('are hour-stamped and stable', () => {
    expect(snapshotRefFor(new Date('2026-08-13T06:04:31Z'))).toBe('cs_2026-08-13T06:00Z');
  });
});
