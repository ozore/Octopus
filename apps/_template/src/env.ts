/**
 * This app's environment contract: the shared platform shape plus anything the
 * product itself needs.
 *
 * The Stripe price variables the plan map names (`STRIPE_PRICE_STARTER`, …) do
 * NOT have to be declared here: `createEnv` merges every `STRIPE_PRICE_*`
 * variable back after validation (packages/platform/src/env.ts), because Zod
 * strips unknown keys and a stripped price id makes a correctly configured
 * Stripe account look unconfigured.
 */

import { basePlatformEnv, createEnv } from '@octopus/platform/env';
import { z } from 'zod';

export const appEnvSchema = basePlatformEnv.extend({
  /** Example of a product-specific variable; delete when scaffolding. */
  TEMPLATE_DEMO_BANNER: z.string().optional(),
});

export type AppEnv = z.infer<typeof appEnvSchema>;

export const { parseEnv, getEnv, resetEnv } = createEnv(appEnvSchema);
