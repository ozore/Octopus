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
import { ACTIVATION_EVENT, plans } from './plans';

const registry = createJobRegistry();

configurePlatform({
  plans,
  jobs: registry,
  migrationDirs: [appMigrationsDir()],
  activationEvent: ACTIVATION_EVENT,
  firstStep: {
    url: `${process.env['APP_BASE_URL'] ?? 'http://localhost:3000'}/dashboard`,
    label: 'Create your first project',
  },
});

// The platform's own jobs (welcome, dunning, trial warnings, housekeeping).
registerPlatformJobs(registry, () => getContext());

// --- This app's jobs --------------------------------------------------------
// Example: a knowledge-base refresh the cron drains. Replace with the real one.
registry.override('template.refresh_knowledge_base', async (payload) => {
  const { db } = await getContext();
  void db;
  void payload;
});

export { plans, registry };
export type { PlatformContext };
export { getContext };
