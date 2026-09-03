/**
 * The shared environment contract (Twelve-Factor III), Zod-validated so a
 * missing or malformed variable fails at boot rather than at the first
 * customer request. Same shape and same discipline as Clausewright's
 * `app/src/env.ts`; what differs is that this schema is EXTENDED per app
 * rather than owned by one app.
 *
 *   // apps/wagelens/src/env.ts
 *   export const { getEnv } = createEnv(basePlatformEnv.extend({
 *     WAGELENS_WDOL_SNAPSHOT: z.string().default('2026-09'),
 *   }));
 *
 * NO VALUE IN THIS FILE IS A SECRET. Defaults exist only for variables that are
 * safe in the open (names, URLs, limits); every credential is `optional()` here
 * and `require()`d by the superRefine below when the deploy actually needs it.
 */

import { z } from 'zod';

const bool = (dflt: boolean) =>
  z
    .union([z.boolean(), z.string()])
    .default(dflt)
    .transform((v) =>
      typeof v === 'boolean' ? v : ['1', 'true', 'yes', 'on'].includes(v.toLowerCase()),
    );

export const DatabaseDriver = z.enum(['postgres', 'pglite']);
export type DatabaseDriver = z.infer<typeof DatabaseDriver>;

/** `mock` binds the in-repo fakes (Stripe, Resend). Rejected in production. */
export const AdapterMode = z.enum(['live', 'mock']);
export type AdapterMode = z.infer<typeof AdapterMode>;

export const basePlatformEnv = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // --- Identity of the app instance --------------------------------------
  /** "WageLens" — used in emails, legal pages and the "a TheVillage company"
   *  signature. One codebase, three brands (PLAN.md D1). */
  APP_NAME: z.string().default('App'),
  APP_SLUG: z.string().default('app'),
  APP_BASE_URL: z.string().url().default('http://localhost:3000'),
  COMPANY_NAME: z.string().default('TheVillage'),
  COMPANY_ADDRESS: z.string().default('Address on file with the founder'),
  SUPPORT_EMAIL: z.string().default('support@thevillage.example'),

  // --- Backing services (Twelve-Factor IV) --------------------------------
  DATABASE_DRIVER: DatabaseDriver.default('postgres'),
  DATABASE_URL: z.string().optional(),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(5),

  ADAPTER_MODE: AdapterMode.default('live'),

  // --- Stripe (billing) ----------------------------------------------------
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  /** Price ids are per-app and per-plan; the plan map names the variables it
   *  reads (see billing/plans.ts) so this schema stays app-agnostic. */
  STRIPE_PORTAL_CONFIGURATION_ID: z.string().optional(),

  // --- Resend (email) ------------------------------------------------------
  RESEND_API_KEY: z.string().optional(),
  /** `"WageLens <hello@wagelens.com>"`. The templates append the
   *  "<App>, a TheVillage company" signature (D1). */
  EMAIL_FROM: z.string().default('App <hello@localhost>'),
  EMAIL_REPLY_TO: z.string().optional(),

  // --- Auth ----------------------------------------------------------------
  SESSION_COOKIE_NAME: z.string().default('octopus_session'),
  SESSION_TTL_DAYS: z.coerce.number().int().positive().default(30),
  /** A session token older than this is rotated the next time a code path that
   *  can write cookies runs (see auth/README notes in packages/platform/README.md). */
  SESSION_ROTATE_AFTER_HOURS: z.coerce.number().int().positive().default(24),
  LOGIN_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(15),
  LOGIN_RATE_LIMIT_PER_EMAIL_PER_HOUR: z.coerce.number().int().positive().default(5),
  LOGIN_RATE_LIMIT_PER_IP_PER_HOUR: z.coerce.number().int().positive().default(20),

  // --- Ops -----------------------------------------------------------------
  /** Guards `/admin` (events metrics). Same boundary as Clausewright's ops console. */
  OPS_SHARED_SECRET: z.string().optional(),
  /** Vercel sends it as `Authorization: Bearer <CRON_SECRET>` on every cron hit. */
  CRON_SECRET: z.string().optional(),
  JOBS_BATCH_SIZE: z.coerce.number().int().positive().default(20),
  JOBS_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),

  // --- Optional analytics (A14: our own events table is the source of truth) --
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),

  // --- Flags ---------------------------------------------------------------
  BILLING_ENABLED: bool(true),
  SIGNUPS_ENABLED: bool(true),
});

export type BasePlatformEnv = z.infer<typeof basePlatformEnv>;

