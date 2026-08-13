/**
 * The web tier's case repository — SERVER ONLY.
 *
 * Spec: USER_JOURNEY.md §4 (the case state machine), ARCHITECTURE.md §5.1 (the
 * `cases` / `classifications` / `drafts` / `citations` / `critiques` /
 * `payments` / `shield_accounts` / `outcome_reports` tables), §3.6 (the
 * escalation queue), ADR-002 (the classification and slice are frozen for the
 * life of a case), ADR-006 (Shield is an inbound-email adapter and nothing more),
 * ADR-008 ¶3 (attribution is stamped at creation).
 *
 * WHAT THIS IS. A read-model over `src/lib/db/`. It owns exactly two things:
 * the assembly of one `CaseRecord` from the rows of seven tables, and the
 * translation between the screens' lifecycle vocabulary and the database's.
 * Every write goes through the repositories, and every status write goes through
 * `transitionCase()`, so an illegal edge throws here as surely as it does in the
 * worker.
 *
 * THE TRANSLATION IS THE INTERESTING PART, so it is stated rather than inferred.
 * `case_status` is an ABRIDGED 11-state projection of USER_JOURNEY §4's diagram
 * (see `db/case-state-machine.ts`'s reconciliation note). The states the screens
 * render that the enum does not have are reconstructed from the rows that
 * actually record them:
 *
 *   screen state        →  what it is derived from
 *   ------------------     ---------------------------------------------------
 *   awaiting_payment    →  status='preview_ready' AND a pending payment row
 *   delivered           →  status='document_ready', nothing submitted yet
 *   submitted           →  cases.submitted_at set, no outcome report
 *   decision_pending    →  an outcome report with decision='unknown'
 *   reinstated/rejected →  the outcome report's decision
 *   human_queued        →  status='escalated', claimed, not resolved
 *   human_reviewed      →  status='escalated', resolved
 *
 * That direction is lossy on purpose: the database records FACTS (a payment
 * exists, a decision was reported, a reviewer claimed it) and the screen renders
 * a state. Deriving the state from the facts means the two can never disagree,
 * which the previous in-process store — a `Map` holding a `status` string
 * alongside the facts — could not promise across even a single restart.
 */

import { ulid } from 'ulid';

import { getDb } from '@/lib/db';
import type { Db } from '@/lib/db';
import * as casesRepo from '@/lib/db/repositories/cases';
import * as classificationsRepo from '@/lib/db/repositories/classifications';
import * as consentsRepo from '@/lib/db/repositories/consents';
import * as critiquesRepo from '@/lib/db/repositories/critiques';
import * as draftsRepo from '@/lib/db/repositories/drafts';
import * as noticeDocumentsRepo from '@/lib/db/repositories/notice-documents';
import * as outcomeReportsRepo from '@/lib/db/repositories/outcome-reports';
import * as paymentsRepo from '@/lib/db/repositories/payments';
import * as shieldAccountsRepo from '@/lib/db/repositories/shield-accounts';
import type { CaseRow } from '@/lib/db/repositories/types';
import { cases as casesTable } from '@/lib/db/schema';
import { REASON_CODE_TABLE, isReasonCode } from '@/lib/domain/reason-codes';
import type {
  CitedClause,
  Critique,
  DraftSections,
  EscalationReason,
  Marketplace,
} from '@/lib/domain/types';
import { getEnv } from '@/env';

/** The states USER_JOURNEY.md §4 draws — the screens' vocabulary, derived from
 *  the database's per the table in this file's header. */
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
  /** Set by the WEBHOOK, which is the source of truth (ADR-007). A row that
   *  exists with `status='pending'` is a Checkout that was started, never a
   *  purchase that completed — which is why the /case screen distinguishes
   *  "recorded" from "confirmed". */
  paidAt?: string;
  status: 'pending' | 'paid' | 'refunded' | 'failed';
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

/** The screens' patch vocabulary. Each field is routed to the table that owns
 *  it by `updateCase` below; `status` is routed to the state machine. */
