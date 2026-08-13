'use server';

/**
 * Server actions — the only mutations the UI can perform.
 *
 * Spec: ARCHITECTURE.md §3.1 (web app), §3.5 / ADR-007 (billing), §3.6
 * (escalation queue), §3.8 / ADR-006 (Shield), USER_JOURNEY.md §4 (the case
 * state machine), ADR-008 ¶1 (consent).
 *
 * THREE INVARIANTS LIVE IN WHAT THESE FUNCTIONS DO NOT DO:
 *
 *  - **I4.** There is no action here that submits an appeal, logs into a seller
 *    account, or accepts a marketplace credential. `markSubmitted` records that
 *    the *seller* submitted; it sends nothing anywhere. The absence is the
 *    product claim, so it is stated rather than assumed.
 *
 *  - **I5.** No action promotes an escalated case into a drafted one. A case that
 *    the classifier declined stays declined until a human resolves it; there is
 *    no "try again with a different reason code" affordance, because that would
 *    let a seller argue an inconsistent case across drafts without noticing
 *    (USER_JOURNEY §7.5 — the slice is frozen for the life of the case).
 *
 *  - **ADR-007.** `startCheckout` creates a hosted session and a PENDING payment
 *    row, and nothing more. The redirect back from Checkout is not the source of
 *    truth for payment; the webhook is. `recordCheckoutReturn` therefore reads
 *    state rather than granting it, so a seller who bookmarks the success URL
 *    cannot unlock a case by reloading it.
 *
 * WHAT CHANGED AT INTEGRATION, and why it is not a refactor: these actions used
 * to call `adapters.billing.createCheckoutSession` directly and then write the
 * result into an in-process map. That skipped `billing/checkout.ts` entirely —
 * so no `payments` row was ever created, which meant the webhook had nothing to
 * find and `fulfillCheckoutSession` would have thrown on every real purchase,
 * and it skipped `VALID_ORIGIN_STATUSES`, so a case could start a Checkout from
 * any state at all. Both are now the billing module's job, which is where the
 * rules were written down in the first place.
 */

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { getDb } from '@/lib/db';
import { getAdapters } from '@/lib/adapters';
import { createCheckoutForCase, InvalidCheckoutStateError } from '@/lib/billing';
import { handleStripeWebhook } from '@/lib/billing/webhook';
import * as paymentsRepo from '@/lib/db/repositories/payments';

import {
  claimEscalation,
  createCase,
  getCase,
  resolveEscalation,
  updateCase,
} from './case-store';
import { adapterMode, appBaseUrl, shieldIngestDomain } from './runtime-env';

function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

// ---------------------------------------------------------------------------
// J1 — intake
// ---------------------------------------------------------------------------

/**
 * B1. The whole intake: one textarea, no signup, no email, no card. Email is
 * captured by Stripe at Checkout and nowhere else (N4).
 */
export async function startAppeal(formData: FormData): Promise<void> {
  const notice = str(formData, 'notice').trim();
  if (notice.length < 40) {
    // The client validates first with the seller-facing message; this is the
    // no-JavaScript path, and it must not create a case it cannot classify.
    redirect('/appeal?tooShort=1');
  }
  const record = await createCase(notice);
  redirect(`/appeal/${record.id}`);
}

// ---------------------------------------------------------------------------
// S4 — the paywall handoff
// ---------------------------------------------------------------------------

export async function startCheckout(formData: FormData): Promise<void> {
  const caseId = str(formData, 'caseId');
  const tier = str(formData, 'tier') === 'rescue_human' ? 'rescue_human' : 'rescue';
  const consentGranted = str(formData, 'consent') === 'on';

  const record = await getCase(caseId);
  if (!record) redirect('/appeal');

  const base = appBaseUrl();
  const db = await getDb();

  let session;
  try {
    ({ session } = await createCheckoutForCase(db, getAdapters(), {
      caseId,
      tier,
      successUrl: `${base}/case/${caseId}/plan?session={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${base}/appeal/${caseId}`,
      // ADR-008 ¶1: consent rides as metadata and is SEPARABLE from the
      // purchase — declining must not block or degrade it, so it is never a
      // required field. `fulfillCheckoutSession` reads it back off the session.
      consent: { granted: consentGranted, textVersion: 'outcome-consent-v1' },
    }));
  } catch (error) {
    // The origin-status rule is the billing module's (VALID_ORIGIN_STATUSES).
    // A case that is not previewable cannot buy, and the honest answer is the
    // case's own screen, not a Stripe page it should never have reached.
    if (error instanceof InvalidCheckoutStateError) redirect(`/appeal/${caseId}`);
    throw error;
  }

  if (adapterMode() === 'live') {
    // Hosted Checkout. No card data ever reaches us (SAQ-A).
    redirect(session.url);
  }
  // Mock mode has no Stripe to redirect to. The handoff still went through the
  // adapter and the payment row still exists; the stand-in page shows it.
  redirect(`/appeal/${caseId}/checkout?session=${encodeURIComponent(session.id)}`);
}

/**
 * The return from Checkout.
 *
 * In LIVE mode this grants nothing: it reads whether the webhook has already
 * fulfilled the session, because the webhook is the source of truth (ADR-007)
 * and the redirect is just a browser that happens to have arrived first.
 *
 * In MOCK mode there is no Stripe to call our webhook, so the same event is
 * synthesised and driven through the REAL `handleStripeWebhook` path — signed
 * with the mock adapter's own HMAC, so the signature check runs too. That keeps
 * the local flow honest: development exercises the production fulfilment code
 * rather than a parallel shortcut that could quietly diverge from it.
 */
