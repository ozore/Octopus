import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CoverageBar, CoverageLegend } from '@/components/CoverageBar';
import { Disclaimer } from '@/components/Disclaimer';
import { StatusPill } from '@/components/StatusPill';
import { getVendorActivity } from '@/lib/audit';
import { getDb } from '@/lib/db';
import { orgToday } from '@/lib/engine';
import { trackEvent } from '@/lib/events';
import { buildReviewView } from '@/lib/extract/review';
import { readPdf } from '@/lib/extract/pdf';
import { ensureOrgSettings, loadRequirementSet, resolveRequirementSetId } from '@/lib/repos';
import { comparisonRows, latestComparisons, rosterForScope } from '@/lib/repos/dashboard';
import { vendorNeedsReview } from '@/lib/repos/review-queue';
import { getDocumentStore } from '@/lib/storage/document-store';
import {
  REQUIREMENT_STATUS,
  STATUS_WORD_LONG,
  VENDOR_STATUS,
  vendorWord,
  type RequirementState,
} from '@/lib/status';
import { coverageWindow } from '../coverage-window';
import { ReviewPanel } from '../ReviewPanel';
import { exportVendorAction } from '../../reports/actions';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * ONE VENDOR — `UX.md` S11, `specs/04` A7, `specs/06` §3.
 *
 * The status band, the coverage bar, the requirement set that applies, the
 * comparison result row by row with the engine's own sentence, M4's review
 * panel when a document is still in question, and the activity log.
 *
 * THE SENTENCES ARE THE ENGINE'S, NOT THIS PAGE'S. `explanation` is generated
 * once, stored with the comparison and printed here, in the report and in the
 * CSV. A screen that re-phrases the engine is a screen that will one day
 * disagree with the PDF a customer forwarded.
 *
 * Surface 3 of the eleven (KB §F.4): the vendor detail renders a status, so it
 * renders the §F.1 disclaimer.
 */

const STATE_ORDER: RequirementState[] = ['gap', 'undetermined', 'asserted_only', 'not_checked', 'met'];

