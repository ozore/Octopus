/**
 * Case repository.
 *
 * Spec: ARCHITECTURE.md §5.1 (attribution stamped at creation — corpus_release,
 * prompt_bundle_hash, model_id — ADR-008 ¶3), USER_JOURNEY.md §4 (the state
 * diagram; transitions are delegated to ../case-state-machine.ts, never
 * written here as a bare UPDATE).
 */

import { desc, eq } from 'drizzle-orm';

import type { Db } from '../index';
import { cases } from '../schema';
import {
  assertValidCaseTransition,
  transitionCase,
  type CaseStatus,
  type CaseTransitionPatch,
} from '../case-state-machine';
import type { CaseRow, NewCaseRow } from './types';

/** The enum has no standalone exported type in schema.ts; derive the
 *  non-nullable member type from the column instead of hand-duplicating it. */
export type EscalationReasonValue = NonNullable<CaseRow['escalationReason']>;

export {
  CASE_TRANSITIONS,
  CaseNotFoundError,
  IllegalCaseTransitionError,
  assertValidCaseTransition,
  transitionCase,
} from '../case-state-machine';
export type { CaseStatus, CaseTransitionPatch } from '../case-state-machine';

export async function createCase(
  db: Db,
  input: Omit<NewCaseRow, 'status' | 'createdAt' | 'updatedAt'>,
): Promise<CaseRow> {
  const [created] = await db
    .insert(cases)
    .values({ ...input, status: 'intake' })
    .returning();
  if (!created) throw new Error('createCase: insert returned no row');
  return created;
}

export async function getCase(db: Db, id: string): Promise<CaseRow | undefined> {
  const rows = await db.select().from(cases).where(eq(cases.id, id)).limit(1);
  return rows[0];
}

export async function requireCase(db: Db, id: string): Promise<CaseRow> {
  const found = await getCase(db, id);
  if (!found) throw new Error(`case not found: ${id}`);
  return found;
}

export async function listCasesByStatus(db: Db, status: CaseStatus): Promise<CaseRow[]> {
  return db.select().from(cases).where(eq(cases.status, status)).orderBy(desc(cases.createdAt));
}

/** Links the Stripe-side identity captured at Checkout (N4: never a login).
 *  A plain column write, not a status transition, so it does not go through
 *  the state machine. */
export async function attachCustomer(db: Db, caseId: string, customerId: string): Promise<void> {
  await db.update(cases).set({ customerId, updatedAt: new Date() }).where(eq(cases.id, caseId));
}

/**
 * Records `paid_at` WITHOUT transitioning status — used when a case is paid
 * while already `escalated` (the $399 human tier is purchased from the
 * escalated state; USER_JOURNEY.md §4 shows Escalated leading straight to
 * HumanQueued, with payment alongside rather than a distinct case-status
 * value). The machine-path payment (`preview_ready -> paid`) goes through
 * `markPaid` above instead, which does transition status.
 */
export async function recordPaidTimestamp(db: Db, caseId: string, paidAt: Date = new Date()): Promise<void> {
  await db.update(cases).set({ paidAt, updatedAt: new Date() }).where(eq(cases.id, caseId));
}

// ---------------------------------------------------------------------------
// Named transitions. Each is a thin, self-documenting wrapper over
// transitionCase() so call sites read as business events, not status strings.
// ---------------------------------------------------------------------------

export async function markClassifying(db: Db, caseId: string): Promise<CaseRow> {
  return transitionCase(db, caseId, 'classifying');
}

export async function markClassified(
  db: Db,
  caseId: string,
  marketplace?: CaseRow['marketplace'],
): Promise<CaseRow> {
  return transitionCase(db, caseId, 'classified', marketplace ? { marketplace } : {});
}

/** I5: the only way a case reaches 'escalated' — never a fallback that drafts
 *  anyway. Reachable from 'classifying', 'critiquing' (zero cited clauses),
 *  or 'document_ready' (post-rejection outcome guarantee). */
export async function markEscalated(
  db: Db,
  caseId: string,
  reason: EscalationReasonValue,
  detail: string,
): Promise<CaseRow> {
  return transitionCase(db, caseId, 'escalated', {
    escalatedAt: new Date(),
    escalationReason: reason,
    escalationDetail: detail,
  });
}

export async function markDrafting(db: Db, caseId: string): Promise<CaseRow> {
  return transitionCase(db, caseId, 'drafting');
}

export async function markCritiquing(db: Db, caseId: string): Promise<CaseRow> {
  return transitionCase(db, caseId, 'critiquing');
}

export async function markPreviewReady(db: Db, caseId: string): Promise<CaseRow> {
  return transitionCase(db, caseId, 'preview_ready');
}

/** AwaitingPayment → Abandoned in USER_JOURNEY.md §4: a session that times out
 *  with no payment. See case-state-machine.ts's reconciliation note. */
export async function markAbandoned(db: Db, caseId: string): Promise<CaseRow> {
  return transitionCase(db, caseId, 'failed', {
    escalationDetail: 'abandoned: no payment before session timeout',
  });
}

export async function markPipelineFailed(db: Db, caseId: string, detail: string): Promise<CaseRow> {
  return transitionCase(db, caseId, 'failed', { escalationDetail: detail });
}

/** Stripe `checkout.session.completed`, applied by billing/fulfillment.ts. */
export async function markPaid(db: Db, caseId: string, paidAt: Date = new Date()): Promise<CaseRow> {
  return transitionCase(db, caseId, 'paid', { paidAt });
}

/** The 10-minute SLO's other end: `document_ready_at` measured, not claimed
 *  (ARCHITECTURE.md §3.5, G6). Reachable from 'paid' (machine path) or
 *  'escalated' (human-reviewed path) — USER_JOURNEY.md §4's two converging
 *  arrows into Delivered. */
export async function markDocumentReady(
  db: Db,
  caseId: string,
  documentReadyAt: Date = new Date(),
): Promise<CaseRow> {
  return transitionCase(db, caseId, 'document_ready', { documentReadyAt });
}

/** SLO breach or refused-category refund. The guarantee is enforced by the
 *  system, not by goodwill (ARCHITECTURE.md §3.5). */
export async function markRefunded(db: Db, caseId: string): Promise<CaseRow> {
  return transitionCase(db, caseId, 'refunded');
}

/** Revising: the seller asks the MACHINE to try again with notes. Stages 3-4
 *  only — `corpus_slice_refs` is untouched, so classification stays frozen
 *  (ADR-002). Structurally distinct from escalation (USER_JOURNEY.md §4
 *  reading notes). */
export async function markRevising(db: Db, caseId: string): Promise<CaseRow> {
  return transitionCase(db, caseId, 'critiquing');
}

/** Rejected → Escalated: the outcome guarantee triggers a free human review
 *  after a first-pass rejection (USER_JOURNEY.md §4, ARCHITECTURE.md §6.3). */
export async function markEscalatedAfterRejection(
  db: Db,
  caseId: string,
  detail: string,
): Promise<CaseRow> {
  return transitionCase(db, caseId, 'escalated', {
    escalatedAt: new Date(),
    escalationReason: 'seller_choice',
    escalationDetail: detail,
  });
}
