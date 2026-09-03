/**
 * The platform's composition root for an app.
 *
 * An app calls `configurePlatform()` once (in a module every entry point
 * imports — see `apps/_template/src/lib/platform.ts`) and everything else in
 * the platform then resolves its database, adapters, plan map and job handlers
 * from here. That is what lets the shared route handlers, server helpers and
 * job drain be MOUNTED by an app rather than re-implemented in it.
 *
 * Pinned to `globalThis` for the same reason the db handle and the adapters
 * are: Next.js compiles the RSC graph and the route/action graph separately.
 */

import type { Adapters } from './adapters';
import { getAdapters } from './adapters';
import type { Db } from './db';
import { getDb } from './db';
import type { PlanMap } from './billing/plans';
import { getEnv, type PlatformEnv } from './env';
import type { JobRegistry } from './jobs/registry';

export type PlatformConfig = {
  /** Extra migration directories (the app's own), applied after the platform's. */
  migrationDirs?: string[];
  plans?: PlanMap;
  jobs?: JobRegistry;
  /**
   * The event name that counts as "activated" for this app — the moment a
   * signup has done the thing the product exists for (PLAN.md §4 tracking row).
   * WageLens: `wage_determination_exported`. Certly: `coi_parsed`.
   */
  activationEvent?: string;
  /** Where a new customer should be sent first (welcome email, onboarding). */
  firstStep?: { url: string; label: string };
};

export type PlatformContext = {
  db: Db;
  adapters: Adapters;
  env: PlatformEnv;
  config: PlatformConfig;
};

const globalRef = globalThis as typeof globalThis & { __platformConfig?: PlatformConfig };

export function configurePlatform(config: PlatformConfig): void {
  globalRef.__platformConfig = { ...(globalRef.__platformConfig ?? {}), ...config };
}

export function getPlatformConfig(): PlatformConfig {
  return globalRef.__platformConfig ?? {};
}

export function requirePlans(): PlanMap {
  const plans = getPlatformConfig().plans;
  if (!plans) {
    throw new Error(
      'No plan map configured. Call configurePlatform({ plans: definePlans({...}) }) at startup.',
    );
  }
  return plans;
}

/** The context every platform helper takes. Cheap: the db handle is cached. */
export async function getContext(): Promise<PlatformContext> {
  const config = getPlatformConfig();
  const db = await getDb(config.migrationDirs ? { migrationDirs: config.migrationDirs } : {});
  return { db, adapters: getAdapters(), env: getEnv(), config };
}
