/**
 * "What you can check before you pay" — the L4 proof stack in BRAND §3.3's
 * binding order: 1 cited clause · 2 honest triage · 3 guarantees · 4 the human
 * tier, then the deliberate absence of a win rate.
 *
 * Ported verbatim from `identity/landing/index.html`.
 *
 * TWO THINGS THAT ARE NOT ON THIS PAGE AND MUST NOT RETURN:
 *  - A success rate. NAMING.md §5 invariant 5 / N10 / R11 — not until B9 yields
 *    one with its denominator. The design system ships no component capable of
 *    expressing one (exclusion X8).
 *  - A delivery-time guarantee. H-7 removed all five instances; gate G6
 *    (ARCHITECTURE.md §9) binds its return to the automatic refund job actually
 *    running, not to someone remembering.
 *
 * The citation figure below is hand-written rather than rendered through
 * `CitationChip` on purpose: it is a marketing example of a publicly published
 * clause, not a `CitedClause` produced by the pipeline, and typing it as one
 * would be exactly the conflation invariant I2 exists to prevent.
 */

export function Proof() {
  return (
    <section className="cw-lp-section" aria-labelledby="proof-title">
      <div className="cw-shell">
        <div className="cw-lp-head">
          <span className="cw-lp-eyebrow">Proof</span>
          <h2 className="cw-lp-h2" id="proof-title">
            What you can check before you pay
          </h2>
          <p className="cw-lp-lede">
            There is no success rate on this page. Here is what there is instead.
          </p>
        </div>

        <div className="cw-lp-proof__grid">
          <div>
            <p className="cw-lp-proof__intro">
              Every policy reference in a Clausewright draft comes back from retrieval carrying a
              source location. A reference without one cannot reach the screen — a test in the build
              pipeline fails first. This is what that looks like:
            </p>

            <figure className="cw-cite">
              <blockquote
                className="cw-cite__quote"
                cite="https://sellercentral.amazon.com/help/hub/reference/G1801"
              >
                Act fairly and honestly on Amazon to ensure a safe buying and selling experience.
              </blockquote>
              <figcaption className="cw-cite__source">
                <span className="cw-cite__doc">Amazon Seller Code of Conduct</span>
                <span className="cw-cite__loc">§ 3 — Acting Fairly</span>
                <a
                  className="cw-cite__link"
                  href="https://sellercentral.amazon.com/help/hub/reference/G1801"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  View the policy page
                  <span className="cw-visually-hidden"> (opens in a new tab)</span>
                </a>
              </figcaption>
            </figure>

            <p className="cw-lp-proof__caption">
              An example rendering, using a publicly published clause. Which clause appears in your
              draft is decided by your notice, not by us. The quotation, the document, the section
              and the link all travel together — a quote you cannot trace is a quote you should not
              trust.
            </p>
          </div>

          <div className="cw-lp-proof__list">
            <div className="cw-card--inset cw-lp-proof__item">
              <span className="cw-lp-proof__rank">Proof 02</span>
              <h3 className="cw-lp-proof__h">Some cases should not be appealed by a tool</h3>
              <p className="cw-lp-proof__p">
                If yours is one of them, you are told so before you are charged, and pointed at
                someone who can actually help. A tool that guesses at a case it cannot read costs
                you an appeal attempt you do not get back.
              </p>
            </div>

            <div className="cw-card--inset cw-lp-proof__item">
              <span className="cw-lp-proof__rank">Proof 03</span>
              <h3 className="cw-lp-proof__h">Two guarantees, and one thing nobody can guarantee</h3>
              <p className="cw-lp-proof__p">
                Revisions are unlimited until you are reinstated or you tell us to stop. If your
                first submission is rejected, your human review is free. No one can guarantee
                reinstatement — Amazon and Walmart decide that. Your draft is written while you
                wait, in the session you are already in, but we do not put a guarantee on the clock
                until the refund that would back it runs by itself.
              </p>
            </div>

            <div className="cw-card--inset cw-lp-proof__item">
              <span className="cw-lp-proof__rank">Proof 04</span>
              <h3 className="cw-lp-proof__h">A person takes the case the machine should not</h3>
              <p className="cw-lp-proof__p">
                When the reason code is unclear or the case needs judgment, an experienced appeal
                writer picks it up the same day and edits the same document in the same tool, under
                the same citation rule. That is a tier with a price on it, not a support ticket.
              </p>
            </div>

            <div className="cw-card--inset cw-lp-proof__item">
              <span className="cw-lp-proof__rank">What is missing</span>
              <h3 className="cw-lp-proof__h">We have not published a win rate</h3>
              <p className="cw-lp-proof__p">
                Other tools in this category advertise reinstatement rates between 85 and 93
                percent. Amazon publishes no reinstatement data, so no one outside those companies
                can check them. Ours will appear once it has been measured — with the number of
                cases it was measured over and the method used to count them, and not a day before.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
