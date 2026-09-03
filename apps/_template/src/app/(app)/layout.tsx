import Link from 'next/link';
import type { ReactNode } from 'react';

import { getEnv } from '@/env';
import { signOutAction } from '@/lib/actions';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * The signed-in shell. `requireOrg()` is the REAL guard — the middleware only
 * checks that a session cookie exists, because Edge middleware cannot reach the
 * database. Every protected render therefore verifies the session row here.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const env = getEnv();
  const { org, user, entitlement } = await requireOrg();

  return (
    <>
      <header className="site-header">
        <nav>
          <Link className="brand" href="/dashboard">
            {env.APP_NAME}
          </Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/settings">Settings</Link>
          <Link href="/settings/billing">Billing</Link>
          <Link href="/help">Help</Link>
          <span className="badge" data-testid="plan-badge">
            {entitlement.planName}
          </span>
          <span className="small muted">
            {org.name} · {user.email}
          </span>
          <form action={signOutAction}>
            <button className="button secondary" type="submit">
              Sign out
            </button>
          </form>
        </nav>
      </header>
      {entitlement.inGrace ? (
        <p className="notice warn" style={{ margin: 16 }}>
          Your last payment failed. Update the card in <Link href="/settings/billing">billing</Link>{' '}
          — access stays on while Stripe retries.
        </p>
      ) : null}
      {children}
    </>
  );
}
