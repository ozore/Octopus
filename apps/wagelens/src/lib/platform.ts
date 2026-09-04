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

import { getAdapters } from '@octopus/platform/adapters';

import { assertGcNotLive } from './billing/sellable';
import { appMigrationsDir, getDb } from './db';
import { getEnv } from '@/env';
import { registerAppJobs } from './jobs/handlers';
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

// WL-08, WL-09 and WL-14. MUST come after `registerKbJobs`: it OVERRIDES the
// two no-op seams that file registers (`wd.modification_detected`,
// `wd.watch_notify`) and adds the send and sweep jobs. Registering it first
// would leave the no-ops in place and a real modification would go nowhere.
registerAppJobs(registry, async () => ({
  db: await getDb(),
  adapters: getAdapters(),
  env: getEnv() as never,
  plans,
}));

/**
 * WL-09 V18 — the boot assertion, at the composition root so every entry point
 * runs it: a LIVE deployment carrying a GC Roll-up price id refuses to start.
 * The GC tier is published as "Coming" and is not sellable until WL-24 ships
 * (finding B2); a price id in a live environment is the one way that could
 * quietly stop being true, so it fails the deploy rather than the customer.
 */
assertGcNotLive(process.env);

export { plans, registry };
export type { PlatformContext };
export { getContext };
