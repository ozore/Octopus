/**
 * Landing footer — the wordmark, the category frame, and the full disclaimer.
 *
 * Ported verbatim from `identity/landing/index.html`.
 *
 * The wordmark's accented `w` is the only decoration NAMING.md §3.5 permits, and
 * only at the mark's largest sizes; `.cw-wordmark--lg` is where that rule lives.
 * B11's "not legal advice" runs here at `.cw-disclaimer` — legible, not quiet.
 */

export function LandingFooter() {
  return (
    <footer className="cw-lp-footer">
      <div className="cw-shell">
        <div className="cw-lp-footer__top">
          <div>
            <span className="cw-wordmark cw-wordmark--lg">
              clause<span className="cw-wordmark__mark">w</span>right
            </span>
            <p className="cw-lp-footer__meta">Suspension defense. Amazon and Walmart.</p>
          </div>
          <p className="cw-lp-footer__frame">
            Clausewright is a suspension defense copilot for Amazon and Walmart sellers. You paste
            the notice you were sent; you get the reason code, the policy clause you were charged
            under with its source, and a submission-ready Plan of Action — with an experienced
            appeal writer available the same day when a case needs judgment.
          </p>
        </div>

        <p className="cw-disclaimer">
          Not legal advice. Clausewright drafts documents you review and submit yourself; it does
          not advise you, represent you, or act for you before any marketplace, agency or court.
          Marketplace policy is contract, not law. Clausewright is an independent product and is not
          affiliated with, endorsed by, or sponsored by Amazon.com, Inc. or Walmart Inc.; those
          names are used only to identify the marketplaces this product works with. Prices shown are
          in US dollars. No account credentials are ever requested, stored or used.
        </p>

        <p className="cw-lp-footer__meta">© 2026 Clausewright.</p>
      </div>
    </footer>
  );
}