export default async function VendorDetailPage({ params }: { params: Promise<{ vendorId: string }> }) {
  const { vendorId } = await params;
  const { org, user } = await requireOrg();
  const db = await getDb();

  const [vendor] = await rosterForScope(db, { orgId: org.id, filter: { vendorIds: [vendorId] } });
  // A cross-org read returns nothing, and nothing is a 404 (`specs/01` A6).
  if (!vendor) notFound();

  const settings = await ensureOrgSettings(db, org.id);
  const today = orgToday(settings.timezone, new Date());

  await trackEvent(db, {
    name: 'vendor_opened_from_dashboard',
    orgId: org.id,
    userId: user.id,
    props: { status: vendor.status },
  });

  const latest = await latestComparisons(db, org.id, [vendorId]);
  const comparison = latest.get(vendorId) ?? null;
  const rows = comparison ? await comparisonRows(db, [comparison.comparisonId]) : [];
  const band = coverageWindow({
    status: vendor.status,
    earliestRequiredExpiry: vendor.earliestRequiredExpiry,
    today,
    vendorName: vendor.name,
  });
  const activity = await getVendorActivity(db, { orgId: org.id, vendorId, limit: 20 });

  const setId = await resolveRequirementSetId(db, org.id, vendorId);
  const requirementSet = setId ? await loadRequirementSet(db, org.id, setId) : null;

  // M4's review panel, built through its documented contract. It is embedded
  // ONLY when the newest reading is still in question — the case where a person
  // is being asked to look. The page texts are re-read from the stored document
  // so the quote-gate sentences are the real ones; if the object cannot be read
  // the panel still renders and the gate says, honestly, that it could not
  // check.
  const waiting = await vendorNeedsReview(db, org.id, vendorId);
  let reviewView = null;
  if (waiting) {
    let pageTexts: string[] = [];
    try {
      const bytes = await getDocumentStore().get(waiting.storageKey);
      pageTexts = (await readPdf(bytes)).pageTexts;
    } catch {
      pageTexts = [];
    }
    reviewView = buildReviewView({
      extractionId: waiting.extractionId,
      documentId: waiting.documentId,
      status: 'needs_review',
      payload: waiting.payload,
      pageTexts,
      requirementSet,
      vendorName: vendor.name,
    });
  }

  const byState = STATE_ORDER.map((state) => ({ state, rows: rows.filter((row) => row.state === state) })).filter(
    (group) => group.rows.length > 0,
  );

  return (
    <main>
      <header className="c-page__head">
        <div>
          <h1 className="c-page__title">{vendor.name}</h1>
          <p className="c-page__lede">
            {vendor.legalName && vendor.legalName !== vendor.name ? `${vendor.legalName} · ` : ''}
            {vendor.vendorTypeLabel ?? 'no vendor type'} ·{' '}
            {requirementSet ? `${requirementSet.name} v${requirementSet.version}` : 'no requirement set applies yet'}
          </p>
        </div>
        <StatusPill state={VENDOR_STATUS[vendor.status]} word={vendorWord(vendor.status)} asOf={today} />
      </header>

      <p className="c-gap-3">
        <Link className="c-btn c-btn--quiet" href="/dashboard">
          ← Coverage
        </Link>
        <form action={exportVendorAction}>
          <input type="hidden" name="vendorId" value={vendorId} />
          <input type="hidden" name="format" value="pdf" />
          <button className="c-btn c-btn--secondary c-btn--sm" type="submit" data-testid="export-vendor">
            Export this vendor’s gap report
          </button>
        </form>
      </p>

      <section className="c-card">
        <div className="c-card__head">
          <h2 className="c-card__title">On record</h2>
          <span className="c-asof">
            as of <time dateTime={today}>{today}</time>
          </span>
        </div>
        <CoverageBar
          segments={band.segments}
          ariaLabel={band.ariaLabel}
          todayAt={band.todayAt}
          axis={band.axis}
          testId="vendor-bar"
        />
        <CoverageLegend states={[...new Set(band.segments.map((segment) => segment.state))]} />
        <p className="c-small c-muted">
          A gap is drawn as a hole rather than as a red block, because a gap is the absence of cover on
          the record and “here is nothing” is the true statement.
        </p>
      </section>

      {comparison ? (
        <section className="c-card" data-testid="comparison">
          <div className="c-card__head">
            <h2 className="c-card__title">What the certificate evidences</h2>
            <span className="c-xs c-muted">
              {comparison.metCount} met · {comparison.gapCount} gaps · {comparison.assertedOnlyCount}{' '}
              claimed, not evidenced · {comparison.undeterminedCount} needs review ·{' '}
              {comparison.notCheckedCount} not checked
            </span>
          </div>
          {byState.map((group) => (
            <div key={group.state} data-testid={`results-${group.state}`}>
              <h3 className="c-card__title">{STATUS_WORD_LONG[REQUIREMENT_STATUS[group.state]]}</h3>
              <ul className="c-list-reset c-stack">
                {group.rows.map((row) => (
                  <li key={row.requirementId} className="c-report__finding">
                    <strong>{row.label}</strong>
                    {row.severity === 'advisory' ? <span className="badge"> advisory</span> : null}
                    <br />
                    {row.explanation}
                    {row.foundRaw ? (
                      <>
                        {' '}
                        <span className="c-mono">printed: {row.foundRaw}</span>
                      </>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="c-xs c-muted" data-testid="comparison-provenance">
            Compared on {comparison.evaluationDate} against requirement set version{' '}
            {comparison.requirementSetVersion}, engine {comparison.engineVersion}.
          </p>
        </section>
      ) : (
        <section className="c-card" data-testid="no-comparison">
          <div className="c-card__head">
            <h2 className="c-card__title">Nothing compared yet</h2>
          </div>
          <p className="c-small c-muted">
            Certly has no certificate on record for {vendor.name}, so there is nothing to compare. That is
            a finding, not an error — it is the one this product exists to surface first.
          </p>
        </section>
      )}

      {reviewView && waiting ? <ReviewPanel view={reviewView} documentId={waiting.documentId} /> : null}

      <section className="c-card">
        <div className="c-card__head">
          <h2 className="c-card__title">Activity</h2>
        </div>
        {activity.length === 0 ? (
          <p className="c-small c-muted">Nothing has happened on this vendor yet.</p>
        ) : (
          <ul className="c-list-reset c-small c-stack">
            {activity.map((event) => (
              <li key={event.id}>
                <span className="c-date">{event.createdAt.toISOString().slice(0, 10)}</span> {event.summary}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Surface 3 of the eleven (KB §F.4). */}
      <Disclaimer of="primary" />
    </main>
  );
}
