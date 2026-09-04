import Link from 'next/link';
import type { ReactNode } from 'react';

import { getEnv } from '@/env';
import { getSession } from '@octopus/platform/next';

/**
 * Runtime config, not build-time config (Twelve-Factor III): every page below
 * reads APP_NAME, SUPPORT_EMAIL and the plan map from the environment at
 * REQUEST time. Prerendering them would bake one deploy's values into the
 * bundle — and would fail the build outright in CI, where no environment is
 * set. These pages are cheap; the cost of rendering them per request is a
 * rounding error next to the cost of shipping a stale support address.
 */
export const dynamic = 'force-dynamic';

export default async function MarketingLayout({ children }: { children: ReactNode }) {
  const env = getEnv();
  const session = await getSession();

  return (
    <>
      <header className="site-header">
        <nav>
          <Link className="brand" href="/">
            {env.APP_NAME}
          </Link>
          <Link href="/coverage">Coverage</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/help">Help</Link>
          {session ? (
            <Link className="button" href="/dashboard">
              Dashboard
            </Link>
          ) : (
            <Link className="button" href="/login">
              Sign in
            </Link>
          )}
        </nav>
      </header>
      {children}
      <footer className="site-footer">
        <p className="small">
          {env.APP_NAME}, a {env.COMPANY_NAME} company · <Link href="/legal/terms">Terms</Link> ·{' '}
          <Link href="/legal/privacy">Privacy</Link> · <Link href="/legal/disclaimer">Disclaimer</Link> ·{' '}
          <a href={`mailto:${env.SUPPORT_EMAIL}`}>{env.SUPPORT_EMAIL}</a>
        </p>
      </footer>
    </>
  );
}
