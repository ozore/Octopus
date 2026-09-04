import { eq } from 'drizzle-orm';

import { getEnv } from '@/env';
import { getDb } from '@/lib/db';
import {
  buildGapReport,
  findSessionByToken,
  listSessionDocuments,
  type ReportDocumentInput,
} from '@/lib/gap-report';
import { orgToday, type CoiExtraction, type RequirementSet } from '@/lib/engine';
import { extractions } from '@/lib/schema';

import { ReportView } from '../ReportView';

export const dynamic = 'force-dynamic';

/**
 * `/gap-report/<token>` — processing, then the report. `specs/15` §3.
 *
 * The report is rebuilt from the STORED extraction payloads and the requirement
 * SNAPSHOT taken at session creation, never from the live template library:
 * a report re-opened on day six must say what it said on day one (§8).
 *
 * A10 — a session where nothing could be read gets an honest page and no
 * report artefact. An empty report would be worse than none: it would look
 * like a finding.
 *
 * A7 — after seven days the session is gone, and the page says so and offers a
 * fresh run rather than 404ing on a link somebody kept.
 */
export default async function GapReportSessionPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const env = getEnv();
  const db = await getDb();
  const session = await findSessionByToken(db, token);

  if (!session) {
    return (
      <main className="c-main">
        <section className="c-card" style={{ maxWidth: '34rem', margin: '3rem auto' }} data-testid="gap-report-expired">
          <h1 className="c-page__title">This report has expired</h1>
          <p>
            We keep a free report for seven days and then delete it, along with everything we read to
            make it. That is the promise we made when you sent the files, and this is it being kept.
          </p>
          <p>
            <a className="c-btn c-btn--primary" href="/gap-report">
              Run a fresh one
            </a>
          </p>
        </section>
      </main>
    );
  }

  const documents = await listSessionDocuments(db, session.id);

  if (session.status !== 'ready') {
    return (
      <main className="c-main">
        <section className="c-card" style={{ maxWidth: '34rem', margin: '3rem auto' }} data-testid="gap-report-processing">
          <h1 className="c-page__title">Reading your certificates</h1>
          <p>
            {documents.filter((document) => document.status === 'ready' || document.status === 'needs_review').length} of{' '}
            {documents.length} read so far. You can close this tab — the report is emailed either way.
          </p>
        </section>
      </main>
    );
  }

  const payloads = new Map<string, { payload: CoiExtraction | null; reason: string | null; status: string }>();
  for (const document of documents) {
    const [row] = await db
      .select({ payload: extractions.payload, status: extractions.status, failureReason: extractions.failureReason })
      .from(extractions)
      .where(eq(extractions.gapReportDocumentId, document.id))
      .limit(1);
    payloads.set(document.id, {
      payload: (row?.payload as CoiExtraction | null) ?? null,
      reason: row?.failureReason ?? null,
      status: row?.status ?? document.status,
    });
  }

  const inputs: ReportDocumentInput[] = documents.map((document) => {
    const found = payloads.get(document.id);
    return {
      documentId: document.id,
      originalFilename: document.originalFilename,
      insuredNameRead: document.insuredNameRead,
      status: (found?.status ?? document.status) as ReportDocumentInput['status'],
      reason: found?.reason ?? null,
      payload: found?.payload ?? null,
    };
  });

  const snapshot = (session.requirementsSnapshot ?? null) as RequirementSet | null;
  const report = buildGapReport({
    documents: inputs,
    requirementSet: snapshot ?? { id: 'none', name: 'no template', audience: 'pm', version: 0, requirements: [] },
    templateName: snapshot?.name ?? 'a baseline requirement set',
    evaluationDate: session.readyAt ? orgToday('UTC', session.readyAt) : orgToday('UTC', new Date()),
  });

  if (report.comparedCount === 0) {
    return (
      <main className="c-main">
        <section className="c-card" style={{ maxWidth: '34rem', margin: '3rem auto' }} data-testid="gap-report-unreadable">
          <h1 className="c-page__title">We could not read these well enough to compare them</h1>
          <p>{report.headline}</p>
          <ul>
            {report.uncompared.map((document) => (
              <li key={document.documentId}>
                <strong>{document.filename}</strong> — {document.reason}
              </li>
            ))}
          </ul>
          <p>
            <a className="c-btn c-btn--primary" href="/gap-report">
              Try again with different files
            </a>
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="c-main">
      <div style={{ maxWidth: '44rem', margin: '2rem auto' }}>
        <ReportView
          report={report}
          appName={env.APP_NAME}
          // §2 step 6: ONE call to action, below the finding, after the value
          // has been delivered. No account UI anywhere above it.
          cta={{ href: `/login?gap=${token}`, label: 'Keep these vendors and start tracking them' }}
        />
      </div>
    </main>
  );
}
