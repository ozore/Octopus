/**
 * This app's environment contract: the shared platform shape plus what the
 * knowledge base needs.
 *
 * THE PRODUCT NAME IS `APP_NAME`, and that is a specification, not a
 * convenience (WL-11 V8, finding M12). PLAN.md A3 leaves the final name to the
 * founder; every user-visible string, email template, PDF footer and legal page
 * resolves it from here, and no slug carries it — so a rename is one
 * environment variable and a redeploy, with no code change and no broken link.
 * `tests/naming.test.ts` fails the build on a hard-coded product name in `src/`.
 *
 * The Stripe price variables the plan map names (`STRIPE_PRICE_CREW`, …) do NOT
 * have to be declared: `createEnv` merges every `STRIPE_PRICE_*` back after
 * validation, because Zod strips unknown keys and a stripped price id makes a
 * correctly configured Stripe account look unconfigured.
 */

import { basePlatformEnv, createEnv } from '@octopus/platform/env';
import { z } from 'zod';

const bool = (dflt: boolean) =>
  z
    .union([z.boolean(), z.string()])
    .default(dflt)
    .transform((v) => (typeof v === 'boolean' ? v : ['1', 'true', 'yes', 'on'].includes(v.toLowerCase())));

export const appEnvSchema = basePlatformEnv.extend({
  /** KNOWLEDGE_BASE §6.4's recovery procedure: if GSA renames a path, this is
   *  an environment change and not a deploy. */
  SAM_API_BASE_URL: z.string().url().default('https://sam.gov/api/prod'),
  /** WL-13 V2. We are an unauthenticated caller on a public government service;
   *  saying who we are and how to reach us is the price of that. Left OPTIONAL
   *  and with no literal default: the fallback is built from `APP_NAME` in
   *  `lib/kb/adapter.ts`, so the product's rename reaches SAM.gov too. */
  SAM_USER_AGENT: z.string().optional(),
  /** WL-13 V3 — a courtesy budget. Whether SAM publishes a limit is UNVERIFIED. */
  SAM_RATE_LIMIT_PER_SECOND: z.coerce.number().positive().default(4),
  SAM_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  /** Seed the corpus from `tests/fixtures/` at boot. Dev and e2e only: it is a
   *  no-op unless ADAPTER_MODE=mock, and production refuses mock. */
  KB_SEED_FIXTURES: bool(false),
  /** Salt for the public lookup's IP hashes. WL-00 V6 and WL-14: a hash, never
   *  an address. Absent, a per-process random salt is used, which is correct
   *  for dev (the hashes simply do not survive a restart). */
  KB_IP_HASH_SALT: z.string().optional(),
});

export type AppEnv = z.infer<typeof appEnvSchema>;

export const { parseEnv, getEnv, resetEnv } = createEnv(appEnvSchema);

/**
 * The product's name, from one place. Import this, never a literal.
 *
 * It is a function and not a constant because the environment is read at
 * REQUEST time (Twelve-Factor III): a constant evaluated at module load would
 * bake one deploy's name into the bundle, which is the same defect
 * `force-dynamic` exists to prevent on the marketing pages.
 */
export function productName(): string {
  return getEnv().APP_NAME;
}
