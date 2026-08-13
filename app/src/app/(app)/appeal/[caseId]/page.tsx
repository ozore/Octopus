/**
 * `/appeal/{caseId}` — the streaming preview.
 *
 * Spec: ARCHITECTURE.md §3.1, USER_JOURNEY.md S2–S4.
 *
 * The server half is deliberately thin: it resolves the case, decides which
 * screen the case's *state* calls for, and hands the client component the two
 * server actions it is allowed to invoke. Everything the seller reads is
 * streamed, because the alternative — render on completion — is a blank page for
 * the length of the pipeline, which is the abandonment failure USER_JOURNEY §6
 * is written to prevent.
 */

import { notFound, redirect } from 'next/navigation';

import { getCase } from '@/app/_lib/case-store';
import { requestHumanReview, startCheckout } from '@/app/_lib/actions';
import { timeGuaranteeAdvertised } from '@/app/_lib/runtime-env';

import { AppealStream } from './AppealStream';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Your case — Clausewright',
};

export default async function AppealCasePage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;
  const record = await getCase(caseId);
  if (!record) notFound();

  // A paid case belongs on the delivered document, not back at the paywall.
  //
  // `status === 'paid'`, not "a payment row exists". `startCheckout` writes a
  // PENDING row before the seller reaches Stripe, so the weaker test sent a
  // seller who merely OPENED Checkout and backed out straight to the delivered
  // document — which, with the plan page ungated, handed over the $149 artifact
  // for free. Only the webhook writes `paid` (ADR-007).
  if (record.payment?.status === 'paid') redirect(`/case/${caseId}/plan`);

  return (
    <AppealStream
      caseId={caseId}
      startCheckout={startCheckout}
      requestHumanReview={requestHumanReview}
      timeGuaranteeAdvertised={timeGuaranteeAdvertised()}
    />
  );
}
