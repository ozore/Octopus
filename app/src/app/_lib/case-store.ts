/**
 * The web tier's case repository — SERVER ONLY.
 *
 * Spec: USER_JOURNEY.md §4 (the case state machine this file's `CaseLifecycle`
 * enumerates), ARCHITECTURE.md §5.1 (the `cases` / `classifications` / `drafts` /
 * `citations` / `critiques` tables this shape mirrors), §3.6 (the escalation
 * queue), ADR-006 (Shield as an inbound-email adapter and nothing else).
 *
 * WHAT THIS IS, STATED PLAINLY SO IT IS NOT MISTAKEN FOR THE DATA LAYER:
 *
 * This is an in-process store standing in for the Drizzle repository. It exists
 * so the screens are real, exercisable and testable with no Postgres, no
 * network and no API key — the precondition every test in this repo runs under
 * (vitest.config.ts). Field names deliberately mirror `lib/db/schema.ts` so the
 * swap is a repository implementation, not a UI rewrite:
 *
 *     cases.status ............... CaseRecord.status
 *     classifications.reason_code  CaseRecord.classification.code
 *     drafts.sections ............ CaseRecord.sections
 *     citations.* ................ CaseRecord.clauses  (CitedClause[], I2)
 *     critiques.* ................ CaseRecord.critique
 *     shield_accounts.* .......... CaseRecord.shield
 *
 * IT IS NOT DURABLE, and the UI never pretends otherwise: a restart loses cases,
 * which is why nothing in these screens tells a seller their case is saved
 * forever. Replacing this module with `lib/db` queries is the only change the
 * pages need.
 */

import { ulid } from 'ulid';

import type {
  CitedClause,
  Critique,
  DraftSections,
  EscalationReason,
  Marketplace,
} from '@/lib/domain/types';

/**
 * The states USER_JOURNEY.md §4 draws. Named in snake_case to match
 * `case_status` in the database enum where they overlap; the states the diagram
 * has and the v1 enum does not (`submitted`, `decision_pending`, `reinstated`,
 * `rejected`) are carried here because the /case screen renders them.
 */
export type CaseLifecycle =
  | 'intake'
  | 'classifying'
  | 'preview_ready'
  | 'awaiting_payment'
  | 'paid'
  | 'delivered'
  | 'submitted'
  | 'decision_pending'
  | 'reinstated'
  | 'rejected'
  | 'escalated'
  | 'human_queued'
  | 'human_reviewed'
  | 'failed';

export type EscalationRecord = {
  reason: EscalationReason;
  detail: string;
  /** ARCHITECTURE.md §3.6 — refused categories route out, everything else in. */
  disposition: 'human_tier' | 'refer_out';
  escalatedAt: string;
  claimedBy?: string;
  claimedAt?: string;
  resolvedAt?: string;
  resolution?: string;
};

export type PaymentRecord = {
  tier: 'rescue' | 'rescue_human';
  sessionId: string;
  amountCents: number;
  /** Set by the webhook in production. Here it is set on return from Checkout,
   *  which is why the /case screen says "payment recorded", never "confirmed by
   *  Stripe" — the webhook is the source of truth (ADR-007), not the redirect. */
  paidAt: string;
};

/** ADR-006 / D6. An opaque ingest token and nothing else — no credentials (I4). */
export type ShieldRecord = {
  ingestToken: string;
  includedUntil: string;
  cardOnFile: boolean;
  forwardingConfirmedAt?: string;
  cancelledAt?: string;
};

export type CaseRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: CaseLifecycle;
  noticeText: string;
  marketplace: Marketplace | 'unknown';
  classification?: {
    code: string;
    plainEnglish: string;
    confidence: number;
  };
  clauses?: CitedClause[];
  sections?: DraftSections;
  critique?: Critique;
  rubricLabels?: Record<string, string>;
  syntheticCorpus?: boolean;
  recordedModel?: boolean;
  escalation?: EscalationRecord;
  payment?: PaymentRecord;
  submittedAt?: string;
  decision?: 'reinstated' | 'rejected' | 'no_response';
  shield?: ShieldRecord;
};

type Store = {
  cases: Map<string, CaseRecord>;
};

/**
 * `globalThis` rather than a module-level `const`, so Next's dev-mode module
 * reloading does not silently hand a route a second, empty store while the
 * seller's tab is still open on the first.
 */
const g = globalThis as typeof globalThis & { __cwCaseStore?: Store };
const store: Store = (g.__cwCaseStore ??= { cases: new Map() });

export function newCaseId(): string {
  // CORPUS_DESIGN §2.3: opaque, never derived from email, merchant token or
  // Stripe id.
  return `case_${ulid().toLowerCase()}`;
}

export function createCase(noticeText: string): CaseRecord {
  const now = new Date().toISOString();
  const record: CaseRecord = {
    id: newCaseId(),
    createdAt: now,
    updatedAt: now,
    status: 'intake',
    noticeText,
    marketplace: 'unknown',
  };
  store.cases.set(record.id, record);
  return record;
}

export function getCase(id: string): CaseRecord | undefined {
  return store.cases.get(id);
}

export function updateCase(id: string, patch: Partial<CaseRecord>): CaseRecord | undefined {
  const existing = store.cases.get(id);
  if (!existing) return undefined;
  const next: CaseRecord = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  store.cases.set(id, next);
  return next;
}

export function listCases(): CaseRecord[] {
  return [...store.cases.values()].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/**
 * The /ops queue. Both entry points converge here — a first-pass classification
 * failure and a post-rejection guarantee — because USER_JOURNEY §4 requires the
 * human-review experience not to differ by *why* a human got involved.
 */
export function listEscalations(): CaseRecord[] {
  return listCases().filter((c) => c.escalation && !c.escalation.resolvedAt);
}

export function listResolvedEscalations(): CaseRecord[] {
  return listCases().filter((c) => c.escalation?.resolvedAt);
}

export function claimEscalation(id: string, reviewerId: string): CaseRecord | undefined {
  const existing = getCase(id);
  if (!existing?.escalation) return undefined;
  return updateCase(id, {
    status: 'human_queued',
    escalation: {
      ...existing.escalation,
      claimedBy: reviewerId,
      claimedAt: new Date().toISOString(),
    },
  });
}

export function resolveEscalation(id: string, resolution: string): CaseRecord | undefined {
  const existing = getCase(id);
  if (!existing?.escalation) return undefined;
  return updateCase(id, {
    status: 'human_reviewed',
    escalation: {
      ...existing.escalation,
      resolvedAt: new Date().toISOString(),
      resolution,
    },
  });
}

/** Test seam. */
export function resetCaseStore(): void {
  store.cases.clear();
}
