/**
 * Starting (or rejoining) the preview run for one case — SERVER ONLY.
 *
 * Spec: ARCHITECTURE.md §3.1, §3.2, I5; USER_JOURNEY.md §4 and §7.
 *
 * This is where the pipeline's two exits become two screens. A `drafted` result
 * becomes the pre-paywall preview — reason code, cited clause, critique — which
 * USER_JOURNEY §1.4 requires to be complete and legible *before* payment,
 * because A4 is a comparative experiment and a half-visible proof confounds it.
 * An `escalate` result becomes an honest triage screen, and the case is put on
 * the /ops queue in the same step, so the human path is real rather than a
 * promise on a page.
 *
 * NOTHING HERE COERCES AN ESCALATION INTO A DRAFT. That is I5, and the reason it
 * cannot be done accidentally is upstream of this file: `EngineRunResult` is a
 * discriminated union and `draft` exists only on the `drafted` arm.
 */

import { createHash } from 'node:crypto';

import { REASON_CODE_TABLE, REFUSED_CATEGORIES, isReasonCode } from '@/lib/domain/reason-codes';
import type { Marketplace, NoticeDocument } from '@/lib/domain/types';

import { getCase, updateCase, type CaseRecord } from './case-store';
import { runNarratedPipeline } from './engine-runtime';
import type { ProgressEvent } from './progress';
import { STAGE_KEYS } from './progress';
import { getRun, startRun, type Run } from './run-registry';

/** The notice's content hash, stamped on the `NoticeDocument` the engine reads. */
function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

/** Replays a finished case as a terminal set of events, for a fresh tab. */
function terminalEvents(record: CaseRecord): ProgressEvent[] {
  const events: ProgressEvent[] = STAGE_KEYS.map((key) => ({
    type: 'stage' as const,
    key,
    state: 'done' as const,
  }));

  if (record.sections && record.clauses && record.critique && record.classification) {
    events.push({
      type: 'preview',
      preview: {
        caseId: record.id,
        reasonCode: record.classification.code,
        plainEnglish: record.classification.plainEnglish,
        marketplace: record.marketplace,
        clauses: record.clauses,
        sections: record.sections,
        critique: record.critique,
        rubricLabels: record.rubricLabels ?? {},
        syntheticCorpus: Boolean(record.syntheticCorpus),
        recordedModel: Boolean(record.recordedModel),
      },
    });
  } else if (record.escalation) {
    events.push({
      type: 'escalated',
      reason: record.escalation.reason,
      detail: record.escalation.detail,
      disposition: record.escalation.disposition,
    });
  }
  events.push({ type: 'done' });
  return events;
}

export function ensureRun(record: CaseRecord): Run {
  const existing = getRun(record.id);
  if (existing) return existing;

  // A case that already carries a result was run in an earlier process life (or
  // an earlier tab). Replay it rather than re-billing three model calls. This is
  // now durable across a restart rather than merely across a tab: the record is
  // assembled from Postgres, so a seller who comes back tomorrow still sees the
  // preview they were shown today.
  if (record.status !== 'intake') {
    const replay = startRun(record.id, async (emit) => {
      for (const event of terminalEvents(record)) {
        if (event.type !== 'done') emit(event);
      }
    });
    return replay;
  }

  return startRun(record.id, async (emit) => {
    await updateCase(record.id, { status: 'classifying' });

    const notice: NoticeDocument = {
      caseId: record.id,
      text: record.noticeText,
      sha256: sha256(record.noticeText),
      receivedVia: 'paste',
    };

    const { result, syntheticCorpus, recordedModel, rubricLabels } = await runNarratedPipeline(
      notice,
      emit,
    );

    if (result.kind === 'drafted') {
      const code = result.classification.code;
      const plainEnglish = REASON_CODE_TABLE[code].plainEnglish;
      const marketplace: Marketplace = result.classification.marketplace;

      await updateCase(record.id, {
        status: 'preview_ready',
        marketplace,
        classification: { code, plainEnglish, confidence: result.classification.confidence },
        clauses: [...result.draft.clauses],
        sections: result.draft.sections,
        critique: result.critique,
        rubricLabels,
        syntheticCorpus,
        recordedModel,
      });

      emit({
        type: 'preview',
        preview: {
          caseId: record.id,
          reasonCode: code,
          plainEnglish,
          marketplace,
          clauses: [...result.draft.clauses],
          sections: result.draft.sections,
          critique: result.critique,
          rubricLabels,
          syntheticCorpus,
          recordedModel,
        },
      });
      return;
    }

    // ---- The escalation exit (I5, R3) -------------------------------------
    // Honest triage happens BEFORE the paywall, not after: per Akerlof (1970),
    // a strong refund guarantee needs a complementary screening control, and
    // telling an unwinnable case so for free is that control (USER_JOURNEY §7.6).
    const topCandidate = result.candidates?.[0]?.code;
    const refused =
      result.reason === 'refused_category' ||
      (typeof topCandidate === 'string' &&
        isReasonCode(topCandidate) &&
        REFUSED_CATEGORIES.has(topCandidate));
    const disposition = refused ? 'refer_out' : 'human_tier';

    await updateCase(record.id, {
      status: 'escalated',
      escalation: {
        reason: result.reason,
        detail: result.detail,
        disposition,
        escalatedAt: new Date().toISOString(),
      },
    });

    // The blocked node is amber, never rose: this is a routing decision, not a
    // failure (DESIGN_SYSTEM P4.2, §8.3).
    emit({ type: 'stage', key: 'identify', state: 'blocked' });
    emit({
      type: 'escalated',
      reason: result.reason,
      detail: result.detail,
      disposition,
    });
  });
}

export async function ensureRunById(caseId: string): Promise<Run | undefined> {
  const record = await getCase(caseId);
  return record ? ensureRun(record) : undefined;
}
