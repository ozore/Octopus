/**
 * Worker job handlers owned by the outcome-capture module.
 *
 * Spec: ADR-008. Three jobs: `redact_notice` (stage a record), `promote_l4`
 * (walk it to `promoted` once earned), `delete_subject_data` (the async half
 * of a consent revocation's cascade — see outcome-capture/consent.ts for the
 * synchronous half). None of these need a vendor adapter, so their handler
 * signature is `(db, job)`, not `(db, adapters, job)`.
 */

import * as noticeDocumentsRepo from '../db/repositories/notice-documents';
import * as l4Repo from '../db/repositories/l4-records';
import type { Db } from '../db';
import type { Job } from '../db/schema';
import { parseJobPayload } from '../queue/job-payloads';
import type { ModelAssistRedactor } from './redaction';
import { runRedactionAndStage } from './pipeline';
import { attemptPromotion } from './promotion';

export function makeHandleRedactNotice(modelAssist?: ModelAssistRedactor) {
  return async function handleRedactNotice(db: Db, job: Job): Promise<void> {
    const { caseId } = parseJobPayload('redact_notice', job.payload);
    await runRedactionAndStage(db, caseId, modelAssist ? { modelAssist } : {});
  };
}

export async function handlePromoteL4(db: Db, job: Job): Promise<void> {
  const { l4RecordId } = parseJobPayload('promote_l4', job.payload);
  await attemptPromotion(db, l4RecordId);
}

/**
 * The async half of ADR-008 ¶4's deletion cascade. The synchronous half
 * (cancel pending emails, soft-delete already-promoted L4 records) runs
 * inside `outcome-capture/consent.ts#revokeConsentAndCascade`'s own
 * transaction at revocation time; this job additionally purges the raw
 * notice text, which is intentionally NOT done inline at revocation (it can
 * be a larger, slower operation once real encryption/KMS calls are wired,
 * and Twelve-Factor IX disposability means that work belongs on the queue).
 */
export async function handleDeleteSubjectData(db: Db, job: Job): Promise<void> {
  const { caseId, consentId } = parseJobPayload('delete_subject_data', job.payload);

  if (caseId) {
    const notice = await noticeDocumentsRepo.getNoticeDocumentForCase(db, caseId);
    if (notice && !notice.deletedAt) {
      await noticeDocumentsRepo.purgeNoticeDocument(db, notice.id);
    }
  }

  if (consentId) {
    await l4Repo.softDeleteL4RecordsForConsent(db, consentId);
  }
}
