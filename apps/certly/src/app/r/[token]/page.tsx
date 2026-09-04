import { notFound } from 'next/navigation';

import { ReportView } from '../../(app)/reports/ReportView';
import { getDb } from '@/lib/db';
import { trackEvent } from '@/lib/events';
import { resolveShare } from '@/lib/reports';

export const dynamic = 'force-dynamic';

/**
 * THE SHARED REPORT — `specs/12` §5, §8, A6, A7, A12.
 *
 * NO APP CHROME, NO LOGIN, NO NAVIGATION. This route sits outside the `(app)`
 * group on purpose: it must render for a stranger — an owner, a lender, an
 * insurer — with a link and nothing else, and it must expose ONLY the report's
 * content. Nothing on this page reads live data: it renders the stored
 * snapshot, so what a reader sees in June is what the sender saw in March.
 *
 * A REVOKED LINK AND AN EXPIRED LINK ANSWER IDENTICALLY (A7). A distinct
 * "revoked" page would tell whoever holds the link that it was once real and
 * that somebody took it away, which is more than a stranger is owed.
 *
 * The §F.1 disclaimer is inside `ReportView`, which is surface 8 of the eleven
 * (KB §F.4, REVIEW.md MJ-06): a report that travels away from the app carries
 * its own limits.
 */

export default async function SharedReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = await getDb();
  const resolved = await resolveShare(db, token);
  if (!resolved) notFound();

  await trackEvent(db, {
    name: 'report_share_opened',
    orgId: resolved.report.orgId,
    props: { unique_viewers: 1 },
  });

  return (
    <main style={{ margin: '0 auto', maxWidth: 'var(--c-measure-wide, 900px)', padding: 'var(--c-space-6)' }}>
      <ReportView snapshot={resolved.snapshot} />
      <p className="c-xs c-muted">
        This is a read-only copy of a Certly gap report. It expires, and the organisation that generated
        it can revoke it at any time.
      </p>
    </main>
  );
}
