/**
 * Worker job handlers owned by the billing module.
 *
 * Spec: ARCHITECTURE.md §3.5 / G6 — `sla_breach_refund` is enqueued by
 * whatever code path first observes a breach (a cron-style sweep is the
 * worker's `scheduler` role per §4.2, wired in `queue/worker-registration.ts`
 * alongside this handler).
 */

import type { Adapters } from '../adapters';
import type { Db } from '../db';
import type { Job } from '../db/schema';
import { parseJobPayload } from '../queue/job-payloads';
import { checkAndRefundIfBreached } from './refunds';

export async function handleSlaBreachRefund(db: Db, adapters: Adapters, job: Job): Promise<void> {
  const { caseId } = parseJobPayload('sla_breach_refund', job.payload);
  await checkAndRefundIfBreached(db, adapters, caseId);
}
