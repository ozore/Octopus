import Link from 'next/link';

import { TrialCta } from '@/components/billing/TrialCta';
import { Disclaimer } from '@/components/Disclaimer';
import { StatusPill } from '@/components/StatusPill';
import { certlyEntitlement } from '@/lib/billing/entitlement';
import { getDb } from '@/lib/db';
import { trackEvent } from '@/lib/events';
import { buildFinding } from '@/lib/onboarding/finding';
import { ensureOnboarding } from '@/lib/onboarding/repo';
import { latestComparison, listVendors } from '@/lib/repos';
import { VENDOR_STATUS } from '@/lib/status';
import { requireOrg } from '@octopus/platform/next';
import { and, desc, eq } from 'drizzle-orm';
import { comparisons } from '@/lib/schema';

export const dynamic = 'force-dynamic';

/**
 * THE FINDING — `specs/11` step 6, A4, A9 and A10.
 *
 * A sentence first, the table second, the disclaimer verbatim beside it, and
 * the trial offered HERE — at the moment the customer has just seen a real gap
 * in their own document — with the card disclosure adjacent to the button.
 */
export default async function FindingPage() {
  const { org } = await requireOrg();
  const db = await getDb();
  const view = await ensureOnboarding(db, org.id);
  const entitlement = await certlyEntitlement(db, org.id);

  const [latest] = await db
    .select({ vendorId: comparisons.vendorId })
    .from(comparisons)
    .where(and(eq(comparisons.orgId, org.id)))
    .orderBy(desc(comparisons.evaluatedAt))
    .limit(1);

  if (!latest) {
    return (
      <main className="c-prose">
        <h1>The finding</h1>
        <p className="notice" data-testid="finding-empty">
          Nothing has been compared yet. <Link href="/onboarding/certificate">Read a certificate</Link>{' '}
          and this page fills itself in.
        </p>
      </main>
    );
  }

  const comparison = await latestComparison(db, org.id, latest.vendorId);
  const vendors = await listVendors(db, org.id, 200);
  const vendor = vendors.find((row) => row.id === latest.vendorId);
  if (!comparison || !vendor) {
    return (
      <main className="c-prose">
        <h1>The finding</h1>
        <p className="notice">That comparison is no longer available.</p>
      </main>
    );
  }

  const row = comparison.comparison;
  const finding = buildFinding(vendor.name, {
    status: row.status,
    evaluationDate: row.evaluationDate,
    gapCount: row.gapCount,
    results: comparison.results,
  });
  const statusState = VENDOR_STATUS[row.status as keyof typeof VENDOR_STATUS];

  // `first_finding_shown` is a UI event and is named as one. It is NOT
  // activation: activation is a fact about the data and is written by the
  // comparison path (`specs/11` §2, §5).
  await trackEvent(db, {
    name: 'first_finding_shown',
    orgId: org.id,
    props: { status: row.status, gaps: row.gapCount },
  });

  return (
    <main className="c-prose">
      <p className="c-xs c-muted">
        <Link href="/onboarding">Your first audit</Link> · step 6 of 6
      </p>

      <h1 data-testid="finding-sentence">{finding.sentence}</h1>
      <p className="c-muted">{finding.nextStep}</p>

      <div className="c-gap-3">
        <StatusPill
          state={statusState}
          word={row.status === 'expired' ? 'Expired' : undefined}
          asOf={row.evaluationDate}
        />
        <span className="c-small c-muted">
          {row.metCount} met · {row.gapCount} gaps · {row.assertedOnlyCount} claimed, not
          evidenced · {row.notCheckedCount} not checked
        </span>
      </div>

      {/* A9: the §F.1 disclaimer, verbatim, adjacent to the finding. */}
      <Disclaimer of="primary" />

      <details data-testid="finding-table">
        <summary className="c-small">Every requirement, row by row</summary>
        <div className="c-table-wrap" style={{ marginTop: 'var(--c-space-3)' }}>
          <table className="c-table">
            <thead>
              <tr>
                <th>Requirement</th>
                <th>State</th>
                <th>What the document says</th>
              </tr>
            </thead>
            <tbody>
              {comparison.results.map((row) => (
                <tr key={row.id}>
                  <td>{row.label}</td>
                  <td>{row.state}</td>
                  <td className="c-table__meta">{row.explanation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <hr className="c-hr" />

      <h2>Want us to check the rest?</h2>
      <p className="c-small">
        Add the others and send them all a request in one go. You are tracking{' '}
        {entitlement.vendorsUsed} of {entitlement.vendorLimit} vendors.
      </p>
      <p className="c-gap-3">
        <Link className="c-btn c-btn--secondary" href="/onboarding/vendors">
          Add the rest
        </Link>
        <Link className="c-btn c-btn--quiet" href="/dashboard">
          Go to the dashboard
        </Link>
      </p>

      {entitlement.row === 'no_subscription' ? (
        <section className="c-card" data-testid="finding-checkout">
          <h2 className="c-card__title">Keep going</h2>
          <p className="c-small c-muted">
            Onboarding is free up to here. Watching every vendor, chasing every renewal and exporting
            the file is the paid part.
          </p>
          <TrialCta tier="standard" returnTo="/dashboard" />
        </section>
      ) : null}

      {view.activatedAt ? (
        <p className="c-xs c-muted" data-testid="activated-stamp">
          First certificate compared {view.activatedAt.toISOString().slice(0, 10)}.
        </p>
      ) : null}
    </main>
  );
}
