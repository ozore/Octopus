/**
 * The authenticated shell's navigation.
 *
 * AUTHORITY: `USER_JOURNEY.md` §0.6 (the screen inventory), `DESIGN_SYSTEM.md` §8.1.
 *
 * FIVE LINKS, AND NONE OF THEM IS HELP. There is no support link, no chat launcher
 * and no route to a person in this nav, and there must never be one: A3 forbids an
 * escalation path anywhere in the compliance flow, and a nav item appears on every
 * screen in the product — including the ones that exist precisely to refuse without
 * one. Help in Ratepin is inline provenance: the determination's own text, sitting
 * next to the decision it governs.
 */

import Link from 'next/link';

import { signOut } from '../_actions/auth';
import { requireSession } from '../_lib/auth';

export default async function AppLayout({
  children,
}: {
  readonly children: React.ReactNode;
}): Promise<React.ReactElement> {
  const session = await requireSession('/app');

  return (
    <div className="rp-stack rp-stack--section">
      <nav className="rp-row rp-row--between" aria-label="Ratepin">
        <span className="rp-row">
          <Link href="/app">Projects</Link>
          <Link href="/app/week">This week</Link>
          <Link href="/app/workers">Workers</Link>
          <Link href="/app/settings/memory">Memory</Link>
          <Link href="/app/settings/billing">Billing</Link>
          <Link href="/app/settings/data">Data</Link>
        </span>
        <form action={signOut}>
          <span className="rp-t-micro rp-num">{session.email}</span>{' '}
          <button type="submit" className="rp-btn rp-btn--quiet rp-btn--sm">
            Sign out
          </button>
        </form>
      </nav>
      {children}
    </div>
  );
}
