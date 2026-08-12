/**
 * S5 + S6 — the delivered document and the pre-submission checklist.
 *
 * Spec: USER_JOURNEY.md §1.3 (S5, S6), §7.3, ARCHITECTURE.md §3.1, I4, B11.
 *
 * THE ORDER ON THIS PAGE IS THE ARGUMENT. Document first, checklist second,
 * "where it goes" last — because the one action that spends the seller's one
 * credible attempt is the paste into Account Health, and Nielsen's
 * error-prevention heuristic here means putting a deliberate, unhurried step
 * immediately before it. USER_JOURNEY §7.3 calls the checklist "the highest-
 * leverage single screen in the product"; it is not a formality and it is not
 * skippable.
 *
 * I4, STATED ON THE SCREEN AND NOT ONLY IN THE ARCHITECTURE: Clausewright never
 * holds a Seller Central session, cookie or password, and never posts on the
 * seller's behalf. The last thing this page does is tell them exactly where to
 * paste it and then stop.
 */

import { notFound } from 'next/navigation';

import { markSubmitted, recordCheckoutReturn } from '@/app/_lib/actions';
import { getCase } from '@/app/_lib/case-store';
import { PlanDocument } from '@/components/PlanDocument';
import { StatusPill } from '@/components/StatusPill';
import { SubmissionChecklist } from '@/components/SubmissionChecklist';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Your Plan of Action — Clausewright' };

const ACCOUNT_HEALTH_PATH: Record<string, string> = {
  amazon: 'Seller Central → Performance → Account Health → “Reactivate your account” → paste under “Plan of Action”',
  walmart: 'Seller Center → Settings → Account Health → “Submit an appeal” → paste under “Plan of Action”',
  unknown: 'Your marketplace’s Account Health page, under “Plan of Action”',
};

export default async function PlanPage({
  params,
  searchParams,
}: {
  params: Promise<{ caseId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { caseId } = await params;
  const query = await searchParams;
  const sessionId = typeof query.session === 'string' ? query.session : '';

  // The return from Checkout. Idempotent, and it records rather than confirms:
  // `checkout.session.completed` is the source of truth (ADR-007), not this
  // redirect, so reloading this URL cannot unlock anything twice.
  if (sessionId) await recordCheckoutReturn(caseId, sessionId);

  const record = getCase(caseId);
  if (!record) notFound();

  if (!record.sections || !record.clauses) {
    return (
      <div className="cw-screen">
        <div className="cw-screen__head">
          <h1 className="cw-screen__title">This case has no document yet</h1>
          <p className="cw-screen__lede">
            Either the run has not finished, or the case went to a person instead of a draft.
          </p>
        </div>
        <div className="cw-actions">
          <a className="cw-btn cw-btn--secondary" href={`/case/${caseId}`}>
            <span className="cw-btn__label">See where this case is</span>
          </a>
        </div>
      </div>
    );
  }

  const path = ACCOUNT_HEALTH_PATH[record.marketplace] ?? ACCOUNT_HEALTH_PATH.unknown!;

  return (
    <div className="cw-screen">
      <div className="cw-screen__head">
        <span className="cw-screen__eyebrow">
          {record.classification?.plainEnglish ?? 'Your case'}
        </span>
        <h1 className="cw-screen__title">Your Plan of Action is ready to review</h1>
        <div className="cw-screen__meta">
          {record.payment ? (
            <StatusPill tone="accent">Payment recorded</StatusPill>
          ) : (
            <StatusPill tone="caution">Preview</StatusPill>
          )}
          {record.classification ? (
            <span className="cw-chip cw-chip--code">{record.classification.code}</span>
          ) : null}
          <span className="cw-chip cw-chip--code">{record.id}</span>
        </div>
        <p className="cw-screen__lede">
          Read it as the reviewer will. Anything that reads as untrue to you will read that way to
          them — edit it until it is yours, then work through the checklist below.
        </p>
      </div>

      <div className="cw-split">
        <section className="cw-card cw-mat-0" aria-labelledby="doc-title">
          <div className="cw-card__header">
            <h2 className="cw-card__title" id="doc-title">
              The document
            </h2>
          </div>
          <div className="cw-card__body">
            <PlanDocument
              sections={record.sections}
              clauses={record.clauses}
              clauseIdPrefix="plan-clause"
            />
          </div>
        </section>

        <div className="cw-stack cw-stack--loose">
          <SubmissionChecklist
            deficiencies={record.critique?.blockingDeficiencies ?? []}
            evidenceGaps={record.critique?.evidenceKitGaps ?? []}
            markSubmitted={markSubmitted}
            accountHealthPath={path}
          />

          {/* S7 — Shield activation. No new decision at this moment, by design:
              the retention decision is deferred to day 25, at relief rather than
              at panic (D6, peak-end rule). */}
          <section className="cw-card cw-mat-0 cw-card--accent" aria-labelledby="shield-title">
            <div className="cw-card__header">
              <h2 className="cw-card__title" id="shield-title">
                30 days of Shield are already on
              </h2>
            </div>
            <div className="cw-card__body">
              <p className="cw-ink-2">
                Included with Rescue, card on file, nothing charged. On day 25 you get an email that
                opens with what those 30 days actually flagged, and you keep it or let it lapse —
                both one click, neither buried. Nothing renews quietly.
              </p>
              <div className="cw-actions">
                <a className="cw-btn cw-btn--quiet cw-btn--sm" href="/settings/monitoring">
                  <span className="cw-btn__label">Set up forwarding</span>
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="cw-actions">
        <a className="cw-btn cw-btn--secondary" href={`/case/${caseId}`}>
          <span className="cw-btn__label">See where this case is</span>
        </a>
        <p className="cw-note">
          Revisions are unlimited until you are reinstated or you tell us to stop. A revision
          rewrites the document; it never changes which policy the document argues under.
        </p>
      </div>
    </div>
  );
}
