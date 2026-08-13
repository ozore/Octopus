/**
 * S00 — `/`. The landing page.
 *
 * AUTHORITY: `identity/landing/index.html` — this is a PORT of that page into
 * React, section for section and sentence for sentence. It was written to spec and
 * reviewed adversarially; nothing here is a redesign. Also `USER_JOURNEY.md` §0.6
 * (S00), §7.4 (the boundary statement), `CORRECTIONS.md` §4 (the four forbidden
 * claim families and the six gates), `PLAN.md` A1–A6.
 *
 * ===========================================================================
 * THE FOUR THINGS THIS PAGE IS NOT ALLOWED TO DO
 *
 * 1. **Claim an outcome.** No accuracy figure (G1), no acceptance claim (G2), no
 *    "every wage determination" (G3), no time or money saved (G4), no "zero human
 *    minutes" (G5), and no description of the staleness credit (G6). Where the
 *    landing states what a gate permits today, that sentence is rendered from
 *    `GATE_MECHANISM` in the gates module rather than typed here — so a gate that
 *    clears changes this page by changing a counter, and nobody can promote a claim
 *    by editing copy.
 *
 * 2. **Print a number the system did not produce.** The prices come from the
 *    `plans` table through `assessUsage`; the corpus figures come from the
 *    reconciliation ledger; the specimen's money is computed by the money kernel
 *    from the determination's own published rates. The only bare numerals left are
 *    regulation citations and dated quotations of other people's published prices.
 *
 * 3. **Sell on fear.** There is no penalty figure anywhere on this page. The
 *    Davis-Bacon Act carries no civil money penalty, and the large per-violation
 *    numbers this category's marketing likes are borrowed from a different statute.
 *
 * 4. **Offer a person.** No contact form, no address, no chat, no demo, no quote,
 *    no call, no "talk to us about enterprise". A3, and the page says so out loud
 *    rather than leaving it as an absence.
 */

import Link from 'next/link';

import { getDb } from '@/db';
import { getConfig } from '@/lib/config';
import { readStatus } from '@/platform/ops/status';

import { ArtifactHero } from './_components/artifact-hero';
import { Comparison } from './_components/comparison';
import { PriceCards } from './_components/price-cards';
import {
  SPECIMEN_COMPUTED_1,
  SPECIMEN_HEADER,
  SPECIMEN_LABORER,
  rateInCents,
} from './_data/specimen';
import { readLadder } from './_lib/plans';
import { Cents } from '@/lib/money';
import { corpusCounts, corpusView, stamp } from '../status/_lib/present';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Ratepin — certified payroll with a rate of record',
  description:
    'Payroll CSV in, WH-347 and California eCPR XML out, with the wage-determination number, ' +
    'modification and publication date printed on the artifact itself.',
};

