/**
 * THE FOUR REFUSAL PRIMITIVES, RENDERED — and there is no fifth.
 *
 * AUTHORITY: `USER_JOURNEY.md` §0.3 (P-A…P-D and the test for a new screen),
 * `DESIGN_SYSTEM.md` §8.10 (one alert variant per primitive, and no success
 * variant), §8.10.2 (why P-D has no hue at all), §8.10.4 (a live narrowing has no
 * dismiss affordance).
 *
 * The `switch` is closed by `assertNever`, which is what makes "there is no fifth
 * shape" a compile error rather than a convention: adding a primitive to the union
 * breaks this file, which is exactly the review §0.3 asks for.
 *
 * THERE IS NO CONTACT AFFORDANCE IN THIS COMPONENT AND THERE MUST NEVER BE ONE. A
 * `Refusal` has no field in which a support address, a ticket id or an escalation
 * target could travel (`src/lib/types.ts`), so the absence here is structural: even
 * a determined edit would have to invent the data as well as the markup.
 */

import { assertNever, type Refusal } from '@/lib/types';

import { stamp } from '../_lib/format';

export function RefusalView({ refusal }: { readonly refusal: Refusal }): React.ReactElement {
  switch (refusal.primitive) {
    /**
     * P-A — a blocked line with a closed choice. Rendered here as the STATEMENT of
     * the block; the choice itself is the picker component, because a radiogroup
     * inside an alert is a control inside a status message and screen readers
     * announce the two differently.
     */
    case 'P-A':
      return (
        <div className="rp-alert rp-alert--blocked" role="group" aria-label="Blocked line">
          <span className="rp-alert__glyph" aria-hidden="true">
            ✕
          </span>
          <div className="rp-alert__body">
            <p className="rp-alert__title">{refusal.headline}</p>
            <p>{refusal.detail}</p>
          </div>
        </div>
      );

    /** P-B — the artifact renders in full, watermarked, signature withheld. */
    case 'P-B':
      return (
        <div className="rp-alert rp-alert--blocked">
          <span className="rp-alert__glyph" aria-hidden="true">
            ✕
          </span>
          <div className="rp-alert__body">
            <p className="rp-alert__title">{refusal.headline}</p>
            <p>{refusal.detail}</p>
            {refusal.exceptionReport.length > 0 ? (
              <ul className="rp-stack rp-stack--tight">
                {refusal.exceptionReport.map((sentence) => (
                  <li key={sentence}>{sentence}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      );

    /**
     * P-C — the artifact and the rate are unchanged; the sentence about currency
     * narrows and the banner carries a date. The date is not optional: a narrowing
     * without a timestamp is vagueness wearing a refusal's clothes.
     */
    case 'P-C':
      return (
        <div className="rp-alert rp-alert--narrowed">
          <span className="rp-alert__glyph" aria-hidden="true">
            !
          </span>
          <div className="rp-alert__body">
            <p className="rp-alert__title">{refusal.headline}</p>
            <p>{refusal.narrowedClaim}</p>
            <p className="rp-t-micro rp-num">
              As of {stamp(refusal.asOf)} · corpus level {refusal.ladderLevel.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
      );

    /**
     * P-D — we state the rule, show the observable dates, and refuse to draw the
     * conclusion. No hue: colouring a statement of epistemic limits converts it
     * into an alarm, and this is the most honest thing the product says.
     */
    case 'P-D':
      return (
        <div className="rp-alert rp-alert--declined">
          <span className="rp-alert__glyph" aria-hidden="true">
            §
          </span>
          <div className="rp-alert__body">
            <p className="rp-alert__title">{refusal.headline}</p>
            <blockquote className="rp-prose">
              <p>{refusal.rule}</p>
              <p className="rp-t-micro rp-num">{refusal.citation}</p>
            </blockquote>
            {refusal.observableFacts.length > 0 ? (
              <dl className="rp-stack rp-stack--tight">
                {refusal.observableFacts.map((fact) => (
                  <div key={`${fact.label}:${fact.value}`} className="rp-row rp-row--between">
                    <dt>{fact.label}</dt>
                    <dd className="rp-num">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
            <p>{refusal.declined}</p>
          </div>
        </div>
      );

    default:
      return assertNever(refusal, 'unrenderable refusal primitive');
  }
}
