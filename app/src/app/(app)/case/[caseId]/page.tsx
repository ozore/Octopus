/**
 * `/case/{caseId}` — where this case actually is.
 *
 * Spec: USER_JOURNEY.md §4 (the canonical state machine this screen renders),
 * §2 (J2 — the rejected-appeal recovery), S8/S9/S10/S12/S13.
 *
 * THE STATE DIAGRAM IS THE SCREEN. Every node below is one state from
 * USER_JOURNEY §4, in its order, and the case renders exactly one position in
 * it. Two properties of that diagram show up here as design decisions rather
 * than as data:
 *
 *  - `Escalated` is reachable from two different places — a first-pass
 *    classification failure and the post-rejection guarantee — and both converge
 *    on the same /ops surface and the same copy here. Deliberate: a seller
 *    escalated after a rejection must not feel they are on a second-tier
 *    recovery path (§4, reading notes).
 *
 *  - `Revising` and `Escalated → HumanQueued` are structurally distinct. A
 *    revision asks the machine to try again; an escalation moves the case to a
 *    person. Conflating them in the UI would understate what the outcome
 *    guarantee actually delivers.
 *
 * AND THE REJECTION IS NOT RENDERED IN RED. It is the worst moment in the arc,
 * which is exactly why: the design job at that moment is "this is not the end of
 * the road", and red says the opposite (DESIGN_SYSTEM P4.2). Caution tone, with
 * the guarantee immediately adjacent and the safe next step pre-surfaced rather
 * than something the seller has to remember from eleven days ago (Nielsen #6).
 */

import { notFound } from 'next/navigation';

import { reportOutcome, requestHumanReview } from '@/app/_lib/actions';
import { getCase, type CaseRecord } from '@/app/_lib/case-store';
import { StatusPill, type PillTone } from '@/components/StatusPill';
import { StatusTimeline, type TimelineNode } from '@/components/StatusTimeline';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Your case — Clausewright' };

function headline(record: CaseRecord): { title: string; tone: PillTone; pill: string } {
  switch (record.status) {
    case 'reinstated':
      return { title: 'You are back online', tone: 'accent', pill: 'Reinstated' };
    case 'escalated':
    case 'human_queued':
      return { title: 'A reviewer is on your case', tone: 'caution', pill: 'Needs a person' };
    case 'human_reviewed':
      return { title: 'Your reviewer has returned the draft', tone: 'accent', pill: 'Reviewed' };
    case 'decision_pending':
      return { title: 'Submitted — now you wait', tone: 'caution', pill: 'Awaiting decision' };
    case 'delivered':
      return { title: 'Your document is ready to submit', tone: 'accent', pill: 'Draft ready' };
    case 'preview_ready':
      return { title: 'Your preview is ready to read', tone: 'neutral', pill: 'Preview ready' };
    case 'failed':
      return { title: 'Something on our side stopped', tone: 'danger', pill: 'System failure' };
    default:
      return { title: 'Your case is in progress', tone: 'neutral', pill: 'Working' };
  }
}

