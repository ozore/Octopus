/**
 * Certly's environment contract: the shared platform shape plus what this
 * product needs.
 *
 * TWO RULES THAT ARE NOT PREFERENCES:
 *
 *  - **The product name is configuration.** `IDENTITY.md` §2.3 and REVIEW.md
 *    OQ-10 leave the customer-facing name open — the recommendation is a rename
 *    to **Coverfile**, keeping the slug `certly` — and the Stripe product names
 *    carry it. So every customer-facing surface renders `APP_NAME` and the
 *    rename is a Vercel environment variable, not a pull request.
 *  - **No hardcoded domain, anywhere.** We do not own `certly.app`;
 *    `IDENTITY.md` §2.1 records it as somebody else's parked placeholder
 *    (REVIEW.md B-11). The app origin, the inbound domain and the sending
 *    domain are all env values, and `tests/vocabulary.test.ts` greps the source
 *    for a literal one.
 *
 * The `STRIPE_PRICE_*` variables the plan map names do NOT have to be declared:
 * `createEnv` merges every one of them back after validation, because Zod
 * strips unknown keys and a stripped price id makes a correctly configured
 * Stripe account look unconfigured.
 */

import { basePlatformEnv, createEnv } from '@octopus/platform/env';
import { z } from 'zod';

export const appEnvSchema = basePlatformEnv.extend({
  /** Where the no-login vendor upload link lives: `{APP_ORIGIN}/u/<token>`.
   *  Defaults to APP_BASE_URL; separate because a custom domain may differ. */
  APP_ORIGIN: z.string().optional(),
  /** `coi@{INBOUND_DOMAIN}` — forward-by-email (SH-1), post-MVP but named now. */
  INBOUND_DOMAIN: z.string().optional(),
  /** The verified Resend sending domain. */
  SENDING_DOMAIN: z.string().optional(),
  /** Vercel Blob. Absent in mock mode, where the in-memory store is bound. */
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  /**
   * `specs/07` §9: defaults to false outside production, so the dev and preview
   * formations render an email to the log and send nothing. PLAN.md §A4's
   * drafts-first discipline, applied to product email too.
   */
  SEND_ENABLED: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
  /** `specs/15` §11 — anonymous traffic spending real inference money is the
   *  easiest way to lose money on this product, so the cap is a launch
   *  requirement rather than a nice-to-have. */
  GAP_REPORT_DAILY_SPEND_CAP_CENTS: z.coerce.number().int().min(0).default(2000),
  /**
   * `specs/15`'s LAUNCH GATE, as a variable rather than a branch.
   *
   * Until the founder's legal read lands (REVIEW.md B-07, §2.6), `/gap-report`
   * accepts nothing from a stranger: the page ships the samples-only demo and
   * the report sits behind a waitlist line. Defaults to **false**, because the
   * failure mode of the wrong default is holding a third party's insurance
   * documents with no contract, and the failure mode of the right one is a
   * page that says "not yet".
   */
  GAP_REPORT_UPLOADS_ENABLED: z
    .string()
    .optional()
    .transform((value) => value === 'true'),
  /** Svix-scheme signing secret for `POST /api/webhooks/resend` (`specs/07` §8). */
  RESEND_WEBHOOK_SECRET: z.string().optional(),
  /** M4's model, stamped onto every extraction. No default that could ship. */
  ANTHROPIC_API_KEY: z.string().optional(),
  EXTRACTION_MODEL: z.string().default('claude-sonnet-4-5'),
});

export type AppEnv = z.infer<typeof appEnvSchema>;

export const { parseEnv, getEnv, resetEnv } = createEnv(appEnvSchema);

/** The origin every vendor-facing link is built from. Never a literal domain. */
export function appOrigin(): string {
  const env = getEnv();
  return env.APP_ORIGIN ?? env.APP_BASE_URL;
}
