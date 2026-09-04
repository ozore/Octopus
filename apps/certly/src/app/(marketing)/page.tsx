import Link from 'next/link';

import { CoverageBar, CoverageLegend } from '@/components/CoverageBar';
import { Disclaimer } from '@/components/Disclaimer';
import { StatusPill } from '@/components/StatusPill';
import { getEnv } from '@/env';

export const dynamic = 'force-dynamic';

/**
 * LANDING PLACEHOLDER. `LANDING_SPEC.md` owns this file and the sub-wave B
 * agent replaces it entirely: one problem, one promise, visual proof, ONE call
 * to action, inside a 450-word budget that a published script counts.
 *
 * What is here is deliberately small and deliberately honest: enough of the
 * identity to prove the shell works, and no claim the product cannot yet make.
 * What it establishes and the replacement must keep:
 *
 *  - ONE hero CTA (REVIEW.md MJ-04), whose LABEL is gated on the founder's
 *    legal read of the Free Gap Report (`specs/15` launch gate, B-07).
 *    Pre-gate it is "See it read a certificate"; post-gate it becomes "Get a
 *    free Gap Report". Both fit the budget; neither says "Start free".
 *  - Zero third-party requests on first view: the fonts are self-hosted, there
 *    is no CDN, no analytics script and no embedded video.
 *  - No document from `kb-samples/` and no traced ACORD form (B-13). Every
 *    sample shown on a public surface is Certly-authored.
 */
export default function LandingPage() {
  const env = getEnv();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="c-prose">
      <p className="badge">Placeholder — LANDING_SPEC.md replaces this page</p>

      <h1>A certificate that says “additional insured” is not an endorsement.</h1>
      <p>
        {env.APP_NAME} reads the certificates your vendors send, compares them to the requirements you
        set, and separates what the document <strong>evidences</strong> from what it only{' '}
        <strong>claims</strong>.
      </p>

      <p className="c-gap-3" style={{ marginTop: 'var(--c-space-6)' }}>
        <Link className="c-btn c-btn--primary" href="/login">
          See it read a certificate
        </Link>
        <Link className="c-btn c-btn--quiet" href="/pricing">
          Pricing
        </Link>
      </p>

      <hr className="c-hr" />

      <h2>The third state is the product</h2>
      <p className="c-small c-muted">
        The ACORD 25 prints, on its face, that a statement on the certificate does not confer rights on
        the holder in lieu of an endorsement. Rendering a ticked box as a green tick is the category’s
        standard lie; rendering it as a failure would flag most ordinary certificates. So there is a
        third answer.
      </p>

      <div className="c-gap-3" style={{ marginBottom: 'var(--c-space-5)' }}>
        <StatusPill state="meets" asOf={today} />
        <StatusPill state="asserted_only" asOf={today} />
        <StatusPill state="gap" asOf={today} />
      </div>

      <CoverageBar
        segments={[
          { state: 'meets', width: 46 },
          { state: 'expiring', width: 14 },
          { state: 'gap', width: 40 },
        ]}
        ariaLabel="A sample coverage bar: in force, then expiring, then no certificate on record."
        axis={['Jan', 'Jun', 'Dec']}
      />
      <CoverageLegend states={['meets', 'expiring', 'gap']} />

      <Disclaimer of="primary" />
    </main>
  );
}
