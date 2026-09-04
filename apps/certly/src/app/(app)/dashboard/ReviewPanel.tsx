import { Disclaimer } from '@/components/Disclaimer';
import type { ReviewView } from '@/lib/extract/review';

/**
 * M4'S REVIEW PANEL, EMBEDDED IN THE VENDOR DETAIL — `UX.md` S12, §3.2.
 *
 * The contract is `ReviewView` from `src/lib/extract/review.ts`, which M4
 * documents as "a plain data structure rather than a component… M6's dashboard
 * embeds the panel". This file is the M6 half of that seam and it reads nothing
 * else: no extraction payload, no confidence model, no quote gate. If the shape
 * of a confidence chip changes, it changes in one place.
 *
 * THREE RULES FROM `UX.md` §3.2 THAT THIS RENDER HONOURS:
 *
 *  1. **No bounding boxes.** The extractor returns no coordinates and none are
 *     invented to decorate a screen whose entire purpose is provenance
 *     (REVIEW.md B-04). A field carries a page number to scroll to, and the
 *     `source_text` is quoted beside the value.
 *  2. **The quote-gate result is a sentence**, in the tabular face — "found on
 *     page 1", "we could not find this text on the page we read it from" —
 *     never a score.
 *  3. **The full screen is one link away.** This panel is the summary on the
 *     vendor's page; accepting a reading happens at `/review/[documentId]`,
 *     which M4 owns.
 */

export function ReviewPanel({ view, documentId }: { view: ReviewView; documentId: string }) {
  return (
    <section className="c-card" data-testid="review-panel">
      <div className="c-card__head">
        <h2 className="c-card__title">What Certly read, and what it is unsure about</h2>
        <span className="c-xs c-muted">
          {view.rows.length} {view.rows.length === 1 ? 'field' : 'fields'} in question of{' '}
          {view.allFields.length}
        </span>
      </div>

      {view.reasons.length > 0 ? (
        <ul className="c-list-reset c-small" data-testid="review-reasons">
          {view.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}

      {view.rows.length === 0 ? (
        <p className="c-small c-muted">Nothing on this document was read below the threshold.</p>
      ) : (
        <ul className="c-review c-list-reset">
          {view.rows.map((row) => (
            <li className="c-review__row" key={row.path} data-testid={`review-field-${row.path}`}>
              <span className="c-review__label">{row.label}</span>
              <span className="c-review__value">
                {row.value}
                {row.raw && row.raw !== row.value ? <span className="c-mono"> (printed: {row.raw})</span> : null}
              </span>
              {row.sourceText ? (
                <q className="c-mono c-xs">{row.sourceText}</q>
              ) : null}
              <span className="c-xs c-muted">
                {row.gateSentence}
                {row.page !== null ? ` · page ${row.page}` : ''}
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="c-gap-3">
        <a className="c-btn c-btn--secondary c-btn--sm" href={`/review/${documentId}`}>
          Open the full reading
        </a>
        {view.acceptDisabledBecause ? (
          <span className="c-xs c-muted" data-testid="accept-blocked">
            {view.acceptDisabledBecause}
          </span>
        ) : null}
      </p>

      {/* §F.3 — beside a value read from a document (KB §F.4, surface 1's
          second key). The §F.1 disclaimer for this screen is on the page. */}
      <Disclaimer of="extracted_fields" inline />
    </section>
  );
}
