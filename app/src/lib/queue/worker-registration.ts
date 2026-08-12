/**
 * Wires the engine jobs owned by data/billing/email/outcome-capture onto the
 * worker's handler table.
 *
 * Spec: ARCHITECTURE.md §4.2 (the worker's roles: job runner, scheduler, PDF
 * renderer, redaction pipeline), ADR-005.
 *
 * This is dependency-injected (`register: RegisterFn`) rather than importing
 * `registerHandler` from `src/worker/index.ts` directly, because
 * `src/worker/index.ts` is this module's caller — importing it back would be
 * a cycle. `src/worker/index.ts` passes its own `registerHandler` in.
 *
 * Deliberately NOT registered here: `render_pdf` (PDF/document rendering),
 * `escalation_review` (the /ops queue-claim UI), `cache_rewarm` (the corpus/
 * engine workstream). Each belongs to a different assignment boundary; the
 * worker's "no handler registered for job kind" failure (src/worker/index.ts)
 * is the correct, loud signal for those until their owning module registers
 * them, rather than a silent no-op stub here.
 */

import type { Adapters } from '../adapters';
import type { Db } from '../db';
import type { Job } from '../db/schema';
import type { JobKind } from '../db/queue';
import { handleSlaBreachRefund } from '../billing/handlers';
import { handleSendScheduledEmail, makeProcessInboundNoticeHandler, type InboundNoticeClassifier } from '../email/handlers';
import {
  handleDeleteSubjectData,
  handlePromoteL4,
  makeHandleRedactNotice,
} from '../outcome-capture/handlers';
import type { ModelAssistRedactor } from '../outcome-capture/redaction';

export type RegisterFn = (kind: JobKind, handler: (db: Db, job: Job) => Promise<void>) => void;

export type RegisterAllHandlersOptions = {
  /** Injected classifier for inbound Shield mail (ADR-006: "passed through
   *  the SAME classifier"). Left undefined here by default — see
   *  email/handlers.ts's `InboundNoticeClassifier` doc comment for why this
   *  module never imports `lib/engine/` directly. */
  inboundClassifier?: InboundNoticeClassifier;
  /** Injected model-assisted redaction pass (CORPUS_DESIGN.md §4.4: "model-
   *  assisted pass second, never model-only"). Undefined degrades to
   *  deterministic-only redaction, which is stricter, not weaker. */
  modelAssistRedactor?: ModelAssistRedactor;
};

export function registerAllHandlers(
  register: RegisterFn,
  adapters: Adapters,
  opts: RegisterAllHandlersOptions = {},
): void {
  register('sla_breach_refund', (db, job) => handleSlaBreachRefund(db, adapters, job));

  register('send_scheduled_email', (db, job) => handleSendScheduledEmail(db, adapters, job));

  const processInboundNotice = makeProcessInboundNoticeHandler(opts.inboundClassifier);
  register('process_inbound_notice', (db, job) => processInboundNotice(db, adapters, job));

  register('redact_notice', makeHandleRedactNotice(opts.modelAssistRedactor));
  register('promote_l4', handlePromoteL4);
  register('delete_subject_data', handleDeleteSubjectData);
}
