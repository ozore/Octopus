/**
 * Promotion — the third conjunct of ADR-008 ¶2's gate: human spot-check on
 * the first ~100 records.
 *
 * Spec: ADR-008 ¶2, CORPUS_DESIGN.md §4.4 — "Human spot-check on the first
 * ~100: Mandatory gate; a record cannot be promoted past `redacted` without
 * it," and §8's honest acknowledgement that this "does not scale past the
 * first hundred (accepted deliberately — by then we will know whether the
 * loop is worth automating)."
 */

import * as l4Repo from '../db/repositories/l4-records';
import type { Db } from '../db';

export const DEFAULT_SPOT_CHECK_THRESHOLD = 100;

export type PromotionResult =
  | { promoted: false; reason: 'not_in_redacted_state' | 'awaiting_human_spot_check' }
  | { promoted: true };

/**
 * Walks a `redacted` record to `promoted` if it has earned it: either a human
 * has spot-checked it, or the corpus has already passed the first-~100
 * threshold globally (past that point the marginal record no longer requires
 * one — CORPUS_DESIGN.md §4.4/§8, "accepted deliberately"). A record that is
 * not yet eligible is left exactly where it is — this is a legitimate
 * "not yet," not a failure, so it does not throw.
 */
export async function attemptPromotion(
  db: Db,
  l4RecordId: string,
  opts: { spotCheckThreshold?: number } = {},
): Promise<PromotionResult> {
  const threshold = opts.spotCheckThreshold ?? DEFAULT_SPOT_CHECK_THRESHOLD;

  const record = await l4Repo.getL4Record(db, l4RecordId);
  if (!record || record.curationState !== 'redacted') {
    return { promoted: false, reason: 'not_in_redacted_state' };
  }

  if (!record.humanSpotChecked) {
    const spotCheckedSoFar = await l4Repo.countHumanSpotChecked(db);
    if (spotCheckedSoFar < threshold) {
      return { promoted: false, reason: 'awaiting_human_spot_check' };
    }
  }

  await l4Repo.transitionCuration(db, l4RecordId, 'verified');
  await l4Repo.transitionCuration(db, l4RecordId, 'promoted');
  return { promoted: true };
}

/**
 * Called from the (out-of-scope-here) `/ops` spot-check UI once a human has
 * reviewed a record: marks it checked and immediately retries promotion so
 * the reviewer doesn't have to wait for the next scheduler tick.
 */
export async function recordSpotCheckAndPromote(
  db: Db,
  l4RecordId: string,
  spotCheckedBy: string,
  opts: { spotCheckThreshold?: number } = {},
): Promise<PromotionResult> {
  await l4Repo.markHumanSpotChecked(db, l4RecordId, spotCheckedBy);
  return attemptPromotion(db, l4RecordId, opts);
}

/** CORPUS_DESIGN.md §4.6: "Demotion is symmetric... the record drops to
 *  verified and opens a review." Business logic (three consecutive rejected
 *  outcomes) lives with whatever calls this — this function only performs the
 *  legal structural edge. */
export async function demoteFromPromoted(db: Db, l4RecordId: string): Promise<void> {
  await l4Repo.transitionCuration(db, l4RecordId, 'verified');
}
