/**
 * The rendered appeal document.
 *
 * Spec: DESIGN_SYSTEM.md §5.1 and the `.cw-doc` block — "the same React
 * component renders both the screen and the branded PDF, so the on-screen serif
 * IS the PDF's serif; the two cannot drift, which the architecture identifies as
 * a citation-invariant leak vector" (ARCHITECTURE.md §3.1).
 *
 * INVARIANT I2 IS EXPRESSED IN THE PROP TYPES, not in a runtime check here: the
 * body arrives as `DraftSections` that already passed `assertRenderableDraft`
 * (branded `RenderableDraft`), and every policy reference arrives as
 * `CitedClause[]`. There is no prop on this component that accepts a
 * policy-shaped string, so a future caller cannot render an uncited clause by
 * mistake — which is ADR-004's point: the gate is structural, not procedural.
 *
 * Copy register (NAMING.md §5): the three headings are the seller's words. The
 * document is a "Plan of Action" in full — never "POA".
 */

import { CitationChip } from './CitationChip';
import type { CitedClause, DraftSections } from '@/lib/domain/types';

const SECTIONS: readonly { key: keyof DraftSections; heading: string; why: string }[] = [
  {
    key: 'rootCause',
    heading: 'Root cause',
    why: 'What actually went wrong, stated without blaming the marketplace.',
  },
  {
    key: 'correctiveActions',
    heading: 'Immediate corrective actions',
    why: 'What you have already done, with dates and evidence you can attach.',
  },
  {
    key: 'preventiveMeasures',
    heading: 'Preventive measures',
    why: 'The measurable control that stops this recurring. This is the section most appeals are thin on.',
  },
];

function paragraphs(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function PlanDocument({
  sections,
  clauses,
  clauseIdPrefix = 'clause',
}: {
  sections: DraftSections;
  clauses: readonly CitedClause[];
  clauseIdPrefix?: string;
}) {
  return (
    <article className="cw-doc">
      {SECTIONS.map((section) => (
        <section className="cw-doc__section" key={section.key}>
          <h2>{section.heading}</h2>
          {paragraphs(sections[section.key]).map((p, i) => (
            <p key={`${section.key}-${i}`}>{p}</p>
          ))}
        </section>
      ))}

      {clauses.length > 0 ? (
        <section className="cw-doc__section">
          <h2>The policy clauses this argues under</h2>
          <div className="cw-clauses">
            {clauses.map((clause, i) => (
              <CitationChip
                key={`${clause.clauseId}-${i}`}
                clause={clause}
                id={`${clauseIdPrefix}-${i + 1}`}
              />
            ))}
          </div>
        </section>
      ) : null}
    </article>
  );
}
