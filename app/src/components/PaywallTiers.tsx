/**
 * S4 — the paywall, reached only after the clause and the critique are on screen.
 *
 * Spec: USER_JOURNEY.md §1.3 S4 and §1.4, DESIGN_SYSTEM.md §8.6, IDEA_DOSSIER
 * §6.2 (the anchor table) and §7.1 (why the paywall sits where it sits).
 *
 * WHY THE ANCHORS ARE REPRODUCED RATHER THAN INVENTED: $3,500 attorney / $1,250
 * consultant are AppealDesk's *own published* comparison figures, and the dossier
 * explicitly licenses using a competitor's anchor. Ramanujam's anchoring only
 * works if the anchor reads as a real alternative, so the rows are legible and
 * unmocked rather than strawmen — which is also why `.cw-price--anchor` exists
 * as a system variant instead of being styled down here.
 *
 * BOTH TIER BUTTONS ARE `.cw-btn--secondary`. This is one of exactly two screens
 * in the product where a genuinely symmetric choice exists (P6), so neither
 * option is visually punished; the recommendation is carried by a
 * `.cw-chip--recommend` LABEL — a word the seller can disagree with — rather
 * than by contrast (Nielsen #3).
 *
 * NO SCARCITY FURNITURE. No countdown, no "was $299", no expiry (X1). The design
 * system ships no component capable of expressing one, and that omission is the
 * enforcement.
 *
 * NO DELIVERY-TIME PROMISE unless `timeGuaranteeAdvertised` is true — gate G6
 * (ARCHITECTURE.md §9) binds the claim to the automatic refund job actually
 * running in production, not to anyone's diligence.
 */

export function PaywallTiers({
  caseId,
  startCheckout,
  recommendHuman,
  timeGuaranteeAdvertised = false,
}: {
  caseId: string;
  startCheckout: (formData: FormData) => void | Promise<void>;
  /** True when the reason code is one the taxonomy marks judgment-required. */
  recommendHuman?: boolean;
  timeGuaranteeAdvertised?: boolean;
}) {
  return (
    <section className="cw-card cw-mat-0" aria-labelledby="paywall-title">
      <div className="cw-card__header">
        <h2 className="cw-card__title" id="paywall-title">
          What it costs, next to what this usually costs
        </h2>
      </div>

      <div className="cw-card__body">
        <ul className="cw-anchors">
          <li className="cw-anchor">
            <span className="cw-anchor__what">An attorney</span>
            <span className="cw-anchor__price">~$3,500</span>
            <span className="cw-anchor__note">About two weeks.</span>
          </li>
          <li className="cw-anchor">
            <span className="cw-anchor__what">A consultant</span>
            <span className="cw-anchor__price">~$1,250</span>
            <span className="cw-anchor__note">Several days, and usually a call first.</span>
          </li>
          <li className="cw-anchor cw-anchor--us">
            <span className="cw-anchor__what">Clausewright Rescue</span>
            <span className="cw-anchor__price">$149</span>
            <span className="cw-anchor__note">
              The attorney and consultant figures above are AppealDesk&rsquo;s own published
              comparison figures, not ours.
            </span>
          </li>
        </ul>

        <div className="cw-tiers">
          <section className="cw-price cw-mat-0" aria-labelledby="tier-rescue">
            <div className="cw-price__head">
              <h3 className="cw-price__tier" id="tier-rescue">
                Rescue
              </h3>
              {recommendHuman ? null : (
                <span className="cw-chip cw-chip--recommend">
                  Recommended for a first suspension
                </span>
              )}
            </div>
            <p className="cw-price__amount">
              $149<span className="cw-price__unit"> one-time</span>
            </p>
            <p className="cw-price__role">The complete Plan of Action, drafted and critiqued.</p>
            <ul className="cw-price__list">
              <li className="cw-price__item">
                <span>The complete document, every section, written while you wait</span>
              </li>
              <li className="cw-price__item">
                <span>Unlimited revisions until you are reinstated or you tell us to stop</span>
              </li>
              <li className="cw-price__item">
                <span>Evidence Kit and Reason Code Playbook</span>
              </li>
              <li className="cw-price__item">
                <span>30 days of Shield included, card on file</span>
              </li>
            </ul>
            <form action={startCheckout}>
              <input type="hidden" name="caseId" value={caseId} />
              <input type="hidden" name="tier" value="rescue" />
              <ConsentField id="consent-rescue" />
              <button className="cw-btn cw-btn--secondary cw-btn--block" type="submit">
                <span className="cw-btn__label">Get my Plan of Action — $149</span>
              </button>
            </form>
            <p className="cw-price__guarantee">
              You are choosing this after reading your reason code, your clause and your critique —
              not before.
            </p>
          </section>

          <section className="cw-price cw-mat-0" aria-labelledby="tier-human">
            <div className="cw-price__head">
              <h3 className="cw-price__tier" id="tier-human">
                Rescue + Human
              </h3>
              {recommendHuman ? (
                <span className="cw-chip cw-chip--recommend">
                  Recommended for a case like yours
                </span>
              ) : null}
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
                <span>Priority queue and second-round Rejection Rescue</span>
              </li>
            </ul>
            <form action={startCheckout}>
              <input type="hidden" name="caseId" value={caseId} />
              <input type="hidden" name="tier" value="rescue_human" />
              <ConsentField id="consent-human" />
              <button className="cw-btn cw-btn--secondary cw-btn--block" type="submit">
                <span className="cw-btn__label">Have a person review this — $399</span>
              </button>
            </form>
            <p className="cw-price__guarantee">
              First submission rejected? Your human review is free.
            </p>
          </section>
        </div>

        <p className="cw-note">
          Payment is taken by Stripe on their own hosted page. No card details ever reach us. No one
          can guarantee reinstatement — Amazon and Walmart decide that.
          {timeGuaranteeAdvertised
            ? ' Your draft is in your inbox within ten minutes of payment, or your $149 is refunded automatically.'
            : ' Your draft is written while you wait, in the session you are already in; we do not put a guarantee on the clock until the refund that would back it runs by itself.'}
        </p>
      </div>
    </section>
  );
}

/**
 * B9 / ADR-008 ¶1. Consent is worded as an exchange, is unchecked by default
 * (affirmative or nothing), and is SEPARABLE FROM THE PURCHASE — declining does
 * not block or degrade it, which is why the button above never reads the box.
 * D10: if the build slips, everything else gets cut before this does.
 */
function ConsentField({ id }: { id: string }) {
  return (
    <div className="cw-checklist__item" style={{ marginBlock: 'var(--cw-space-4)' }}>
      <input className="cw-checklist__box" type="checkbox" id={id} name="consent" />
      <label className="cw-checklist__label" htmlFor={id}>
        <span className="cw-text-sm">
          Follow up with me at day 3, 10 and 21 to ask how this turned out, and use my case — with
          names, numbers and identifiers removed — to make the next seller&rsquo;s draft better. In
          exchange you get a $25 credit.
        </span>
        <span className="cw-checklist__why">
          Optional, and nothing changes if you leave it unticked: same document, same price, same
          revisions. You can withdraw it later and we delete the record.
        </span>
      </label>
    </div>
  );
}
