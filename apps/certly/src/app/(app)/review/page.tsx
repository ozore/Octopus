import Link from 'next/link';

import { Disclaimer } from '@/components/Disclaimer';
import { StatusPill } from '@/components/StatusPill';
import { getDb } from '@/lib/db';
import { orgToday } from '@/lib/engine';
import { trackEvent } from '@/lib/events';
import { ensureOrgSettings } from '@/lib/repos';
import { reviewQueue } from '@/lib/repos/review-queue';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * THE NEEDS-REVIEW QUEUE — `specs/06` A8.
 *
 * Oldest first, because a queue sorted newest-first is a queue whose tail is
 * never worked. The depth is a badge on the dashboard; this is the list.
 *
 * WHY THESE ROWS MATTER MORE THAN THEY LOOK. A vendor whose only certificate is
 * sitting here counts as **No certificate** on the dashboard and in every
 * report, and appears in no green count (`specs/06` §8) — an unreviewed reading
 * must never colour a vendor green. So this queue is not a tidy-up list; it is
 * the difference between a count that is honest and a count that is early.
 *
 * The individual reading screen is M4's (`/review/[documentId]`). This page is
 * the queue in front of it.
 */

export default async function ReviewQueuePage() {
  const { org, user } = await requireOrg();
  const db = await getDb();
  const settings = await ensureOrgSettings(db, org.id);
  const today = orgToday(settings.timezone, new Date());
  const queue = await reviewQueue(db, org.id, { limit: 100 });

  await trackEvent(db, {
    name: 'review_queue_opened',
    orgId: org.id,
    userId: user.id,
    props: { depth: queue.length },
  });

  return (
    <main>
      <header className="c-page__head">
        <div>
          <h1 className="c-page__title">Read, but not confident enough to compare</h1>
          <p className="c-page__lede">
            {queue.length} {queue.length === 1 ? 'document' : 'documents'} waiting for a person, oldest
            first. Until one is accepted, its vendor counts as “No certificate” — nothing is coloured
            green before somebody has looked.
          </p>
        </div>
        <span className="c-asof">
          as of <time dateTime={today}>{today}</time>
        </span>
      </header>

      {queue.length === 0 ? (
        <section className="c-empty" data-testid="review-empty">
          <p className="c-empty__title">Nothing is waiting.</p>
          <p className="c-muted">
            Every document Certly has read was confident enough to compare. Anything it could not read at
            all is on the vendor’s own page, with the reason.
          </p>
        </section>
      ) : (
        <section className="c-card">
          <div className="c-table-wrap">
            <table className="c-table">
              <thead>
                <tr>
                  <th>Uploaded</th>
                  <th>Vendor</th>
                  <th>Document</th>
                  <th>Why a person has to look</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((item) => (
                  <tr key={item.extractionId} data-testid="review-row">
                    <td className="c-date">{item.uploadedAt.toISOString().slice(0, 10)}</td>
                    <td className="c-table__party">
                      {item.vendorId ? (
                        <Link href={`/dashboard/${item.vendorId}`}>{item.vendorName}</Link>
                      ) : (
                        <span className="c-muted">not matched to a vendor yet</span>
                      )}
                    </td>
                    <td className="c-mono c-xs">
                      <Link href={`/review/${item.documentId}`}>{item.documentLabel}</Link>
                    </td>
                    <td className="c-table__meta">{item.reason}</td>
                    <td>
                      <StatusPill state="needs_review" asOf={today} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Disclaimer of="primary" />
    </main>
  );
}