/**
 * The cross-cutting rules that no single field can express. Applied to the base
 * shape AND to every per-app extension of it (createEnv wires it in).
 */
export function refinePlatformEnv(v: BasePlatformEnv, ctx: z.RefinementCtx): void {
  const require = (key: string, value: unknown, why: string) => {
    if (value === undefined || value === '') {
      ctx.addIssue({ code: 'custom', path: [key], message: `${key} is required ${why}` });
    }
  };

  if (v.DATABASE_DRIVER === 'postgres') {
    require('DATABASE_URL', v.DATABASE_URL, 'when DATABASE_DRIVER=postgres');
  }

  if (v.NODE_ENV === 'production') {
    if (v.DATABASE_DRIVER !== 'postgres') {
      ctx.addIssue({
        code: 'custom',
        path: ['DATABASE_DRIVER'],
        message: 'pglite is a dev/test-only fallback and is not permitted in production',
      });
    }
    if (v.ADAPTER_MODE !== 'live') {
      ctx.addIssue({
        code: 'custom',
        path: ['ADAPTER_MODE'],
        message: 'only live adapters are permitted in production',
      });
    }
    require('OPS_SHARED_SECRET', v.OPS_SHARED_SECRET, 'in production (it guards /admin)');
    require('CRON_SECRET', v.CRON_SECRET, 'in production (it guards the queue drain route)');
  }

  if (v.ADAPTER_MODE === 'live') {
    require('RESEND_API_KEY', v.RESEND_API_KEY, 'when ADAPTER_MODE=live');
    if (v.BILLING_ENABLED) {
      require('STRIPE_SECRET_KEY', v.STRIPE_SECRET_KEY, 'when ADAPTER_MODE=live and billing is on');
      require(
        'STRIPE_WEBHOOK_SECRET',
        v.STRIPE_WEBHOOK_SECRET,
        'when ADAPTER_MODE=live and billing is on',
      );
    }
  }
}

export class EnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentError';
  }
}

/**
 * PRICE IDS SURVIVE PARSING.
 *
 * Zod strips unknown keys, and the Stripe price variables a plan map names
 * (`STRIPE_PRICE_STARTER`, …) are per app, so they are not in the shared shape.
 * Stripping them makes a correctly configured Stripe account look unconfigured:
 * `priceIdFor()` reads the parsed env and finds nothing, and every Checkout
 * answers "price not configured" with no error anywhere to explain it.
 *
 * They are therefore merged back after validation, by NAME PATTERN rather than
 * by declaration, so adding a plan cannot forget to declare its variable. They
 * are ids, not secrets, and they are validated where it matters — `startCheckout`
 * refuses a plan whose price id is missing.
 */
const PRICE_VAR = /^STRIPE_PRICE_[A-Z0-9_]+$/;

function pricesFrom(source: Record<string, unknown>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(source).filter(
      ([key, value]) => PRICE_VAR.test(key) && typeof value === 'string' && value.length > 0,
    ),
  ) as Record<string, string>;
}

export type EnvAccessor<T> = {
  parseEnv: (source?: Record<string, string | undefined>) => T;
  getEnv: () => T;
  resetEnv: () => void;
};

/**
 * Bind a schema (the base shape, or `basePlatformEnv.extend({...})`) into the
 * lazily-cached accessor the app imports. Lazy on purpose: importing a module
 * in a unit test must not require a fully populated environment.
 */
export function createEnv<S extends z.ZodType<BasePlatformEnv & Record<string, unknown>>>(
  schema: S,
): EnvAccessor<z.infer<S>> {
  const refined = (schema as unknown as z.ZodObject).superRefine((v, ctx) =>
    refinePlatformEnv(v as BasePlatformEnv, ctx),
  );

  let cached: z.infer<S> | undefined;

  const parseEnv = (source: Record<string, string | undefined> = process.env): z.infer<S> => {
    const result = refined.safeParse(source);
    if (!result.success) {
      const detail = result.error.issues
        .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('\n');
      throw new EnvironmentError(`Invalid environment configuration:\n${detail}`);
    }
    return { ...result.data, ...pricesFrom(source) } as z.infer<S>;
  };

  return {
    parseEnv,
    getEnv: () => (cached ??= parseEnv(process.env)),
    resetEnv: () => {
      cached = undefined;
    },
  };
}

/** The unextended accessor, for the platform's own modules and tests. */
export const { parseEnv, getEnv, resetEnv } = createEnv(basePlatformEnv);
export type PlatformEnv = BasePlatformEnv;
