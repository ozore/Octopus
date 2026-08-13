/**
 * `/legal` — the standing boundary statement, the privacy scope, and the sentence
 * this whole company is organised around.
 *
 * AUTHORITY: `USER_JOURNEY.md` §7.4 (the boundary statement is permanent structure,
 * never dismissible, never in a modal), §12.1–§12.2 (export and deletion: exactly
 * what goes and exactly what stays), §12.4 (the model question, answered in copy
 * rather than by a reply), `ARCHITECTURE.md` §5.5 (we do not quote a backup
 * retention figure we have not measured), §10.4, `CORRECTIONS.md` §4.
 *
 * ===========================================================================
 * THREE PROPERTIES OF THIS PAGE
 *
 * 1. **It is not a terms-of-service dump.** It states the boundary, the data scope
 *    and the deletion consequence, in that order, because those are the three
 *    things a payroll administrator signing a federal certification actually needs
 *    from us before she uploads a worker's Social Security number.
 *
 * 2. **The retention obligation is stated as HERS.** 29 CFR 5.5(a)(3)(i)(A) puts a
 *    three-year record-keeping duty on the contractor. Deleting a Ratepin account
 *    does not delete that duty — it deletes our copy. Making that fine print would
 *    be the single most damaging design decision available to us, so it is a
 *    heading.
 *
 * 3. **There is no rights-request form, because there is no queue behind one.**
 *    Export and deletion are buttons in the product. A page that told a customer to
 *    write to an address in order to exercise a right they can exercise with a click
 *    would be manufacturing the human minute this company is built not to spend.
 *
 * 4. **The deletion tables are rendered from `DELETION_SCOPE`, not written here.**
 *    They used to be prose, and the prose said deletion erased "every project, pin,
 *    payroll line, filing and artifact" while the executor retained the filings, the
 *    artifacts, the last-4 and names printed into them, and the projects and pins,
 *    for three years (`ARCHITECTURE.md` §5.5 — the evidence layer of a signed federal
 *    certification, and 29 CFR 5.5(a)(3)(i)(A)'s own three-year floor). A public
 *    privacy promise that a regulator can falsify with one query is the worst
 *    sentence on a site, and the fix is not a better sentence: it is that this page,
 *    the in-app confirmation screen and the erasure report are three renderings of
 *    one array, so the promise and the executor cannot disagree again.
 */

import Link from 'next/link';

import { getDb } from '@/db';
import {
  ARTIFACT_RETENTION_YEARS,
  DELETION_BOUNDARY_STATEMENT,
  DELETION_ERASED,
  DELETION_RETAINED,
} from '@/platform/account/deletion';
import { backupWindowSentence, oldestRestorableAt } from '@/platform/ops/status';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Legal and privacy — Ratepin',
  description:
    'What Ratepin does and does not do, what we hold, what deletion erases and what it does ' +
    'not, and the statement that we compute and format while you certify and file.',
};

