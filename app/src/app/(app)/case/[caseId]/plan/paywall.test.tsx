/**
 * THE PAYWALL, AS A SERVER-SIDE AUTHORISATION RULE.
 *
 * Spec: ARCHITECTURE.md §1 — "The paywall therefore sits between the critique
 * and the full document"; §3.5 / ADR-007 — only the webhook writes `paid`, "so a
 * seller who bookmarks the success URL cannot unlock a case by reloading it".
 *
 * WHY THIS FILE EXISTS. The build's free-preview boundary was enforced only by
 * which components a page chose to render. `/case/{id}/plan` served the full
 * three-section Plan of Action to anyone who could reach the URL, and
 * `/appeal/{id}` redirected there on the mere EXISTENCE of a `payments` row —
 * which `startCheckout` writes as `pending` before the seller ever reaches
 * Stripe. Opening Checkout and pressing Back therefore delivered the $149
 * artifact for free, through the product's own navigation, with no tampering.
 *
 * The two properties asserted here are the ones that were false:
 *   1. an unpaid case must not render the drafted sections, and
 *   2. a PENDING payment must count as unpaid — the distinction ADR-007 draws
 *      between "a Checkout was started" and "a purchase completed".
 *
 * `revalidatePath` is mocked for the same reason `ops.test.tsx` mocks it: it
 * throws outside a real Next request. Everything else — the case store, the
 * billing module, PGlite — runs for real, because the property worth protecting
 * is what the page actually serves.
 */

import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { getAdapters } from '@/lib/adapters';
import { createCheckoutForCase } from '@/lib/billing';
import { getDb } from '@/lib/db';
import { createCase, getCase, resetCaseStore, updateCase } from '@/app/_lib/case-store';
import type { CitedClause, DraftSections } from '@/lib/domain/types';

import PlanPage from './page';

afterEach(async () => {
  await resetCaseStore();
});

const SECRET_BODY = 'The root cause was an unverified supplier introduced in March.';

const sections: DraftSections = {
  rootCause: SECRET_BODY,
  correctiveActions: 'We removed the listing and audited the remaining catalogue.',
  preventiveMeasures: 'Every new supplier now requires an invoice on file before listing.',
};

const clause: CitedClause = {
  citedText: 'Sellers must be able to provide documentation showing the source of their inventory.',
  clauseId: 'amz.psaa#supplier-invoices',
  sourceUrl: 'https://sellercentral.amazon.com/help/hub/reference/external/G201165970',
  documentTitle: 'Amazon — Product Authenticity and Quality policy',
  block: { startBlockIndex: 0, endBlockIndex: 0 },
};

async function draftedCase(): Promise<string> {
  const record = await createCase(
    'Your account has been deactivated in accordance with section 3 of the Amazon Business Solutions Agreement.',
  );
  // `preview_ready` is walked from `classifying`, not from `intake` — the state
  // machine has no intake -> classified edge, and `walk()` silently skips edges
  // it cannot take rather than corrupting the row.
  await updateCase(record.id, { status: 'classifying' });
  await updateCase(record.id, {
    status: 'preview_ready',
    marketplace: 'amazon',
    classification: { code: 'AMZ.AUTH.INAUTHENTIC', plainEnglish: 'Product authenticity', confidence: 0.9 },
    clauses: [clause],
    sections,
    critique: {
      readinessScore: 71,
      criteria: [{ id: 'supplier_invoices', met: true, weight: 30, deficiency: null }],
      blockingDeficiencies: [],
      evidenceKitGaps: [],
    },
  });
  return record.id;
}

async function renderPlan(caseId: string) {
  const ui = await PlanPage({
    params: Promise.resolve({ caseId }),
    searchParams: Promise.resolve({}),
  });
  return render(ui);
}

describe('/case/{id}/plan — the paywall is server-side (ARCHITECTURE.md §1, ADR-007)', () => {
  it('does not serve the drafted document to a case that has never paid', async () => {
    const caseId = await draftedCase();
    const { container } = await renderPlan(caseId);

    expect(container.textContent).not.toContain(SECRET_BODY);
    expect(container.textContent).toMatch(/not unlocked yet/i);
  });

  it('treats a PENDING payment as unpaid: opening Checkout is not buying', async () => {
    const caseId = await draftedCase();

    // The real billing path, which writes the pending row — the exact state a
    // seller reaches by pressing the buy button and then going back.
    await createCheckoutForCase(await getDb(), getAdapters(), {
      caseId,
      tier: 'rescue',
      successUrl: 'https://app.test/success',
      cancelUrl: 'https://app.test/cancel',
    });
    expect((await getCase(caseId))?.payment?.status).toBe('pending');

    const { container } = await renderPlan(caseId);
    expect(container.textContent).not.toContain(SECRET_BODY);
  });

  it('serves the document once the payment is paid — the gate opens, it does not merely exist', async () => {
    const caseId = await draftedCase();
    const db = await getDb();
    const { session } = await createCheckoutForCase(db, getAdapters(), {
      caseId,
      tier: 'rescue',
      successUrl: 'https://app.test/success',
      cancelUrl: 'https://app.test/cancel',
    });

    // Only the webhook writes `paid` (ADR-007), so the fulfilment path is what
    // unlocks it here too — not a direct status poke that would prove nothing.
    const { handleStripeWebhook } = await import('@/lib/billing/webhook');
    const mockBilling = getAdapters().billing as unknown as {
      signedCompletedSession(id: string): { payload: string; signature: string };
    };
    const { payload, signature } = mockBilling.signedCompletedSession(session.id);
    await handleStripeWebhook(db, getAdapters(), payload, signature);

    expect((await getCase(caseId))?.payment?.status).toBe('paid');

    const { container } = await renderPlan(caseId);
    expect(container.textContent).toContain(SECRET_BODY);
  });
});
