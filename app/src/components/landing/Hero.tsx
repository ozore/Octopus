/**
 * Landing hero — R-1 register. L1 lead → L2 frame → L3 mechanic → one CTA.
 *
 * Ported from `identity/landing/index.html` (post-H-7/H-8 review pass). The copy
 * is verbatim and is BINDING: BRAND §3.1 orders the hero, and H-7 removed every
 * delivery-time guarantee from this page pending gate G6 (ARCHITECTURE.md §9),
 * so nothing here may reacquire a number of minutes.
 *
 * P6: exactly one `.cw-btn--primary` exists on this page and it is the one
 * inside `NoticeForm`. Every other call to action on the page is a secondary
 * button pointing back at this same box.
 */

import { LossCounter } from '../LossCounter';
import { NoticeForm } from '../NoticeForm';

export function Hero({ action }: { action: (formData: FormData) => void | Promise<void> }) {
  return (
    <section className="cw-lp-hero" aria-labelledby="hero-title">
      <div className="cw-shell">
        <div className="cw-lp-hero__grid">
          <div>
            <p className="cw-lp-hero__frame">
              <b>Clausewright</b> — a suspension defense copilot for Amazon and Walmart sellers.
            </p>

            <h1 className="cw-lp-hero__title" id="hero-title">
              <span className="cw-lp-hero__title-a">
                Every day dark costs you a day&rsquo;s sales.
              </span>
              <span className="cw-lp-hero__title-b">
                Get back to selling — with the exact policy clause on your side.
              </span>
            </h1>

            <p className="cw-lp-hero__lede">
              Paste your deactivation notice. In minutes you get a submission-ready Plan of Action
              that cites the exact policy clause you were charged under — with a human appeal writer
              one click away if your case needs judgment.
            </p>

            <NoticeForm action={action} />
          </div>

          {/* The loss counter. The seller supplies both numbers; the arithmetic
              happens in front of them. No countdown, no colour, no motion (P5). */}
          <LossCounter />
        </div>
      </div>
    </section>
  );
}
