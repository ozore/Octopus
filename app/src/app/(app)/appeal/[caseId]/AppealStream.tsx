'use client';

/**
 * S2 → S3 → S4: the narrated wait, the cited preview, and the paywall.
 *
 * Spec: USER_JOURNEY.md §6 (this is the highest-risk UX surface in the product),
 * §1.4 (the differentiator must be complete and legible BEFORE payment or the
 * primary experiment A4 is confounded), DESIGN_SYSTEM.md §8.3.
 *
 * FOUR THINGS THIS COMPONENT DOES THAT A SPINNER WOULD NOT:
 *
 *  1. It narrates REAL checkpoints. Each node advances on an event the pipeline
 *     genuinely emitted, because control flow lives in code rather than in an
 *     agent's loop (D9/I1). There is no synthetic percentage anywhere here, and
 *     DESIGN_SYSTEM §8.4 rules one out by name — a fake progress bar is a status
 *     claim, and a false one.
 *
 *  2. It has a `slow` state, and it is not optional. USER_JOURNEY §6.4 names
 *     silence during a stalled stage "the single highest-risk micro-interaction
 *     in the product", so an active node that has not moved in
 *     `SLOW_AFTER_MS` says so, in the words that section specifies, rather than
 *     spinning quietly.
 *
 *  3. It fills the wait with reading rather than motion. As soon as the clause
 *     and the critique arrive they are on screen, free, complete — several of
 *     the waiting minutes then pass productively.
 *
 *  4. It reconnects without restarting. The stream is keyed by case id on the
 *     server, so a reload replays the buffer instead of re-billing three model
 *     calls (Twelve-Factor IX — "the seller will not paste twice").
 */

import { useEffect, useRef, useState } from 'react';

import { CitationChip } from '@/components/CitationChip';
import { CritiquePanel } from '@/components/CritiquePanel';
import { EscalationCard } from '@/components/EscalationCard';
import { PaywallTiers } from '@/components/PaywallTiers';
import { StatusPill } from '@/components/StatusPill';
import { StatusTimeline, type TimelineNode, type TimelineNodeState } from '@/components/StatusTimeline';
import {
  BLOCKED_LABEL,
  SLOW_AFTER_MS,
  SLOW_LABEL,
  STAGE_KEYS,
  STAGE_LABELS,
  type PreviewPayload,
  type ProgressEvent,
  type StageKey,
} from '@/app/_lib/progress';

type StageState = { state: TimelineNodeState; detail?: string };

const INITIAL: Record<StageKey, StageState> = {
  read: { state: 'pending' },
  identify: { state: 'pending' },
  clause: { state: 'pending' },
  draft: { state: 'pending' },
  check: { state: 'pending' },
};

function labelFor(key: StageKey, state: TimelineNodeState): string {
  if (state === 'slow') return SLOW_LABEL;
  if (state === 'blocked') return BLOCKED_LABEL;
  if (state === 'failed') return STAGE_LABELS[key].active;
  return STAGE_LABELS[key][state === 'done' ? 'done' : state === 'active' ? 'active' : 'pending'];
}

