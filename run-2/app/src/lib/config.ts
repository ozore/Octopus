/**
 * CONFIG — Twelve-Factor III, validated at boot, failing closed.
 *
 * Spec: ARCHITECTURE.md §2.2 factor III — "every deploy-varying value is an env
 * var, Zod-validated at boot. Boot fails loudly on a missing or malformed var."
 *
 * Three things this module refuses to do, each because the alternative has a
 * specific failure mode rather than because failing closed is a virtue:
 *
 * 1. IT WILL NOT BOOT A PRODUCTION PROCESS ON THE TEST SUBSTRATE. `pglite` is an
 *    in-memory database and `mock` binds recorded fixtures; either one in
 *    production is a product that serves plausible answers from nowhere. Since a
 *    filing carries a federal certification, "plausible answers from nowhere" is
 *    the worst available failure, so it is made unreachable rather than unlikely.
 *
 * 2. IT WILL NOT BOOT WITHOUT `DIR_XSD_SHA256`. ADR-009 pins the CA schema by
 *    CONTENT HASH because the XSD advertises version="1.0" while DIR publishes it
 *    as V1.3 — version attributes lie, hashes do not. The hash lives in config
 *    rather than in code deliberately: rotating a pinned hash is then a config
 *    change with a release record, not a code change that can be slipped in.
 *
 * 3. IT WILL NOT BOOT AS A ROLE THAT BYPASSES ROW-LEVEL SECURITY. A superuser
 *    silently ignores every policy in `drizzle/0000_init.sql`, which is the exact
 *    shape of a tenant boundary that passes its tests and leaks in production
 *    (ADR-011). The name check here is cheap and catches the common mistake; the
 *    authoritative runtime assertion is `assertRlsEnforced` in `src/db`.
 *
 * The gate flags at the bottom are the other half of CORRECTIONS.md: a claim is
 * rendered FROM ITS COUNTER, never from an opinion about the counter. While a gate
 * is locked the renderer emits the mechanism sentence and declines the outcome
 * sentence (P-D). None of them may be flipped by hand to make copy read better.
 */

import { z } from 'zod';

const boolFromEnv = (fallback: boolean) =>
  z
    .union([z.boolean(), z.string()])
    .default(fallback)
    .transform((v) => (typeof v === 'boolean' ? v : ['1', 'true', 'yes', 'on'].includes(v.toLowerCase())));

const urlish = z.string().refine((v) => {
  try {
    // eslint-disable-next-line no-new
    new URL(v);
    return true;
  } catch {
    return false;
  }
}, 'must be an absolute URL');

const sha256Hex = z
  .string()
  .regex(/^[0-9a-f]{64}$/, 'must be a 64-character lowercase hex sha256 digest');

/** ADR-005: Postgres is the database, the queue, the scheduler and the tenant
 *  boundary. `pglite` is a dev/test fallback and nothing else. */
export const DatabaseDriver = z.enum(['postgres', 'pglite']);
export type DatabaseDriver = z.infer<typeof DatabaseDriver>;

/** `mock` binds the in-repo recorded fixtures for every upstream. Tests and CI run
 *  in `mock`; no test may require a real key or a network call. */
export const AdapterMode = z.enum(['live', 'mock']);
export type AdapterMode = z.infer<typeof AdapterMode>;