function timeline(record: CaseRecord): TimelineNode[] {
  const nodes: TimelineNode[] = [];
  const escalated = Boolean(record.escalation);
  const resolved = Boolean(record.escalation?.resolvedAt);

  nodes.push({
    id: 'intake',
    label: 'You pasted your notice.',
    detail: new Date(record.createdAt).toLocaleString(),
    state: 'done',
  });

  nodes.push({
    id: 'classified',
    label: record.classification
      ? `We read it — this is a ${record.classification.plainEnglish.toLowerCase()} case.`
      : escalated
        ? 'This one needs a person.'
        : 'Reading your notice…',
    detail: record.classification?.code ?? record.escalation?.detail ?? null,
    state: record.classification ? 'done' : escalated ? 'blocked' : 'active',
  });

  if (escalated) {
    nodes.push({
      id: 'queued',
      label: record.escalation?.claimedBy
        ? 'A reviewer has your case.'
        : 'Queued for an experienced appeal writer.',
      detail: record.escalation?.claimedBy
        ? 'They edit the same document, in the same tool, under the same citation rule.'
        : 'Same business day — a realistic expectation, not a countdown.',
      state: resolved ? 'done' : record.escalation?.claimedBy ? 'active' : 'pending',
    });
    if (resolved) {
      nodes.push({
        id: 'reviewed',
        label: 'Your reviewer returned the draft.',
        detail: record.escalation?.resolution ?? null,
        state: 'done',
      });
    }
  }

  nodes.push({
    id: 'preview',
    label: record.sections
      ? 'Your clause and critique were on screen before you paid anything.'
      : 'Draft your Plan of Action',
    state: record.sections ? 'done' : 'pending',
  });

  nodes.push({
    id: 'paid',
    label: record.payment ? 'You chose a tier.' : 'Choose a tier when you are ready.',
    detail: record.payment
      ? `${record.payment.tier === 'rescue_human' ? 'Rescue + Human' : 'Rescue'} — payment recorded, awaiting Stripe confirmation`
      : null,
    state: record.payment ? 'done' : 'pending',
  });

  nodes.push({
    id: 'submitted',
    label: record.submittedAt
      ? 'You submitted it yourself.'
      : 'Submit it yourself, when you have read it through.',
    detail: record.submittedAt
      ? new Date(record.submittedAt).toLocaleString()
      : 'We never log into your account and never submit on your behalf.',
    state: record.submittedAt ? 'done' : 'pending',
  });

  nodes.push({
    id: 'decision',
    label:
      record.decision === 'reinstated'
        ? 'Reinstated.'
        : record.decision === 'rejected'
          ? 'Rejected — your human review is free.'
          : record.submittedAt
            ? 'Waiting on a decision…'
            : 'A decision, in roughly 3 to 30 days.',
    detail:
      record.decision === 'rejected'
        ? 'This is what the outcome guarantee is for. It was written for exactly this moment.'
        : record.submittedAt && !record.decision
          ? 'Neither marketplace publishes a service level for appeals. We will ask you at day 3, 10 and 21.'
          : null,
    state:
      record.decision === 'reinstated'
        ? 'done'
        : record.decision === 'rejected'
          ? 'blocked'
          : record.submittedAt
            ? 'active'
            : 'pending',
  });

  return nodes;
}

