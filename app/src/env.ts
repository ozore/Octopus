/**
 * Twelve-Factor III (Config) — everything that varies between deploys is an
 * environment variable, validated at boot with Zod so a missing or malformed
 * var fails fast rather than at the first customer request.
 *
 * Spec: ARCHITECTURE.md §2.2 (factor III), §2.1 (named vars), ADR-001.
 *
 * Two constraints that are invisible in the code below and therefore stated:
 *
 *  - Model IDs are PINNED here and stamped onto every `case` row. Per
 *    LLM_ENGINE.md ADR-101, a model change is an ADR and a corpus-release bump,
 *    never a config tweak, because outcome attribution (ADR-008) depends on it.
 *    They are read from env only so that staging can pin a different release of
 *    the same decision — not so that they can be swapped casually.
 *
 *  - `TIME_GUARANTEE_ADVERTISED` defaults to false and is gated by G6
 *    (ARCHITECTURE.md §9): no surface may state a delivery-time guarantee until
 *    the automatic SLO-refund job is running in production and has been
 *    exercised on a deliberately-breached test case. The SLO is *measured* from
 *    day one regardless; what this flag withholds is the promise.
 *
 *  - `FEATURE_STOREFRONT_RADAR` defaults to false: ADR-006's third NoticeSource
 *    is a flagged hypothesis and does not ship until counsel has reviewed it.
 */

import { z } from 'zod';

const bool = (dflt: boolean) =>
  z
    .union([z.boolean(), z.string()])
    .default(dflt)
    .transform((v) => (typeof v === 'boolean' ? v : ['1', 'true', 'yes', 'on'].includes(v.toLowerCase())));

/**
 * ADR-005: Postgres is the database, the queue and the scheduler. `pglite` is a
 * dev/test-only fallback so the suite runs with no network and no container;
 * it is rejected outright when NODE_ENV is production.
 */
export const DatabaseDriver = z.enum(['postgres', 'pglite']);
export type DatabaseDriver = z.infer<typeof DatabaseDriver>;

/**
 * `mock` binds the in-repo fake adapters (Anthropic, Stripe, Resend,
 * NoticeSource). Tests and CI run in `mock`; no test may require a real key or
 * a network call.
 *
 * `claude-cli` binds the real pipeline to a locally installed Claude Code CLI
 * (a Claude SUBSCRIPTION login, no API key) and mocks for the other vendors —
 * a founder's personal machine, never a server. Rejected in production like
 * every non-`live` mode.
 */
