/**
 * Worker job handlers owned by the email module.
 *
 * Spec: ARCHITECTURE.md §3.7 (`send_scheduled_email`), ADR-006
 * (`process_inbound_notice`). Registered onto the worker by
 * `queue/worker-registration.ts` — see that module for why registration is
 * dependency-injected rather than imported directly by `src/worker/index.ts`.
 */

import { eq } from 'drizzle-orm';

import type { Adapters } from '../adapters';
import { getEnv } from '../../env';
import * as casesRepo from '../db/repositories/cases';
import { customers as customersTable } from '../db/schema';
import * as inboundNoticesRepo from '../db/repositories/inbound-notices';
import * as scheduledEmailsRepo from '../db/repositories/scheduled-emails';
import * as shieldAccountsRepo from '../db/repositories/shield-accounts';
import type { Db } from '../db';
import type { Job } from '../db/schema';
import { parseJobPayload } from '../queue/job-payloads';
import * as send from './send';

/**
 * The magic link is `case.id` itself: cases carry an opaque, ULID-derived id
 * that is "never derived from email, merchant token or Stripe id" (schema.ts
 * comment on `cases.id`) — there is no separate token column in the scaffold
 * schema to key off instead. If unguessability-by-obscurity is later judged
 * insufficient, adding a dedicated random `magic_token` column is a one-line
 * migration; this function is the one place that would change.
 */
export function buildMagicLinkUrl(baseUrl: string, caseId: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/c/${caseId}`;
}

export function buildOutcomeUrl(
  baseUrl: string,
  caseId: string,
  decision: 'reinstated' | 'rejected' | 'no_response',
): string {
  return `${baseUrl.replace(/\/+$/, '')}/api/outcome/${caseId}?decision=${decision}`;
}

async function getCustomerEmailForCase(db: Db, caseId: string): Promise<string | undefined> {
  const caseRow = await casesRepo.getCase(db, caseId);
  if (!caseRow?.customerId) return undefined;
  const rows = await db
    .select({ email: customersTable.email })
    .from(customersTable)
    .where(eq(customersTable.id, caseRow.customerId))
    .limit(1);
  return rows[0]?.email;
}

/**
 * `send_scheduled_email`: reads the scheduled row, resolves the case's
 * customer, picks the right template by `kind`, sends, and marks sent.
 * Idempotent in effect (not just in the queue's retry sense): a row with
 * `sentAt` already set is treated as done rather than re-sent, so a stray
 * duplicate job (e.g. from the reconciliation sweep in
 * `scheduled-emails.ts`) can never double-send.
 */
export async function handleSendScheduledEmail(db: Db, adapters: Adapters, job: Job): Promise<void> {
  const { scheduledEmailId } = parseJobPayload('send_scheduled_email', job.payload);
  const row = await scheduledEmailsRepo.getScheduledEmail(db, scheduledEmailId);
  if (!row) throw new Error(`send_scheduled_email: no such scheduledEmail ${scheduledEmailId}`);
  if (row.sentAt || row.cancelledAt) return; // already handled or withdrawn (ADR-008 ¶1/¶4)

  const to = await getCustomerEmailForCase(db, row.caseId);
  if (!to) throw new Error(`send_scheduled_email: case ${row.caseId} has no customer email yet`);

  const env = getEnv();
  const caseRow = await casesRepo.requireCase(db, row.caseId);

  let sentId: string;
  if (row.kind === 'magic_link') {
    const sent = await send.sendDraftReadyEmail(adapters, to, row.caseId, {
      reasonCodeLabel: caseRow.marketplace === 'unknown' ? 'your' : caseRow.marketplace,
      magicLinkUrl: buildMagicLinkUrl(env.APP_BASE_URL, row.caseId),
    });
    sentId = sent.id;
  } else {
    const day = row.kind === 'd3' ? 3 : row.kind === 'd10' ? 10 : 21;
    const sent = await send.sendOutcomeRequestEmail(adapters, to, row.caseId, {
      day,
      reinstatedUrl: buildOutcomeUrl(env.APP_BASE_URL, row.caseId, 'reinstated'),
      rejectedUrl: buildOutcomeUrl(env.APP_BASE_URL, row.caseId, 'rejected'),
      noResponseUrl: buildOutcomeUrl(env.APP_BASE_URL, row.caseId, 'no_response'),
    });
    sentId = sent.id;
  }

  await scheduledEmailsRepo.markScheduledEmailSent(db, row.id, sentId);
}

/**
 * Optional injection point for the engine's classifier, kept out of this
 * module's own dependency graph (email/ never imports lib/engine/ — see the
 * assignment boundary in this file's header). `queue/worker-registration.ts`
 * may supply one; if it does not, the alert is candid about the gap (BRAND.md
 * P3 — "candid about limits") rather than pretending to a diagnosis it has
 * not made.
 */
export type InboundNoticeClassifier = (
  text: string,
) => Promise<{ summary: string; actionUrl?: string } | null>;

/**
 * `process_inbound_notice`: marks the row processed and sends a monitoring
 * alert. Classification (ADR-006: "passed through the SAME classifier") is
 * injected rather than performed here — see `InboundNoticeClassifier` above.
 */
export function makeProcessInboundNoticeHandler(classify?: InboundNoticeClassifier) {
  return async function handleProcessInboundNotice(db: Db, adapters: Adapters, job: Job): Promise<void> {
    const { inboundNoticeId } = parseJobPayload('process_inbound_notice', job.payload);
    const notice = await inboundNoticesRepo.getInboundNotice(db, inboundNoticeId);
    if (!notice) throw new Error(`process_inbound_notice: no such notice ${inboundNoticeId}`);
    if (notice.processedAt) return;

    const account = await shieldAccountsRepo.getShieldAccountById(db, notice.shieldAccountId);
    const result = classify ? await classify(notice.rawTextEncrypted) : null;

    const email = account?.customerId
      ? (
          await db
            .select({ email: customersTable.email })
            .from(customersTable)
            .where(eq(customersTable.id, account.customerId))
            .limit(1)
        )[0]?.email
      : undefined;

    if (email) {
      await send.sendMonitoringAlertEmail(adapters, email, notice.caseId ?? undefined, {
        marketplace: account?.marketplace ?? 'unknown',
        summary:
          result?.summary ??
          "We're not confident enough in an automated read yet, so a person will look at this shortly.",
        ...(result?.actionUrl ? { actionUrl: result.actionUrl } : {}),
      });
    }

    await inboundNoticesRepo.markInboundNoticeProcessed(db, notice.id);
  };
}
