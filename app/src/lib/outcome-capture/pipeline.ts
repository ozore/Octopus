/**
 * The redaction + staging step: consent → redact → insert into L4 at
 * `curation_state = 'redacted'`.
 *
 * Spec: ADR-008 ¶2 — "promotion, not insertion... a record enters `l4_record`
 * only when (consent ∧ automated redaction ∧ — for the first ~100 — human
 * spot-check) all hold." This module implements the first conjunct's gate
 * (consent) and the second (redaction); `./promotion.ts` implements the
 * third and performs the actual `redacted → verified → promoted` walk.
 */

import { createHash } from 'node:crypto';

import * as casesRepo from '../db/repositories/cases';
import * as classificationsRepo from '../db/repositories/classifications';
import * as consentsRepo from '../db/repositories/consents';
import * as draftsRepo from '../db/repositories/drafts';
import * as l4Repo from '../db/repositories/l4-records';
import * as noticeDocumentsRepo from '../db/repositories/notice-documents';
import * as outcomeReportsRepo from '../db/repositories/outcome-reports';
import { enqueueJob } from '../queue';
import type { Db } from '../db';
import { looksFullyRedacted, redactText, type ModelAssistRedactor } from './redaction';

export type StageResult =
  | { staged: false; reason: 'no_consent' | 'incomplete_case' }
  | { staged: true; l4RecordId: string; quarantined: boolean };

/** A stable fingerprint of the document's SHAPE, not its text — CORPUS_DESIGN
 *  design intent (schema.ts comment on `poa_structure_hash`): "fifty near-
 *  identical drafts for one code are evidence about ONE pattern." Hashing the
 *  section lengths bucketed to the nearest 50 characters clusters similar
 *  structures without being sensitive to exact wording. */
export function computeStructureHash(sections: Record<string, string>): string {
  const shape = Object.keys(sections)
    .sort()
    .map((key) => `${key}:${Math.round((sections[key]?.length ?? 0) / 50) * 50}`)
    .join('|');
  return createHash('sha256').update(shape).digest('hex').slice(0, 16);
}

/**
 * Redacts the case's notice and latest draft and stages them as an L4 record
 * (curation_state = 'redacted'). No-ops (returns `{staged:false}`) rather
 * than throwing when consent is absent/declined or the case is incomplete —
 * both are ordinary, expected states, not errors (a case can finish without
 * ever becoming corpus material, and that is fine).
 */
export async function runRedactionAndStage(
  db: Db,
  caseId: string,
  opts: { modelAssist?: ModelAssistRedactor } = {},
): Promise<StageResult> {
  const consent = await consentsRepo.getConsentForCase(db, caseId);
  if (!consent || !consent.granted || consent.revokedAt) {
    return { staged: false, reason: 'no_consent' };
  }

  const [caseRow, notice, draft, classification, outcomeReport] = await Promise.all([
    casesRepo.getCase(db, caseId),
    noticeDocumentsRepo.getNoticeDocumentForCase(db, caseId),
    draftsRepo.getLatestDraft(db, caseId),
    classificationsRepo.getLatestClassification(db, caseId),
    outcomeReportsRepo.getLatestOutcomeReport(db, caseId),
  ]);

  if (!caseRow || !notice || !draft || !classification) {
    return { staged: false, reason: 'incomplete_case' };
  }

  const [redactedNotice, redactedDraft] = await Promise.all([
    redactText(notice.rawTextEncrypted, opts),
    redactText(draft.bodyMd, opts),
  ]);

  const plausible =
    looksFullyRedacted(redactedNotice.redactedText) && looksFullyRedacted(redactedDraft.redactedText);

  const sections = draft.sections as Record<string, string>;

  const record = await l4Repo.insertL4Record(db, {
    consentId: consent.id,
    ...(outcomeReport ? { outcomeReportId: outcomeReport.id } : {}),
    reasonCode: classification.reasonCode,
    marketplace: caseRow.marketplace,
    redactedNotice: redactedNotice.redactedText,
    redactedDraft: redactedDraft.redactedText,
    poaStructureHash: computeStructureHash(sections),
    corpusRelease: caseRow.corpusRelease,
    promptBundleHash: caseRow.promptBundleHash,
    modelId: caseRow.modelId,
    redactionMethod: opts.modelAssist ? 'deterministic-v1+model-assist' : 'deterministic-v1',
  });

  if (!plausible) {
    // CORPUS_DESIGN.md §4.6: "redacted → quarantined: implausible /
    // contradictory." A failed redaction pass never reaches a human
    // reviewer's promotion queue silently — it lands in a state that says so.
    await l4Repo.transitionCuration(db, record.id, 'quarantined');
    return { staged: true, l4RecordId: record.id, quarantined: true };
  }

  await enqueueJob(db, 'promote_l4', { l4RecordId: record.id });
  return { staged: true, l4RecordId: record.id, quarantined: false };
}
