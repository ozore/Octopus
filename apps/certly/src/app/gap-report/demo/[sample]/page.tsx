import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getEnv } from '@/env';
import {
  DEMO_EVALUATION_DATE,
  DEMO_SAMPLES,
  DEMO_TEMPLATE_ID,
  buildGapReport,
  getDemoSample,
} from '@/lib/gap-report';
import { getTemplate, toRequirementSet } from '@/lib/templates';

import { ReportView } from '../../ReportView';

export const dynamic = 'force-dynamic';

/**
 * One sample, on its own — the chip's landing place (`LANDING_SPEC.md` §8.1).
 *
 * The finding is produced by the real engine over the authored payload, so
 * "meets", "expired" and "claimed, not evidenced" are the engine's own verdicts
 * and its own sentences, never copy written to look like output.
 */
export default async function DemoSamplePage({ params }: { params: Promise<{ sample: string }> }) {
  const { sample: slug } = await params;
  const env = getEnv();
  const sample = getDemoSample(slug);
  if (!sample) notFound();

  const template = getTemplate(DEMO_TEMPLATE_ID);
  if (!template) notFound();

  const report = buildGapReport({
    documents: [
      {
        documentId: sample.slug,
        originalFilename: sample.filename,
        insuredNameRead: sample.payload.insured.name.value,
        status: 'ready',
        reason: null,
        payload: sample.payload,
      },
    ],
    requirementSet: toRequirementSet(template),
    templateName: template.label,
    evaluationDate: DEMO_EVALUATION_DATE,
  });

  return (
    <main className="c-main">
      <div style={{ maxWidth: '44rem', margin: '2rem auto' }}>
        <p className="notice" data-testid="demo-notice">
          A certificate {env.APP_NAME} wrote for this demonstration. Fictional vendor, insurer and policy
          number; real ISO form numbers.
        </p>
        <nav aria-label="Samples" className="c-remind__schedule">
          {DEMO_SAMPLES.map((other) => (
            <Link
              className="c-remind__offset"
              key={other.slug}
              href={`/gap-report/demo/${other.slug}`}
              aria-current={other.slug === slug ? 'page' : undefined}
            >
              {other.label}
            </Link>
          ))}
          <Link className="c-remind__offset" href="/gap-report/demo">
            All three
          </Link>
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
