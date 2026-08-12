/**
 * Consent capture — the exchange, worded and versioned, separable from the
 * purchase.
 *
 * Spec: ADR-008 ¶1, CORPUS_DESIGN.md §4.3. "The consent checkbox is separable
 * from the purchase and the purchase completes either way. Bundling consent
 * into the transaction would be both an ethical problem and a data-quality
 * problem — coerced consent produces sellers who ignore the follow-up email."
 *
 * This module is deliberately the ONLY place that writes a `consents` row, so
 * "consent text is versioned and never retroactively reinterpreted" is a
 * property of one function, not a convention every call site has to remember.
 */

import { and, eq } from 'drizzle-orm';

import type { Db } from '../db';
import * as consentsRepo from '../db/repositories/consents';
import { l4Records as l4Schema } from '../db/schema';
import * as l4Repo from '../db/repositories/l4-records';
import { cancelPendingEmailsForCase } from '../db/repositories/scheduled-emails';
import { enqueueJob } from '../queue';
import type { Consent } from '../db/repositories/types';

/**
 * The current consent text version and wording. Bumping this is a product/
 * legal decision, not a code refactor — CORPUS_DESIGN.md §4.3: "the exact
 * text shown is stored, so re-wording never retroactively reinterprets an
 * earlier agreement." Historical rows keep whatever version they were shown.
 */
export const CURRENT_CONSENT_TEXT_VERSION = 'v1-2026-08-12';

export const CURRENT_CONSENT_TEXT =
  'Let us follow up on how this appeal turned out, in exchange for a credit toward ' +
  'your next Clausewright case. We will ask three quick one-click questions (day 3, ' +
  '10 and 21) and, only if you say yes here, may use a redacted version of your ' +
  'notice and draft to improve future appeals for other sellers. Declining does not ' +
  'affect your purchase in any way, and you can withdraw at any time.';

const DEFAULT_RETENTION_DAYS = 365 * 2;

export type ConsentChoice = { granted: boolean; textVersion?: string; consentText?: string };

/**
 * Records the seller's choice at the moment of Checkout. Called from
 * billing/fulfillment.ts inside the same transaction as the payment write —
 * consent capture and order fulfillment succeed or fail together, but
 * consent's OWN semantics (declining doesn't block anything) are enforced by
 * simply never gating the caller on this function's `granted` value.
 */
export async function recordConsentAtCheckout(
  db: Db,
  caseId: string,
  choice: ConsentChoice,
): Promise<Consent> {
  const retentionExpiresAt = new Date(Date.now() + DEFAULT_RETENTION_DAYS * 24 * 60 * 60 * 1000);
  return consentsRepo.recordConsent(db, {
    caseId,
    granted: choice.granted,
    textVersion: choice.textVersion ?? CURRENT_CONSENT_TEXT_VERSION,
    consentText: choice.consentText ?? CURRENT_CONSENT_TEXT,
    retentionExpiresAt,
  });
}

/**
 * Revocation cascades to a `delete_subject_data` job in the SAME transaction
 * as the flag flip (ADR-008 ¶4) — a revoked-but-uncascaded consent must never
 * be observable, even across a crash between the two writes.
 */
export async function revokeConsentAndCascade(db: Db, caseId: string): Promise<Consent | undefined> {
  return db.transaction(async (tx) => {
    const updated = await consentsRepo.revokeConsent(tx, caseId);
    if (!updated) return updated;

    await cancelPendingEmailsForCase(tx, caseId);

    // Any L4 records already promoted under this consent must be deleted too
    // — done inline (small, bounded) rather than only via the async job, so a
    // reader querying immediately after revocation never sees stale text.
    const existing = await tx
      .select({ id: l4Schema.id })
      .from(l4Schema)
      .where(and(eq(l4Schema.consentId, updated.id)));
    for (const row of existing) {
      await l4Repo.softDeleteL4Record(tx, row.id);
    }

    await enqueueJob(tx, 'delete_subject_data', { consentId: updated.id, caseId });
    return updated;
  });
}
