/**
 * The app's composition root. EVERY entry point imports this module first —
 * layouts, route handlers, server actions, the migrate script — because it is
 * what tells the platform which plan map, which job handlers and which
 * migrations this app has.
 *
 * Importing it for its side effect is deliberate: a missing import would
 * otherwise surface as "No plan map configured" deep inside a Stripe webhook.
 */

import { registerPlatformJobs, createJobRegistry } from '@octopus/platform/jobs';
import { configurePlatform, getContext, type PlatformContext } from '@octopus/platform/runtime';

import { appMigrationsDir } from './db';
import { registerGapReportJobs } from './gap-report/jobs';
import { registerReminderJobs } from './reminders/jobs';
import { ACTIVATION_EVENT, plans } from './plans';

const registry = createJobRegistry();

configurePlatform({
  plans,
  jobs: registry,
  migrationDirs: [appMigrationsDir()],
  activationEvent: ACTIVATION_EVENT,
  firstStep: {
    url: `${process.env['APP_BASE_URL'] ?? 'http://localhost:3000'}/vendors`,
    label: 'Add your first vendor',
  },
});

// The platform's own jobs (welcome, dunning, trial warnings, housekeeping).
registerPlatformJobs(registry, () => getContext());

// --- This app's jobs --------------------------------------------------------
// Example: a knowledge-base refresh the cron drains. Replace with the real one.
// --- Certly's own job kinds -------------------------------------------------
// Registered here so the cron drain knows them; the HANDLERS land with their
// specs in sub-wave B. An unregistered kind is PARKED rather than retried
// forever (packages/platform README §3), which is the right failure while a
// handler is still being written — but a registered no-op says out loud which
// jobs exist and who owns them.
registry.override('certly.extract_document', async () => {
  // M4 — specs/03 §9. Owner: the extraction agent.
});
registry.override('certly.run_comparison', async () => {
  // M5 — specs/05 §6. The engine is done; this wraps it in a job.
});
// M7 — specs/07 §8: `certly.schedule_reminders` and `certly.send_due_reminders`.
registerReminderJobs(registry);
registry.override('certly.import_vendors', async () => {
  // M3 — specs/04 §5, the job path above 200 rows.
});
registry.override('certly.render_report', async (payload) => {
  // M12 — `specs/12` §7: synchronous under 100 vendors, a job above. The
  // handler calls the SAME renderer the request path calls, so the two cannot
  // produce different documents. Imported dynamically so that `pdf-lib` is not
  // in the module graph of every request that merely configures the platform.
  const [{ renderQueuedReport }, { getDb }] = await Promise.all([
    import('./reports'),
    import('./db'),
  ]);
  await renderQueuedReport(await getDb(), payload as unknown as Parameters<typeof renderQueuedReport>[1]);
});
// M15 — specs/15 §2 and §6: `certly.render_gap_report` and
// `certly.purge_gap_reports`. The render job is also where the source files are
// deleted, which is the promise printed next to the drop zone.
registerGapReportJobs(registry);
registry.override('certly.sweep_orphan_blobs', async () => {
  // specs/03 §9 — a blob with no `documents` row, swept daily.
});
registry.override('certly.refresh_knowledge_base', async () => {
  // KB §E — the weekly source re-fetch and drift check.
});

export { plans, registry };
export type { PlatformContext };
export { getContext };
