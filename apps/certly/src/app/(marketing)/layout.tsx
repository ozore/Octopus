import Link from 'next/link';
import type { ReactNode } from 'react';

import { getEnv } from '@/env';
import { getSession } from '@octopus/platform/next';

/**
 * Runtime config, not build-time config (Twelve-Factor III): every page below
 * reads APP_NAME, SUPPORT_EMAIL and the plan map from the environment at
 * REQUEST time. Prerendering them would bake one deploy's values into the
 * bundle — and would fail the build outright in CI, where no environment is
 * set. It is also what makes the rename to Coverfile a variable rather than a
 * pull request.
 */
export const dynamic = 'force-dynamic';

export default async function MarketingLayout({ children }: { children: ReactNode }) {
  const env = getEnv();
  const session = await getSession();

  return (
    <>
      <header className="c-topbar">
        <Link className="c-wordmark" href="/">
          {env.APP_NAME}
        </Link>
        <span className="c-topbar__spacer" />
        <Link href="/pricing">Pricing</Link>
        <Link href="/help">Help</Link>
        {session ? (
          <Link className="c-btn c-btn--primary c-btn--sm" href="/dashboard">
            Dashboard
          </Link>
        ) : (
          <Link className="c-btn c-btn--primary c-btn--sm" href="/login">
            Sign in
          </Link>
        )}
      </header>

      {children}

      <footer className="c-footer">
        <p>
          {env.APP_NAME}, a {env.COMPANY_NAME} company · <Link href="/legal/terms">Terms</Link> ·{' '}
          <Link href="/legal/privacy">Privacy</Link> · <Link href="/legal/disclaimer">Disclaimer</Link> ·{' '}
          <a href={`mailto:${env.SUPPORT_EMAIL}`}>{env.SUPPORT_EMAIL}</a>
        </p>
      </footer>
    </>
  );
}
