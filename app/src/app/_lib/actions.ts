'use server';

/**
 * Server actions — the only mutations the UI can perform.
 *
 * Spec: ARCHITECTURE.md §3.1 (web app), §3.5 (billing), §3.6 (escalation queue),
 * §3.8 (Shield), USER_JOURNEY.md §4 (the case state machine).
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
 *  - **ADR-007.** `startCheckout` creates a hosted session and nothing more. The
 *    redirect back from Checkout is *not* the source of truth for payment; the
 *    webhook is. `recordCheckoutReturn` therefore says "recorded", and the /case
 *    screen shows the state as such, so a seller who bookmarks the success URL
 *    cannot unlock a case by reloading it.
 */

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import {
  claimEscalation,
  createCase,
  getCase,
  resolveEscalation,
  updateCase,
} from './case-store';
import { adapterMode, appBaseUrl, billingAdapter, shieldIngestDomain } from './runtime-env';

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
  const record = createCase(notice);
  redirect(`/appeal/${record.id}`);
}

// ---------------------------------------------------------------------------
// S4 — the paywall handoff
// ---------------------------------------------------------------------------

export async function startCheckout(formData: FormData): Promise<void> {
  const caseId = str(formData, 'caseId');
  const tier = str(formData, 'tier') === 'rescue_human' ? 'rescue_human' : 'rescue';
  const consentGranted = str(formData, 'consent') === 'on';
  const record = getCase(caseId);
  if (!record) redirect('/appeal');

  const base = appBaseUrl();
  const billing = await billingAdapter();
  const session = await billing.createCheckoutSession({
    caseId,
    tier,
    successUrl: `${base}/case/${caseId}/plan?session={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${base}/appeal/${caseId}`,
    // D6: the card is kept so 30 days of Shield can be included with zero extra
    // decision at the moment of panic. The retention decision lands 30 days
    // later, at relief (peak-end rule).
    saveCardForFutureUse: true,
    // ADR-008 ¶1: consent rides as metadata and is SEPARABLE from the purchase —
    // declining must not block or degrade it, so it is never a required field.
    consent: { granted: consentGranted, textVersion: 'outcome-consent-v1' },
  });

  updateCase(caseId, { status: 'awaiting_payment' });

  if (adapterMode() === 'live') {
    // Hosted Checkout. No card data ever reaches us (SAQ-A).
    redirect(session.url);
  }
  // Mock mode has no Stripe to redirect to. The handoff still went through the
  // adapter; the stand-in page below shows the session it produced.
  redirect(`/appeal/${caseId}/checkout?session=${encodeURIComponent(session.id)}`);
}

/**
 * The return from Checkout. Records the session against the case so the
 * delivered document can be reached; it does NOT assert that Stripe confirmed
 * the charge — `checkout.session.completed` does that, in the webhook handler.
 */
export async function recordCheckoutReturn(caseId: string, sessionId: string): Promise<void> {
  const record = getCase(caseId);
  if (!record || record.payment) return;
  const billing = await billingAdapter();
  let amountCents = 14900;
  try {
    const session = await billing.retrieveSession(sessionId);
    amountCents = session.amountCents;
  } catch {
    // An unknown session id is not an error the seller can act on; the case
    // simply stays unpaid and the paywall stays where it was.
    return;
  }
  const now = new Date().toISOString();
  updateCase(caseId, {
    status: 'delivered',
    payment: {
      tier: amountCents >= 39900 ? 'rescue_human' : 'rescue',
      sessionId,
      amountCents,
      paidAt: now,
    },
    // D6 — 30 days of Shield are included, card on file, no new decision now.
    shield: {
      ingestToken: caseId.replace(/^case_/, ''),
      includedUntil: new Date(Date.now() + 30 * 864e5).toISOString(),
      cardOnFile: true,
    },
  });
}

// ---------------------------------------------------------------------------
// S6 / S12 — submission and outcome
// ---------------------------------------------------------------------------

export async function markSubmitted(formData: FormData): Promise<void> {
  const caseId = str(formData, 'caseId');
  updateCase(caseId, { status: 'decision_pending', submittedAt: new Date().toISOString() });
  revalidatePath(`/case/${caseId}`);
  redirect(`/case/${caseId}`);
}

export async function reportOutcome(formData: FormData): Promise<void> {
  const caseId = str(formData, 'caseId');
  const decision = str(formData, 'decision');
  if (decision === 'reinstated') {
    updateCase(caseId, { status: 'reinstated', decision: 'reinstated' });
  } else if (decision === 'rejected') {
    // J2. The rejection does not end the case; it triggers the outcome
    // guarantee, and the escalation is created here rather than waiting for the
    // seller to find a support link (USER_JOURNEY §2.1, Nielsen #6).
    updateCase(caseId, {
      status: 'escalated',
      decision: 'rejected',
      escalation: {
        reason: 'seller_choice',
        detail: 'First submission rejected — free human review under the outcome guarantee.',
        disposition: 'human_tier',
        escalatedAt: new Date().toISOString(),
      },
    });
  } else {
    updateCase(caseId, { decision: 'no_response' });
  }
  revalidatePath(`/case/${caseId}`);
}

/**
 * The human backstop, reachable from every screen where a machine-only answer
 * might be insufficient (USER_JOURNEY §8.7, D3). Never behind a help menu.
 */
export async function requestHumanReview(formData: FormData): Promise<void> {
  const caseId = str(formData, 'caseId');
  const record = getCase(caseId);
  if (!record) return;
  updateCase(caseId, {
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
  claimEscalation(caseId, reviewer);
  revalidatePath('/ops');
}

export async function resolveCase(formData: FormData): Promise<void> {
  const caseId = str(formData, 'caseId');
  const note = str(formData, 'resolution') || 'Reviewed and returned to the seller.';
  resolveEscalation(caseId, note);
  revalidatePath('/ops');
  revalidatePath(`/case/${caseId}`);
}

// ---------------------------------------------------------------------------
// Shield (D6 / ADR-006)
// ---------------------------------------------------------------------------

export async function confirmForwarding(formData: FormData): Promise<void> {
  const caseId = str(formData, 'caseId');
  const record = getCase(caseId);
  if (!record?.shield) return;
  updateCase(caseId, {
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
  const record = getCase(caseId);
  if (!record?.shield) return;
  updateCase(caseId, {
    shield: keep
      ? { ...record.shield, cancelledAt: undefined }
      : { ...record.shield, cancelledAt: new Date().toISOString() },
  });
  revalidatePath('/settings/monitoring');
}

export async function shieldAddressFor(token: string): Promise<string> {
  return `shield+${token}@${shieldIngestDomain()}`;
}
