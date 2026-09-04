/**
 * StateReady's environment contract: the shared platform shape plus what this
 * product needs.
 *
 * The `STRIPE_PRICE_*` variables the plan map names do NOT have to be declared
 * here — `createEnv` merges every `STRIPE_PRICE_*` back after validation,
 * because Zod strips unknown keys and a stripped price id makes a correctly
 * configured Stripe account look unconfigured (platform P5).
 *
 * NO SECRET HAS A DEFAULT AND NO SECRET IS IN THIS FILE. Names only.
 */

import { basePlatformEnv, createEnv } from '@octopus/platform/env';
import { z } from 'zod';

export const appEnvSchema = basePlatformEnv.extend({
  /**
   * Where licence documents and generated packs live.
   *   `memory` — in-process, tests and local development;
   *   `blob`   — Vercel Blob, live (`BLOB_READ_WRITE_TOKEN`).
   * Chosen at boot by `src/lib/documents.ts`; `memory` is refused in production
   * for the same reason `ADAPTER_MODE=mock` is.
   */
  DOCUMENT_STORE: z.enum(['memory', 'blob']).default('memory'),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),

  /**
   * The cron expression `vercel.json` declares. Read at boot so `DRAIN_INTERVAL`
   * follows the schedule rather than being a comment, and so a sub-daily
   * expression on a Hobby project FAILS THE BUILD (`specs/06` AC11).
   */
  CRON_EXPRESSION: z.string().default('0 12 * * *'),
  VERCEL_PLAN: z.enum(['hobby', 'pro']).default('hobby'),

  /** Overrides the snapshot version; normally `VERCEL_GIT_COMMIT_SHA`. */
  KB_VERSION: z.string().optional(),
});

export type AppEnv = z.infer<typeof appEnvSchema>;

export const { parseEnv, getEnv, resetEnv } = createEnv(appEnvSchema);
