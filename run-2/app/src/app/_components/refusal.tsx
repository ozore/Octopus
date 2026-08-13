/**
 * THE REFUSAL PRIMITIVES, RENDERED — one component, every surface.
 *
 * AUTHORITY: `USER_JOURNEY.md` §0.3 (P-A…P-D and the test for a new screen),
 * `DESIGN_SYSTEM.md` §8.10 (one alert variant per primitive, and no success
 * variant), §8.10.2 (why P-D has no hue at all), §8.10.4 (a live narrowing has no
 * dismiss affordance).
 *
 * THIS FILE LIVES AT `src/app/_components/` RATHER THAN UNDER A ROUTE GROUP
 * because the build review found the opposite arrangement: the component sat in
 * `(free)/_components`, the free surface used it consistently, and the
 * authenticated surface hand-rolled the same markup on fifteen of sixteen screens.
 * A primitive that is re-implemented per screen is not a primitive — the glyph, the
 * role, the heading order and the wording all drift, and the four-primitive rule
 * dies quietly rather than loudly. `tests/web/refusal-primitives.test.ts` now fails
 * the build if `rp-alert` markup appears anywhere under `(app)` except here.
 *
 * The `switch` is closed by `assertNever`, which is what makes "there is no other
 * shape" a compile error rather than a convention: adding a member to the union
 * breaks this file, which is exactly the review §0.3 asks for.
 *
 * THERE IS NO CONTACT AFFORDANCE IN THIS COMPONENT AND THERE MUST NEVER BE ONE. A
 * `Refusal` has no field in which a support address, a ticket id or an escalation
 * target could travel (`src/lib/types.ts`), so the absence here is structural: even
 * a determined edit would have to invent the data as well as the markup.
 *
 * `children` IS FOR CONTROLS, NOT FOR COPY. Some blocks have to contain a form —
 * the contract-value radio set, "undo the deletion", "try another file" — and a
 * control cannot travel inside a data value. Every SENTENCE comes from the
 * `Refusal`, so the copy still cannot drift screen to screen; only the widget is
 * passed in.
 */

import { assertNever, type Refusal, type RefusalAction } from '@/lib/types';
import { stamp } from '@/app/(free)/_lib/format';

/** DESIGN_SYSTEM §8.10.1. Three variants, five members: P-A and P-B share
 *  `--blocked` because both are stops, and P-S borrows whichever of the three
 *  matches its severity. There is no fourth variant and no `--success`. */
const SEVERITY_VARIANT = {
  blocked: { variant: 'rp-alert--blocked', glyph: '✕' },
  narrowed: { variant: 'rp-alert--narrowed', glyph: '!' },
  noted: { variant: 'rp-alert--declined', glyph: '§' },
} as const;

/**
 * WHY THE `onThisScreen` ARM RENDERS A SENTENCE RATHER THAN NOTHING (finding NEW-6).
 *
 * This function returned `null` for `onThisScreen`, on the reasoning that the way
 * out is a control arriving through `children`, so there is no link to draw. The
 * reasoning was right about the link and wrong about the copy: it discarded the
 * authored `label` — the one sentence naming what clears the block — on 8 of 13
 * P-S refusals, including *"take the refund below"* on the $49 screen. The
 * invariant `productStateHasAWayOut` still held, the 16 primitive tests still
 * passed, and the customer still saw a dead end, because the invariant is
 * enforced on the VALUE and the render is where the value is spent. A3 is a
 * property of what she reads, not of what the type permits.
 *
 * So: a link action draws a button, an on-screen action draws its sentence, and
 * the control still arrives as `children` beneath it. An empty label draws
 * nothing rather than an empty paragraph — and `refusal-primitives.test.ts`
 * fails the build if any P-S reaches the renderer with a blank one, because a
 * blank way out is the same dead end wearing the invariant's clothes.
 */
function ActionLine({ action }: { readonly action: RefusalAction }): React.ReactElement | null {
  if (action.kind === 'onThisScreen') {
    const label = action.label.trim();
    if (label === '') return null;
    return <p className="rp-alert__actions">{label}</p>;
  }
  return (
    <p className="rp-btn-row">
      <a className="rp-btn rp-btn--primary" href={action.href}>
        {action.label}
      </a>
    </p>
  );
}

export function RefusalView({
  refusal,
  children,
}: {
  readonly refusal: Refusal;
  readonly children?: React.ReactNode;
}): React.ReactElement {
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
          <div className="rp-alert__body rp-stack rp-stack--tight">
            <p className="rp-alert__title">{refusal.headline}</p>
            <p>{refusal.detail}</p>
            {children}
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
          <div className="rp-alert__body rp-stack rp-stack--tight">
            <p className="rp-alert__title">{refusal.headline}</p>
            <p>{refusal.detail}</p>
            {refusal.exceptionReport.length > 0 ? (
              <ul className="rp-stack rp-stack--tight">
                {refusal.exceptionReport.map((sentence) => (
                  <li key={sentence}>{sentence}</li>
                ))}
              </ul>
            ) : null}
            {children}
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
          <div className="rp-alert__body rp-stack rp-stack--tight">
            <p className="rp-alert__title">{refusal.headline}</p>
            <p>{refusal.narrowedClaim}</p>
            <p className="rp-t-micro rp-num">
              As of {stamp(refusal.asOf)} · corpus level {refusal.ladderLevel.replace(/_/g, ' ')}
            </p>
            {children}
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
          <div className="rp-alert__body rp-stack rp-stack--tight">
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
            {children}
          </div>
        </div>
      );

    /**
     * P-S — a product state. What is blocked, why, and the way out.
     *
     * The way out is rendered LAST and always: the type guarantees exactly one of
     * `clearedBy` / `clearsItself` is present, so this block cannot end on a
     * statement of a problem with nothing after it. That is the whole reason the
     * variant exists — not to make billing look regulatory, but to make a billing
     * dead end unrepresentable on a product with nobody to email.
     */
    case 'P-S': {
      const { variant, glyph } = SEVERITY_VARIANT[refusal.severity];
      return (
        <div className={`rp-alert ${variant}`}>
          <span className="rp-alert__glyph" aria-hidden="true">
            {glyph}
          </span>
          <div className="rp-alert__body rp-stack rp-stack--tight">
            <p className="rp-alert__title">{refusal.headline}</p>
            <p>{refusal.blocked}</p>
            <p>{refusal.because}</p>
            {children}
            {refusal.clearsItself === null ? null : (
              <p className="rp-t-micro">{refusal.clearsItself}</p>
            )}
            {refusal.clearedBy === null ? null : <ActionLine action={refusal.clearedBy} />}
          </div>
        </div>
      );
    }

    default:
      return assertNever(refusal, 'unrenderable refusal primitive');
  }
}
