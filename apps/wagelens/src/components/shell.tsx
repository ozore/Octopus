/**
 * The two shells: the signed-in app (UX.md §2) and the public surface.
 *
 * THE LEFT RAIL IS 216px AND THE ORDER IS THE WORKING WEEK: Projects, Payroll,
 * Workers, Alerts, Settings, Help. `--wl-rail` carries the width, so the
 * measurement lives in the design system and not in a component — and the rail
 * collapses to 56px under 1100px and to a horizontal strip under 780px, which
 * is the identity fleet's rule, not this file's.
 *
 * The product name is `APP_NAME` (WL-11 V8): the wordmark, the tab title and
 * the footer all read it from the environment, so the founder's rename is a
 * redeploy.
 */

import Link from 'next/link';
import type { ReactNode } from 'react';

import { productName } from '@/env';

export type NavItem = { href: string; label: string };

/** UX.md §2's app screens, in the order the week is worked. */
export const APP_NAV: NavItem[] = [
  { href: '/projects', label: 'Projects' },
  { href: '/payroll', label: 'Payroll' },
  { href: '/workers', label: 'Workers' },
  { href: '/alerts', label: 'Alerts' },
  { href: '/settings', label: 'Settings' },
  { href: '/help', label: 'Help' },
];

export function Wordmark({ href = '/', sub }: { href?: string; sub?: string }) {
  return (
    <Link className="wl-mark" href={href} aria-label={productName()}>
      <span className="wl-mark__name">{productName()}</span>
      <span className="wl-mark__rule" aria-hidden="true" />
      {sub ? <span className="wl-mark__sub">{sub}</span> : null}
    </Link>
  );
}

export function AppShell({
  currentPath,
  orgName,
  userEmail,
  planBadge,
  banner,
  actions,
  children,
}: {
  currentPath: string;
  orgName: string;
  userEmail: string;
  planBadge?: ReactNode;
  banner?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="wl-shell">
      <aside className="wl-rail">
        <Wordmark href="/projects" sub="Certified payroll" />
        <nav className="wl-nav" aria-label="Main">
          {APP_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={
                currentPath === item.href || currentPath.startsWith(`${item.href}/`)
                  ? 'page'
                  : undefined
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="wl-stack-2 wl-spacer">
          <span className="wl-2xs wl-muted">{orgName}</span>
          <span className="wl-2xs wl-muted">{userEmail}</span>
        </div>
      </aside>
      <div className="wl-main">
        <header className="wl-topbar">
          <span className="wl-sm wl-strong">{orgName}</span>
          {planBadge}
          <span className="wl-spacer" />
          {actions}
        </header>
        {banner}
        <div className="wl-content">{children}</div>
      </div>
    </div>
  );
}

export function PublicShell({
  signedIn,
  children,
}: {
  signedIn: boolean;
  children: ReactNode;
}) {
  const product = productName();
  return (
    <div className="wl-public">
      <header className="wl-public__bar">
        <Wordmark href="/" />
        <nav>
          <Link href="/lookup">Rate lookup</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/help">Help</Link>
          {signedIn ? (
            <Link className="wl-btn wl-btn--secondary wl-btn--sm" href="/projects">
              Open {product}
            </Link>
          ) : (
            <Link className="wl-btn wl-btn--secondary wl-btn--sm" href="/login">
              Sign in
            </Link>
          )}
        </nav>
      </header>
      <main className="wl-public__body">{children}</main>
      <footer className="wl-public__foot">
        <p>
          {product}, a TheVillage company · <Link href="/legal/terms">Terms</Link> ·{' '}
          <Link href="/legal/privacy">Privacy</Link> ·{' '}
          <Link href="/legal/disclaimer">Disclaimer</Link> ·{' '}
          <Link href="/help">Help</Link>
        </p>
      </footer>
    </div>
  );
}