export default async function LegalPage(): Promise<React.ReactElement> {
  const db = await getDb();
  const backupSentence = backupWindowSentence(await oldestRestorableAt(db));

  return (
    <div className="rp-stack rp-stack--section">
      <section className="rp-lp-hero">
        <p className="rp-lp-eyebrow">The standing statement</p>
        <h1>We compute and format. You certify and file.</h1>
        <p className="rp-lp-hero__sub">
          Ratepin reads a payroll CSV and writes a WH-347 and, in California, an eCPR XML, with the
          wage determination number, modification and publication date printed on the artifact. The
          statement of compliance on that artifact is signed by the contractor under 29 CFR
          5.5(a)(3)(ii), with falsification reachable under 18 U.S.C. 1001 and 31 U.S.C. 3729. That
          signature is yours. It is never ours, and nothing we publish changes that.
        </p>
        <p className="rp-boundary">
          <strong>This is not legal advice.</strong> No statement made by Ratepin — in the product,
          on an artifact, or on this site — is a legal conclusion about your contract, your
          classifications, your fringe plans, your deductions, or the effectiveness of any wage
          determination.
        </p>
      </section>

      {/* ---------------------------------------------------- WHAT WE DECLINE -- */}
      <section className="rp-lp-section">
        <div className="rp-lp-head">
          <p className="rp-lp-eyebrow">The conclusions we decline</p>
          <h2>What Ratepin will never assert</h2>
          <p className="rp-lp-lead">
            Each of these is a question that turns on a fact we do not hold or a finding no software
            can observe. Where one arises, the product prints the rule, prints the figures, points at
            the paragraph — and declines to conclude.
          </p>
        </div>
        <ul className="rp-lp-notlist">
          <li>That a filing is accepted, compliant or approved by any receiving party.</li>
          <li>
            That a wage determination is <em>effective</em> for your contract. FAR 22.404-6 turns on
            a contracting-officer finding.
          </li>
          <li>
            That Executive Order 13658&rsquo;s floor applies. It depends on the award date and on
            whether the contract is subject to the Davis-Bacon Act or only to a Related Act — neither
            of which we hold.
          </li>
          <li>
            That a fringe credit is annualized, bona fide or WHD-approved. 29 CFR 5.25(c)
            annualization needs private-work hours a certified-payroll CSV does not contain, and 29
            CFR 5.28 makes unfunded plan credits non-bona-fide absent WHD approval, so they are
            refused rather than approximated.
          </li>
          <li>That a deduction is permissible under 29 CFR 3.5.</li>
          <li>That a classification is correct. You choose it from the determination&rsquo;s own list.</li>
          <li>
            That the Contract Work Hours and Safety Standards Act applies — or does not apply — to
            your contract. 29 CFR 5.5(b) turns on a contract amount we never see; the contract value
            band is your assertion and is printed as one, and &ldquo;unknown&rdquo; withholds the
            signature block rather than guessing.
          </li>
          <li>
            Any measured-performance number before the counter behind it has cleared. The counters
            are public on <Link href="/status">the status page</Link>.
          </li>
        </ul>
      </section>

      {/* ------------------------------------------------------------ PRIVACY -- */}
      <section className="rp-lp-section">
        <div className="rp-lp-head">
          <p className="rp-lp-eyebrow">Privacy scope</p>
          <h2>What we hold, and what we do with it</h2>
        </div>

        <div className="rp-lp-grid rp-lp-grid--2">
          <div className="rp-lp-card rp-lp-card--ruled">
            <p className="rp-lp-card__t">What we hold</p>
            <p className="rp-lp-card__b">
              Your projects and their pins; your payroll lines as you uploaded them; your workers,
              including Social Security numbers held encrypted under a key scoped to your account
              alone; your classification memory; your column mappings; your generated artifacts; and
              your billing state as Stripe reports it.
            </p>
          </div>
          <div className="rp-lp-card rp-lp-card--ruled">
            <p className="rp-lp-card__t">The two Social Security number rules, both obeyed</p>
            <p className="rp-lp-card__b">
              29 CFR 5.5(a)(3)(ii)(B) says full numbers must not be included on weekly transmittals
              and that an individually identifying number is enough. California&rsquo;s eCPR schema
              requires all nine digits. So the number is stored encrypted, the last four are printed
              on the WH-347, and the nine digits are decrypted only into the California XML.
            </p>
          </div>
          <div className="rp-lp-card">
            <p className="rp-lp-card__t">What never reaches a model</p>
            <p className="rp-lp-card__b">
              Your payroll data is never sent to a model. The only thing that ever reaches one is a
              normalized job title of 128 characters or fewer, and only when a classification is
              unmapped. The model&rsquo;s response schema has no numeric field, so it cannot emit a
              rate. The free tier makes zero model calls at all.
            </p>
          </div>
          <div className="rp-lp-card">
            <p className="rp-lp-card__t">Export, at any tier, at any time</p>
            <p className="rp-lp-card__b">
              One button, one ZIP, no request form and no waiting period — including while an account
              is restricted for a failed payment. Every filing, its artifacts, its provenance record,
              your payroll lines, your projects and pins, and your classification memory. The
              provenance JSON in the export is byte-identical to the one rendered into the artifact,
              so the export verifies itself.
            </p>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- DELETION -- */}
      <section className="rp-lp-section">
        <div className="rp-lp-head">
          <p className="rp-lp-eyebrow">Deletion</p>
          <h2>You are required to keep these records for three years</h2>
          <p className="rp-lp-lead">
            29 CFR 5.5(a)(3)(i)(A) requires payroll records to be preserved for at least three years
            after all the work on the prime contract is completed. Deleting your Ratepin account does
            not delete that obligation — it only deletes our copy, and we cannot recover it later.
            That is why the export runs first by default, and why this is a heading rather than a
            footnote.
          </p>
        </div>

        <div className="rp-lp-grid rp-lp-grid--2">
          <div className="rp-lp-card">
            <p className="rp-lp-card__t">What deletion erases</p>
            <ul className="rp-stack rp-stack--tight">
              {DELETION_ERASED.map((entry) => (
                <li key={entry.id}>
                  <strong>{entry.label}.</strong> {entry.mechanism}
                </li>
              ))}
            </ul>
            <p className="rp-lp-card__b">
              Your subscription is cancelled immediately and the unused days are refunded
              automatically. Deletion is reversible for seven days, with the permanent date stated on
              the confirmation, and the undo link is in the product for the whole window rather than
              only in an email.
            </p>
          </div>
          <div className="rp-lp-card">
            <p className="rp-lp-card__t">What deletion does not erase</p>
            <ul className="rp-stack rp-stack--tight">
              {DELETION_RETAINED.map((entry) => (
                <li key={entry.id}>
                  <strong>{entry.label}</strong>
                  {entry.retention === undefined ? '' : ` — kept ${entry.retention}`}.{' '}
                  {entry.why ?? entry.mechanism}
                </li>
              ))}
            </ul>
            <p className="rp-lp-card__b">
              The first three of those are the reason this list exists at all: a filing is the
              evidence layer of a signed federal certification, and 29 CFR 5.5(a)(3)(i)(A) puts a{' '}
              {ARTIFACT_RETENTION_YEARS}-year floor under your own copy of exactly these documents.
              You receive the full export before closure. What you cannot do is make our copy vanish
              inside the window in which an investigator may ask about it.
            </p>
          </div>
        </div>

        <p className="rp-legal">{DELETION_BOUNDARY_STATEMENT}</p>

        <div className="rp-alert rp-alert--declined rp-lp-actions">
          <span className="rp-alert__glyph" aria-hidden="true">
            §
          </span>
          <p className="rp-alert__title">Backups, stated as what we measured</p>
          <div className="rp-alert__body">
            <p>{backupSentence}</p>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------- RIGHTS -- */}
      <section className="rp-lp-section">
        <div className="rp-lp-head">
          <p className="rp-lp-eyebrow">How rights are exercised here</p>
          <h2>Buttons, not a request form</h2>
          <p className="rp-lp-lead">
            The right to know is the export button and the right to delete is the delete button. Both
            are in the product, both work immediately, and neither is routed through a person. There
            is no rights-request address on this page because there is nothing behind one that the
            buttons do not already do, and a form that only creates a delay is a form that makes the
            right worse.
          </p>
        </div>
        <p className="rp-legal">
          Form WH-347 is a U.S. Department of Labor form (OMB 1235-0008, expires 01/31/2028). The
          California eCPR schema is published by the California Department of Industrial Relations.
          Ratepin is not affiliated with, endorsed by, or acting on behalf of the U.S. Department of
          Labor, the California Department of Industrial Relations, SAM.gov, or any other government
          agency, and displays no agency seal, flag or logo for that reason. Regulations are quoted
          from the eCFR and linked so you can read them in place; where our summary and the
          regulation differ, the regulation governs.
        </p>
      </section>

      <section className="rp-stack">
        <div className="rp-btn-row">
          <Link className="rp-btn" href="/">
            Back to the overview
          </Link>
          <Link className="rp-btn rp-btn--quiet" href="/status">
            Status and counters
          </Link>
        </div>
      </section>
    </div>
  );
}
