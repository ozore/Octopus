/**
 * M7's job handlers — `specs/07` §4, §8.
 *
 * Registered from `src/lib/platform.ts`, which is the app's composition root
 * and the only place the queue learns what this app can do. They are here
 * rather than there so that M7 grows in its own directory and the composition
 * root stays a list of one-line registrations.
 *
 * Both are IDEMPOTENT, because Vercel's own docs say cron delivery is best
 * effort and may fire the same schedule twice: `scheduleLadder` upserts on
 * `(vendorId, rung, expiryDate, recipientEmail)`, and the send path claims with
 * `FOR UPDATE SKIP LOCKED` and marks the row before it sends.
 */

import { getAdapters } from '@octopus/platform/adapters';
import type { JobRegistry } from '@octopus/platform/jobs';

import { getDb } from '../db';
import { drainReminders, scheduleLadder } from './service';

export const REMINDER_JOB_KINDS = {
  scheduleLadder: 'certly.schedule_reminders',
  sendDue: 'certly.send_due_reminders',
} as const;

export function registerReminderJobs(registry: JobRegistry): void {
  registry.override(REMINDER_JOB_KINDS.scheduleLadder, async (payload) => {
    const orgId = String(payload['orgId'] ?? '');
    const vendorId = String(payload['vendorId'] ?? '');
    if (!orgId || !vendorId) return;
    const db = await getDb();
    await scheduleLadder(db, { orgId, vendorId, actor: { kind: 'system' } });
  });

  registry.override(REMINDER_JOB_KINDS.sendDue, async () => {
    const db = await getDb();
    // The same drain the cron route calls. Having both is deliberate: the queue
    // path gives an operator a way to run it beside every other job, and the
    // route gives it a schedule of its own.
    await drainReminders(db, getAdapters());
  });
}
