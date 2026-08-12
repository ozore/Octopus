/**
 * The Decoder page — one textarea, one button.
 *
 * Spec: ARCHITECTURE.md §3.1, USER_JOURNEY.md, DESIGN_SYSTEM.md.
 *
 * This is the scaffold's placeholder shell: the SSE stream, the loss counter's
 * live arithmetic and the paywall are built on top of it. Three constraints
 * apply to whatever replaces this and are recorded here so they are not
 * rediscovered by accident:
 *
 *  - NO SIGNUP, NO DASHBOARD, NO NAVIGATION BEFORE PAYMENT (N4). Email is
 *    captured only at Stripe Checkout. Every field before the paywall is a
 *    conversion tax on a buyer who is mid-panic.
 *
 *  - The copy says "policy clause" and "your account went dark" — never "POA",
 *    never "Plan of Action", never "legal clause" (NAMING.md §5 invariants 1–2;
 *    Nielsen heuristic #2).
 *
 *  - NO DELIVERY-TIME GUARANTEE ON ANY SURFACE until gate G6 clears
 *    (ARCHITECTURE.md §9): the automatic SLO-refund job must be running in
 *    production and exercised on a deliberately-breached test case first. Copy
 *    may describe what the product does; it may not promise a remedy we cannot
 *    pay automatically.
 */

export default function DecoderPage() {
  return (
    <div className="cw-stack cw-stack--section cw-measure">
      <section className="cw-stack">
        <h1>Your account went dark. Let&apos;s find the clause.</h1>
        <p className="cw-ink-2">
          Paste the deactivation notice exactly as the marketplace sent it. You&apos;ll see the
          reason code it maps to, the policy clause it was issued under, and an honest readiness
          check — before you pay anything.
        </p>
      </section>

      <form className="cw-stack" action="/api/appeal" method="post">
        <div className="cw-field">
          <label className="cw-field__label" htmlFor="notice">
            Your deactivation notice
          </label>
          <textarea
            className="cw-paste"
            id="notice"
            name="notice"
            placeholder="Paste the full email or Seller Central message here…"
            required
          />
          <p className="cw-field__help">
            We never ask for your seller login, and we never submit on your behalf.
          </p>
        </div>

        <button className="cw-btn cw-btn--primary cw-btn--lg cw-btn--block" type="submit">
          <span className="cw-btn__label">Find my policy clause</span>
          <span className="cw-btn__reason">Free — no account needed</span>
        </button>
      </form>
    </div>
  );
}
