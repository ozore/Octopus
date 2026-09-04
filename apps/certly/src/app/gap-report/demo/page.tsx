import Link from 'next/link';

import { getEnv } from '@/env';
import { DEMO_SAMPLES, cachedDemoReport } from '@/lib/gap-report';

import { ReportView } from '../ReportView';

export const dynamic = 'force-dynamic';

/**
 * `/gap-report/demo` — THE SAMPLES-ONLY DEMO. `LANDING_SPEC.md` §8.1.
 *
 * Three certificates **we authored for this purpose** — fictional vendors,
 * fictional insurers, real ISO form numbers — read by the real comparison
 * engine against a real library template. **No model call at request time**,
 * nothing of the visitor's is uploaded, stored or logged beyond an anonymous
 * event, and no account is offered anywhere on the page.
 *
 * It is the hero interaction in the launch state, so it shows the ACTUAL
 * report component rather than a mock-up of one: if the report changes, the
 * demo changes with it, which is the only way a demo stays honest.
 */
export default function GapReportDemoPage() {
  const env = getEnv();
  const report = cachedDemoReport();

  return (
    <main className="c-main">
      <div style={{ maxWidth: '44rem', margin: '2rem auto' }}>
        <p className="notice" data-testid="demo-notice">
          These three certificates were written by {env.APP_NAME} for this demonstration. The vendors,
          insurers and policy numbers are invented; the form numbers are the real ISO ones. Nothing here
          is anybody’s document, and nothing of yours is uploaded.
        </p>

        <nav aria-label="Samples" className="c-remind__schedule">
          {DEMO_SAMPLES.map((sample) => (
            <Link className="c-remind__offset" key={sample.slug} href={`/gap-report/demo/${sample.slug}`}>
              {sample.label} — {sample.teaser}
            </Link>
          ))}
        </nav>

        <ReportView
          report={report}
          appName={env.APP_NAME}
          cta={{ href: '/gap-report', label: 'Run this on your own certificates' }}
        />
      </div>
    </main>
  );
}
