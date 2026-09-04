/**
 * THE LAPSE WATCH — `OFFER.md` §6.1, transcribed.
 *
 * One text, one place, like the disclaimers next door. The guarantee is
 * rendered in three surfaces (the landing strip, `/legal/lapse-watch`, the
 * pricing block's footnote) and the CARVE-OUTS TRAVEL WITH IT EVERYWHERE. A
 * guarantee whose exclusions are one click further away than its promise is how
 * a risk reversal becomes a complaint (`OFFER.md` §6.2 L1).
 *
 * Two holes `OFFER.md` closed on 2026-09-03 and this module keeps closed:
 *   - the annual remedy is stated (one month's credit, one twelfth of the year)
 *     because six of the eight Stripe prices are annual (REVIEW.md MJ-19);
 *   - the expiry warning the promise depends on **cannot be switched off**
 *     (`specs/13` §2), so nothing a customer does in settings can cost them the
 *     guarantee.
 */

export const GUARANTEE_NAME = 'The Lapse Watch';

/** The promise, as the landing strip and the legal page both render it. */
export const GUARANTEE_PROMISE =
  'If a certificate we are tracking expires and we did not warn you before it expired, that month is free. No form, no argument — tell us, and we credit it. On an annual plan the remedy is a credit of one month of your plan — one twelfth of what you paid.';

/** The scope sentence: what kind of promise this is. */
export const GUARANTEE_SCOPE =
  'This is a promise about our warning, not about your vendor’s insurance. It applies to every certificate where you gave us a readable expiry date. The expiry warning cannot be switched off, so nothing you do in settings can cost you this guarantee.';

/**
 * THE CARVE-OUTS, VERBATIM. `OFFER.md` §6.1 writes them as one sentence with
 * three limbs; they are listed here so no surface can render the promise
 * without them, and the closing clause is kept because it is the reason the
 * carve-outs are fair: the warning is in the dashboard either way.
 */
export const GUARANTEE_CARVE_OUTS = [
  'It does not apply to a certificate we flagged for review because we could not read its dates,',
  'to a vendor added after their certificate had already expired,',
  'or to email we sent that your server rejected',
] as const;

export const GUARANTEE_CARVE_OUT_TAIL =
  '— in all three cases you will find the warning in your dashboard, dated.';

/** Stacked on top, and unconditional. */
export const GUARANTEE_STACK =
  'Stacked with it: cancel any time, and 30 days money back, no questions asked.';

/**
 * The standing commitment. `PERSONA.md` §2.8 O-A5 says to say it in those
 * words; it is in the hero, in FAQ 4, in every vendor-facing email footer and —
 * since REVIEW.md §2.9 — in the terms, because a promise made in three
 * customer-facing places and absent from the contract is a marketing line.
 */
export const NEVER_CHARGE_VENDORS = 'We never charge your vendors';

/** The one-line form the landing strip renders under the heading. */
export const GUARANTEE_STRIP_BODY =
  'If a certificate we’re tracking expires and we didn’t warn you first, that month is free — a month’s credit on an annual plan. Cancel any time. Thirty days, money back.';
