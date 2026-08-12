/**
 * "What happens after you paste" — three cards mirroring the real pipeline.
 *
 * Ported verbatim from `identity/landing/index.html`.
 *
 * MAT-0 (opaque) is not a style choice here: the sticky L1 header is already the
 * viewport's one translucent surface, and DESIGN_SYSTEM §7 caps a viewport at
 * three with the header counted first. H-8 was resolved by moving the page
 * inside the guard rather than loosening the guard, so these cards must stay
 * `.cw-mat-0`.
 */

export function HowItWorks() {
  return (
    <section className="cw-lp-section" aria-labelledby="how-title">
      <div className="cw-shell">
        <div className="cw-lp-head">
          <span className="cw-lp-eyebrow">How it works</span>
          <h2 className="cw-lp-h2" id="how-title">
            What happens after you paste
          </h2>
          <p className="cw-lp-lede">
            Three things come back, in this order, and the first two cost nothing.
          </p>
        </div>

        <ol className="cw-lp-grid-3">
          <li className="cw-card cw-mat-0 cw-lp-step">
            <span className="cw-lp-step__n">Step 01</span>
            <h3 className="cw-card__title">Your reason code, read out of your own notice</h3>
            <p className="cw-lp-step__body">
              A Section 3 case, an inauthentic-item case and a linked-account case take three
              different appeals, and most sellers cannot tell them apart. Your notice&rsquo;s own
              wording decides which one you are in — not a template, and not a guess.
            </p>
          </li>

          <li className="cw-card cw-mat-0 cw-lp-step">
            <span className="cw-lp-step__n">Step 02</span>
            <h3 className="cw-card__title">The policy clause, quoted, before you decide anything</h3>
            <p className="cw-lp-step__body">
              The clause you were charged under appears verbatim on screen, with the policy document
              and section it came from. It is free and it is on the page before any payment. Read
              it, check it against your notice, and decide from there.
            </p>
          </li>

          <li className="cw-card cw-mat-0 cw-lp-step">
            <span className="cw-lp-step__n">Step 03</span>
            <h3 className="cw-card__title">
              A drafted Plan of Action, and a list of what it still lacks
            </h3>
            <p className="cw-lp-step__body">
              You get a submission-ready Plan of Action plus a flat list of what is missing — the
              things this reason code is most often rejected for. You review it, you submit it, and
              you are told exactly where in Account Health it goes.
            </p>
          </li>
        </ol>

        <p className="cw-lp-note">
          Four fixed steps in code — classify, retrieve, draft, critique — rather than an agent
          improvising its own route. That is a deliberate choice, and it is why the wait can be
          narrated honestly instead of hidden behind a spinner. You stay in command throughout:
          nothing is filed, submitted or logged into on your behalf.
        </p>
      </div>
    </section>
  );
}