export default async function CasePage({ params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;
  const record = await getCase(caseId);
  if (!record) notFound();

  const head = headline(record);
  const rejected = record.decision === 'rejected';

  return (
    <div className="cw-screen">
      <div className="cw-screen__head">
        <span className="cw-screen__eyebrow">Your case</span>
        <h1 className="cw-screen__title">{head.title}</h1>
        <div className="cw-screen__meta">
          <StatusPill tone={head.tone}>{head.pill}</StatusPill>
          <span className="cw-chip cw-chip--code">{record.id}</span>
          {record.classification ? (
            <span className="cw-chip cw-chip--code">{record.classification.code}</span>
          ) : null}
        </div>
      </div>

      {/* S9 — the guarantee, surfaced automatically rather than remembered.
          Green, because green means the way back online (DESIGN_SYSTEM P4.3). */}
      {rejected ? (
        <section className="cw-card cw-mat-0 cw-card--accent" aria-labelledby="guarantee-title">
          <div className="cw-card__header">
            <h2 className="cw-card__title" id="guarantee-title">
              Your first submission was rejected, so your human review is free
            </h2>
          </div>
          <div className="cw-card__body">
            <p className="cw-ink-2">
              This is not the end of the road, and it is not a favour you have to argue for — it is
              the guarantee you already have. An experienced appeal writer takes the case, edits the
              same document in the same tool under the same citation rule, and you review what they
              changed and why before you resubmit.
            </p>
            <form action={requestHumanReview} className="cw-actions">
              <input type="hidden" name="caseId" value={record.id} />
              <button className="cw-btn cw-btn--secondary" type="submit">
                <span className="cw-btn__label">Send it to a reviewer — free</span>
              </button>
              <span className="cw-btn__reason">
                Same business day. Nothing is charged, and nothing is submitted for you.
              </span>
            </form>
          </div>
        </section>
      ) : null}

      <div className="cw-case__grid">
        <section className="cw-card cw-mat-0" aria-labelledby="timeline-title">
          <div className="cw-card__header">
            <h2 className="cw-card__title" id="timeline-title">
              Where this case is
            </h2>
          </div>
          <StatusTimeline nodes={timeline(record)} label="Case status" />
        </section>

        <div className="cw-stack cw-stack--loose">
          <section className="cw-card cw-mat-0" aria-labelledby="facts-title">
            <div className="cw-card__header">
              <h2 className="cw-card__title" id="facts-title">
                The facts of this case
              </h2>
            </div>
            <dl className="cw-facts">
              <div className="cw-facts__row">
                <dt className="cw-facts__k">Case</dt>
                <dd className="cw-facts__v cw-facts__v--code">{record.id}</dd>
              </div>
              <div className="cw-facts__row">
                <dt className="cw-facts__k">Marketplace</dt>
                <dd className="cw-facts__v">{record.marketplace}</dd>
              </div>
              <div className="cw-facts__row">
                <dt className="cw-facts__k">Reason code</dt>
                <dd className="cw-facts__v cw-facts__v--code">
                  {record.classification?.code ?? 'not established'}
                </dd>
              </div>
              <div className="cw-facts__row">
                <dt className="cw-facts__k">Opened</dt>
                <dd className="cw-facts__v">{new Date(record.createdAt).toLocaleString()}</dd>
              </div>
            </dl>
            <div className="cw-card__footer cw-actions">
              {record.sections ? (
                <a className="cw-btn cw-btn--secondary" href={`/case/${record.id}/plan`}>
                  <span className="cw-btn__label">Open the document</span>
                </a>
              ) : (
                <a className="cw-btn cw-btn--secondary" href={`/appeal/${record.id}`}>
                  <span className="cw-btn__label">Back to the preview</span>
                </a>
              )}
              {/* USER_JOURNEY §8.7 — the human backstop is never behind a menu. */}
              {!record.escalation ? (
                <form action={requestHumanReview}>
                  <input type="hidden" name="caseId" value={record.id} />
                  <button className="cw-btn cw-btn--quiet cw-btn--sm" type="submit">
                    <span className="cw-btn__label">Have a person look at this</span>
                  </button>
                </form>
              ) : null}
            </div>
          </section>

          {/* S12 — the outcome report. Consent-gated upstream; declining never
              degrades service, and this asks for one click, not a survey. */}
          {record.submittedAt && !record.decision ? (
            <section className="cw-card cw-mat-0" aria-labelledby="outcome-title">
              <div className="cw-card__header">
                <h2 className="cw-card__title" id="outcome-title">
                  Heard anything back?
                </h2>
              </div>
              <div className="cw-card__body">
                <p className="cw-ink-2">
                  One click. We ask because what actually happened is the only thing that makes the
                  next seller&rsquo;s draft better — and because we would rather hear it from you
                  than guess.
                </p>
                <div className="cw-actions">
                  {(
                    [
                      ['reinstated', 'Reinstated'],
                      ['rejected', 'Rejected'],
                      ['no_response', 'Nothing yet'],
                    ] as const
                  ).map(([value, label]) => (
                    <form action={reportOutcome} key={value}>
                      <input type="hidden" name="caseId" value={record.id} />
                      <input type="hidden" name="decision" value={value} />
                      <button className="cw-btn cw-btn--secondary cw-btn--sm" type="submit">
                        <span className="cw-btn__label">{label}</span>
                      </button>
                    </form>
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {/* S13 — the peak. Acknowledged, with no new form at the best moment. */}
          {record.decision === 'reinstated' ? (
            <section className="cw-card cw-mat-0 cw-card--accent" aria-labelledby="peak-title">
              <div className="cw-card__header">
                <h2 className="cw-card__title" id="peak-title">
                  That is the one that matters
                </h2>
              </div>
              <div className="cw-card__body">
                <p className="cw-ink-2">
                  Nothing to do here. Shield is already covering you for the rest of the included 30
                  days, and the decision about whether to keep it comes later, once you have had a
                  chance to see whether it earned it.
                </p>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
