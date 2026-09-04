import Link from 'next/link';
import { headers } from 'next/headers';
import type { ReactNode } from 'react';

import { getEnv } from '@/env';
import { signOutAction } from '@/lib/actions';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * THE APP SHELL — `UX.md` §2.2, `IDENTITY.md` §8.2.
 *
 * A 240px left navigation and a content column. Not a top bar: the buyer's
 * two-second job is "who has a problem?", and a persistent list of the four
 * places that answer it beats a menu that has to be opened. The width is
 * `--c-nav-w`, a token, so the rail at 1199px and the stacked layout at 899px
 * come from `design-system.css` rather than from a media query written here.
 *
 * `requireOrg()` is THE REAL GUARD. The middleware only checks that a session
 * cookie exists, because Edge middleware cannot reach Postgres; every protected
 * render therefore verifies the session row here.
 */

type NavItem = { href: string; label: string; note?: string };

const PRIMARY: NavItem[] = [
  { href: '/dashboard', label: 'Coverage' },
  { href: '/vendors', label: 'Vendors' },
  { href: '/requirements', label: 'Requirements' },
];

const SECONDARY: NavItem[] = [
  { href: '/settings', label: 'Settings' },
  { href: '/settings/billing', label: 'Billing' },
  { href: '/help', label: 'Help' },
];

export default async function AppLayout({ children }: { children: ReactNode }) {
  const env = getEnv();
  const { org, user, entitlement } = await requireOrg();
  const pathname = (await headers()).get('x-pathname') ?? '';

  const item = ({ href, label, note }: NavItem) => {
    const current = pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));
    return (
      <li key={href}>
        <Link className="c-nav__link" href={href} aria-current={current ? 'page' : undefined}>
          {label}
          {note ? <span className="c-xs c-muted">{note}</span> : null}
        </Link>
      </li>
    );
  };

  return (
    <div className="c-shell">
      <nav className="c-nav" aria-label="Main">
        <Link className="c-wordmark c-nav__brand" href="/dashboard">
          {env.APP_NAME}
        </Link>

        <div className="c-nav__group">
          <p className="c-nav__grouptitle">Portfolio</p>
          <ul className="c-nav__list">{PRIMARY.map(item)}</ul>
        </div>

        <div className="c-nav__group">
          <p className="c-nav__grouptitle">Account</p>
          <ul className="c-nav__list">{SECONDARY.map(item)}</ul>
        </div>

        <div className="c-nav__foot">
          <p style={{ margin: 0 }}>
            <span data-testid="plan-badge">{entitlement.planName}</span> · {org.name}
          </p>
          <p className="c-xs c-muted" style={{ margin: '4px 0 8px' }}>
            {user.email}
          </p>
          <form action={signOutAction}>
            <button className="c-btn c-btn--secondary c-btn--sm" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </nav>

      <div className="c-main">
        {entitlement.inGrace ? (
          <p className="notice warn">
            Your last payment failed. Update the card in <Link href="/settings/billing">billing</Link> —
            access stays on while Stripe retries.
          </p>
        ) : null}
        {children}
      </div>
    </div>
  );
}
