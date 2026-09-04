/**
 * StateReady's composition root. EVERY entry point imports this module first —
 * layouts, route handlers, server actions, the migrate script — because it is
 * what tells the platform which plan map, which job handlers and which
 * migrations this app has.
 *
 * It also runs the two boot assertions that must fail a deploy rather than a
 * request:
 *
 *  - `assertCronSchedule` — a sub-daily cron on a Hobby project (`specs/06` AC11);
 *  - the knowledge base's own schema and gates, on first use of the KB
 *    (`kb/validate.ts`, `specs/14` invariant 1). It is deliberately NOT run at
 *    import time: `next build` imports this module to prerender, and a KB
 *    failure should fail the *test* and the *deploy step*, not the bundle — the
 *    first request would fail anyway and with a clearer message.
 */

import { enqueue, registerPlatformJobs, createJobRegistry } from '@octopus/platform/jobs';
import type { Db } from '@octopus/platform/db';
import { configurePlatform, getContext, type PlatformContext } from '@octopus/platform/runtime';

import { getEnv } from '@/env';
import { assertStripePrices } from './billing/prices';
import { assertCronSchedule } from './cron';
import { appMigrationsDir } from './db';
import { ALERTS_DRAIN_JOB, B2_DAILY_JOBS, DELETION_JOB, EXPORT_JOB, TRIALS_JOB } from './jobs/kinds';
import { ACTIVATION_EVENT, plans } from './plans';

const registry = createJobRegistry();

configurePlatform({
  plans,
  jobs: registry,
  migrationDirs: [appMigrationsDir()],
  activationEvent: ACTIVATION_EVENT,
  firstStep: {
    url: `${process.env['APP_BASE_URL'] ?? 'http://localhost:3000'}/onboarding/company`,
    label: 'Tell us where you operate',
  },
});

registerPlatformJobs(registry, () => getContext());

// --- StateReady's own jobs --------------------------------------------------
//
// Handlers are thin and load their heavy dependencies lazily, so importing this
// module (which every route does) does not pull the knowledge base, the drift
// fetcher or the rules engine into every bundle.

/** Daily: re-fetch every source, compare hashes, open review items. Never publishes. */
registry.register('stateready.kb_drift', async () => {
  const { db } = await getContext();
  const { runDriftCheck } = await import('./kb/drift');
  const { httpFetcher } = await import('./kb/fetcher');
  await runDriftCheck(db, httpFetcher);
});

/** Deploy-time: load the committed records as an immutable snapshot. */
registry.register('stateready.kb_snapshot', async () => {
  const { db } = await getContext();
  const { loadSnapshot } = await import('./kb/snapshot');
  const { closeAcceptedItems } = await import('./kb/drift');
  await loadSnapshot(db, { today: new Date().toISOString().slice(0, 10) });
  await closeAcceptedItems(db);
});

// --- M8 — the State Entry Pack generator (specs/08) -------------------------
//
// Generation runs on the queue rather than inside the webhook, because it must
// survive the webhook's timeout and because `specs/08` §Errors requires a
// failed generation to refund rather than to retry a paid delivery for ever.
// `maxAttempts` is left at the queue's default; an integrity failure is NOT a
// transient error and `generateEntryPack` resolves it to `failed` + refund
// rather than throwing, so it is not retried into a loop.
registry.register('stateready.entry_pack_generate', async (payload) => {
  const { db } = await getContext();
  const { generateEntryPack } = await import('./packs/service');
  const playbookId = String(payload['playbookId'] ?? '');
  if (!playbookId) return;
  const today = String(payload['today'] ?? new Date().toISOString().slice(0, 10));
  await generateEntryPack(db, { playbookId, today });
});

// --- M11 — the support auto-responder (specs/11) ----------------------------
//
// The acknowledgement is queued, not sent inline: `specs/11` §Errors requires a
// ticket to survive a mail outage ("support that depends on an email hop must
// not lose the message"), so the ticket row is written first and the send is a
// job that can retry.
registry.register('stateready.support_autorespond', async (payload) => {
  const { db, adapters, env } = await getContext();
  const { runAutoResponder } = await import('./support/autoresponder');
  const ticketId = String(payload['ticketId'] ?? '');
  if (!ticketId) return;
  await runAutoResponder({ db, adapters, env }, { ticketId });
});

/** Nightly: re-derive every organisation's deadlines. Fixed-date rules roll over. */
registry.register('stateready.rederive_org', async (payload) => {
  const { db } = await getContext();
  const { deriveForOrganisation } = await import('./repos/deadlines');
  const { refreshDashboardSummary } = await import('./repos/dashboard');
  const orgId = String(payload['orgId'] ?? '');
  if (!orgId) return;
  const today = new Date().toISOString().slice(0, 10);
  await deriveForOrganisation(db, orgId, { today });
  await refreshDashboardSummary(db, orgId, today);
});

// --- B2 · M6, M9, M10, M13 --------------------------------------------------
//
// Four job kinds, all enqueued by the ONE daily drain (`api/cron/drain`), which
// is the shape platform request P-1 works around: `vercel.json` may declare
// several crons but `createCronHandler` is drain-only, so a schedule this app
// needs becomes a job kind rather than a second route.

/** Daily: the alert digests (`specs/06`). The whole product's heartbeat. */
registry.register(ALERTS_DRAIN_JOB, async () => {
  const { db, adapters, env } = await getContext();
  const { runAlertDrain } = await import('./jobs/alerts-drain');
  const { drainIntervalMs } = await import('./cron');
  await runAlertDrain(
    { db, adapters, env },
    { drainIntervalMs: drainIntervalMs(getEnv().CRON_EXPRESSION) },
  );
});

/** Daily: day-7 and day-12 trial mail, and the day-14 read-only notice. */
registry.register(TRIALS_JOB, async () => {
  const { db, env } = await getContext();
  const { runTrialLifecycle } = await import('./jobs/trials');
  await runTrialLifecycle({ db, env });
});

/** On request: build the export zip. Enqueued by `/settings/data`. */
registry.register(EXPORT_JOB, async (payload) => {
  const { db } = await getContext();
  const { runExportJob, expireStaleExports } = await import('./jobs/export');
  const exportId = String(payload['exportId'] ?? '');
  if (exportId) await runExportJob({ db, env: getEnv() }, { exportId });
  await expireStaleExports(db);
});

/** Daily: execute the deletions whose seven days are up (`specs/10`). */
registry.register(DELETION_JOB, async () => {
  const { db } = await getContext();
  const { runDeletionSweep } = await import('./jobs/deletion');
  const result = await runDeletionSweep(db);
  for (const blocked of result.blocked) {
    console.warn('[stateready] deletion blocked', blocked.orgId, blocked.reason);
  }
});

/**
 * The daily work this app schedules for itself, enqueued by the cron route
 * before it drains. Deduped per day, so a cron Vercel fires twice — which its
 * own docs say it may — enqueues once.
 */
export async function enqueueDailyJobs(db: Db, now = new Date()): Promise<void> {
  const day = now.toISOString().slice(0, 10);
  for (const kind of B2_DAILY_JOBS) {
    await enqueue(db, { kind, dedupeKey: `${kind}:${day}` });
  }
}

/** Boot assertion: the schedule the platform will actually honour, and the
 *  Stripe prices a live deploy cannot start without (`specs/09` AC8). */
export function assertBootConfiguration(): void {
  const env = getEnv();
  assertCronSchedule(env.CRON_EXPRESSION, env.VERCEL_PLAN);
  assertStripePrices(env as unknown as Record<string, unknown>);
}

export { plans, registry };
export type { PlatformContext };
export { getContext };
