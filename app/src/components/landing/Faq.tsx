/**
 * FAQ — five items, R-3 register: the plainest and slowest copy on the page.
 *
 * Ported verbatim from `identity/landing/index.html`, including both review
 * fixes that live here: H-7 (the third answer explains, on the page, why there
 * is no delivery-time guarantee) and C-1 (the fifth answer describes Shield as
 * email forwarding and turns "we never log into your account" into the
 * positioning asset it actually is).
 *
 * `<details>`/`<summary>` rather than a JS accordion: it works before hydration,
 * it is keyboard-operable for free, and it is the shape the browser already
 * announces correctly.
 */

export function Faq() {
  return (
    <section className="cw-lp-section" aria-labelledby="faq-title">
      <div className="cw-shell">
        <div className="cw-lp-head">
          <span className="cw-lp-eyebrow">Questions</span>
          <h2 className="cw-lp-h2" id="faq-title">
            What sellers ask first
          </h2>
        </div>

        <div className="cw-lp-faq">
          <details className="cw-lp-faq__item">
            <summary className="cw-lp-faq__q">
              Do you need my Seller Central login?
              <span className="cw-lp-faq__sign" aria-hidden="true">
                +
              </span>
            </summary>
            <div className="cw-lp-faq__a">
              <p>
                No, and you will never be asked for one. You paste the text of your notice; that is
                the only thing that crosses over. Nothing is filed, submitted or logged into on your
                behalf — when your Plan of Action is ready, you are shown exactly where in Account
                Health to paste it, and you submit it yourself.
              </p>
            </div>
          </details>

          <details className="cw-lp-faq__item">
            <summary className="cw-lp-faq__q">
              Can you guarantee I get reinstated?
              <span className="cw-lp-faq__sign" aria-hidden="true">
                +
              </span>
            </summary>
            <div className="cw-lp-faq__a">
              <p>
                No. Amazon and Walmart decide that, and anyone who tells you otherwise is selling
                you something they do not control.
              </p>
              <p>
                What is guaranteed is narrower and entirely in our hands: revisions continue until
                you are reinstated or you tell us to stop, and if your first submission is rejected,
                your human review is free.
              </p>
              <p>
                You may notice there is no delivery-time guarantee on this page. Drafting takes
                minutes, not days, and we could say so with a number — but a guarantee is only worth
                the refund behind it, and ours pays out automatically or not at all. The number goes
                up when that job is running, not before.
              </p>
            </div>
          </details>

          <details className="cw-lp-faq__item">
            <summary className="cw-lp-faq__q">
              What if my case is one you should not be drafting?
              <span className="cw-lp-faq__sign" aria-hidden="true">
                +
              </span>
            </summary>
            <div className="cw-lp-faq__a">
              <p>
                You will be told so, in plain words, before you are charged. Some deactivations turn
                on facts a document cannot fix, and some notices are too ambiguous to classify with
                confidence. Guessing there would cost you an appeal attempt you do not get back.
              </p>
              <p>
                In that situation you get two things instead of a draft: a person who can take the
                case if it is one that judgment can solve, and a referral if it is not. You have not
                been charged either way.
              </p>
            </div>
          </details>

          <details className="cw-lp-faq__item">
            <summary className="cw-lp-faq__q">
              Why $149 when there is a $97 tool?
              <span className="cw-lp-faq__sign" aria-hidden="true">
                +
              </span>
            </summary>
            <div className="cw-lp-faq__a">
              <p>
                AppealDesk is honest that it walks away when a case gets hard — it publishes the
                categories it refuses. Clausewright built the tier that takes those cases instead,
                and that tier is why the $149 one exists at the price it does.
              </p>
              <p>
                The $52 difference buys unlimited revisions, the Evidence Kit, the human tier
                standing behind the hard cases, 30 days of Shield, and the clause on screen before
                you pay. If none of that is worth $52 to you, the free Decoder still tells you your
                reason code and shows you your clause, and you are welcome to take it and write the
                appeal yourself.
              </p>
            </div>
          </details>

          <details className="cw-lp-faq__item">
            <summary className="cw-lp-faq__q">
              What are the 30 days of Shield, and what happens at the end of them?
              <span className="cw-lp-faq__sign" aria-hidden="true">
                +
              </span>
            </summary>
            <div className="cw-lp-faq__a">
              <p>
                You forward the account-health emails Amazon and Walmart send you — one rule, set
                once. Each one that arrives is read, and when something moves you get an alert
                naming the specific policy at risk. We never log into your account, so Shield sees
                what you forward and nothing else. Thirty days come with every Rescue, at no extra
                charge, with your card kept on file.
              </p>
              <p>
                On day 25 you get an email that opens with what those 30 days actually flagged. Keep
                Shield at $49/mo, or let it lapse — both are one click, presented the same size, in
                the same email. Nothing renews quietly.
              </p>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