export type CasePatch = Partial<Omit<CaseRecord, 'id' | 'createdAt' | 'updatedAt'>>;

// ---------------------------------------------------------------------------
// Ids and attribution
// ---------------------------------------------------------------------------

export function newCaseId(): string {
  // CORPUS_DESIGN §2.3: opaque, never derived from email, merchant token or
  // Stripe id.
  return `case_${ulid().toLowerCase()}`;
}

/** ADR-008 ¶3 — stamped at creation, never back-filled. Without these three an
 *  outcome is an anecdote rather than evidence about a corpus release. */
function attribution() {
  const env = getEnv();
  return {
    corpusRelease: env.CORPUS_RELEASE,
    promptBundleHash: env.PROMPT_BUNDLE_HASH,
    modelId: env.MODEL_DRAFT,
    stageModelIds: {
      classify: env.MODEL_CLASSIFY,
      draft: env.MODEL_DRAFT,
      critique: env.MODEL_CRITIQUE,
    },
  };
}

// ---------------------------------------------------------------------------
// Assembling the read model
// ---------------------------------------------------------------------------

const iso = (d: Date | null | undefined): string | undefined => d?.toISOString();

function deriveStatus(
  row: CaseRow,
  payment: Awaited<ReturnType<typeof paymentsRepo.getLatestPaymentForCase>>,
  outcome: Awaited<ReturnType<typeof outcomeReportsRepo.getLatestOutcomeReport>>,
): CaseLifecycle {
  switch (row.status) {
    case 'escalated':
      if (row.escalationResolvedAt) return 'human_reviewed';
      if (row.escalationClaimedBy) return 'human_queued';
      return 'escalated';

    case 'preview_ready':
      // AwaitingPayment has no database state of its own: it IS preview_ready
      // with a Checkout in flight (case-state-machine.ts's reconciliation note).
      return payment && payment.status === 'pending' ? 'awaiting_payment' : 'preview_ready';

    case 'document_ready': {
      if (outcome && outcome.decision !== 'unknown') {
        if (outcome.decision === 'reinstated') return 'reinstated';
        if (outcome.decision === 'rejected') return 'rejected';
        return 'submitted'; // no_response / withdrawn: reported, not concluded
      }
      if (outcome) return 'decision_pending';
      if (row.submittedAt) return 'submitted';
      return 'delivered';
    }

    // classified/drafting/critiquing are mid-pipeline: the screens narrate them
    // through the SSE stream, and a page load during them shows 'classifying'.
    case 'classified':
    case 'drafting':
    case 'critiquing':
      return 'classifying';

    case 'refunded':
      return 'failed';

    default:
      return row.status;
  }
}

function toEscalation(row: CaseRow): EscalationRecord | undefined {
  if (!row.escalatedAt || !row.escalationReason) return undefined;
  const code = row.escalationReason;
  return {
    reason: code as EscalationReason,
    detail: row.escalationDetail ?? '',
    // ARCHITECTURE §3.6: only a refused category routes OUT; everything else is
    // a case a person on our side takes.
    disposition: code === 'refused_category' ? 'refer_out' : 'human_tier',
    escalatedAt: row.escalatedAt.toISOString(),
    ...(row.escalationClaimedBy ? { claimedBy: row.escalationClaimedBy } : {}),
    ...(iso(row.escalationClaimedAt) ? { claimedAt: iso(row.escalationClaimedAt)! } : {}),
    ...(iso(row.escalationResolvedAt) ? { resolvedAt: iso(row.escalationResolvedAt)! } : {}),
    ...(row.escalationResolution ? { resolution: row.escalationResolution } : {}),
  };
}

