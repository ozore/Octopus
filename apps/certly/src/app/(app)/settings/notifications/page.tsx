import Link from 'next/link';

import { getDb } from '@/lib/db';
import { getPreferences } from '@/lib/repos/settings';
import { updatePreferencesAction } from '@/lib/settings/actions';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * NOTIFICATIONS — and the two messages that have no switch.
 *
 * `specs/13` §2: the trial-ending T−3/T−1 emails (`specs/10` §3.1) and the
 * customer-facing expiry warning (`UX.md` §4.1 C4) are transactional. The
 * second one is not a policy preference either: **the Lapse Watch guarantee is
 * conditioned on our having warned** (REVIEW.md MJ-19), so a customer who could
 * switch the warning off could switch off the thing the guarantee depends on
 * and we would owe a credit for a warning they had disabled. The screen says so
 * where the toggles would otherwise be, rather than leaving it to be discovered.
 */
export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { org, user } = await requireOrg();
  const db = await getDb();
  const preferences = await getPreferences(db, { orgId: org.id, userId: user.id });

  return (
    <main className="c-prose">
      <p className="c-xs c-muted">
        <Link href="/settings">Settings</Link> · Notifications
      </p>
      <h1>Notifications</h1>
      {params['saved'] ? <p className="notice">Saved.</p> : null}

      <form action={updatePreferencesAction} className="c-stack">
        <label className="c-row" htmlFor="weeklyDigest">
          <input id="weeklyDigest" name="weeklyDigest" type="checkbox" defaultChecked={preferences.weeklyDigest} />
          <span>Weekly digest — what changed, and what expires next</span>
        </label>
        <label className="c-row" htmlFor="reviewAlerts">
          <input id="reviewAlerts" name="reviewAlerts" type="checkbox" defaultChecked={preferences.reviewAlerts} />
          <span>Review queue — when a document needs a human</span>
        </label>
        <label className="c-row" htmlFor="bounceAlerts">
          <input id="bounceAlerts" name="bounceAlerts" type="checkbox" defaultChecked={preferences.bounceAlerts} />
          <span>Bounces — when a vendor’s address stops working</span>
        </label>
        <button className="c-btn c-btn--primary" type="submit">
          Save
        </button>
      </form>

      <h2>Two messages have no switch</h2>
      <ul className="c-small" data-testid="transactional-notice">
        <li>
          <strong>Before your card is charged.</strong> Three days before, and again one day before,
          we email you the date and the amount with a one-click cancel. No charge without a warning.
        </li>
        <li>
          <strong>Before a certificate expires.</strong> The Lapse Watch is a promise about our
          warning, so the warning itself cannot be turned off —{' '}
          <Link href="/legal/lapse-watch">read it in full</Link>.
        </li>
      </ul>
    </main>
  );
}
