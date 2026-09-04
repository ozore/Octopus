import Link from 'next/link';
import type { ReactNode } from 'react';

import { Disclaimer } from '@/components/provenance';
import { getEnv } from '@/env';
import { signOutAction } from '@/lib/actions';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * The signed-in shell: **a full-width top bar over a full-width board**, not a
 * left rail (`IDENTITY_ARBITRATION.md` §3.5, `UX.md` S09,
 * `design-system.css` `.sr-bar`). Both sibling apps run rails; this is the
 * third distinct layout structure in the fleet, and the board's hero object is
 * a wide grid that wants the width.
 *
 * `requireOrg()` is the REAL guard — the middleware only checks that a session
 * cookie exists, because Edge middleware cannot reach the database. Every
 * protected render therefore verifies the session row here.
 *
 * The disclaimer is in this layout rather than on each page, so `UX.md` C7 —
 * *the disclaimer appears in the footer of every app screen* — is a structural
 * fact rather than a thing to remember.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const env = getEnv();
  const { org, user, entitlement } = await requireOrg();

  return (
    <div className="sr-shell">
      <header className="sr-bar">
        <nav className="sr-bar__nav" aria-label="Main">
          <Link className="brand" href="/dashboard">
            {env.APP_NAME}
          </Link>
          <Link href="/dashboard">Board</Link>
          <Link href="/roster">Roster</Link>
          <Link href="/coverage">Coverage</Link>
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
        <p className="notice warn" style={{ margin: 'var(--sr-space-4)' }}>
          Your last payment failed. Update the card in <Link href="/settings/billing">billing</Link> — access
          stays on while Stripe retries.
        </p>
      ) : null}

      <main className="sr-main">
        <div className="sr-container">
          {children}
          <Disclaimer />
        </div>
      </main>
    </div>
  );
}