export async function recordCheckoutReturn(caseId: string, sessionId: string): Promise<void> {
  const db = await getDb();
  const adapters = getAdapters();

  const payment = await paymentsRepo.getPaymentBySessionId(db, sessionId);
  if (!payment || payment.caseId !== caseId) return;
  if (payment.status === 'paid') return; // The webhook already did this.

  if (adapterMode() === 'live') return; // Only the webhook may unlock a case.

  // The mock builds the event Stripe WOULD send, metadata and all, rather than
  // an approximation of it — fulfilment reads consent off that metadata
  // (ADR-008 ¶1), so a hand-rolled payload would fulfil the purchase and
  // silently drop the seller's consent.
  const { payload, signature } = (
    adapters.billing as unknown as {
      signedCompletedSession(id: string): { payload: string; signature: string };
    }
  ).signedCompletedSession(sessionId);
  await handleStripeWebhook(db, adapters, payload, signature);

  // NO `revalidatePath` HERE, unlike every other mutation in this file, and the
  // asymmetry is deliberate rather than an oversight.
  //
  // This one is not called from a form — `/case/{caseId}/plan` awaits it during
  // its own render, because the return from Checkout is a GET the seller's
  // browser follows, not a submission. Next.js 15 throws on a cache write
  // performed inside a render ("used revalidatePath during render which is
  // unsupported"), which five-hundred'd this page at the precise moment the
  // seller had just paid.
  //
  // Nothing is lost by removing it: the page reads the case immediately below
  // this call, and both `/case/{caseId}/plan` and `/case/{caseId}` declare
  // `dynamic = 'force-dynamic'`, so neither has a cached rendering to
  // invalidate.
}

// ---------------------------------------------------------------------------
// S6 / S12 — submission and outcome
// ---------------------------------------------------------------------------

export async function markSubmitted(formData: FormData): Promise<void> {
  const caseId = str(formData, 'caseId');
  await updateCase(caseId, { submittedAt: new Date().toISOString() });
  revalidatePath(`/case/${caseId}`);
  redirect(`/case/${caseId}`);
}

export async function reportOutcome(formData: FormData): Promise<void> {
  const caseId = str(formData, 'caseId');
  const decision = str(formData, 'decision');

  if (decision === 'reinstated') {
    await updateCase(caseId, { decision: 'reinstated' });
  } else if (decision === 'rejected') {
    // J2. The rejection does not end the case; it triggers the outcome
    // guarantee, and the escalation is created here rather than waiting for the
    // seller to find a support link (USER_JOURNEY §2.1, Nielsen #6).
    await updateCase(caseId, {
      decision: 'rejected',
      status: 'escalated',
      escalation: {
        reason: 'seller_choice',
        detail: 'First submission rejected — free human review under the outcome guarantee.',
        disposition: 'human_tier',
        escalatedAt: new Date().toISOString(),
      },
    });
  } else {
    await updateCase(caseId, { decision: 'no_response' });
  }
  revalidatePath(`/case/${caseId}`);
}

/**
 * The human backstop, reachable from every screen where a machine-only answer
 * might be insufficient (USER_JOURNEY §8.7, D3). Never behind a help menu.
 */
export async function requestHumanReview(formData: FormData): Promise<void> {
  const caseId = str(formData, 'caseId');
  const record = await getCase(caseId);
  if (!record) return;
  await updateCase(caseId, {
    status: 'escalated',
    escalation: record.escalation ?? {
      reason: 'seller_choice',
      detail: 'The seller asked for a person to take this case.',
      disposition: 'human_tier',
      escalatedAt: new Date().toISOString(),
    },
  });
  revalidatePath('/ops');
  redirect(`/case/${caseId}`);
}

// ---------------------------------------------------------------------------
// /ops
// ---------------------------------------------------------------------------

export async function claimCase(formData: FormData): Promise<void> {
  const caseId = str(formData, 'caseId');
  const reviewer = str(formData, 'reviewer') || 'unassigned';
  await claimEscalation(caseId, reviewer);
  revalidatePath('/ops');
}

export async function resolveCase(formData: FormData): Promise<void> {
  const caseId = str(formData, 'caseId');
  const note = str(formData, 'resolution') || 'Reviewed and returned to the seller.';
  await resolveEscalation(caseId, note);
  revalidatePath('/ops');
  revalidatePath(`/case/${caseId}`);
}

// ---------------------------------------------------------------------------
// Shield (D6 / ADR-006)
// ---------------------------------------------------------------------------

export async function confirmForwarding(formData: FormData): Promise<void> {
  const caseId = str(formData, 'caseId');
  const record = await getCase(caseId);
  if (!record?.shield) return;
  await updateCase(caseId, {
    shield: { ...record.shield, forwardingConfirmedAt: new Date().toISOString() },
  });
  revalidatePath('/settings/monitoring');
}

/**
 * S15/S17. Keeping and lapsing are the same weight, one click each, and neither
 * is buried. There is no retention interstitial and no "are you sure" — per the
 * peak-end rule a punitive ending is disproportionately what gets remembered and
 * repeated in the forum that is the entire distribution channel (D8).
 */
export async function setShieldState(formData: FormData): Promise<void> {
  const caseId = str(formData, 'caseId');
  const keep = str(formData, 'keep') === 'yes';
  const record = await getCase(caseId);
  if (!record?.shield) return;
  await updateCase(caseId, {
    shield: keep
      ? { ...record.shield, cancelledAt: undefined }
      : { ...record.shield, cancelledAt: new Date().toISOString() },
  });
  revalidatePath('/settings/monitoring');
}

export async function shieldAddressFor(token: string): Promise<string> {
  return `shield+${token}@${shieldIngestDomain()}`;
}