export function AppealStream({
  caseId,
  startCheckout,
  requestHumanReview,
  timeGuaranteeAdvertised,
}: {
  caseId: string;
  startCheckout: (formData: FormData) => void | Promise<void>;
  requestHumanReview: (formData: FormData) => void | Promise<void>;
  timeGuaranteeAdvertised: boolean;
}) {
  const [stages, setStages] = useState<Record<StageKey, StageState>>(INITIAL);
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [escalation, setEscalation] = useState<
    { detail: string; disposition: 'human_tier' | 'refer_out' } | null
  >(null);
  const [failure, setFailure] = useState<string | null>(null);
  const slowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const source = new EventSource(`/api/appeal/${caseId}/stream`);

    const armSlowTimer = (key: StageKey) => {
      if (slowTimer.current) clearTimeout(slowTimer.current);
      slowTimer.current = setTimeout(() => {
        setStages((prev) =>
          prev[key].state === 'active' ? { ...prev, [key]: { state: 'slow' } } : prev,
        );
      }, SLOW_AFTER_MS);
    };

    source.onmessage = (message) => {
      const event = JSON.parse(message.data as string) as ProgressEvent;
      switch (event.type) {
        case 'stage':
          setStages((prev) => ({
            ...prev,
            [event.key]: { state: event.state, ...(event.detail ? { detail: event.detail } : {}) },
          }));
          if (event.state === 'active') armSlowTimer(event.key);
          break;
        case 'preview':
          setPreview(event.preview);
          break;
        case 'escalated':
          setEscalation({ detail: event.detail, disposition: event.disposition });
          break;
        case 'failed':
          setFailure(event.message);
          break;
        case 'done':
          if (slowTimer.current) clearTimeout(slowTimer.current);
          source.close();
          break;
      }
    };

    // A transport drop is not a lost draft — the run keeps going server-side and
    // the buffer replays on reconnect. Saying nothing here would be the failure.
    source.onerror = () => {
      if (source.readyState === EventSource.CLOSED) source.close();
    };

    return () => {
      if (slowTimer.current) clearTimeout(slowTimer.current);
      source.close();
    };
  }, [caseId]);

  const nodes: TimelineNode[] = STAGE_KEYS.map((key) => ({
    id: key,
    label: labelFor(key, stages[key].state),
    detail: stages[key].detail ?? null,
    state: stages[key].state,
  }));

  const finished = Boolean(preview || escalation || failure);

  return (
    <div className="cw-screen">
      <div className="cw-screen__head">
        <span className="cw-screen__eyebrow">Your case</span>
        <h1 className="cw-screen__title">
          {preview
            ? 'Here is what you were charged under'
            : escalation
              ? 'We are not going to guess at this one'
              : 'Reading your notice now'}
        </h1>
        {!finished ? (
          <p className="cw-screen__lede">
            Nothing is hidden until you pay. The reason code, the exact policy clause and our own
            critique of the draft all appear below as they are finished.
          </p>
        ) : null}
      </div>

      <section className="cw-card cw-mat-0 cw-run" aria-labelledby="run-title">
        <div className="cw-card__header">
          <h2 className="cw-card__title" id="run-title">
            What is happening
          </h2>
          {preview ? (
            <StatusPill tone="accent">Draft ready to read</StatusPill>
          ) : escalation ? (
            <StatusPill tone="caution">Needs a person</StatusPill>
          ) : (
            <StatusPill>Working</StatusPill>
          )}
        </div>
        <StatusTimeline nodes={nodes} label="Progress on your appeal draft" />
        {preview?.syntheticCorpus ? (
          <p className="cw-run__foot cw-note">
            Development build: this run used the engine&rsquo;s synthetic fixture corpus, not a
            built policy corpus. The clause below is fixture text and is labelled as such wherever
            it appears.
          </p>
        ) : null}
      </section>

      {failure ? (
        <section className="cw-card cw-mat-0" aria-labelledby="failure-title">
          <div className="cw-card__header">
            <h2 className="cw-card__title" id="failure-title">
              Something on our side stopped
            </h2>
            <StatusPill tone="danger">System failure</StatusPill>
          </div>
          <div className="cw-card__body">
            <p className="cw-ink-2">
              This is ours, not yours, and nothing has been charged. {failure}
            </p>
            <p className="cw-ink-2">
              Your notice is still on the case — reload this page and the run picks up where it
              was. If it stops again, a person will take it.
            </p>
            <form action={requestHumanReview} className="cw-actions">
              <input type="hidden" name="caseId" value={caseId} />
              <button className="cw-btn cw-btn--secondary" type="submit">
                <span className="cw-btn__label">Have a person take this case</span>
              </button>
            </form>
          </div>
        </section>
      ) : null}

      {escalation ? (
        <EscalationCard
          caseId={caseId}
          detail={escalation.detail}
          disposition={escalation.disposition}
          requestHumanReview={requestHumanReview}
        />
      ) : null}

      {preview ? (
        <>
          <section className="cw-card cw-mat-0" aria-labelledby="finding-title">
            <div className="cw-card__header">
              <h2 className="cw-card__title" id="finding-title">
                {preview.plainEnglish}
              </h2>
              <span className="cw-chip cw-chip--code">{preview.reasonCode}</span>
            </div>
            <div className="cw-card__body">
              <p className="cw-ink-2">
                That is what your notice&rsquo;s own wording maps to. It decides which appeal you
                are writing, and it is frozen for the life of this case — a revision improves the
                document, it never quietly changes which policy the document argues under.
              </p>

              <h3 className="cw-critique__label">The policy clause you were charged under</h3>
              <div className="cw-clauses">
                {preview.clauses.map((clause, i) => (
                  <CitationChip
                    key={`${clause.clauseId}-${i}`}
                    clause={clause}
                    id={`preview-clause-${i + 1}`}
                  />
                ))}
              </div>
              <p className="cw-note">
                Quoted from the policy document we retrieved, with its source. Read it against your
                notice before you decide anything — a quote you cannot trace is a quote you should
                not trust.
              </p>
            </div>
          </section>

          <CritiquePanel
            critique={preview.critique}
            labels={preview.rubricLabels}
            headingId="critique-title"
          />

          <PaywallTiers
            caseId={caseId}
            startCheckout={startCheckout}
            timeGuaranteeAdvertised={timeGuaranteeAdvertised}
          />

          {/* USER_JOURNEY §8.7: the human backstop is one visible click away on
              every screen where a machine-only answer might not be enough. */}
          <form action={requestHumanReview} className="cw-actions">
            <input type="hidden" name="caseId" value={caseId} />
            <p className="cw-note">Not sure this reads like your case?</p>
            <button className="cw-btn cw-btn--quiet cw-btn--sm" type="submit">
              <span className="cw-btn__label">Have a person look at it instead</span>
            </button>
          </form>
        </>
      ) : null}
    </div>
  );
}
