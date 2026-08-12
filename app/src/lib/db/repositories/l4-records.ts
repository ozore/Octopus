/**
 * L4-record repository — the compounding asset (D10, ADR-008).
 *
 * Spec: ARCHITECTURE.md §5.2 ¶2 ("promotion, not insertion" — nothing enters
 * `l4_records` directly; a row can only be created once consent AND
 * redaction hold), CORPUS_DESIGN.md §4.6 (the curation state diagram:
 * `raw → redacted → verified → promoted`, with `raw`/`redacted → quarantined`,
 * and symmetric demotion from `promoted` back to `verified`).
 *
 * This module enforces the STRUCTURAL legality of a curation-state edge (is
 * `verified → promoted` a real edge in the diagram). The BUSINESS gate — has
 * this record actually earned promotion (human spot-check on the first ~100,
 * outcome plausibility) — is outcome-capture/promotion.ts's job, layered on
 * top. Keeping the two separate means a business-rule change (e.g. raising
 * the spot-check threshold) never touches this file.
 */

import { and, count, desc, eq, isNull } from 'drizzle-orm';

import type { Db } from '../index';
import { l4Records } from '../schema';
import type { L4Record, NewL4Record } from './types';

export type CurationState = L4Record['curationState'];

export class IllegalCurationTransitionError extends Error {
  constructor(
    public readonly recordId: string,
    public readonly from: CurationState,
    public readonly to: CurationState,
  ) {
    super(`illegal L4 curation transition for ${recordId}: ${from} -> ${to} (CORPUS_DESIGN.md §4.6)`);
    this.name = 'IllegalCurationTransitionError';
  }
}

/** `raw` is retained for completeness against CORPUS_DESIGN.md §4.6's diagram
 *  even though no v1 code path inserts a row at `raw`: ADR-008 ¶2's
 *  "promotion, not insertion" means a row is only ever created post-redaction,
 *  i.e. at `redacted`. The edge stays documented so a future pre-redaction
 *  staging table (if one is ever added) has a legal target to land on. */
export const L4_CURATION_TRANSITIONS: Readonly<Record<CurationState, readonly CurationState[]>> =
  Object.freeze({
    raw: ['redacted', 'quarantined'],
    redacted: ['verified', 'quarantined'],
    verified: ['promoted', 'quarantined'],
    // Demotion is symmetric (CORPUS_DESIGN.md §4.6): "if a promoted pattern's
    // supporting records later shift ... the record drops to verified."
    promoted: ['verified'],
    quarantined: [],
  });

export function assertValidCurationTransition(
  from: CurationState,
  to: CurationState,
  recordId = '(unknown)',
): void {
  if (!(L4_CURATION_TRANSITIONS[from] ?? []).includes(to)) {
    throw new IllegalCurationTransitionError(recordId, from, to);
  }
}

/** The only construction path (ADR-008 ¶2). Defaults to `redacted` — the
 *  schema's own default — because nothing reaches this table pre-redaction. */
export async function insertL4Record(db: Db, input: NewL4Record): Promise<L4Record> {
  const [created] = await db
    .insert(l4Records)
    .values({ curationState: 'redacted', ...input })
    .returning();
  if (!created) throw new Error('insertL4Record: insert returned no row');
  return created;
}

export async function getL4Record(db: Db, id: string): Promise<L4Record | undefined> {
  const rows = await db.select().from(l4Records).where(eq(l4Records.id, id)).limit(1);
  return rows[0];
}

export async function transitionCuration(db: Db, id: string, to: CurationState): Promise<L4Record> {
  return db.transaction(async (tx) => {
    const rows = await tx.select().from(l4Records).where(eq(l4Records.id, id)).for('update');
    const current = rows[0];
    if (!current) throw new Error(`l4_record not found: ${id}`);

    assertValidCurationTransition(current.curationState, to, id);

    const [updated] = await tx
      .update(l4Records)
      .set({ curationState: to })
      .where(eq(l4Records.id, id))
      .returning();
    if (!updated) throw new Error(`transitionCuration: update returned no row for ${id}`);
    return updated;
  });
}

export async function markHumanSpotChecked(
  db: Db,
  id: string,
  spotCheckedBy: string,
): Promise<L4Record | undefined> {
  const [updated] = await db
    .update(l4Records)
    .set({ humanSpotChecked: true, spotCheckedBy })
    .where(eq(l4Records.id, id))
    .returning();
  return updated;
}

/** GDPR/CCPA baseline (ADR-008 ¶4): deletion is a modelled state. Text is
 *  scrubbed, not just flagged, so a later query can never accidentally surface
 *  it. */
export async function softDeleteL4Record(db: Db, id: string): Promise<void> {
  await db
    .update(l4Records)
    .set({
      deletionRequestedAt: new Date(),
      deletedAt: new Date(),
      redactedNotice: '[deleted]',
      redactedDraft: '[deleted]',
    })
    .where(eq(l4Records.id, id));
}

/** Cascades from a consent revocation — every record promoted under that
 *  consent is deleted (ADR-008 ¶4). */
export async function softDeleteL4RecordsForConsent(db: Db, consentId: string): Promise<number> {
  const rows = await db
    .update(l4Records)
    .set({
      deletionRequestedAt: new Date(),
      deletedAt: new Date(),
      redactedNotice: '[deleted]',
      redactedDraft: '[deleted]',
    })
    .where(eq(l4Records.consentId, consentId))
    .returning();
  return rows.length;
}

export async function listL4RecordsByReasonCode(
  db: Db,
  reasonCode: L4Record['reasonCode'],
): Promise<L4Record[]> {
  return db
    .select()
    .from(l4Records)
    .where(eq(l4Records.reasonCode, reasonCode))
    .orderBy(desc(l4Records.promotedAt));
}

/**
 * The "first ~100" threshold (ADR-008 ¶2, CORPUS_DESIGN.md §4.4): a global
 * count of spot-checked, non-deleted records, used by outcome-capture to
 * decide whether a new record still requires a human before it can promote.
 *
 * NOTE: `l4_records.promoted_at` is stamped at INSERT time (schema.ts —
 * `defaultNow()`, always set) and names "when this record entered the
 * corpus," not "when curation_state reached 'promoted'." Use `curationState`
 * for the curation-stage question; use this count for the spot-check gate.
 */
export async function countHumanSpotChecked(db: Db): Promise<number> {
  const rows = await db
    .select({ n: count() })
    .from(l4Records)
    .where(and(eq(l4Records.humanSpotChecked, true), isNull(l4Records.deletedAt)));
  return Number(rows[0]?.n ?? 0);
}
