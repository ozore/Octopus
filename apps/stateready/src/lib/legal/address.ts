/**
 * The postal-address gate — `specs/12` §Edge cases, and founder prerequisite
 * **P10**.
 *
 * > *"**Address not yet available (P10 outstanding).** The build fails rather
 * > than shipping a placeholder address in a CAN-SPAM footer. A missing legal
 * > address is a launch blocker, not a TODO."*
 *
 * Two things this catches, and the second is the one that would actually have
 * happened:
 *
 *  1. `COMPANY_ADDRESS` unset. `.env.example` ships it blank on purpose.
 *  2. **`COMPANY_ADDRESS` left at the platform's default.**
 *     `packages/platform/src/env.ts` defaults it to *"Address on file with the
 *     founder"*, which is a perfectly reasonable default for a shared library
 *     and a placeholder address in a CAN-SPAM footer for this app. A gate that
 *     only checked for emptiness would have passed a deploy shipping that
 *     sentence to every recipient of every alert.
 *
 * It is enforced at BUILD time by `scripts/check-legal-address.mjs`
 * (a `prebuild` step), not at request time, because the point is that a deploy
 * without an address never happens — not that its first request fails.
 */

/** Values that are not a postal address, however plausible they look. */
export const PLACEHOLDER_ADDRESSES = [
  'address on file with the founder',
  'address on file',
  'tbd',
  'todo',
  'n/a',
  'coming soon',
] as const;

export type AddressVerdict = { ok: true } | { ok: false; reason: string };

export function checkLegalAddress(value: string | undefined | null): AddressVerdict {
  const address = (value ?? '').trim();
  if (address.length === 0) {
    return {
      ok: false,
      reason:
        'COMPANY_ADDRESS is empty. CAN-SPAM requires a postal address in commercial mail, and specs/12 fails the build rather than shipping a placeholder one (founder prerequisite P10).',
    };
  }
  if (PLACEHOLDER_ADDRESSES.includes(address.toLowerCase() as (typeof PLACEHOLDER_ADDRESSES)[number])) {
    return {
      ok: false,
      reason: `COMPANY_ADDRESS is the placeholder "${address}". That is the platform's default, not an address; set the real one in the deployment environment (founder prerequisite P10).`,
    };
  }
  // A real postal address has more than one word and at least one digit or a
  // recognisable postal token. Deliberately loose: this gate exists to catch a
  // forgotten variable, not to validate international addressing.
  if (!/\s/.test(address)) {
    return { ok: false, reason: `COMPANY_ADDRESS "${address}" does not look like a postal address.` };
  }
  return { ok: true };
}

export function assertLegalAddress(value: string | undefined | null): void {
  const verdict = checkLegalAddress(value);
  if (!verdict.ok) throw new Error(verdict.reason);
}
