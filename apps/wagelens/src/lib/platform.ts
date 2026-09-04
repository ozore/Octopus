/**
 * The app's composition root. EVERY entry point imports this module first —
 * layouts, route handlers, server actions, the migrate script, the CLI —
 * because it is what tells the platform which plan map, which job handlers and
 * which migrations this app has.
 *
 * Importing it for its side effect is deliberate: a missing import would
 * otherwise surface as "No plan map configured" deep inside a Stripe webhook.
 */

import { registerPlatformJobs, createJobRegistry } from '@octopus/platform/jobs';
import { configurePlatform, getContext, type PlatformContext } from '@octopus/platform/runtime';

import { appMigrationsDir, getDb } from './db';
import { kbJobContext, registerKbJobs } from './kb';
import { ACTIVATION_EVENT, plans } from './plans';

const registry = createJobRegistry();

configurePlatform({
  plans,
  jobs: registry,
  migrationDirs: [appMigrationsDir()],
  activationEvent: ACTIVATION_EVENT,
  firstStep: {
    url: `${process.env['APP_BASE_URL'] ?? 'http://localhost:3000'}/projects/new`,
    label: 'Pin the wage determination your contract names',
  },
});

// The platform's own jobs (welcome, dunning, trial warnings, housekeeping).
registerPlatformJobs(registry, () => getContext());

// The knowledge base's: the daily diff's fetches, history, the backfill, and
// the two seams WL-08 and WL-14 take over (see BUILD.md).
registerKbJobs(registry, async () => kbJobContext(await getDb()));

export { plans, registry };
export type { PlatformContext };
export { getContext };
