/**
 * WL-09 V16 — **the notices that go out before money moves.**
 *
 * (a) A pre-charge reminder on **day 10** of a 14-day trial — four days before
 *     the first charge — naming the amount, the calendar date and the cancel
 *     link, *and* showing what has already been produced. OFFER.md §7 makes the
 *     "here is what you got" half a spec requirement rather than a marketing
 *     intention: a reminder that only says "we are about to charge you" is a
 *     dunning notice, and a reminder that shows two finished WH-347s is the
 *     offer being kept.
 * (b) An **annual renewal notice at least seven days out**, with the amount,
 *     the date and the cancel link. Several states' automatic renewal laws
 *     require it on longer terms; California's is the strictest.
 *
 * Both are TRANSACTIONAL and are never suppressed by a marketing unsubscribe
 * (V16c, WL-14 V7) — `sendScoped(..., { scope: 'transactional' })` is what
 * enforces that, and `tests/billing-notices.test.ts` proves it against an
 * address that has unsubscribed from everything else.
 *
 * Neither message calls the trial free, here or anywhere (V16a).
 */

import type { EmailBrand } from '@octopus/platform/email';

import { buildEmail, escapeHtml, type AppEmailContent } from './layout';

export function trialReminderEmail(
  brand: EmailBrand,
  input: {
    planName: string;
    amount: string;
    chargeDate: string;
    daysBeforeCharge: number;
    cancelUrl: string;
    /** What the trial has produced so far — the offer, kept or not kept. */
    documentsProduced: number;
    projectsSetUp: number;
  },
): AppEmailContent {
  const produced =
    input.documentsProduced > 0
      ? `So far you have produced ${input.documentsProduced} certified payroll document${input.documentsProduced === 1 ? '' : 's'} across ${input.projectsSetUp} project${input.projectsSetUp === 1 ? '' : 's'}.`
      : `You have not produced a certified payroll yet. If something is in the way, reply to this message — a person reads it.`;

  const bodyHtml = `<p>Your ${escapeHtml(brand.appName)} trial ends in ${input.daysBeforeCharge} days.</p>
<p><strong>${escapeHtml(input.amount)} will be charged on ${escapeHtml(input.chargeDate)}</strong>, and every month after that until you cancel.</p>
<p>${escapeHtml(produced)}</p>
<p>Cancel in two clicks and pay nothing: <a href="${escapeHtml(input.cancelUrl)}">manage billing</a>.</p>`;

  const bodyText = `Your ${brand.appName} trial ends in ${input.daysBeforeCharge} days.

${input.amount} will be charged on ${input.chargeDate}, and every month after that until you cancel.

${produced}

Cancel in two clicks and pay nothing: ${input.cancelUrl}`;

  return buildEmail(brand, {
    subject: `${input.amount} on ${input.chargeDate} — your ${brand.appName} trial ends in ${input.daysBeforeCharge} days`,
    bodyHtml,
    bodyText,
    footer: { kind: 'transactional' },
  });
}

export function renewalNoticeEmail(
  brand: EmailBrand,
  input: {
    planName: string;
    amount: string;
    renewalDate: string;
    daysBeforeRenewal: number;
    cancelUrl: string;
  },
): AppEmailContent {
  const bodyHtml = `<p>Your ${escapeHtml(brand.appName)} ${escapeHtml(input.planName)} subscription renews on <strong>${escapeHtml(input.renewalDate)}</strong>.</p>
<p><strong>${escapeHtml(input.amount)} will be charged</strong> on that date for another year.</p>
<p>Nothing to do if you want to continue. To stop, cancel before then: <a href="${escapeHtml(input.cancelUrl)}">manage billing</a>. Cancelling keeps your payrolls and exports readable for 30 days.</p>`;

  const bodyText = `Your ${brand.appName} ${input.planName} subscription renews on ${input.renewalDate}.

${input.amount} will be charged on that date for another year.

Nothing to do if you want to continue. To stop, cancel before then: ${input.cancelUrl}
Cancelling keeps your payrolls and exports readable for 30 days.`;

  return buildEmail(brand, {
    subject: `${brand.appName} renews on ${input.renewalDate} — ${input.amount}`,
    bodyHtml,
    bodyText,
    footer: { kind: 'transactional' },
  });
}