export const AdapterMode = z.enum(['live', 'mock', 'claude-cli']);
export type AdapterMode = z.infer<typeof AdapterMode>;

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    APP_BASE_URL: z.string().url().default('http://localhost:3000'),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

    // --- Backing services (Twelve-Factor IV) --------------------------------
    DATABASE_DRIVER: DatabaseDriver.default('postgres'),
    DATABASE_URL: z.string().optional(),
    DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),

    ADAPTER_MODE: AdapterMode.default('live'),

    ANTHROPIC_API_KEY: z.string().optional(),
    ANTHROPIC_BASE_URL: z.string().url().optional(),
    /** ADAPTER_MODE=claude-cli only: path to the Claude Code binary. */
    CLAUDE_CLI_PATH: z.string().default('claude'),

    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    STRIPE_PRICE_RESCUE: z.string().default('price_rescue_149'),
    STRIPE_PRICE_RESCUE_HUMAN: z.string().default('price_rescue_human_399'),
    STRIPE_PRICE_SHIELD_MONTHLY: z.string().default('price_shield_49'),

    RESEND_API_KEY: z.string().optional(),
    RESEND_INBOUND_SIGNING_SECRET: z.string().optional(),
    EMAIL_FROM: z.string().default('Clausewright <hello@clausewright.com>'),
    SHIELD_INGEST_DOMAIN: z.string().default('in.clausewright.com'),

    // --- Engine pinning (LLM_ENGINE.md ADR-101, §2.2) -----------------------
    MODEL_CLASSIFY: z.string().default('claude-sonnet-5'),
    MODEL_DRAFT: z.string().default('claude-opus-5'),
    MODEL_CRITIQUE: z.string().default('claude-sonnet-5'),

    // --- Corpus attribution (ADR-003 / ADR-008), baked at build time --------
    CORPUS_RELEASE: z.coerce.number().int().nonnegative().default(0),
    PROMPT_BUNDLE_HASH: z.string().default('unbuilt'),
    /** Where `src/lib/corpus/load.ts` reads the corpus content directory from.
     *  Unset means `{cwd}/corpus`, which is what both process types get from the
     *  image. It exists so a test or a one-off can point at a fixture tree
     *  without a checkout, not so a deploy can swap corpora at run time — that
     *  would break attribution (ADR-008 ¶3). */
    CORPUS_DIR: z.string().optional(),
    /** Stamped into the page as NEXT_PUBLIC_BUILD_SHA by next.config.mjs. Read
     *  at BUILD time, not run time (factor V); declared here so the set of
     *  variables this codebase reads is complete in one place. */
    BUILD_SHA: z.string().default('dev'),
    /** Prompt-cache TTL. 5m is the default; the scheduler switches to 1h only
     *  during an observed traffic burst (LLM_ENGINE.md §3.3). */
    CORPUS_CACHE_TTL: z.enum(['5m', '1h']).default('5m'),

    // --- Worker (ADR-005) ---------------------------------------------------
    WORKER_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(2000),
    WORKER_BATCH_SIZE: z.coerce.number().int().positive().default(5),
    WORKER_ID: z.string().default('worker-local'),
    /** Test seam. `src/worker/index.ts` reads this one RAW, at module scope,
     *  because it decides whether the poll loop starts at all — i.e. it must be
     *  answerable before `getEnv()` has validated anything. It is declared here
     *  so the variable is documented and so `parseEnv` rejects a typo in it. */
    CLAUSEWRIGHT_WORKER_AUTOSTART: bool(true),

    // --- Ops console auth boundary (ARCHITECTURE §3.1, N4) ------------------
    OPS_SHARED_SECRET: z.string().optional(),

    // --- Gates and flags ----------------------------------------------------
    TIME_GUARANTEE_ADVERTISED: bool(false),
    FEATURE_STOREFRONT_RADAR: bool(false),
    SLO_MINUTES: z.coerce.number().int().positive().default(10),
  })
  .superRefine((v, ctx) => {
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
          message: 'only live adapters are permitted in production (mock and claude-cli are dev-only)',
        });
      }
    }

    // Live adapters need their credentials; mock adapters must never need one.
    if (v.ADAPTER_MODE === 'live') {
      require('ANTHROPIC_API_KEY', v.ANTHROPIC_API_KEY, 'when ADAPTER_MODE=live');
      require('STRIPE_SECRET_KEY', v.STRIPE_SECRET_KEY, 'when ADAPTER_MODE=live');
      require('STRIPE_WEBHOOK_SECRET', v.STRIPE_WEBHOOK_SECRET, 'when ADAPTER_MODE=live');
      require('RESEND_API_KEY', v.RESEND_API_KEY, 'when ADAPTER_MODE=live');
    }
  });

export type Env = z.infer<typeof EnvSchema>;

export class EnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentError';
  }
}

/** Parse an arbitrary source (used by tests). Throws EnvironmentError. */
export function parseEnv(source: Record<string, string | undefined> = process.env): Env {
  const result = EnvSchema.safeParse(source);
  if (!result.success) {
    const detail = result.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new EnvironmentError(`Invalid environment configuration:\n${detail}`);
  }
  return result.data;
}

let cached: Env | undefined;

/**
 * Lazily validated singleton. Lazy, not module-level, so that importing a module
 * for a unit test does not require a fully populated environment — the boot-time
 * fail-fast happens in the web/worker entrypoints, which call this first.
 */
export function getEnv(): Env {
  if (!cached) cached = parseEnv(process.env);
  return cached;
}

/** Test seam: forget the cached parse. */
export function resetEnv(): void {
  cached = undefined;
}

export function isProduction(): boolean {
  return getEnv().NODE_ENV === 'production';
}