const ConfigSchema = z
  .object({
    // --- Process ------------------------------------------------------------
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    APP_BASE_URL: urlish.default('http://localhost:3000'),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

    /** Stamped into every artifact's provenance block (I6). Set by the build. */
    BUILD_SHA: z.string().default('dev'),
    ENGINE_VERSION: z.coerce.number().int().nonnegative().default(1),

    // --- Database -----------------------------------------------------------
    DATABASE_DRIVER: DatabaseDriver.default('postgres'),
    DATABASE_URL: z.string().optional(),
    DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
    DATABASE_APP_ROLE: z.string().default('ratepin_app'),
    /**
     * Where PGlite keeps its files, when it keeps any.
     *
     * Unset — the default, and what the whole test suite runs under — is an
     * in-memory database that dies with the process. That is correct for tests and
     * useless for `npm run seed`, which writes in one process so that `npm run dev`
     * can read in another; without a directory the two are two empty databases and
     * the seeded end-to-end path cannot be walked at all.
     *
     * It is not a production escape hatch: `DATABASE_DRIVER=pglite` is already
     * refused outright under NODE_ENV=production below, so a persistent PGlite is
     * unreachable there for the same reason an ephemeral one is.
     */
    PGLITE_DATA_DIR: z.string().optional(),

    // --- Adapters -----------------------------------------------------------
    ADAPTER_MODE: AdapterMode.default('live'),

    // --- Anthropic: the setup path only, never the filing critical path (I3) --
    ANTHROPIC_API_KEY: z.string().optional(),
    ANTHROPIC_BASE_URL: urlish.optional(),
    /** ENGINE ADR-101 / E8: one model for both jobs. A model change is an ADR and a
     *  release, not a config tweak; this is read from env only so staging can pin a
     *  different release of the same decision. */
    MODEL_CLASSIFY: z.string().default('claude-sonnet-5'),
    MODEL_NARRATIVE: z.string().default('claude-sonnet-5'),
    /** P12. Exhaustion degrades the classification ladder L-D -> L-E, which is the
     *  lexical picker the free generator uses every day. It never blocks a filing. */
    MODEL_MONTHLY_BUDGET_CENTS: z.coerce.number().int().nonnegative().default(20_000),

    // --- Stripe (ADR-007: webhooks are the source of truth for money) --------
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    STRIPE_PRICE_RATE_CARD: z.string().default('price_rate_card_49'),
    STRIPE_PRICE_SOLO: z.string().default('price_solo_99'),
    STRIPE_PRICE_CREW: z.string().default('price_crew_249'),
    STRIPE_PRICE_MULTI: z.string().default('price_multi_599'),

    // --- Object storage ------------------------------------------------------
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET: z.string().default('ratepin'),
    R2_ENDPOINT: urlish.optional(),

    // --- Email: outbound only. There is no inbound adapter, by design (A3) ----
    RESEND_API_KEY: z.string().optional(),
    EMAIL_FROM: z.string().default('Ratepin <notifications@ratepin.com>'),

    // --- Upstream sources: five independent failure domains (§3.4) -----------
    SAM_INDEX_BASE: urlish.default('https://sam.gov/api/prod/sgs/v1/search/'),
    SAM_WDOL_BASE: urlish.default('https://sam.gov/api/prod/wdol/v1/wd/'),
    ECFR_BASE: urlish.default('https://www.ecfr.gov/api/versioner/v1/'),
    DIR_XSD_URL: urlish.default('https://www.dir.ca.gov/public-works/CPR.xsd'),
    WHD_FORM_URL: urlish.default('https://www.dol.gov/agencies/whd/forms/wh347'),
    DIR_XSD_SHA256: sha256Hex.default(
      '2ea52e977ab4ac74f7bb99aa9fb7634de8b48db7e090864150428b63c800d01a',
    ),

    // --- The freshness clock and the ladder (D7, §4.5) -----------------------
    FRESHNESS_DATED_HOURS: z.coerce.number().int().positive().default(24),
    FRESHNESS_SLA_HOURS: z.coerce.number().int().positive().default(72),

    // --- Staleness auto-credit (D7, gated by G6) -----------------------------
    CREDIT_CEILING_PCT: z.coerce.number().int().min(0).max(100).default(100),
    CREDIT_FLOOR_CENTS: z.coerce.number().int().nonnegative().default(100),
    CREDIT_GUARANTEE_ADVERTISED: boolFromEnv(false),

    // --- Gate flags: locked until a counter says otherwise -------------------
    CLAIM_G1_RATE_CORRECTNESS: boolFromEnv(false),
    CLAIM_G2_FORM_ACCEPTANCE: boolFromEnv(false),
    CLAIM_G3_CORPUS_COMPLETENESS: boolFromEnv(false),
    CLAIM_G4_TIME_SAVED: boolFromEnv(false),
    CLAIM_G5_AUTONOMY: boolFromEnv(false),

    // --- Encryption ----------------------------------------------------------
    KMS_KEY_URI: z.string().optional(),

    MIGRATIONS_DIR: z.string().optional(),
  })
  .superRefine((cfg, ctx) => {
    const fail = (path: string, message: string): void => {
      ctx.addIssue({ code: 'custom', path: [path], message });
    };

    if (cfg.FRESHNESS_SLA_HOURS <= cfg.FRESHNESS_DATED_HOURS) {
      fail(
        'FRESHNESS_SLA_HOURS',
        'the STALE threshold must be later than the DATED threshold; L1 and L2 are ' +
          'ordered states on one ladder (ARCHITECTURE §4.5).',
      );
    }

    if (cfg.NODE_ENV !== 'production') return;

    if (cfg.DATABASE_DRIVER !== 'postgres') {
      fail(
        'DATABASE_DRIVER',
        'pglite is an in-memory dev/test fallback and must never serve production. ' +
          'A filing carries a federal certification; it does not get to come from a ' +
          'database that disappears on restart.',
      );
    }
    if (!cfg.DATABASE_URL) fail('DATABASE_URL', 'required when DATABASE_DRIVER=postgres');

    if (cfg.DATABASE_APP_ROLE === 'postgres' || /(^|_)superuser$/i.test(cfg.DATABASE_APP_ROLE)) {
      fail(
        'DATABASE_APP_ROLE',
        'a superuser bypasses every row-level security policy silently. The tenant ' +
          'boundary would pass its tests and leak in production (ADR-011).',
      );
    }

    if (cfg.ADAPTER_MODE !== 'live') {
      fail(
        'ADAPTER_MODE',
        'mock binds recorded fixtures. In production that is a product serving ' +
          'plausible answers from nowhere.',
      );
    }

    for (const key of [
      'ANTHROPIC_API_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'R2_ACCOUNT_ID',
      'R2_ACCESS_KEY_ID',
      'R2_SECRET_ACCESS_KEY',
      'R2_ENDPOINT',
      'RESEND_API_KEY',
      'KMS_KEY_URI',
    ] as const) {
      if (!cfg[key]) fail(key, 'required in production');
    }
  });

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Deliberately NOT `NodeJS.ProcessEnv`. Next augments that type with required
 * members, which would force every caller — including a test constructing a
 * three-key environment to prove a single refusal — to spell out fields the
 * parser is about to supply defaults for.
 */
