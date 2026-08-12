/**
 * Consent repository.
 *
 * Spec: ADR-008 ¶1 — consent is a first-class, versioned, REVOCABLE record,
 * captured at payment, worded as an exchange, and SEPARABLE FROM THE
 * PURCHASE. The exact text shown is stored verbatim, so a later re-wording
 * never retroactively reinterprets an earlier agreement — which is why this
 * repository never mutates `consentText` or `textVersion` after creation.
 */

import { eq } from 'drizzle-orm';

import type { Db } from '../index';
import { consents } from '../schema';
import type { Consent, NewConsent } from './types';

export class ConsentAlreadyRecordedError extends Error {
  constructor(public readonly caseId: string) {
    super(`consent already recorded for case ${caseId} (one consent record per case, ADR-008 ¶1)`);
    this.name = 'ConsentAlreadyRecordedError';
  }
}

/**
 * Records the seller's choice — granted or declined — at the moment of
 * payment. Declining is recorded, not omitted: an explicit `granted: false`
 * row is what lets outcome-capture assert "no consent, no promotion" without
 * having to distinguish "declined" from "never asked".
 */
export async function recordConsent(db: Db, input: NewConsent): Promise<Consent> {
  const existing = await getConsentForCase(db, input.caseId);
  if (existing) throw new ConsentAlreadyRecordedError(input.caseId);

  const [created] = await db
    .insert(consents)
    .values({ ...input, grantedAt: input.granted ? (input.grantedAt ?? new Date()) : null })
    .returning();
  if (!created) throw new Error('recordConsent: insert returned no row');
  return created;
}

export async function getConsentForCase(db: Db, caseId: string): Promise<Consent | undefined> {
  const rows = await db.select().from(consents).where(eq(consents.caseId, caseId)).limit(1);
  return rows[0];
}

/**
 * Revocation cascades to a `delete_subject_data` job (ADR-008 ¶4) — this
 * function only flips the flag; the caller (outcome-capture/consent.ts) is
 * responsible for enqueueing the cascade in the same transaction so a
 * revoked-but-uncascaded consent can never persist across a crash.
 */
export async function revokeConsent(db: Db, caseId: string): Promise<Consent | undefined> {
  const [updated] = await db
    .update(consents)
    .set({ revokedAt: new Date() })
    .where(eq(consents.caseId, caseId))
    .returning();
  return updated;
}
