import { CoverageBar, CoverageLegend, PortfolioStrip } from '@/components/CoverageBar';
import { Disclaimer } from '@/components/Disclaimer';
import { StatusDot, StatusPill } from '@/components/StatusPill';
import { STATUS_STATES, STATUS_WORD, type StatusState } from '@/lib/status';

export const dynamic = 'force-dynamic';

/**
 * THE IDENTITY REFERENCE — the running copy of `identity/samples.html`.
 *
 * `identity/samples.html` is a static gallery that a designer opens; this is
 * the same seven states rendered by the COMPONENTS THE PRODUCT ACTUALLY USES,
 * from the same `design-system.css`. The difference matters: a gallery can
 * agree with the tokens while the app quietly disagrees with both. Here, if the
 * pill drifts, this page drifts with it and the Playwright spec fails.
 *
 * It is also the fixture page for `e2e/identity.spec.ts`, which asserts that
 * all seven pills render with a word AND a glyph, that the coverage bar draws
 * the gap as a hole rather than a block, and that the disclaimer is present
 * wherever a status is.
 *
 * Keep it public and keep it boring. It costs nothing, it is the fastest way
 * for a reviewer to see the four-signal encoding in a browser, and it is the
 * first thing to check when somebody says "the statuses look wrong".
 */

const AS_OF = '2026-09-03';

const SAMPLE_DETAIL: Partial<Record<StatusState, string>> = {
  expiring: '9d',
};

export default function DesignReferencePage() {
  return (
    <main className="c-prose" style={{ maxWidth: 'var(--c-content-max)' }}>
      <h1>Status reference</h1>
      <p className="c-muted">
        Seven states. Each one carries a <strong>word</strong>, a <strong>glyph</strong>, a{' '}
        <strong>fill pattern</strong> and a <strong>hue</strong> — never fewer than four, because the
        four chromatic fills sit within 1.47:1 of each other in greyscale and colour therefore cannot
        be the carrier of meaning. A photocopied gap report still reads.
      </p>

      <section className="c-card">
        <div className="c-card__head">
          <h2 className="c-card__title">Pills</h2>
          <span className="c-asof">
            as of <time dateTime={AS_OF}>{AS_OF}</time>
          </span>
        </div>
        <div className="c-gap-3" data-testid="status-pill-set">
          {STATUS_STATES.map((state) => (
            <StatusPill key={state} state={state} detail={SAMPLE_DETAIL[state]} asOf={null} />
          ))}
        </div>
        <p className="c-xs c-muted" style={{ marginTop: 'var(--c-space-4)' }}>
          The green state is <strong>Meets requirements</strong>. “Covered” is not a status word in this
          product: it appears in no pill, no counter, no export column, no email and no engine value.
        </p>
      </section>

      <section className="c-card">
        <div className="c-card__head">
          <h2 className="c-card__title">Dots</h2>
        </div>
        <div className="c-gap-3">
          {STATUS_STATES.map((state) => (
            <StatusDot key={state} state={state} label={STATUS_WORD[state]} />
          ))}
        </div>
        <p className="c-xs c-muted" style={{ marginTop: 'var(--c-space-4)' }}>
          A dot is never alone. Colour without a word is a claim nobody can read in greyscale.
        </p>
      </section>

      <section className="c-card">
        <div className="c-card__head">
          <h2 className="c-card__title">The coverage bar</h2>
        </div>
        <p className="c-small c-muted">
          A band of time. The gap is <strong>drawn as a hole</strong> — an outlined opening rather than
          a red block — because a gap is the absence of cover, and a hole is the true shape of that.
        </p>
        <CoverageBar
          segments={[
            { state: 'meets', width: 34 },
            { state: 'asserted_only', width: 14 },
            { state: 'expiring', width: 13 },
            { state: 'gap', width: 15 },
            { state: 'not_checked', width: 10 },
            { state: 'no_certificate', width: 8 },
            { state: 'needs_review', width: 6 },
          ]}
          ariaLabel="General liability: in force from 1 January to 12 September 2026, a claimed but unevidenced stretch, then expiring, then a gap, then not checked, then no certificate on record, then a period under review."
          todayAt={48}
          axis={['Jan 2026', 'Jun 2026', 'Dec 2026']}
          testId="coverage-bar-all-states"
        />
        <CoverageLegend states={[...STATUS_STATES]} />
      </section>

      <section className="c-card">
        <div className="c-card__head">
          <h2 className="c-card__title">The portfolio strip</h2>
          <span className="c-xs c-muted">the only chart in the product</span>
        </div>
        <PortfolioStrip
          counts={[
            { state: 'gap', count: 7, label: 'with a gap' },
            { state: 'expiring', count: 6, label: 'expiring within 30 days' },
            { state: 'asserted_only', count: 3, label: 'claimed but not evidenced' },
            { state: 'needs_review', count: 3, label: 'needing review' },
            { state: 'meets', count: 28, label: 'meeting requirements' },
          ]}
          ariaLabel="Of 47 vendors: 28 meet requirements, 6 expiring within 30 days, 7 with a gap, 3 claimed but not evidenced, 3 needing review."
        />
      </section>

      <section className="c-card">
        <div className="c-card__head">
          <h2 className="c-card__title">The three disclaimers</h2>
        </div>
        <Disclaimer of="primary" />
        <Disclaimer of="templates" />
        <Disclaimer of="extracted_fields" />
      </section>
    </main>
  );
}
