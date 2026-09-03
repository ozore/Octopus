import Link from 'next/link';

import { getEnv } from '@/env';
import { plans } from '@/lib/plans';

/**
 * LANDING PLACEHOLDER. The Offer & Landing fleet replaces this file entirely:
 * one problem, one promise, visual proof, one call to action (PLAN.md §4).
 * What it must keep: the CTA path (/login), the pricing link, and the legal
 * footer that the marketing layout provides.
 */
export default function LandingPage() {
  const env = getEnv();
  const entry = plans.plans[0];

  return (
    <main className="narrow">
      <p className="badge">Placeholder landing page</p>
      <h1>One sentence that names the reader&apos;s problem.</h1>
      <p className="muted">
        One sentence that promises the outcome, in their words, with the proof underneath. Replace
        this whole file with the landing spec from <code>phase-4-revenue/&lt;app&gt;/</code>.
      </p>

      <p>
        <Link className="button" href="/login">
          Start free
        </Link>{' '}
        <Link className="button secondary" href="/pricing">
          See pricing
        </Link>
      </p>

      <h2>What you get</h2>
      <ul>
        {(entry?.features ?? []).map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>

      <p className="disclaimer">
        {env.APP_NAME} summarises public sources with the date each was verified; it is not legal
        advice — check the source before you file.
      </p>
    </main>
  );
}
