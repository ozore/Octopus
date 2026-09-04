/**
 * WL-09 V14/V15 · The auto-renewal disclosure, as data.
 *
 * A 14-day trial with a card on file that converts into a recurring charge is a
 * **negative-option offer**. ROSCA (15 U.S.C. 8403) and the FTC's negative-
 * option posture require the material terms to be disclosed **clearly and
 * conspicuously before the payment method is collected**, consent to be express
 * and recorded, and cancellation to be at least as easy as signing up. Several
 * states add their own automatic-renewal law on top.
 *
 * So the disclosure is a STRUCTURE, not a paragraph somebody writes on a page:
 *
 *  - the five sentences come out of `disclosureLines()` in a fixed order —
 *    trial length, exact amount AND exact calendar date, interval and that it
 *    continues until cancelled, how to cancel in one sentence, and the promise
 *    of a reminder before the first charge;
 *  - the amount and the date are **computed** from the plan and the clock, so
 *    they cannot go stale, and re-rendering with a different plan produces a
 *    different `termsVersion`;
 *  - `termsVersion` is the sha256 of the block exactly as rendered, which is
 *    what makes the stored acceptance mean something a year later;
 *  - `createCheckoutSession` refuses without a matching acceptance row, so the
 *    consent record gates the money path and not merely the button.
 *
 * The page renders these lines as siblings of the button — never inside a
 * `<details>`, a tooltip, a footnote or a linked page (V14).
 */

import { createHash } from 'node:crypto';

import type { PlanDefinition } from '@octopus/platform/billing';

/** `$99.00` — always two decimals. The platform's `formatAmount` drops them on
 *  a whole number, and "charged $99" is not the same disclosure as "$99.00". */
export function formatCents(amountCents: number, currency = 'usd'): string {
  const symbol = currency.toLowerCase() === 'usd' ? '$' : `${currency.toUpperCase()} `;
  return `${symbol}${(amountCents / 100).toFixed(2)}`;
}

/** "17 September 2026" — the calendar date, spelled out, in UTC. */
export function formatChargeDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/** ISO day, for the stored `disclosed_charge_date`. */
export function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function firstChargeDate(plan: PlanDefinition, now: Date): Date {
  const days = plan.trialDays ?? 0;
  return new Date(now.getTime() + days * 24 * 3600 * 1000);
}

export type TrialTerms = {
  planKey: string;
  planName: string;
  lookupKey: string;
  amountCents: number;
  amount: string;
  currency: string;
  interval: 'month' | 'year';
  trialDays: number;
  chargeDate: Date;
  chargeDateLabel: string;
  chargeDateIso: string;
  reminderDays: number;
  cancelPath: string;
  lines: string[];
  /** sha256 of the lines, joined. The consent record's identity. */
  version: string;
};

/** Four days before the first charge — day 10 of a 14-day trial (V16a). */
export const PRE_CHARGE_REMINDER_DAYS = 4;
/** At least seven days before an annual renewal (V16b). */
export const RENEWAL_NOTICE_DAYS = 7;

export function trialTerms(input: {
  plan: PlanDefinition;
  lookupKey: string;
  now: Date;
  cancelPath?: string;
}): TrialTerms {
  const { plan } = input;
  const trialDays = plan.trialDays ?? 0;
  const chargeDate = firstChargeDate(plan, input.now);
  const amount = formatCents(plan.amountCents, plan.currency);
  const chargeDateLabel = formatChargeDate(chargeDate);
  const cancelPath = input.cancelPath ?? '/settings/billing';
  const every = plan.interval === 'year' ? 'year' : 'month';

  // (a) trial length · (b) amount AND date · (c) interval, until cancelled ·
  // (d) how to cancel, one sentence, with the route · (e) the reminder.
  const lines = [
    `${trialDays} days free, then ${amount} a ${every} until you cancel.`,
    `Your card is charged ${amount} on ${chargeDateLabel} and every ${every} after that.`,
    `Cancel any time in two clicks from Settings → Billing (${cancelPath}); cancel before ${chargeDateLabel} and you pay nothing.`,
    `We will email you ${PRE_CHARGE_REMINDER_DAYS} days before the first charge.`,
  ];

  return {
    planKey: plan.key,
    planName: plan.name,
    lookupKey: input.lookupKey,
    amountCents: plan.amountCents,
    amount,
    currency: plan.currency,
    interval: plan.interval,
    trialDays,
    chargeDate,
    chargeDateLabel,
    chargeDateIso: isoDay(chargeDate),
    reminderDays: PRE_CHARGE_REMINDER_DAYS,
    cancelPath,
    lines,
    version: createHash('sha256').update(lines.join('\n')).digest('hex'),
  };
}

/** The label of the required, UNTICKED checkbox (V15). One sentence, and it
 *  never bundles a privacy policy or anything else into the same tick. */
export const TRIAL_TERMS_CONSENT_LABEL = 'I have read the trial terms above.';

/** V16a. The one CTA label for anything that begins a paid trial. */
export const TRIAL_CTA_LABEL = 'Start 14-day trial';
