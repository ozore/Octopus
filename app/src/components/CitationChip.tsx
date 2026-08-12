/**
 * Citation chip — the most important component in the system.
 *
 * Spec: DESIGN_SYSTEM.md §8.5, ARCHITECTURE.md I2 / ADR-004, accessibility
 * commitment A10.
 *
 * TWO CONSTRAINTS THAT ARE NOT VISIBLE IN THE MARKUP:
 *
 *  - The prop type is `CitedClause`, never `string`. `CitedClause` has exactly
 *    one construction path — from a Citations API citation object whose
 *    `document_index` is on the per-case corpus allowlist (`lib/engine`'s
 *    `extractCitedClauses` / `assertRenderableDraft`). There is deliberately no
 *    prop here that accepts model prose, so the render gate cannot be opted out
 *    of by a future caller passing a formatted string.
 *
 *  - `citedText` is rendered verbatim and is NEVER trimmed, ellipsised or
 *    re-flowed by this component. The quotation *is* the product claim; a chip
 *    that shortened it would be making a different claim than the one the
 *    citation object supports.
 *
 * The `<figure> > <blockquote cite> + <figcaption>` shape is A10, binding: a
 * screen reader must convey *quotation plus attribution*, because attribution
 * without the quote, or the quote without its source, is not the product.
 */

import type { CitedClause } from '@/lib/domain/types';

export type CitationChipProps = {
  clause: CitedClause;
  /** Anchor id so inline `.cw-cite-ref` markers can point at the full figure. */
  id?: string;
};

export function CitationChip({ clause, id }: CitationChipProps) {
  return (
    <figure className="cw-cite" id={id}>
      <blockquote className="cw-cite__quote" cite={clause.sourceUrl}>
        {clause.citedText}
      </blockquote>
      <figcaption className="cw-cite__source">
        <span className="cw-cite__doc">{clause.documentTitle}</span>
        <span className="cw-cite__loc">{clause.clauseId}</span>
        <a
          className="cw-cite__link"
          href={clause.sourceUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          View the policy page
          <span className="cw-visually-hidden"> (opens in a new tab)</span>
        </a>
      </figcaption>
    </figure>
  );
}

/**
 * The inline marker used inside draft prose. It links to the full figure rather
 * than repeating the quotation, and carries `aria-describedby` so assistive
 * technology reaches the attribution from the marker (DESIGN_SYSTEM §8.5).
 */
export function CitationRef({ index, targetId }: { index: number; targetId: string }) {
  return (
    <a className="cw-cite-ref" href={`#${targetId}`} aria-describedby={targetId}>
      policy clause<sup>{index}</sup>
    </a>
  );
}
