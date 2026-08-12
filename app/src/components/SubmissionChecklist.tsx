'use client';

/**
 * S6 — the pre-submission checklist.
 *
 * Spec: USER_JOURNEY.md §7.3, which calls this "the highest-leverage single
 * screen in the product", and DESIGN_SYSTEM.md §8.7.
 *
 * THIS SCREEN IS DELIBERATELY SLOW, and that is the whole design. Nielsen's
 * error-prevention heuristic here means slowing the seller down at the one
 * moment it matters — the moment they spend their one credible appeal attempt.
 * It trades directly against the Time-Delay term of the value equation, and
 * that trade is the correct one, because Perceived Likelihood (3/10) is the
 * binding constraint the whole offer targets, not Time Delay (already 9/10)
 * (IDEA_DOSSIER D7, §6.1).
 *
 * INVARIANT I4 IS THE POINT OF THE LAST STEP: Clausewright never logs into a
 * seller account and never submits anything. The seller copies the document into
 * Account Health themselves. The checklist tells them exactly where it goes and
 * then gets out of the way.
 */

import { useMemo, useState } from 'react';

export type ChecklistItem = {
  id: string;
  label: string;
  why?: string;
};

export function SubmissionChecklist({
  deficiencies,
  evidenceGaps,
  markSubmitted,
  accountHealthPath,
}: {
  deficiencies: readonly string[];
  evidenceGaps: readonly string[];
  /** Server action. The seller reports the submission; we never make it. */
  markSubmitted: (formData: FormData) => void | Promise<void>;
  accountHealthPath: string;
}) {
  const items = useMemo<ChecklistItem[]>(() => {
    const fromCritique: ChecklistItem[] = deficiencies.map((text, i) => ({
      id: `deficiency-${i}`,
      label: text,
      why: 'Named by our own readiness check. Fix it or decide deliberately to send without it.',
    }));
    const fromEvidence: ChecklistItem[] = evidenceGaps.map((text, i) => ({
      id: `evidence-${i}`,
      label: `Attached or accounted for: ${text}`,
      why: 'Evidence Kit item for this reason code.',
    }));
    return [
      ...fromCritique,
      ...fromEvidence,
      {
        id: 'read-it',
        label: 'I have read the whole document myself, start to finish.',
        why: 'Nobody knows your account like you do. Anything that reads as untrue to you will read that way to a reviewer.',
      },
      {
        id: 'the-wait',
        label:
          'I understand that submitting starts a wait of roughly 3 to 30 days, with no committed timeline.',
        why: 'Walmart states appeals are "handled and responded to in the order in which they\'re received", with no service level. Amazon publishes none either.',
      },
      {
        id: 'by-hand',
        label: 'I will paste this into Account Health myself.',
        why: 'Clausewright never logs into your seller account and never submits on your behalf — not now, not ever.',
      },
    ];
  }, [deficiencies, evidenceGaps]);

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const done = items.filter((item) => checked[item.id]).length;
  const ready = done === items.length;

  return (
    <section className="cw-card cw-mat-0" aria-labelledby="checklist-title">
      <div className="cw-card__header">
        <h2 className="cw-card__title" id="checklist-title">
          Before you send it
        </h2>
        <p className="cw-checklist__count">
          {done} of {items.length}
        </p>
      </div>

      <div className="cw-card__body">
        <p className="cw-ink-2">
          Take your time with this part. You get very few credible attempts, and this is the step
          that spends one.
        </p>

        <ul className="cw-checklist">
          {items.map((item) => (
            <li className="cw-checklist__item" key={item.id}>
              <input
                className="cw-checklist__box"
                type="checkbox"
                id={`chk-${item.id}`}
                checked={Boolean(checked[item.id])}
                onChange={(e) =>
                  setChecked((prev) => ({ ...prev, [item.id]: e.target.checked }))
                }
              />
              <label className="cw-checklist__label" htmlFor={`chk-${item.id}`}>
                {item.label}
                {item.why ? <span className="cw-checklist__why">{item.why}</span> : null}
              </label>
            </li>
          ))}
        </ul>

        <div className="cw-handoff cw-card--inset">
          <h3 className="cw-critique__label">Where it goes</h3>
          <p className="cw-handoff__path">{accountHealthPath}</p>
          <p className="cw-note">
            Copy the document above into that box and submit it yourself. We never hold a session,
            a cookie or a password for your account.
          </p>
        </div>
      </div>

      <div className="cw-card__footer">
        <form action={markSubmitted}>
          <button
            className="cw-btn cw-btn--secondary"
            type="submit"
            disabled={!ready}
            aria-disabled={!ready}
          >
            <span className="cw-btn__label">I&rsquo;ve submitted it</span>
          </button>
          {/* Nielsen #1: a disabled control must state its reason. */}
          {!ready ? (
            <span className="cw-btn__reason">
              Tick every line above first — this button only records what you did, it does not send
              anything.
            </span>
          ) : (
            <span className="cw-btn__reason">
              This only records the date so we can follow up on the outcome. It sends nothing to the
              marketplace.
            </span>
          )}
        </form>
      </div>
    </section>
  );
}