export default async function LandingPage(): Promise<React.ReactElement> {
  const db = await getDb();
  const config = getConfig();

  const [ladder, status, counts] = await Promise.all([
    readLadder(db),
    readStatus(db, {
      datedHours: config.FRESHNESS_DATED_HOURS,
      slaHours: config.FRESHNESS_SLA_HOURS,
      creditFloorCents: config.CREDIT_FLOOR_CENTS,
      creditCeilingPct: config.CREDIT_CEILING_PCT,
    }),
    corpusCounts(db),
  ]);

  const corpus = corpusView(status);
  const one = SPECIMEN_COMPUTED_1;
  const h = SPECIMEN_HEADER;

  return (
    <div>
      {/* ============================================================ HERO == */}
      <section className="rp-lp-hero" aria-labelledby="hero-h">
        <p className="rp-lp-eyebrow">
          Certified-payroll rate-of-record engine for federally funded construction
        </p>
        <h1 id="hero-h">
          Friday&rsquo;s certified payroll, with every rate traced to the wage determination it came
          from.
        </h1>
        <p className="rp-lp-hero__sub">
          Upload the week&rsquo;s payroll CSV. Ratepin returns the WH-347 and, in California, the
          eCPR XML — with the determination number, the modification number and the publication date
          printed on the artifact itself. Deterministic arithmetic. No model touches a number.
        </p>

        <div className="rp-btn-row rp-lp-actions">
          <Link className="rp-btn rp-btn--primary" href="/wh347">
            Make a WH-347 now — no account
          </Link>
          <a className="rp-btn" href="#artifact">
            Look at the artifact first
          </a>
          <Link className="rp-btn rp-btn--quiet" href="/pricing">
            The prices, in full
          </Link>
        </div>

        <p className="rp-boundary">
          <strong>Ratepin computes and formats. You certify and file. This is not legal advice.</strong>{' '}
          The statement of compliance is signed by the contractor under{' '}
          <a href="https://www.ecfr.gov/current/title-29/subtitle-A/part-5/subpart-A/section-5.5">
            29 CFR 5.5(a)(3)(ii)
          </a>
          , with falsification reachable under 18 U.S.C. 1001 and 31 U.S.C. 3729. That signature is
          yours, never ours, and nothing on this page changes that.
        </p>
      </section>

      {/* ======================================================== ARTIFACT == */}
      <section className="rp-lp-section" id="artifact" aria-labelledby="artifact-h">
        <div className="rp-lp-head">
          <p className="rp-lp-eyebrow">The thing you are buying</p>
          <h2 id="artifact-h">This is the whole product. Read the bottom five lines.</h2>
          <p className="rp-lp-lead">
            Everything else on this page is commentary on the footer of this document. Switch its
            state to see exactly what changes when Ratepin is less sure — and, more importantly,
            what does not.
          </p>
        </div>

        <ArtifactHero />

        <p className="rp-legal rp-lp-actions">
          Sample artifact, marked <strong>SPECIMEN</strong> on the sheet itself in all three states.{' '}
          <strong>
            The contractor, project, addresses, contract number and worker names are fictitious
          </strong>
          , as are the payroll&rsquo;s hours, plan credits and deductions. The wage determination
          number, modification number, publication date, group identifier, classification names and
          hourly rates are real: read from{' '}
          <a href={h.sourceUrl}>
            <code>sam.gov/api/prod/wdol/v1/wd/{h.wdNumber}/{h.modification}</code>
          </a>{' '}
          on 2026-08-13 and reproduced without alteration. Every money figure in the grid is derived
          from those rates by the arithmetic printed under it; nothing there is illustrative
          rounding. Form WH-347 is a U.S. Department of Labor form (OMB 1235-0008). Ratepin is not
          affiliated with, endorsed by, or acting on behalf of any government agency.
        </p>
      </section>

      {/* =========================================================== TRACE == */}
      <section className="rp-lp-section" aria-labelledby="trace-h">
        <div className="rp-lp-head">
          <p className="rp-lp-eyebrow">The differentiator, in one row</p>
          <h2 id="trace-h">
            Where the {Cents.toDollarString(rateInCents(one.straightRate))} came from
          </h2>
          <p className="rp-lp-lead">
            Every other tool in this category will print{' '}
            {Cents.toDollarString(rateInCents(one.straightRate))} on the form correctly. The question
            this product answers is the next one — the one a general contractor&rsquo;s compliance
            desk asks in March about a filing from August.
          </p>
        </div>

        <div className="rp-lp-trace">
          <figure className="rp-lp-figcell">
            <figcaption className="rp-lp-cap">
              <strong>On the form</strong> · column 6A, entry {one.input.no}
            </figcaption>
            <span className="rp-lp-figcell__v">
              {Cents.toDollarString(rateInCents(one.straightRate)).replace('$', '')}
            </span>
            <span className="rp-lp-cap">
              {one.input.classification.name} · <strong>$ per hour</strong>. 6A is the only hourly
              column on the WH-347; 6B and 6C beside it are weekly totals.
            </span>
          </figure>

          <div className="rp-lp-trace__arrow" aria-hidden="true">
            →
          </div>

          <figure className="rp-lp-fig">
            <figcaption className="rp-lp-cap">
              <strong>In the determination</strong> · verbatim, byte for byte
            </figcaption>
            <pre className="rp-lp-pre">
              {` ${one.input.classification.group} 04/16/2021
                              Rates      Fringes
`}
              <mark>ELECTRICIAN..................$ 22.00     11.77</mark>
            </pre>
            <span className="rp-lp-cap">
              Group <code>{one.input.classification.group}</code> — the <code>SU</code> prefix means
              a survey rate, not a collective bargaining agreement. The{' '}
              {Cents.toDollarString(rateInCents(one.input.classification.fringe))} fringe obligation
              is discharged <strong>per hour</strong> as{' '}
              {Cents.toDollarString(rateInCents(one.input.planCreditPerHour))} in plan contributions
              plus {Cents.toDollarString(rateInCents(one.input.cashInLieuPerHour))} cash in lieu —
              the combination method of 29 CFR 5.31(b)(3). On the form those become{' '}
              <strong>weekly totals</strong>: entry {one.input.no}&rsquo;s hours print 6B{' '}
              {Cents.toDollarString(one.col6B)} and 6C {Cents.toDollarString(one.col6C)}, and their
              sum is {Cents.toDollarString(one.fringeObligation)} — the hours times the
              determination&rsquo;s own fringe figure.
            </span>
          </figure>

          <div className="rp-lp-trace__arrow" aria-hidden="true">
            →
          </div>

          <figure className="rp-lp-fig">
            <figcaption className="rp-lp-cap">
              <strong>Read from</strong> · and kept
            </figcaption>
            <dl className="rp-lp-kv rp-lp-kv--boxed">
              <div>
                <dt>Determination</dt>
                <dd>{h.wdNumber}</dd>
              </div>
              <div>
                <dt>Modification</dt>
                <dd>{h.modification}</dd>
              </div>
              <div>
                <dt>Published</dt>
                <dd>{h.published}</dd>
              </div>
              <div>
                <dt>Counties</dt>
                <dd>{h.counties}</dd>
              </div>
              <div>
                <dt>Construction type</dt>
                <dd>{h.constructionType}</dd>
              </div>
            </dl>
            <span className="rp-lp-cap">
              Ratepin keeps a dated copy of every modification it has seen, beside the filings that
              used it. A superseded modification is <strong>also</strong> retrievable from
              SAM&rsquo;s own archive endpoint — we are not claiming otherwise. What is sold here is
              having it already assembled and already attached, not exclusive access to it.
            </span>
          </figure>
        </div>

        <div className="rp-lp-grid rp-lp-grid--2 rp-lp-actions">
          <div className="rp-lp-card rp-lp-card--ruled">
            <p className="rp-lp-card__t">The form itself now asks for this</p>
            <p className="rp-lp-card__b">
              The January 2025 revision of the WH-347 added a <strong>Wage Determination No.</strong>{' '}
              field to the header, alongside new columns 1A–1E, the (J)/(RA) marker,{' '}
              <strong>6B total fringe benefit credit</strong> and{' '}
              <strong>6C payment in lieu of fringe benefits</strong> — both of which WHD&rsquo;s
              instructions define as <strong>weekly totals</strong>, hours × the hourly figure, not
              the hourly figure itself. The header field is one box. Being able to defend what goes
              in it, every week, across every county you run, is the product.
            </p>
          </div>
          <div className="rp-lp-card">
            <p className="rp-lp-card__t">What we are not claiming</p>
            <p className="rp-lp-card__b">
              Not that this archive is unobtainable. We checked on <strong>2026-08-13</strong>:
              asking SAM&rsquo;s own download endpoint for a superseded revision returns a{' '}
              <code>303</code> straight to that revision&rsquo;s file in an S3 archive bucket, and at
              least one vendor resells the series by subscription. So no part of our case is that you
              could not get this yourself. What Ratepin sells is{' '}
              <strong>assembly, latency and the crosswalk your own corrections build</strong>: the
              determination pinned at award, the diff since, and the memory of which of your payroll
              titles is which classification.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================= HOW == */}
      <section className="rp-lp-section" id="how" aria-labelledby="how-h">
        <div className="rp-lp-head">
          <p className="rp-lp-eyebrow">Three steps, one session</p>
          <h2 id="how-h">CSV in. Artifact out. Nobody in between.</h2>
        </div>

        <div className="rp-lp-grid rp-lp-grid--3">
          <div className="rp-lp-card rp-lp-card--ruled">
            <span className="rp-lp-card__k">STEP 1</span>
            <p className="rp-lp-card__t">Upload the week&rsquo;s payroll CSV</p>
            <p className="rp-lp-card__b">
              Whatever your payroll system exports. You map your columns once and Ratepin remembers
              the mapping. Project setup is six fields — county, construction type, wage
              determination number (or find-it-for-me), funding source, week ending, and whether the
              contract is over $100,000, which is the fact that decides whether CWHSSA overtime
              applies at all.
            </p>
            <p className="rp-lp-card__b rp-ink-3">
              Ratepin does not run your payroll, compute your taxes or print your cheques. It reads
              the file yours produces.
            </p>
          </div>

          <div className="rp-lp-card rp-lp-card--ruled">
            <span className="rp-lp-card__k">STEP 2</span>
            <p className="rp-lp-card__t">
              Ratepin reads the pinned determination and does the arithmetic
            </p>
            <p className="rp-lp-card__b">
              Rates come from the modification pinned to the project at award, read from
              Ratepin&rsquo;s own mirror — <strong>never from a live call to SAM</strong>. Gross, the
              weekly fringe-credit and cash-in-lieu totals, CWHSSA overtime over 40 hours{' '}
              <em>on contracts over $100,000</em>, deductions and net are deterministic code under
              property tests. Every rate × hours product rounds half-up to cents at the line and is
              then summed in cents.
            </p>
            <p className="rp-lp-card__b rp-ink-3">
              The model does exactly two things and neither is arithmetic: it orders candidate
              classifications for an unmapped payroll title, and it drafts exception narrative into a
              fixed template.
            </p>
          </div>

          <div className="rp-lp-card rp-lp-card--ruled">
            <span className="rp-lp-card__k">STEP 3</span>
            <p className="rp-lp-card__t">Download the WH-347, and in California the eCPR XML</p>
            <p className="rp-lp-card__b">
              Both carry the provenance footer. The California file validates against the published
              eCPR schema, pinned by content hash rather than by its version attribute —{' '}
              <strong>generated, not acceptance-tested.</strong>
            </p>
            <p className="rp-lp-card__b rp-ink-3">
              You sign it. You file it. Ratepin never holds a portal credential and never submits
              anything on your behalf.
            </p>
          </div>
        </div>

        <div className="rp-alert rp-alert--notice rp-lp-actions">
          <span className="rp-alert__glyph" aria-hidden="true">
            §
          </span>
          <p className="rp-alert__title">
            The federal rule and the California schema disagree, and both are obeyed
          </p>
          <div className="rp-alert__body">
            <p>
              29 CFR 5.5(a)(3)(ii)(B) says full Social Security numbers{' '}
              <em>&ldquo;must not be included on weekly transmittals&rdquo;</em> and that an
              individually identifying number — <em>&ldquo;e.g., the last four digits&rdquo;</em> —
              is enough. California&rsquo;s eCPR schema declares <code>ssn</code> as{' '}
              <code>[0-9]{'{9}'}</code> and required. Same worker, same week, two artifacts with
              opposite rules. Ratepin stores the number encrypted, prints the last four on the
              WH-347, and decrypts the nine digits only into the California XML.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ U1-U4 == */}
      <section className="rp-lp-section" aria-labelledby="diff-h">
        <div className="rp-lp-head">
          <p className="rp-lp-eyebrow">Four facts, not four benefits</p>
          <h2 id="diff-h">What is actually different here</h2>
          <p className="rp-lp-lead">
            Each of these is a statement about how the software behaves, checkable in the free tier
            before an account exists. None of them is a claim about an outcome we have not measured.
          </p>
        </div>

        <div className="rp-lp-grid rp-lp-grid--2">
          <div className="rp-lp-card">
            <span className="rp-lp-card__k">U1</span>
            <p className="rp-lp-card__t">The modification number is on the artifact</p>
            <p className="rp-lp-card__b">
              Not in a dashboard, not in an audit log you would have to go and find. On the document
              that travels to the general contractor, in monospace, at a size that survives a fax. It
              is not configurable, not removable, and not subject to a white-label option at any tier
              — including the free one.
            </p>
          </div>
          <div className="rp-lp-card">
            <span className="rp-lp-card__k">U2</span>
            <p className="rp-lp-card__t">It withholds the signature block rather than guess</p>
            <p className="rp-lp-card__b">
              An unresolved line does not produce a warning you can click past. It produces a
              document with <strong>no signature line on it</strong>. A greyed-out signature line
              photocopies into a signable signature line; an absent one cannot be signed by accident.
            </p>
          </div>
          <div className="rp-lp-card">
            <span className="rp-lp-card__k">U3</span>
            <p className="rp-lp-card__t">It asks which classification once</p>
            <p className="rp-lp-card__b">
              An unmapped payroll title gets a closed choice: candidates drawn only from that
              determination&rsquo;s own classification list, each with its verbatim scope text and its
              rate. You pick. Ratepin remembers, per account, per determination, per title — and
              never asks again.
            </p>
          </div>
          <div className="rp-lp-card">
            <span className="rp-lp-card__k">U4</span>
            <p className="rp-lp-card__t">No demo, no quote, no call, ever</p>
            <p className="rp-lp-card__b">
              The prices are on this page. Upgrades, downgrades, cancellation and refunds are
              buttons. There is no support queue, no human reviews any output at any tier, and
              nothing in the compliance flow routes to a person. When Ratepin is unsure, it says so
              in the product and narrows what it claims.
            </p>
          </div>
        </div>
      </section>

      {/* ========================================================= REFUSALS == */}
      <section className="rp-lp-section" aria-labelledby="refuse-h">
        <div className="rp-lp-head">
          <p className="rp-lp-eyebrow">The whole error vocabulary</p>
          <h2 id="refuse-h">Four ways this software says no</h2>
          <p className="rp-lp-lead">
            There is no fifth. If a state is not one of these it is a defect, not a feature — and
            none of the four ends in &ldquo;contact us&rdquo;.
          </p>
        </div>

        <div className="rp-stack rp-stack--loose">
          <div className="rp-alert rp-alert--blocked">
            <span className="rp-alert__glyph" aria-hidden="true">
              ✕
            </span>
            <p className="rp-alert__title">P-A · A line is blocked, and the choice is closed</p>
            <div className="rp-alert__body">
              <p>
                <code>LOW VOLTAGE TECH</code> is not a classification on {h.wdNumber}. Ratepin will
                not invent one and will not sweep it into the nearest neighbour. It shows the
                candidates its ranking put first, each with the determination&rsquo;s own scope text,
                and the line stays blocked until you click.{' '}
                <strong>No confidence score resolves a classification.</strong>
              </p>
              <p>
                The same primitive covers premium hours. Hours in any premium-labelled column count
                toward the 40-hour threshold unless the row proves a ≥1.5× rate was actually paid — a
                mislabelled column cannot be allowed to delete a federal overtime obligation quietly.
                An unprovable premium label blocks its line, and the closed choice is again yours.
              </p>
            </div>
          </div>

          <div className="rp-alert rp-alert--blocked">
            <span className="rp-alert__glyph" aria-hidden="true">
              ✕
            </span>
            <p className="rp-alert__title">P-B · The artifact is a draft, and it looks like one</p>
            <div className="rp-alert__body">
              <p>
                Any unresolved line watermarks the document{' '}
                <strong>DRAFT — NOT CERTIFIABLE</strong>, prints a full-contrast band naming the
                count and the reason, and replaces the signature block. A DRAFT filing is{' '}
                <strong>never billed and never counts against your included filings</strong>. Flip
                the switch above the artifact to see it.
              </p>
              <p>
                A project whose <strong>contract value band is recorded as unknown</strong> produces
                the same document. CWHSSA&rsquo;s overtime clauses go into contracts over $100,000
                (29 CFR 5.5(b)); Davis-Bacon itself attaches above $2,000. Between those two numbers
                is an ordinary week for a specialty sub. Guessing <em>covered</em> invents a premium
                and can accuse a compliant contractor of underpaying; guessing <em>not covered</em>{' '}
                deletes a real obligation from a document signed under 18 U.S.C. 1001. So Ratepin
                asks once at setup and withholds the signature until it is answered.
              </p>
            </div>
          </div>

          <div className="rp-alert rp-alert--narrowed">
            <span className="rp-alert__glyph" aria-hidden="true">
              ◐
            </span>
            <p className="rp-alert__title">P-C · The claim narrows, the filing does not stop</p>
            <div className="rp-alert__body">
              <p>
                If SAM is unreachable at 16:00 on a Friday, your filing still generates. Generation
                reads the pinned mirror, never a live call, so an upstream outage cannot block a
                filing on a project whose determination is already pinned. What legitimately degrades
                is the freshness sentence:{' '}
                <em>&ldquo;newer-modification check unavailable since …&rdquo;</em>.{' '}
                <strong>Staleness never produces a DRAFT.</strong> Only an unresolved line does.
              </p>
            </div>
          </div>

          <div className="rp-alert rp-alert--declined">
            <span className="rp-alert__glyph" aria-hidden="true">
              §
            </span>
            <p className="rp-alert__title">
              P-D · The conclusion is declined, on the record, in neutral ink
            </p>
            <div className="rp-alert__body">
              <p>
                A real example from the determination on this page.{' '}
                <code>{SPECIMEN_LABORER.name}</code> is listed at{' '}
                <strong>{Cents.toDollarString(rateInCents(SPECIMEN_LABORER.rate))}</strong>. Executive Order 13658&rsquo;s floor for 11 May to 31
                December 2026 is <strong>$13.65</strong> — but the determination&rsquo;s own note
                says the order{' '}
                <em>
                  &ldquo;generally applies to contracts subject to the Davis-Bacon Act that were
                  awarded on or between January 1, 2015 and January 29, 2022, and that have not been
                  renewed or extended on or after January 30, 2022&rdquo;
                </em>
                , and{' '}
                <em>
                  &ldquo;does not apply to contracts subject only to the Davis-Bacon Related
                  Acts&rdquo;
                </em>
                .
              </p>
              <p>
                Ratepin does not hold your award date or your coverage basis. So it prints the rule,
                prints both figures, points at the paragraph — and{' '}
                <strong>declines to conclude</strong>. Same treatment for FAR 22.404-6
                effectiveness, which turns on a contracting-officer finding no software can observe,
                and for annualization under 29 CFR 5.25(c), which needs private-work hours a
                certified-payroll CSV does not contain.
              </p>
            </div>
          </div>
        </div>

        <p className="rp-legal rp-lp-actions">
          A declined conclusion is deliberately uncoloured. It is not a warning and not an error;
          colouring it would turn a statement of epistemic limits into an alarm.
        </p>
      </section>

      {/* ========================================================= FREE TOOLS = */}
      <section className="rp-lp-section" id="free" aria-labelledby="free-h">
        <div className="rp-lp-head">
          <p className="rp-lp-eyebrow">Free, unlimited, no account, no email wall</p>
          <h2 id="free-h">Check our arithmetic against yours before you pay us anything</h2>
          <p className="rp-lp-lead">
            A free WH-347 generator is table stakes — the DOL publishes a fillable form and at least
            three vendors ship a generator. Ours is not the differentiator.{' '}
            <strong>The footer on it is.</strong> Free artifacts carry the same provenance block as
            paid ones, because that block is how this product travels.
          </p>
        </div>

        <div className="rp-lp-grid rp-lp-grid--2">
          <div className="rp-lp-card rp-lp-card--ruled">
            <span className="rp-lp-card__k">FREE TOOL 1</span>
            <p className="rp-lp-card__t">Unlimited WH-347 generator</p>
            <p className="rp-lp-card__b">
              Paste or upload a week of payroll, map the columns, download the form. Both layouts —
              the January 2025 revision by default, the legacy layout behind a per-project flag,
              because the widely repeated 1 October 2026 cutover is vendor-asserted and we could not
              find it on a DOL page.
            </p>
            <p className="rp-lp-card__b rp-ink-3">
              <strong>The free tier makes zero model calls.</strong> Unmapped titles resolve from the
              deterministic crosswalk and the determination&rsquo;s own classification list. It is
              also the exact path the product falls back to if the model is unavailable.
            </p>
            <div className="rp-btn-row">
              <Link className="rp-btn rp-btn--primary" href="/wh347">
                Open the generator
              </Link>
            </div>
          </div>

          <div className="rp-lp-card rp-lp-card--ruled">
            <span className="rp-lp-card__k">FREE TOOL 2</span>
            <p className="rp-lp-card__t">County × craft rate lookup</p>
            <p className="rp-lp-card__b">
              Every rate shown with its determination number, modification, publication date, group
              identifier and the source URL it was read from.{' '}
              <strong>A rate without its determination beside it is not a rate</strong>, and this
              product will not render one.
            </p>
            <p className="rp-lp-card__b rp-ink-3">
              Free tools do not assert a pinned revision-of-record, compute a diff since award,
              remember your classifications or emit XML. That is where the paid line begins.
            </p>
            <div className="rp-btn-row">
              <Link className="rp-btn" href="/rates">
                Open the rate lookup
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================= PRICE == */}
      <section className="rp-lp-section" id="price" aria-labelledby="price-h">
        <div className="rp-lp-head">
          <p className="rp-lp-eyebrow">These are the prices</p>
          <h2 id="price-h">One meter: the certified filing</h2>
          <p className="rp-lp-lead">
            No project caps. No worker caps. No seats. No annual commitment required — annual is
            billed at ten months if you want it. Beyond the included count, overage is{' '}
            {ladder.tiers[0]?.overagePrice ?? '—'} per certified filing, and it stops at the
            difference to the tier above, where the plan upgrades itself. The bill can never exceed
            the tier above.
          </p>
        </div>

        <PriceCards ladder={ladder} />

        <div className="rp-lp-grid rp-lp-grid--2 rp-lp-actions">
          <div className="rp-lp-card">
            <p className="rp-lp-card__t">Cancelling does not take your records hostage</p>
            <p className="rp-lp-card__b">
              The full artifact archive exports on cancellation and stays available for 30 days. A
              failed payment restricts the account but never closes the archive — you can always get
              your filings out. There is no retention offer and no &ldquo;are you sure&rdquo; guilt
              screen.
            </p>
          </div>
          <div className="rp-lp-card">
            <p className="rp-lp-card__t">A DRAFT filing is never billed</p>
            <p className="rp-lp-card__b">
              The meter posts on certifiable artifacts only. If Ratepin could not resolve a line, it
              did not finish the job, and charging for a document with no signature block on it would
              be charging for our own refusal.
            </p>
          </div>
        </div>

        <div className="rp-lp-actions">
          <Comparison />
        </div>
      </section>

      {/* ======================================================== BOUNDARIES == */}
      <section className="rp-lp-section" id="boundaries" aria-labelledby="bound-h">
        <div className="rp-lp-head">
          <p className="rp-lp-eyebrow">Read this before you pay, not after</p>
          <h2 id="bound-h">What Ratepin does not do</h2>
          <p className="rp-lp-lead">
            Nine lines. They are here, at this size, because a buyer who has been sold to by this
            category before is defended against enthusiasm and undefended against subtraction — and
            because every one of them is simply true.
          </p>
        </div>

        <ul className="rp-lp-notlist">
          <li>
            Ratepin does not run payroll, compute taxes or print cheques — it reads the CSV yours
            produces.
          </li>
          <li>
            Ratepin does not file, submit or e-sign anything, and never holds your portal
            credentials.
          </li>
          <li>
            Ratepin does not support union CBA fringe schedules. They are not in public wage
            determinations.
          </li>
          <li>Ratepin does not cover Service Contract Act determinations.</li>
          <li>
            Beyond the federal WH-347, Ratepin covers California eCPR only. NY, WA, NJ and IL are not
            in v1.
          </li>
          <li>
            Ratepin does not file SF-1444 conformance requests, or opine on apprenticeship ratios.
          </li>
          <li>
            Ratepin does not conclude whether a wage determination is effective. It shows the dates
            and the rule.
          </li>
          <li>
            Ratepin does not decide whether CWHSSA applies to your contract, and does not compute
            FLSA overtime. You record the contract value band; &ldquo;unknown&rdquo; yields a draft,
            not a guess.
          </li>
          <li>No human reviews any Ratepin output, at any tier. There is no support queue.</li>
        </ul>

        <div className="rp-lp-grid rp-lp-grid--2 rp-lp-actions">
          <div className="rp-lp-card">
            <p className="rp-lp-card__t">Two more, added after we read the regulations properly</p>
            <p className="rp-lp-card__b">
              <strong>Annualization is out of scope.</strong> 29 CFR 5.25(c) requires fringe
              contributions to be annualized over total hours on private and covered work; a
              certified-payroll CSV does not contain private hours. The hourly credit behind column
              6B is a customer-asserted input — Ratepin multiplies it by the week&rsquo;s hours to
              produce the weekly total the form asks for, prints that, and disclaims it on the
              artifact. <strong>Unfunded plan credits are refused</strong>, not approximated — 29 CFR
              5.28 makes them non-bona-fide absent WHD approval.
            </p>
          </div>
          <div className="rp-lp-card">
            <p className="rp-lp-card__t">And one thing we will never sell on</p>
            <p className="rp-lp-card__b">
              Fear. There is no Davis-Bacon civil money penalty, and the large per-violation figures
              this category&rsquo;s marketing likes to quote are borrowed from a different statute.
              You will find no penalty number anywhere on this site. The reason to buy this is that
              the general contractor does not release the draw until Friday&rsquo;s form is right — a
              gate that arrives every week, on its own, without anyone having to frighten you about
              it.
            </p>
          </div>
        </div>
      </section>

      {/* ============================================================ CLAIMS == */}
      <section className="rp-lp-section" aria-labelledby="claims-h">
        <div className="rp-lp-head">
          <p className="rp-lp-eyebrow">The claims policy, published</p>
          <h2 id="claims-h">What we are not allowed to tell you yet</h2>
          <p className="rp-lp-lead">
            Every performance claim on this site is rendered from a counter, not typed into a
            template. While a gate is locked the page renders the mechanism sentence — what the
            software does — and the outcome sentence is structurally absent. A measured claim that
            regresses is demoted back to the mechanism automatically.{' '}
            <strong>Nobody here can promote a claim by editing copy.</strong> The live counters are
            on <Link href="/status">the status page</Link>.
          </p>
        </div>

        <div className="rp-lp-grid rp-lp-grid--3">
          {status.gates.map((gate) => (
            <div key={gate.reading.key} className="rp-lp-gate">
              <span className="rp-lp-gate__id">
                {gate.reading.key} · {gate.reading.state.toUpperCase()}
              </span>
              <p className="rp-lp-gate__locked">{gate.reading.description}</p>
              <p className="rp-lp-gate__now">{gate.mechanism}</p>
              {gate.outcome !== null && <p className="rp-lp-gate__now">{gate.outcome}</p>}
            </div>
          ))}
        </div>

        <p className="rp-legal rp-lp-actions">
          The standard being applied is the FTC&rsquo;s: an advertiser must hold a reasonable basis
          for express and implied objective claims <em>before</em> they are disseminated, and there
          is no AI exemption from it. Four claims that appeared in this company&rsquo;s own earlier
          pitch documents were falsified during validation — one about clerical time, one about
          penalty exposure, one about competitors&rsquo; pricing structure, and one about the
          wage-determination archive. All four are permanently retired and are named here only by
          subject, never restated, because a retired claim printed inside its own correction is still
          a claim printed. What replaced the fourth is on this page as a plain fact: the archive is
          obtainable elsewhere, and Ratepin is sold on assembly, latency and your own crosswalk.
        </p>
      </section>

      {/* ============================================================ CORPUS == */}
      <section className="rp-lp-section" id="corpus" aria-labelledby="corpus-h">
        <div className="rp-lp-head">
          <p className="rp-lp-eyebrow">The sceptic&rsquo;s landing spot</p>
          <h2 id="corpus-h">Corpus status, live and dated</h2>
          <p className="rp-lp-lead">
            The only marketing asset here that gets <em>more</em> persuasive the harder you look at
            it. These figures are read from the same read model the status page publishes, at the
            moment this page rendered, and nothing on them is rounded in our favour.
          </p>
        </div>

        <div className="rp-lp-grid rp-lp-grid--3">
          <dl className="rp-lp-kv rp-lp-card">
            <div>
              <dt>Active determinations in our mirror</dt>
              <dd>{counts === null ? 'not yet counted' : counts.ourActive}</dd>
            </div>
            <div>
              <dt>Active determinations in the index</dt>
              <dd>{counts === null ? 'not yet counted' : counts.indexTotalActive}</dd>
            </div>
            <div>
              <dt>Reconciliation delta</dt>
              <dd>{counts === null ? '—' : `${String(counts.deltaPct)}%`}</dd>
            </div>
            <div>
              <dt>Counted at</dt>
              <dd>{counts === null ? '—' : stamp(counts.at)}</dd>
            </div>
          </dl>
          <dl className="rp-lp-kv rp-lp-card">
            <div>
              <dt>Freshness state</dt>
              <dd>{corpus.freshnessState}</dd>
            </div>
            <div>
              <dt>Snapshot promoted at</dt>
              <dd>{corpus.promotedAt ?? 'none yet'}</dd>
            </div>
            <div>
              <dt>Snapshot hash</dt>
              <dd>{corpus.snapshotRef ?? 'none yet'}</dd>
            </div>
            <div>
              <dt>Ladder level</dt>
              <dd>{status.ladderLevel}</dd>
            </div>
          </dl>
          <dl className="rp-lp-kv rp-lp-card">
            <div>
              <dt>Blocks a filing on a pinned project</dt>
              <dd>no</dd>
            </div>
            <div>
              <dt>Blocks new pins right now</dt>
              <dd>{corpus.blocksNewPins ? 'yes' : 'no'}</dd>
            </div>
            <div>
              <dt>Open incidents</dt>
              <dd>{status.incidents.length}</dd>
            </div>
            <div>
              <dt>Gates cleared</dt>
              <dd>
                {status.gates.filter((gate) => gate.reading.state === 'unlocked').length} of{' '}
                {status.gates.length}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rp-stack rp-stack--loose rp-lp-actions">
          <details className="rp-disclose">
            <summary>
              What &ldquo;two independent ingest paths&rdquo; actually buys, and what it does not
            </summary>
            <div className="rp-disclose__body rp-prose">
              <p>
                Ratepin reads the search index and, separately, each determination&rsquo;s own
                document — which embeds its Modification Number and Publication Date table, the only
                publisher-authored assertion in the pipeline. When the two disagree on a pinned
                field, neither is published: promotion is blocked for that determination and its rate
                assertions narrow to the last agreed snapshot.
              </p>
              <p>
                This is worth stating precisely, because it is easy to oversell. The two paths share
                DNS, CDN and authentication, so they detect <em>divergence</em>, not <em>outage</em>.
                Disagreement is also field-scoped rather than record-scoped: on one determination we
                checked, the index and the document disagreed about a boolean flag we never use and
                about county codes, while the prose was consistent. Blocking the whole record over
                that would have blocked a live determination for no reason.
              </p>
            </div>
          </details>

          <details className="rp-disclose">
            <summary>Why an outage cannot stop your Friday</summary>
            <div className="rp-disclose__body rp-prose">
              <p>
                A wage determination is pinned to a project at award and does not move. The nightly
                crawl exists to detect that a <em>new modification</em> was published — not to supply
                the rate at generation time. Generation reads the mirror. So the upstream being
                unreachable at 16:00 on a Friday cannot block a filing on an already-pinned project.
              </p>
              <p>
                What it legitimately blocks is first-time resolution for a brand-new project, and the
                assertion that no newer modification exists. The second degrades to a dated, narrowed
                sentence in the footer. Fail-closed is aimed at the novel rate claim, not at your
                filing.
              </p>
            </div>
          </details>

          <details className="rp-disclose">
            <summary>What we depend on, stated as a risk rather than a feature</summary>
            <div className="rp-disclose__body rp-prose">
              <p>
                The endpoints Ratepin reads are undocumented and unversioned. The index alias is an
                internal, date-stamped name; nothing about it is a contract, and it can change
                without notice. The index also caps a result window, which makes a full historical
                crawl impossible in one pass and forces slicing by state and year.
              </p>
              <p>
                The mitigation is not avoidance — there is no alternative source — it is making the
                failure boring. Every document is stored verbatim with its response hash, forever. A
                parse failure never overwrites a good record. A total loss of upstream access
                degrades Ratepin to &ldquo;cannot detect new modifications since <em>date</em>&rdquo;,
                which is a sentence in a footer, not a dead product.
              </p>
            </div>
          </details>
        </div>
      </section>

      {/* =============================================================== END == */}
      <section className="rp-lp-section rp-lp-section--tight" aria-labelledby="end-h">
        <div className="rp-lp-head">
          <h2 id="end-h">The rate of record, printed on the form.</h2>
          <p className="rp-lp-lead">
            Make one for free and look at the bottom of it. If the footer does not change how you
            feel about Friday, do not buy anything.
          </p>
        </div>
        <div className="rp-btn-row">
          <Link className="rp-btn rp-btn--primary" href="/wh347">
            Make a WH-347 — no account
          </Link>
          <Link className="rp-btn" href="/pricing">
            See the four prices
          </Link>
        </div>
      </section>

      {/* ============================================================ SOURCES == */}
      <section className="rp-lp-section rp-lp-section--tight" aria-labelledby="src-h">
        <h2 id="src-h" className="rp-t-lead">
          Sources
        </h2>
        <p className="rp-legal">
          Every figure, quotation and rate quoted on this page resolves to one of these. All were
          fetched on 2026-08-13.
        </p>
        <ol className="rp-lp-refs">
          <li>
            <a href="https://www.dol.gov/agencies/whd/forms/wh347">
              dol.gov/agencies/whd/forms/wh347
            </a>{' '}
            — WH-347 columns 1A–1E, 2, 3, 4, 5, 6A, 6B, 6C, 7A, 7B, 8, 9; OMB 1235-0008; expires
            01/31/2028. Source of the three unit rules on the specimen: 6A is the actual hourly rate
            paid and excludes cash in lieu; 6B and 6C are weekly totals
          </li>
          <li>
            <a href="https://www.dol.gov/sites/dolgov/files/WHD/legacy/files/wh347.pdf">
              dol.gov/…/wh347.pdf
            </a>{' '}
            — the form PDF; MediaBox 0 0 792 612 pt on both pages = Letter landscape, which is the
            geometry the specimen above is drawn to
          </li>
          <li>
            <a href="https://www.ecfr.gov/current/title-29/subtitle-A/part-5/subpart-A/section-5.5">
              eCFR 29 CFR 5.5
            </a>{' '}
            — the three certifications of (a)(3)(ii)(C); the SSN rule for weekly transmittals;{' '}
            <strong>(b) is the CWHSSA threshold</strong> ·{' '}
            <a href="https://www.law.cornell.edu/uscode/text/40/3142">40 U.S.C. 3142(a)</a> — where
            Davis-Bacon itself attaches
          </li>
          <li>
            <a href="https://www.ecfr.gov/current/title-29/subtitle-A/part-5/subpart-B/section-5.25">
              29 CFR 5.25
            </a>{' '}
            — annualization ·{' '}
            <a href="https://www.ecfr.gov/current/title-29/subtitle-A/part-5/subpart-B/section-5.28">
              5.28
            </a>{' '}
            — unfunded plans ·{' '}
            <a href="https://www.ecfr.gov/current/title-29/subtitle-A/part-5/subpart-B/section-5.31">
              5.31
            </a>{' '}
            — discharging the wage obligation, including the combination method used on the specimen
            ·{' '}
            <a href="https://www.ecfr.gov/current/title-29/subtitle-A/part-5/subpart-B/section-5.32">
              5.32
            </a>{' '}
            — the regular rate the overtime premium is computed on
          </li>
          <li>
            <a href={h.sourceUrl}>
              sam.gov/api/prod/wdol/v1/wd/{h.wdNumber}/{h.modification}
            </a>{' '}
            — the determination on this page: Modification {h.modification}, published {h.published},
            Bedford and Coffee Counties, Building; group {one.input.classification.group}; the rates
            and the EO 13658 note quoted above
          </li>
          <li>
            <a href="https://www.acquisition.gov/far/22.404-6">FAR 22.404-6</a> — wage determination
            effectiveness, the conclusion Ratepin declines
          </li>
          <li>
            <a href="http://www.dir.ca.gov/dlse/CPR-Prod-Test/CPR.xsd">
              dir.ca.gov/dlse/CPR-Prod-Test/CPR.xsd
            </a>{' '}
            — the California eCPR schema, pinned by content hash ·{' '}
            <a href="https://www.dir.ca.gov/Public-Works/Certified-Payroll-Reporting.html">
              dir.ca.gov — certified payroll reporting
            </a>
          </li>
          <li>
            <a href="https://lcptracker.com/solutions/lcpcertified/">
              lcptracker.com/solutions/lcpcertified
            </a>{' '}
            and{' '}
            <a href="https://www.certifiedpayrollpro.com/pricing">
              certifiedpayrollpro.com/pricing
            </a>{' '}
            — the two vendors quoted in the comparison table, read on 2026-08-13
          </li>
          <li>
            <a href="https://www.ftc.gov/legal-library/browse/ftc-policy-statement-regarding-advertising-substantiation">
              FTC — Policy Statement Regarding Advertising Substantiation
            </a>{' '}
            — the standard the claims policy implements ·{' '}
            <a href="https://www.w3.org/TR/WCAG22/">WCAG 2.2</a> — the accessibility floor this page
            is built to
          </li>
        </ol>
      </section>
    </div>
  );
}
