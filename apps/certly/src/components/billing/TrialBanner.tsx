/**
 * The trial banner — shown from DAY ONE, stating the first-charge DATE.
 *
 * `specs/10` §6: the date form is canonical and `UX.md` §2.1 S6 follows it
 * (REVIEW.md MN-07). A countdown answers "how long have I got"; the question a
 * customer with a card on file actually has is "when does the money move". From
 * day 7 the days remaining are added, because by then they are the same
 * question.
 *
 * It also carries the two other states a customer must not discover from a
 * failed action: the dunning grace, and read-only after it.
 */

import Link from 'next/link';

import type { CertlyEntitlement } from '@/lib/billing/entitlement';
import { trialBannerText } from '@/lib/billing/trial';

export function TrialBanner({ entitlement }: { entitlement: CertlyEntitlement }) {
  if (entitlement.row === 'trialing' && entitlement.trialEndsAt) {
    return (
      <p className="notice" data-testid="trial-banner">
        {trialBannerText(entitlement.trialEndsAt)}{' '}
        <Link href="/settings/billing">Manage billing</Link>
      </p>
    );
  }

  if (entitlement.row === 'past_due_grace') {
    return (
      <p className="notice warn" data-testid="dunning-banner">
        Your last payment failed. Everything still works while Stripe retries —{' '}
        <Link href="/settings/billing">update the card</Link>.
      </p>
    );
  }

  if (entitlement.readOnly) {
    return (
      <p className="notice warn" data-testid="read-only-banner">
        This account is read-only. Every vendor, certificate, report and export stays available and
        downloadable; new uploads and reminders are paused until{' '}
        <Link href="/settings/billing">billing is restarted</Link>.
      </p>
    );
  }

  return null;
}
