/**
 * The case state machine.
 *
 * Spec: USER_JOURNEY.md §4 (the canonical state diagram — "the lifecycle of
 * one appeal case"), ARCHITECTURE.md §5.1 (the abridged `case.status` field),
 * ADR-002 (classification and the retrieved slice are frozen for the life of
 * a case — a revision can never silently change which policy the document
 * argues under).
 *
 * RECONCILIATION NOTE (load-bearing, not visible from the enum alone): the
 * Drizzle `case_status` enum (schema.ts) is an ABRIDGED 11-state projection of
 * USER_JOURNEY.md §4's full ~24-state diagram. The states that are not columns
 * on `cases` are tracked on their own rows, and this module documents the
 * mapping so "matching the state diagram" is checkable rather than asserted:
 *
 *   USER_JOURNEY state          →  how it is represented here
 *   ---------------------------    -------------------------------------------
 *   Intake                      →  cases.status = 'intake'
 *   Classifying                 →  cases.status = 'classifying'
 *   Classified                  →  cases.status = 'classified'
 *   Escalated (from Classifying,→  cases.status = 'escalated'
 *     or post-rejection)           (escalatedAt/escalationReason/Detail set)
 *   Drafting                    →  cases.status = 'drafting'
 *   Critiquing                  →  cases.status = 'critiquing'
 *   PreviewReady                →  cases.status = 'preview_ready'
 *   AwaitingPayment              →  implicit: preview_ready, seller is at the
 *                                    paywall; there is no separate DB state
 *                                    because nothing is persisted until either
 *                                    payment or abandonment resolves it
 *   Abandoned                   →  cases.status = 'failed' (reason recorded
 *                                    via escalationDetail as an operational
 *                                    note; a dedicated `abandoned` status is a
 *                                    one-line migration if this needs to be
 *                                    distinguished from a hard pipeline error)
 *   Paid                        →  cases.status = 'paid' (paidAt set)
 *   HumanQueued / HumanReviewed →  cases.status = 'escalated' throughout;
 *                                    the queue/review distinction lives in
 *                                    `human_edits` rows against the draft, not
 *                                    on the case
 *   Delivered                   →  cases.status = 'document_ready'
 *                                    (documentReadyAt set) — reached from both
 *                                    `paid` (machine path) and `escalated`
 *                                    (human path), matching the diagram's two
 *                                    converging arrows into Delivered
 *   SLORefunded                 →  cases.status = 'refunded'
 *   Revising                    →  transient: modelled as a re-entry into
 *                                    'critiquing' from 'document_ready' — the
 *                                    diagram's "stages 3-4 re-run only" is
 *                                    exactly this edge, and `corpus_slice_refs`
 *                                    stays untouched, which is what keeps the
 *                                    classification frozen
 *   Submitted / DecisionPending  →  outcome_reports.decision = 'unknown',
 *     / Reinstated / Rejected /     reported_at unset; the case itself has no
 *     NoResponse / OutcomeReported  further status transitions once
 *                                    'document_ready' — the case row is not
 *                                    re-opened by what the seller does with a
 *                                    document we already delivered
 *   ShieldDecisionPending / etc. →  `shield_accounts` rows, deliberately
 *                                    decoupled from case status (USER_JOURNEY
 *                                    §4 reading note: "the two decisions are
 *                                    decoupled in time by design")
 *
 * This module is the enforcement point: every write to `cases.status` in this
 * codebase is required to go through `transitionCase()`, which makes an
 * illegal edge a thrown error rather than a silently-accepted UPDATE.
 */

import { eq } from 'drizzle-orm';

import type { Db } from './index';
import { cases } from './schema';
import type { Case } from './schema';

export type CaseStatus = Case['status'];

export class CaseNotFoundError extends Error {
  constructor(public readonly caseId: string) {
    super(`case not found: ${caseId}`);
    this.name = 'CaseNotFoundError';
  }
}

export class IllegalCaseTransitionError extends Error {
  constructor(
    public readonly caseId: string,
    public readonly from: CaseStatus,
    public readonly to: CaseStatus,
  ) {
    super(
      `illegal case transition for ${caseId}: ${from} -> ${to} (see USER_JOURNEY.md §4 / case-state-machine.ts)`,
    );
    this.name = 'IllegalCaseTransitionError';
  }
}

/**
 * The adjacency list. Read top-to-bottom against USER_JOURNEY.md §4's mermaid
 * diagram — every edge here corresponds to a named edge there (see the mapping
 * table above for states that are not their own `case_status` value).
 */
export const CASE_TRANSITIONS: Readonly<Record<CaseStatus, readonly CaseStatus[]>> = Object.freeze({
  intake: ['classifying'],
  classifying: ['classified', 'escalated', 'failed'],
  classified: ['drafting'],
  drafting: ['critiquing', 'failed'],
  // 'escalated' here is the zero-cited-clauses gate (I2): a draft that yields
  // no citations does not render — ARCHITECTURE.md §6.3.
  critiquing: ['preview_ready', 'escalated', 'failed'],
  // 'failed' from preview_ready is the Abandoned edge (session timeout, no
  // payment) — see the reconciliation note above.
  preview_ready: ['paid', 'failed'],
  paid: ['document_ready', 'refunded', 'failed'],
  // document_ready -> critiquing is Revising (unlimited revisions, §6.3 of
  // ARCHITECTURE.md): stages 3-4 re-run only, corpus_slice_refs is untouched.
  // document_ready -> escalated is the post-rejection outcome guarantee
  // (USER_JOURNEY.md §4: "Rejected --> Escalated: outcome guarantee triggers
  // free human review").
  document_ready: ['critiquing', 'escalated'],
  // escalated -> document_ready is HumanReviewed -> Delivered.
  escalated: ['document_ready', 'refunded'],
  refunded: [],
  failed: [],
});

export function assertValidCaseTransition(from: CaseStatus, to: CaseStatus, caseId = '(unknown)'): void {
  const allowed = CASE_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new IllegalCaseTransitionError(caseId, from, to);
  }
}

export type CaseTransitionPatch = Partial<
  Pick<
    Case,
    | 'paidAt'
    | 'documentReadyAt'
    | 'escalatedAt'
    | 'escalationReason'
    | 'escalationDetail'
    | 'marketplace'
  >
>;

/**
 * Transactionally move a case from its current status to `to`. Locks the row
 * (`SELECT … FOR UPDATE`) so two concurrent writers (e.g. a webhook retry
 * racing a worker job) cannot both observe the pre-transition status and both
 * succeed — one of them must see the post-transition status and fail the
 * assertion.
 *
 * Throws `CaseNotFoundError` or `IllegalCaseTransitionError`. Never silently
 * coerces — an illegal transition is a bug to be surfaced, not a state to be
 * papered over (the same "never guess" discipline as I5 applied to data
 * integrity rather than classification).
 */
export async function transitionCase(
  db: Db,
  caseId: string,
  to: CaseStatus,
  patch: CaseTransitionPatch = {},
): Promise<Case> {
  return db.transaction(async (tx) => {
    const rows = await tx.select().from(cases).where(eq(cases.id, caseId)).for('update');
    const current = rows[0];
    if (!current) throw new CaseNotFoundError(caseId);

    assertValidCaseTransition(current.status, to, caseId);

    const [updated] = await tx
      .update(cases)
      .set({ status: to, updatedAt: new Date(), ...patch })
      .where(eq(cases.id, caseId))
      .returning();

    if (!updated) throw new CaseNotFoundError(caseId);
    return updated;
  });
}
