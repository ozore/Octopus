/**
 * S00 — the entry route. PLACEHOLDER.
 *
 * This file is the scaffold's stand-in. The real S00 belongs to the screens wave
 * (USER_JOURNEY.md §0.6), which owns the marketing surface, the free WH-347
 * generator entry point and the county x craft pages. What it establishes here is
 * the shape everything else has to keep.
 *
 * EVERY SENTENCE BELOW IS A MECHANISM SENTENCE. CORRECTIONS.md §0.2: while a gate
 * is locked the renderer emits how it works, never what it achieves — we state
 * what we do and decline to state what it achieves (P-D). So there is no accuracy
 * figure (G1), no acceptance claim (G2), no "every wage determination" (G3), no
 * time saved (G4) and no "zero human minutes" (G5). Those sentences are rendered
 * from `claim_gates`, and a gate that has not cleared renders nothing.
 *
 * Also absent, permanently: any contact affordance. A3.
 */

export default function HomePage() {
  return (
    <div className="rp-stack rp-stack--section rp-measure">
      <section className="rp-stack">
        <h1>Certified payroll with a rate of record</h1>
        <p className="rp-t-lead">
          Ratepin takes a payroll CSV and emits a WH-347 with its statement of compliance, and — in
          California — an eCPR XML. Every rate on the artifact traces to a named wage-determination
          number, its revision, and the date that revision was published.
        </p>
      </section>

      <section className="rp-stack">
        <h2>How the rate of record works</h2>
        <ul className="rp-stack rp-stack--tight">
          <li>
            A project is pinned once, at setup, to one wage determination at one revision. The pin
            is immutable; a re-pin is a new record and always your click.
          </li>
          <li>
            Generation reads that pinned revision from a local mirror. It does not call SAM.gov, so
            SAM.gov being unreachable on a Friday afternoon cannot block a filing.
          </li>
          <li>
            When we have not been able to check for a newer revision, the artifact still generates
            and the sentence about currency narrows, with the timestamp of the last successful
            check on the document.
          </li>
          <li>
            Every artifact carries the determination number, the revision, the publication date, the
            corpus snapshot hash and the generation timestamp — printed on the document, not looked
            up afterwards.
          </li>
        </ul>
      </section>

      <section className="rp-stack">
        <h2>What Ratepin will not do</h2>
        <ul className="rp-stack rp-stack--tight">
          <li>
            It does not conclude which revision applies to your contract. That turns on FAR 22.404-6
            and on findings by your contracting officer that Ratepin cannot observe.
          </li>
          <li>
            It does not guess a classification. An unmapped trade blocks that payroll line and shows
            you the determination&rsquo;s own candidates with their scope text; your choice is
            remembered for that account.
          </li>
          <li>
            It does not guess whether the 40-hour overtime clause is in your contract. If you have
            not recorded which side of $100,000 the contract sits on, the signature block is
            withheld rather than a premium being invented or omitted.
          </li>
          <li>
            It does not hold your portal credentials, and it does not file, submit or sign anything
            on your behalf.
          </li>
        </ul>
      </section>
    </div>
  );
}
