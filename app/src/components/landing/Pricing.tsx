/**
 * Pricing — anchors first (below the fold, BRAND §3.5), then tiers, then Shield.
 *
 * Ported verbatim from `identity/landing/index.html`, including the C-1 fix: the
 * Shield block describes **email forwarding**, not an automated daily watcher,
 * because ADR-006's v1 mechanism is an inbound-email adapter that only ever sees
 * what the seller forwards. Do not restore "daily monitoring" language here —
 * that was the single most expensive defect the design review found, on the one
 * page a stranger reads first.
 *
 * Every tier button is `.cw-btn--secondary`: the page's single primary action is
 * the paste box (P6). No scarcity furniture anywhere (X1) — no countdown, no
 * "was $299", no expiry, because the system ships no component that can express
 * one.
 */

import { PasteLink } from './PasteLink';

export function Pricing() {
  return (
    <section className="cw-lp-section" aria-labelledby="price-title">
      <div className="cw-shell">
        <div className="cw-lp-head">
          <span className="cw-lp-eyebrow">Pricing</span>
          <h2 className="cw-lp-h2" id="price-title">
            What it costs, next to what this usually costs
          </h2>
          <p className="cw-lp-lede">
            Published in full. No gated pricing, no demo call, no mandatory intake call.
          </p>
        </div>

        <ul className="cw-lp-anchors">
          <li className="cw-lp-anchor">
            <span className="cw-lp-anchor__what">An attorney</span>
            <span className="cw-lp-anchor__price">~$3,500</span>
            <span className="cw-lp-anchor__note">About two weeks.</span>
          </li>
          <li className="cw-lp-anchor">
            <span className="cw-lp-anchor__what">A consultant</span>
            <span className="cw-lp-anchor__price">~$1,250</span>
            <span className="cw-lp-anchor__note">Several days, and usually a call first.</span>
          </li>
          <li className="cw-lp-anchor cw-lp-anchor--us">
            <span className="cw-lp-anchor__what">Clausewright Rescue</span>
            <span className="cw-lp-anchor__price">$149</span>
            <span className="cw-lp-anchor__note">
              Minutes. The attorney and consultant figures above are AppealDesk&rsquo;s own
              published comparison figures, not ours.
            </span>
          </li>
        </ul>

        <div className="cw-lp-price-grid">
          <section className="cw-price cw-mat-0" aria-labelledby="tier-decoder">
            <div className="cw-lp-price__head">
              <h3 className="cw-price__tier" id="tier-decoder">
                Decoder
              </h3>
            </div>
            <p className="cw-price__amount">
              Free<span className="cw-price__unit"> · no card, no login</span>
            </p>
            <p className="cw-price__role">See what you are charged under.</p>
            <ul className="cw-price__list">
              <li className="cw-price__item">
                <span>Your reason code, read from your notice</span>
              </li>
              <li className="cw-price__item">
                <span>The exact policy clause, quoted with its source</span>
              </li>
              <li className="cw-price__item">
                <span>A plain-English diagnosis of your case</span>
              </li>
              <li className="cw-price__item">
                <span>Your Plan of Action outline</span>
              </li>
              <li className="cw-price__item">
                <span>The first section of the real draft</span>
              </li>
            </ul>
            <PasteLink>Start with your notice</PasteLink>
            <p className="cw-price__guarantee">
              Nothing is charged now or later unless you choose a tier.
            </p>
          </section>

          <section className="cw-price cw-mat-0 cw-price--recommended" aria-labelledby="tier-rescue">
            <div className="cw-lp-price__head">
              <h3 className="cw-price__tier" id="tier-rescue">
                Rescue
              </h3>
              <span className="cw-chip cw-chip--recommend">Recommended for a first suspension</span>
            </div>
            <p className="cw-price__amount">
              $149<span className="cw-price__unit"> one-time</span>
            </p>
            <p className="cw-price__role">The complete Plan of Action, drafted and critiqued.</p>
            <ul className="cw-price__list">
              <li className="cw-price__item">
                <span>Complete policy-cited Plan of Action, written while you wait</span>
              </li>
              <li className="cw-price__item">
                <span>Rejection-Risk Scorer on your own draft</span>
              </li>
              <li className="cw-price__item">
                <span>Unlimited revisions</span>
              </li>
              <li className="cw-price__item">
                <span>Evidence Kit and Reason Code Playbook</span>
              </li>
              <li className="cw-price__item">
                <span>30 days of Shield included, card on file</span>
              </li>
            </ul>
            <PasteLink>Start with your notice</PasteLink>
            <p className="cw-price__guarantee">
              Unlimited revisions until you are reinstated or you tell us to stop. You choose this
              after you have read your reason code, your clause and your critique — not before.
            </p>
          </section>

          <section className="cw-price cw-mat-0" aria-labelledby="tier-human">
            <div className="cw-lp-price__head">
              <h3 className="cw-price__tier" id="tier-human">
                Rescue + Human
              </h3>
            </div>
            <p className="cw-price__amount">
              $399<span className="cw-price__unit"> one-time</span>
            </p>
            <p className="cw-price__role">For the case that needs a person rather than a tool.</p>
            <ul className="cw-price__list">
              <li className="cw-price__item">
                <span>Everything in Rescue</span>
              </li>
              <li className="cw-price__item">
                <span>Same-day review by an experienced appeal writer</span>
              </li>
              <li className="cw-price__item">
                <span>A 15-minute strategy call</span>
              </li>
              <li className="cw-price__item">
                <span>Priority queue</span>
              </li>
              <li className="cw-price__item">
                <span>Second-round Rejection Rescue</span>
              </li>
            </ul>
            <PasteLink>Start with your notice</PasteLink>
            <p className="cw-price__guarantee">
              First submission rejected? Your human review is free.
            </p>
          </section>
        </div>

        <div className="cw-card--inset cw-lp-shield">
          <div className="cw-lp-shield__grid">
            <div>
              <h3 className="cw-price__tier">Shield</h3>
              <p className="cw-lp-shield__price">
                $49<span className="cw-price__unit"> /mo, or $470/yr</span>
              </p>
            </div>
            <div>
              <p className="cw-lp-shield__p">
                Thirty days are included free with every Rescue, with your card on file. You set one
                forwarding rule for the account-health emails Amazon and Walmart send you; every
                notice that arrives is read the same way your deactivation notice was. You get an
                alert naming the specific policy at risk, pre-drafted Plans of Action for your top
                three risk vectors, and one Rescue appeal included each year.
              </p>
              <p className="cw-lp-shield__p">
                On day 25 you get an email showing what it flagged. Keep it or let it lapse — both
                are one click, and neither is buried. The paid plan is only ever offered once you
                are back online, never while you are down.
              </p>
              <p className="cw-lp-shield__p">
                Handling accounts for other sellers? Shield Pro is $149/mo for up to ten of them.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