async function assemble(db: Db, row: CaseRow): Promise<CaseRecord> {
  const [notice, classification, draft, payment, shield, outcome] = await Promise.all([
    noticeDocumentsRepo.getNoticeDocumentForCase(db, row.id),
    classificationsRepo.getLatestClassification(db, row.id),
    draftsRepo.getLatestDraft(db, row.id),
    paymentsRepo.getLatestPaymentForCase(db, row.id),
    shieldAccountsRepo.getShieldAccountForCase(db, row.id),
    outcomeReportsRepo.getLatestOutcomeReport(db, row.id),
  ]);

  const [citations, critique] = await Promise.all([
    draft ? draftsRepo.listCitationsForDraft(db, draft.id) : Promise.resolve([]),
    draft ? critiquesRepo.getLatestCritiqueForDraft(db, draft.id) : Promise.resolve(undefined),
  ]);

  const record: CaseRecord = {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    status: deriveStatus(row, payment, outcome),
    noticeText: notice?.rawTextEncrypted ?? '',
    marketplace: row.marketplace,
  };

  if (classification && isReasonCode(classification.reasonCode)) {
    record.classification = {
      code: classification.reasonCode,
      plainEnglish: REASON_CODE_TABLE[classification.reasonCode].plainEnglish,
      confidence: classification.confidence,
    };
  }

  if (draft) {
    record.sections = draft.sections as DraftSections;
    // I2: a `CitedClause` is reconstructed from the citation ROWS, which exist
    // only because an allowlisted citation object existed. There is no path from
    // draft prose to this array, here or anywhere.
    record.clauses = citations.map((c) => ({
      citedText: c.citedText,
      clauseId: c.clauseId,
      sourceUrl: c.sourceUrl,
      documentTitle: c.documentTitle,
      block: { startBlockIndex: c.startBlockIndex, endBlockIndex: c.endBlockIndex },
    }));
    record.syntheticCorpus = draft.promptBundleHash === FIXTURE_BUNDLE_HASH;
    record.recordedModel = draft.modelId === RECORDED_MODEL_ID;
  }

  if (critique) {
    record.critique = {
      readinessScore: critique.readinessScore,
      criteria: critique.criteria as Critique['criteria'],
      blockingDeficiencies: [...critique.blockingDeficiencies],
      evidenceKitGaps: [...critique.evidenceKitGaps],
    } as Critique;
    // DERIVED, NOT STORED. The rubric's human-readable labels are a property of
    // the corpus release, not of this critique, and the case's classification is
    // frozen for its life (ADR-002) — so re-deriving them from the corpus is
    // both correct and duplication-free. Storing a copy in the operational
    // database would put corpus content in two places that could disagree.
    record.rubricLabels = record.classification
      ? await rubricLabelsFor(record.classification.code)
      : {};
  }

  const escalation = toEscalation(row);
  if (escalation) record.escalation = escalation;

  if (payment && payment.tier !== 'shield_monthly') {
    record.payment = {
      tier: payment.tier,
      sessionId: payment.stripeSessionId,
      amountCents: payment.amountCents,
      status: payment.status,
      ...(iso(payment.paidAt) ? { paidAt: iso(payment.paidAt)! } : {}),
    };
  }

  if (shield) {
    record.shield = {
      ingestToken: shield.ingestToken,
      includedUntil: shield.includedUntil?.toISOString() ?? '',
      // D6: every appeal-tier Checkout sets `setup_future_usage`, so an account
      // that exists at all was created from a purchase that left a card on file.
      // The screen uses this to say the renewal needs no new payment details.
      cardOnFile: true,
      ...(iso(shield.cancelledAt) ? { cancelledAt: iso(shield.cancelledAt)! } : {}),
    };
  }

  if (iso(row.submittedAt)) record.submittedAt = iso(row.submittedAt)!;
  if (outcome && outcome.decision !== 'unknown' && outcome.decision !== 'withdrawn') {
    record.decision = outcome.decision;
  }

  return record;
}

/** Markers the engine-runtime stamps so the screen can label a run honestly
 *  (LLM_ENGINE §8.1 — synthetic material is labelled wherever it surfaces). */
export const FIXTURE_BUNDLE_HASH = 'fixture-corpus';
export const RECORDED_MODEL_ID = 'recorded-mock';

