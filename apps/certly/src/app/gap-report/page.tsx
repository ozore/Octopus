import Link from 'next/link';

import { Disclaimer } from '@/components/Disclaimer';
import { getEnv } from '@/env';
import { DEMO_SAMPLES, RETENTION_TERMS } from '@/lib/gap-report';

import { GapReportForm } from './GapReportForm';

export const dynamic = 'force-dynamic';

/**
 * `/gap-report` — `specs/15` §2, §3, and **the launch gate**.
 *
 * THE GATE IS A FOUNDER'S LEGAL READ, NOT AN ENGINEERING DECISION
 * (`offer/RESEARCH.md` §7, REVIEW.md B-07 §2.6). This is the one surface where
 * the product holds a third party's documents with no contract and no
 * relationship, so until that read lands:
 *
 *   - the page runs **the samples-only demo** and accepts nothing from anyone;
 *   - the report itself sits behind **a waitlist line, not an upload box**.
 *
 * Both states have exactly one call to action (REVIEW.md MJ-04). The flag is
 * `GAP_REPORT_UPLOADS_ENABLED` and it defaults to false, because the failure
 * mode of the wrong default is holding somebody else's insurance documents.
 *
 * When it is open, the RETENTION TERMS render as body text adjacent to the drop
 * zone, before a file is chosen — not behind a link, not in a collapsed
 * element (A7c, `offer/RESEARCH.md` §7's own condition).
 */
export default function GapReportPage() {
  const env = getEnv();
  const open = env.GAP_REPORT_UPLOADS_ENABLED === true;

  return (
    <main className="c-main">
      <div style={{ maxWidth: '42rem', margin: '2rem auto' }}>
        <header className="c-page__head">
          <div>
            <h1 className="c-page__title">A free gap report on your vendors’ certificates</h1>
            <p className="c-page__lede">
              {env.APP_NAME} reads certificates of insurance and tells you which have expired, which fall
              short of an ordinary requirement, and which only <em>claim</em> the endorsements they need.
              You keep the report whether or not you ever sign up.
            </p>
          </div>
        </header>

        {open ? (
          <>
            {/* A7c — body text, adjacent to the drop zone, before a file is
                chosen. Not a link, not a disclosure triangle. */}
            <section className="c-note" data-testid="retention-terms">
              <p>
                {RETENTION_TERMS.map((sentence) => (
                  <span key={sentence}>{sentence} </span>
                ))}
              </p>
            </section>
            <GapReportForm />
          </>
        ) : (
          <>
            <section className="c-card" data-testid="gap-report-waitlist">
              <div className="c-card__head">
                <h2 className="c-card__title">Not open yet</h2>
              </div>
              <p>
                We are not accepting other people’s insurance documents until our own legal read is
                finished. Want it run on your own certificates? Join the list and we will write to you
                once — not before.
              </p>
              <p className="c-small c-muted">
                In the meantime, watch it read three certificates we wrote for the purpose. Nothing is
                uploaded and nothing is stored.
              </p>
              <p>
                <Link className="c-btn c-btn--primary" href="/gap-report/demo" data-testid="demo-cta">
                  See it read a certificate
                </Link>
              </p>
            </section>

            <section className="c-card">
              <div className="c-card__head">
                <h3 className="c-card__title">The three samples</h3>
              </div>
              <ul>
                {DEMO_SAMPLES.map((sample) => (
                  <li key={sample.slug}>
                    <Link href={`/gap-report/demo/${sample.slug}`}>{sample.label}</Link> — {sample.teaser}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}

        {/* Surface 11 of the eleven (KB §F.4): the Free Gap Report. */}
        <Disclaimer of="primary" />
        <Disclaimer of="templates" />
      </div>
    </main>
  );
}
