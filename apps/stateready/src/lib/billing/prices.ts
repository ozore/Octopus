/**
 * The Stripe price ids this app reads — **exactly the ones `specs/09`'s
 * canonical table names, and no others**.
 *
 * The table at the end of `specs/09` is the ONE hand-over list (wave-1b **M6**);
 * `OFFER.md` §12 points at it and does not restate it. Three things follow from
 * that being canonical, and all three are enforced here rather than remembered:
 *
 *  1. **`STRIPE_PRICE_MULTISTATE_*`, never `STRIPE_PRICE_MULTI_*`.** Wave 1
 *     carried both names in two documents. A stale `STRIPE_PRICE_MULTI_MONTHLY`
 *     in the environment is IGNORED — `KNOWN_PRICE_KEYS` is a closed set — and a
 *     **missing** `STRIPE_PRICE_MULTISTATE_MONTHLY` is a boot failure.
 *  2. **No `STRIPE_PRICE_FIRST_STATE_AUDIT`.** D1 defers the $149 audit; the
 *     price object is not created and this app has no code path that can charge
 *     it (`specs/09` AC9).
 *  3. **No Enterprise price.** Above fifteen states we quote. There is no basis
 *     for a number and a made-up one rots the whole card.
 *
 * WHY TEN AND NOT ELEVEN. `specs/09` says "the eleven `STRIPE_PRICE_*` keys",
 * counting the eleven ROWS of its own table — and row 11 is Enterprise, which
 * has **no price object at launch** and therefore no variable. Ten variables,
 * eleven rows. `tests/billing.test.ts` asserts the derivation rather than the
 * word, so the check cannot be satisfied by inventing an eleventh key.
 */

import { plans, ONE_OFF_PRICES } from '../plans';

export type OneOffSku = 'entry_pack_first' | 'entry_pack' | 'acq_pack_3' | 'entry_pack_additional';

/** The four one-off SKUs, in the order `specs/09` lists them (rows 7–10). */
export const ONE_OFF_SKUS: Record<OneOffSku, { envVar: string; amountCents: number; label: string }> = {
  entry_pack_first: ONE_OFF_PRICES.entryPackFirst,
  entry_pack: ONE_OFF_PRICES.entryPack,
  acq_pack_3: ONE_OFF_PRICES.acquisitionPack3,
  entry_pack_additional: ONE_OFF_PRICES.entryPackAdditional,
};

/** Rows 1–6 of the canonical table. */
export const SUBSCRIPTION_PRICE_KEYS: readonly string[] = plans.plans.map((p) => p.priceEnvVar);
/** Rows 7–10. */
export const ONE_OFF_PRICE_KEYS: readonly string[] = Object.values(ONE_OFF_SKUS).map((s) => s.envVar);
/** Rows 1–10 — every row of the canonical table that HAS a price object. */
export const KNOWN_PRICE_KEYS: readonly string[] = [...SUBSCRIPTION_PRICE_KEYS, ...ONE_OFF_PRICE_KEYS];

/** Row 11 is quote-only; row "—" is deferred. Neither may ever be read. */
export const FORBIDDEN_PRICE_KEYS: readonly string[] = [
  'STRIPE_PRICE_FIRST_STATE_AUDIT',
  'STRIPE_PRICE_ENTERPRISE',
  'STRIPE_PRICE_MULTI_MONTHLY',
  'STRIPE_PRICE_MULTI_ANNUAL',
];

export type PriceCheck = {
  ok: boolean;
  missing: string[];
  /** Present in the environment but not on the canonical list — ignored. */
  ignored: string[];
  /** `test` / `live`, read from the secret key's prefix. */
  mode: 'test' | 'live' | 'unknown';
  modeMismatch: string[];
};

const modeOf = (value: string | undefined): 'test' | 'live' | 'unknown' =>
  value?.startsWith('sk_live_') ? 'live' : value?.startsWith('sk_test_') ? 'test' : 'unknown';

export function checkStripePrices(env: Record<string, unknown>): PriceCheck {
  const missing = KNOWN_PRICE_KEYS.filter((key) => {
    const value = env[key];
    return typeof value !== 'string' || value.length === 0;
  });
  const ignored = Object.keys(env).filter(
    (key) => key.startsWith('STRIPE_PRICE_') && !KNOWN_PRICE_KEYS.includes(key),
  );

  const mode = modeOf(typeof env['STRIPE_SECRET_KEY'] === 'string' ? (env['STRIPE_SECRET_KEY'] as string) : undefined);
  // Stripe's own convention: a test-mode price id carries `_test_`. A live key
  // with test prices is the mistake that charges nobody and looks like it did.
  const modeMismatch =
    mode === 'unknown'
      ? []
      : KNOWN_PRICE_KEYS.filter((key) => {
          const value = env[key];
          if (typeof value !== 'string' || value.length === 0) return false;
          const looksTest = value.includes('_test_');
          return mode === 'live' ? looksTest : !looksTest;
        });

  return { ok: missing.length === 0 && modeMismatch.length === 0, missing, ignored, mode, modeMismatch };
}

/**
 * `specs/09` AC8 — a missing price fails the BUILD, not a runtime checkout.
 *
 * It is enforced when the app is wired to the real vendor (`ADAPTER_MODE=live`),
 * which is every deployed environment and no test: the offline suite and the
 * Playwright journey run against the mock adapter, where a missing one-off price
 * is a "not on sale yet" row rather than a crash. That is the whole reason
 * `startCheckout` answers `price_not_configured` instead of throwing.
 */
export function assertStripePrices(env: Record<string, unknown>): void {
  if (env['ADAPTER_MODE'] !== 'live') return;
  if (env['BILLING_ENABLED'] === false) return;
  const check = checkStripePrices(env);
  if (check.ok) return;
  const parts: string[] = [];
  if (check.missing.length > 0) {
    parts.push(
      `missing: ${check.missing.join(', ')} — create the product in Stripe (see STRIPE_SETUP.md) and paste the price id into the variable`,
    );
  }
  if (check.modeMismatch.length > 0) {
    parts.push(
      `mode mismatch: STRIPE_SECRET_KEY is ${check.mode} mode but ${check.modeMismatch.join(', ')} look${check.modeMismatch.length === 1 ? 's' : ''} like the other mode`,
    );
  }
  throw new Error(`Stripe price configuration is incomplete. ${parts.join('; ')}.`);
}

export function priceIdForSku(sku: OneOffSku, env: Record<string, unknown>): string | undefined {
  const value = env[ONE_OFF_SKUS[sku].envVar];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
