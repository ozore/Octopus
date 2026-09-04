import { headers } from 'next/headers';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { AppShell } from '@/components/shell';
import { StatusPill } from '@/components/primitives';
import { signOutAction } from '@/lib/actions';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * The signed-in shell. `requireOrg()` is the REAL guard — the middleware only
 * checks that a session cookie exists, because Edge middleware cannot reach the
 * database. Every protected render therefore verifies the session row here.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const { org, user, entitlement } = await requireOrg();
  const currentPath = (await headers()).get('x-pathname') ?? '/projects';

  return (
    <AppShell
      currentPath={currentPath}
      orgName={org.name}
      userEmail={user.email}
      planBadge={
        <StatusPill tone={entitlement.status === 'active' || entitlement.trialing ? 'filed' : 'none'}>
          <span data-testid="plan-badge">{entitlement.planName}</span>
        </StatusPill>
      }
      actions={
        <form action={signOutAction}>
          <button className="wl-btn wl-btn--ghost wl-btn--sm" type="submit">
            Sign out
          </button>
        </form>
      }
      banner={
        entitlement.inGrace ? (
          <div className="wl-alert wl-alert--warn" role="alert">
            <div>
              <p className="wl-alert__title">Your last payment failed.</p>
              <p className="wl-alert__body">
                Update the card in <Link href="/settings/billing">billing</Link> — access stays on
                while Stripe retries.
              </p>
            </div>
          </div>
        ) : null
      }
    >
      {children}
    </AppShell>
  );
}