/**
 * `criterionId -> human label`, read from the corpus slice for a reason code.
 *
 * Returns `{}` rather than throwing when the corpus cannot serve the code: a
 * critique whose labels are missing renders with its criterion ids, which is
 * degraded but honest. Failing the whole case read would turn a corpus gap
 * (G7 blocks `AMZ.OPS.DROPSHIP` for US sellers today) into a broken page.
 */
async function rubricLabelsFor(code: string): Promise<Record<string, string>> {
  try {
    const { loadCorpusProvider } = await import('@/lib/engine');
    const corpus = await loadCorpusProvider();
    const slice = corpus.getSlice(code as Parameters<typeof corpus.getSlice>[0]);
    return Object.fromEntries(slice.rubric.criteria.map((c) => [c.id, c.label]));
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getCase(id: string): Promise<CaseRecord | undefined> {
  const db = await getDb();
  const row = await casesRepo.getCase(db, id);
  return row ? assemble(db, row) : undefined;
}

export async function listCases(limit = 100): Promise<CaseRecord[]> {
  const db = await getDb();
  const rows = await casesRepo.listRecentCases(db, limit);
  return Promise.all(rows.map((row) => assemble(db, row)));
}

export async function listEscalations(): Promise<CaseRecord[]> {
  const db = await getDb();
  const rows = await casesRepo.listOpenEscalations(db);
  return Promise.all(rows.map((row) => assemble(db, row)));
}

export async function listResolvedEscalations(): Promise<CaseRecord[]> {
  const db = await getDb();
  const rows = await casesRepo.listResolvedEscalations(db);
  return Promise.all(rows.map((row) => assemble(db, row)));
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

/**
 * B1: one textarea, no signup, no email, no card. The notice lands in
 * `notice_documents` under its retention clock in the SAME transaction as the
 * case, because a case whose notice went missing is a case we cannot draft and
 * cannot redact.
 */
export async function createCase(noticeText: string): Promise<CaseRecord> {
  const db = await getDb();
  const id = newCaseId();
  const { createHash } = await import('node:crypto');
  const sha256 = createHash('sha256').update(noticeText, 'utf8').digest('hex');

  const row = await casesRepo.createCase(db, { id, sourceKind: 'paste', ...attribution() });

  await noticeDocumentsRepo.insertNoticeDocument(db, {
    caseId: id,
    // Field name, not a claim: at-rest encryption is the database's job
    // (ADR-008 ¶2 gives the column a retention clock, not a cipher). Nothing
    // here should be read as "we encrypted this in application code".
    rawTextEncrypted: noticeText,
    sha256,
    charLength: noticeText.length,
    receivedVia: 'paste',
    retentionExpiresAt: new Date(Date.now() + RETENTION_DAYS * 864e5),
  });

  return assemble(db, row);
}

/** ADR-008 ¶4 — the raw notice's retention clock. */
export const RETENTION_DAYS = 90;

/**
 * Routes a screen-shaped patch to the tables that own each field.
 *
 * `status` is translated back to a `case_status` and applied through
 * `transitionCase()`, so the machine's edges hold for web writes exactly as they
 * do for worker writes. A patch that carries no status touches no status: the
 * screens can record a fact without asserting a lifecycle move.
 */
export async function updateCase(id: string, patch: CasePatch): Promise<CaseRecord | undefined> {
  const db = await getDb();
  const existing = await casesRepo.getCase(db, id);
  if (!existing) return undefined;

  if (patch.classification) {
    const code = patch.classification.code;
    await classificationsRepo.insertClassification(db, {
      caseId: id,
      reasonCode: code,
      confidence: patch.classification.confidence,
      // Margin is the engine's number; the screens never compute one. Absent
      // here means "this write did not carry it", not "it was zero".
      margin: 0,
      marketplace: patch.marketplace ?? existing.marketplace,
      modelId: getEnv().MODEL_CLASSIFY,
    });
  }

  if (patch.sections) {
    const { draft } = await draftsRepo.insertDraftWithCitations(
      db,
      {
        caseId: id,
        bodyMd: [
          patch.sections.rootCause,
          patch.sections.correctiveActions,
          patch.sections.preventiveMeasures,
        ].join('\n\n'),
        sections: patch.sections,
        createdBy: 'model',
        modelId: patch.recordedModel ? RECORDED_MODEL_ID : getEnv().MODEL_DRAFT,
        corpusRelease: existing.corpusRelease,
        promptBundleHash: patch.syntheticCorpus ? FIXTURE_BUNDLE_HASH : existing.promptBundleHash,
      },
      (patch.clauses ?? []).map((c) => ({
        citedText: c.citedText,
        clauseId: c.clauseId,
        sourceUrl: c.sourceUrl,
        documentTitle: c.documentTitle,
        docIndex: 0,
        startBlockIndex: c.block.startBlockIndex,
        endBlockIndex: c.block.endBlockIndex,
      })),
    );

    if (patch.critique) {
      await critiquesRepo.insertCritique(db, {
        draftId: draft.id,
        readinessScore: patch.critique.readinessScore,
        criteria: patch.critique.criteria,
        blockingDeficiencies: [...patch.critique.blockingDeficiencies],
        evidenceKitGaps: [...patch.critique.evidenceKitGaps],
        modelId: getEnv().MODEL_CRITIQUE,
      });
    }
  }

  if (patch.submittedAt) await casesRepo.recordSubmitted(db, id, new Date(patch.submittedAt));

  if (patch.decision) {
    await outcomeReportsRepo.insertOutcomeReport(db, {
      caseId: id,
      source: 'email_form',
      submitted: true,
      decision: patch.decision,
    });
  }

  if (patch.shield) await upsertShield(db, id, patch.shield);

  if (patch.status) await applyStatus(db, existing, patch);

  const updated = await casesRepo.requireCase(db, id);
  return assemble(db, updated);
}

/**
 * Screen state → `case_status`, applied through the machine.
 *
 * The states with no database equivalent (`awaiting_payment`, `human_queued`,
 * `human_reviewed`, `submitted`, `decision_pending`, `reinstated`, `rejected`)
 * deliberately move nothing: they are DERIVED by `deriveStatus` from the facts
 * this same patch already wrote. Translating them into a status write would be
 * the two-sources-of-truth bug the derivation exists to prevent.
 */
async function applyStatus(db: Db, existing: CaseRow, patch: CasePatch): Promise<void> {
  const target = patch.status;
  if (!target || target === 'awaiting_payment') return;
  if (target === 'human_queued' || target === 'human_reviewed') return;
  if (target === 'submitted' || target === 'decision_pending') return;
  if (target === 'reinstated' || target === 'rejected') return;

  switch (target) {
    case 'classifying':
      if (existing.status === 'intake') await casesRepo.markClassifying(db, existing.id);
      return;

    case 'preview_ready':
      // The engine ran classify → retrieve → draft → critique in one call, so
      // the intermediate rows are walked here rather than pretended away: the
      // machine's edges are the audit trail of what actually happened.
      await walk(
        db,
        existing.id,
        ['classified', 'drafting', 'critiquing', 'preview_ready'],
        // Stage 1 read the marketplace out of the notice; this is the transition
        // that is entitled to record it (see `walk`).
        patch.marketplace ? { classified: { marketplace: patch.marketplace } } : {},
      );
      return;

    case 'paid':
      await casesRepo.markPaid(db, existing.id);
      return;

    case 'delivered':
      await casesRepo.markDocumentReady(db, existing.id);
      return;

    case 'escalated': {
      const reason = patch.escalation?.reason ?? 'seller_choice';
      const detail = patch.escalation?.detail ?? 'Escalated for human review.';
      if (existing.status === 'escalated') return;
      // I5: reachable from classifying, critiquing, or document_ready (the
      // post-rejection outcome guarantee). Never a fallback that drafts anyway.
      if (existing.status === 'intake') await casesRepo.markClassifying(db, existing.id);
      await casesRepo.markEscalated(db, existing.id, reason, detail);
      return;
    }

    case 'failed':
      await casesRepo.markPipelineFailed(db, existing.id, patch.escalation?.detail ?? 'pipeline failed');
      return;

    default:
      return;
  }
}

/** Walks a run of legal edges, skipping any the case has already passed. */
/**
 * `at` carries a per-status field patch — today only the marketplace, applied on
 * the `classified` step.
 *
 * WHY IT IS NOT ENOUGH TO WRITE THE MARKETPLACE ON THE CLASSIFICATION ROW.
 * `updateCase` does that already, but `assemble()` reads `CaseRecord.marketplace`
 * off the `cases` row, and the `cases` row's column defaults to `'unknown'`. So
 * before this, every drafted case rendered "Marketplace: unknown" no matter what
 * stage 1 decided — and `/case/{id}/plan` then fell back to the generic "your
 * marketplace's Account Health page" instead of naming the Seller Central path.
 * USER_JOURNEY §7.3 calls that checklist "the highest-leverage single screen in
 * the product", and "where it goes" is its last step, so a silently generic
 * answer there is a real loss rather than a cosmetic one.
 *
 * It rides on the transition rather than a separate UPDATE because
 * `transitionCase` already takes the row's lock and applies the patch inside
 * that transaction — a second write would be a second chance to disagree.
 */
async function walk(
  db: Db,
  caseId: string,
  path: casesRepo.CaseStatus[],
  at: Partial<Record<casesRepo.CaseStatus, { marketplace?: CaseRow['marketplace'] }>> = {},
): Promise<void> {
  for (const to of path) {
    const current = await casesRepo.requireCase(db, caseId);
    if (current.status === to) continue;
    if (!casesRepo.CASE_TRANSITIONS[current.status].includes(to)) continue;
    const fields = at[to];
    await casesRepo.transitionCase(db, caseId, to, fields?.marketplace ? { marketplace: fields.marketplace } : {});
  }
}

async function upsertShield(db: Db, caseId: string, shield: ShieldRecord): Promise<void> {
  const existing = await shieldAccountsRepo.getShieldAccountForCase(db, caseId);
  if (!existing) {
    await shieldAccountsRepo.createShieldAccount(db, {
      caseId,
      ingestToken: shield.ingestToken,
      sourceKind: 'email_forward',
      includedUntil: new Date(shield.includedUntil),
    });
    return;
  }
  if (shield.cancelledAt && !existing.cancelledAt) {
    await shieldAccountsRepo.cancelShieldAccount(db, existing.id);
  }
}

// ---------------------------------------------------------------------------
// The /ops queue
// ---------------------------------------------------------------------------

export async function claimEscalation(id: string, reviewerId: string): Promise<CaseRecord | undefined> {
  const db = await getDb();
  const row = await casesRepo.claimEscalation(db, id, reviewerId);
  return row ? assemble(db, row) : undefined;
}

export async function resolveEscalation(id: string, resolution: string): Promise<CaseRecord | undefined> {
  const db = await getDb();
  const row = await casesRepo.resolveEscalation(db, id, resolution);
  return row ? assemble(db, row) : undefined;
}

/**
 * Test seam. Deletes every case; the schema's `ON DELETE CASCADE` takes the
 * notices, classifications, drafts, citations, critiques, consents and outcome
 * reports with it, which is the same cascade a subject-deletion request relies
 * on (ADR-008 ¶4). Refuses to run in production, where nothing should ever call
 * a function that empties the case table.
 */
export async function resetCaseStore(): Promise<void> {
  if (getEnv().NODE_ENV === 'production') {
    throw new Error('resetCaseStore is a test seam and must never run in production');
  }
  const db = await getDb();
  await db.delete(casesTable);
}

// ---------------------------------------------------------------------------
// Consent (ADR-008 ¶1 — separable from the purchase)
// ---------------------------------------------------------------------------

export async function recordOutcomeConsent(
  caseId: string,
  granted: boolean,
  textVersion: string,
  consentText: string,
): Promise<void> {
  const db = await getDb();
  await consentsRepo.recordConsent(db, {
    caseId,
    granted,
    textVersion,
    consentText,
    ...(granted ? { grantedAt: new Date() } : {}),
  });
}
