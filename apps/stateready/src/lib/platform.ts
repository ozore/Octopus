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

import { registerPlatformJobs, createJobRegistry } from '@octopus/platform/jobs';
import { configurePlatform, getContext, type PlatformContext } from '@octopus/platform/runtime';

import { getEnv } from '@/env';
import { assertCronSchedule } from './cron';
import { appMigrationsDir } from './db';
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

/** Boot assertion: the schedule the platform will actually honour. */
export function assertBootConfiguration(): void {
  const env = getEnv();
  assertCronSchedule(env.CRON_EXPRESSION, env.VERCEL_PLAN);
}

export { plans, registry };
export type { PlatformContext };
export { getContext };
