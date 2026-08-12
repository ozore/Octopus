/**
 * Typed job payloads.
 *
 * Spec: ARCHITECTURE.md ADR-005 (Postgres is the database, the queue and the
 * scheduler). `db/queue.ts` and `db/schema.ts` treat `jobs.payload` as opaque
 * `jsonb` by design — the queue mechanics must not know what a job kind means.
 * This module is the layer above that: one Zod schema per `job_kind`, so a
 * handler never has to defensively re-validate a shape the enqueuing call site
 * already promised.
 *
 * A payload that fails validation on enqueue is a bug caught at the call site,
 * before it becomes a row a worker can claim and fail on repeatedly.
 */

import { z } from 'zod';

import type { JobKind } from '../db/queue';

export const RenderPdfPayload = z.object({ caseId: z.string(), draftId: z.string() });
export const SendScheduledEmailPayload = z.object({ scheduledEmailId: z.string().uuid() });
export const RedactNoticePayload = z.object({ caseId: z.string() });
export const PromoteL4Payload = z.object({ l4RecordId: z.string().uuid() });
export const SlaBreachRefundPayload = z.object({ caseId: z.string() });
export const CacheRewarmPayload = z.object({ reason: z.string().optional() });
export const ProcessInboundNoticePayload = z.object({ inboundNoticeId: z.string().uuid() });
export const EscalationReviewPayload = z.object({ caseId: z.string() });
export const DeleteSubjectDataPayload = z.object({
  consentId: z.string().uuid().optional(),
  caseId: z.string().optional(),
});

/** One schema per `job_kind` (db/schema.ts `jobKindEnum`). Deliberately
 *  exhaustive — see the `satisfies` check below — so adding a job kind to the
 *  enum without adding a payload schema here is a type error, not a runtime
 *  surprise the first time someone enqueues it. */
export const JOB_PAYLOAD_SCHEMAS = {
  render_pdf: RenderPdfPayload,
  send_scheduled_email: SendScheduledEmailPayload,
  redact_notice: RedactNoticePayload,
  promote_l4: PromoteL4Payload,
  sla_breach_refund: SlaBreachRefundPayload,
  cache_rewarm: CacheRewarmPayload,
  process_inbound_notice: ProcessInboundNoticePayload,
  escalation_review: EscalationReviewPayload,
  delete_subject_data: DeleteSubjectDataPayload,
} satisfies Record<JobKind, z.ZodTypeAny>;

export type JobPayloadFor<K extends JobKind> = z.infer<(typeof JOB_PAYLOAD_SCHEMAS)[K]>;

export function parseJobPayload<K extends JobKind>(kind: K, payload: unknown): JobPayloadFor<K> {
  const schema = JOB_PAYLOAD_SCHEMAS[kind];
  return schema.parse(payload) as JobPayloadFor<K>;
}