export type EnvRecord = Record<string, string | undefined>;

let cached: Config | undefined;

/**
 * Parse and memoize. Throws on the FIRST boot rather than on the first customer
 * request: a process that starts and then fails at 16:00 on a Friday is worse than
 * one that never starts, because only the second is noticed by the deploy.
 */
export function getConfig(env: EnvRecord = process.env): Config {
  if (cached && env === process.env) return cached;
  const parsed = ConfigSchema.safeParse(env);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  ${i.path.join('.') || '(root)'}: ${i.message}`);
    throw new Error(
      `Ratepin configuration is invalid — refusing to boot (Twelve-Factor III):\n${lines.join('\n')}`,
    );
  }
  if (env === process.env) cached = parsed.data;
  return parsed.data;
}

/** Test-only. The suite mutates `process.env` between cases. */
export function resetConfigCache(): void {
  cached = undefined;
}

export function isProduction(config: Config = getConfig()): boolean {
  return config.NODE_ENV === 'production';
}

/**
 * The gate flags, in one place, so a renderer asks "may I state this outcome?"
 * rather than deciding. CORRECTIONS.md §0.2: while a gate is locked the answer is
 * the mechanism sentence plus the gate that would unlock the number — in-product,
 * never a sales contact (A3).
 */
export function claimUnlocked(gate: 'G1' | 'G2' | 'G3' | 'G4' | 'G5', config: Config = getConfig()): boolean {
  switch (gate) {
    case 'G1':
      return config.CLAIM_G1_RATE_CORRECTNESS;
    case 'G2':
      return config.CLAIM_G2_FORM_ACCEPTANCE;
    case 'G3':
      return config.CLAIM_G3_CORPUS_COMPLETENESS;
    case 'G4':
      return config.CLAIM_G4_TIME_SAVED;
    case 'G5':
      return config.CLAIM_G5_AUTONOMY;
  }
}
