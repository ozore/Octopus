/**
 * The readiness critique (B6) — shown FREE, before the paywall.
 *
 * Spec: USER_JOURNEY.md §1.4 (the pre-paywall reveal must be complete and
 * legible on its own, not a teaser), DESIGN_SYSTEM.md P4.1 and exclusion X3.
 *
 * THE STYLING RULE THAT LOOKS LIKE A BUG AND IS NOT: this panel is never in
 * rose. It names deficiencies, and a red panel produces avoidance rather than
 * reading — the seller has to actually read this list, because it is the list of
 * things their appeal is most often rejected for. Slate ink, amber marker, no
 * error framing. `USER_JOURNEY §8.4` states it as binding, not as taste.
 *
 * The readiness score is computed in code from criteria × rubric weight
 * (`computeReadinessScore`, LLM_ENGINE §5.5) and is never model-authored, which
 * is what makes it comparable across corpus releases rather than a vibe.
 */

import type { Critique } from '@/lib/domain/types';

function humanise(id: string): string {
  const words = id.replace(/[._-]+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function CritiquePanel({
  critique,
  labels,
  headingId,
}: {
  critique: Critique;
  /** Rubric labels, keyed by criterion id. The rubric owns the wording. */
  labels?: Readonly<Record<string, string>>;
  headingId: string;
}) {
  const unmet = critique.criteria.filter((c) => !c.met);

  return (
    <section className="cw-card cw-mat-0" aria-labelledby={headingId}>
      <div className="cw-card__header">
        <h2 className="cw-card__title" id={headingId}>
          What this draft still lacks
        </h2>
        <p className="cw-readiness">
          <span className="cw-readiness__figure">{critique.readinessScore}</span>
          <span className="cw-readiness__unit">/ 100 ready</span>
        </p>
      </div>

      <div className="cw-card__body">
        <p className="cw-ink-2">
          We check our own draft against the rubric for your reason code before you decide anything.
          This is what it found. Nothing here is hidden until you pay.
        </p>

        <ul className="cw-critique">
          {critique.criteria.map((criterion) => (
            <li className="cw-critique__item" key={criterion.id} data-met={criterion.met}>
              <span className="cw-critique__glyph" aria-hidden="true">
                {criterion.met ? '✓' : '·'}
              </span>
              <span>
                <span className="cw-visually-hidden">
                  {criterion.met ? 'Met. ' : 'Not met yet. '}
                </span>
                <span className="cw-critique__label">
                  {labels?.[criterion.id] ?? humanise(criterion.id)}
                </span>
                {criterion.deficiency ? (
                  <span className="cw-critique__gap">{criterion.deficiency}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>

        {critique.blockingDeficiencies.length > 0 ? (
          <div className="cw-card--inset">
            <h3 className="cw-critique__label">Fix these before you submit</h3>
            <ul className="cw-list">
              {critique.blockingDeficiencies.map((item) => (
                <li className="cw-list__item" key={item}>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {critique.evidenceKitGaps.length > 0 ? (
          <div className="cw-card--inset">
            <h3 className="cw-critique__label">Documents to gather</h3>
            <ul className="cw-list">
              {critique.evidenceKitGaps.map((item) => (
                <li className="cw-list__item" key={item}>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {unmet.length === 0 ? (
          <p className="cw-note">
            Every criterion in the rubric for this reason code is met. That is a statement about the
            draft, not a prediction about the decision — Amazon and Walmart decide that.
          </p>
        ) : null}
      </div>
    </section>
  );
}
