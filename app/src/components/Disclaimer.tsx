/**
 * "Not legal advice."
 *
 * Spec: B11, NAMING.md §5 invariant 3, DESIGN_SYSTEM.md §8.10 — it renders on
 * every surface that shows a draft, at `--cw-ink-2` rather than
 * `--cw-ink-disabled`, because "prominent" means legible and this is the one
 * place where quiet type would be a compliance failure rather than a taste
 * choice.
 *
 * It lives in the app layout, not in each page, so no route can omit it by
 * forgetting — the same reasoning ADR-004 applies to the citation gate.
 */

export function Disclaimer() {
  return (
    <p className="cw-disclaimer">
      Not legal advice. Clausewright drafts documents you review and submit yourself; it does not
      advise you, represent you, or act for you before any marketplace, agency or court. Marketplace
      policy is contract, not law. Clausewright is an independent product and is not affiliated
      with, endorsed by, or sponsored by Amazon.com, Inc. or Walmart Inc.; those names are used only
      to identify the marketplaces this product works with. It is not a law firm and does not
      provide legal advice. No account credentials are ever requested, stored or used.
    </p>
  );
}
