/**
 * THE CANONICAL DISCLAIMER COMPONENT — `specs/13` §12, `KNOWLEDGE_BASE.md` §F.
 *
 * ONE TEXT PER PURPOSE, IN ONE PLACE. The strings live in
 * `src/lib/kb/disclaimers.ts` (transcribed from KB §F, which is the only place
 * they are written in prose) and this component renders them VERBATIM. No
 * surface writes its own; no surface shortens one for a small space.
 *
 * This is not tidiness. `IDENTITY.md` §4.4 and `identity/samples.html` once
 * carried a DIFFERENT disclaimer from the specs, and `specs/13` §12 asserts a
 * verbatim match that only one of the two could pass (REVIEW.md B-12). The
 * guard is now mechanical: `tests/disclaimers.test.ts` greps the whole repo and
 * fails the build on a near-duplicate string anywhere outside `disclaimers.ts`.
 *
 * **The rule for a builder: if a screen renders a status, it renders this.**
 * All eleven surfaces are listed in `DISCLAIMER_SURFACES`; a screen that shows
 * a pill and is missing from that table is a bug in the table.
 */

import { disclaimers, type DisclaimerKey } from '@/lib/kb/disclaimers';

export type DisclaimerProps = {
  /** `primary` on any status; `templates` on the library and editor;
   *  `extracted_fields` beside a value read from a document. */
  of: DisclaimerKey;
  /** Tightens the spacing where the disclaimer sits next to a value rather
   *  than at the foot of a screen. It never shortens the TEXT. */
  inline?: boolean;
};

export function Disclaimer({ of, inline }: DisclaimerProps) {
  const disclaimer = disclaimers[of];
  return (
    <aside
      className={`c-disclaimer${inline ? ' c-disclaimer--inline' : ''}`}
      data-testid={`disclaimer-${of}`}
      data-disclaimer={of}
    >
      <strong>{disclaimer.heading}</strong>
      {disclaimer.body}
    </aside>
  );
}
