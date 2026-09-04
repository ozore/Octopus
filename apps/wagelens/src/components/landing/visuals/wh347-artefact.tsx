/**
 * V5 — THE RENDERED WH-347 (LANDING_SPEC §6 V5).
 *
 * The actual output, not a picture of it: page 1 of a WH-347 drawn as HTML at
 * document fidelity, and page 2 — the Statement of Compliance — behind a
 * `<details>` so the page body never scrolls sideways to reach it.
 *
 * HTML and not SVG, deliberately. `IDENTITY.md` §10.5 requires real tables for
 * tabular data and §10.9 says the rendered form is "accessible HTML first, PDF
 * second"; a picture of a payroll grid is a dead end for a screen reader, and
 * this is the artefact the buyer is being asked to trust.
 *
 * THREE THINGS THE BUYER CHECKS FIRST, and all three are here:
 *   · the rate in the form's own notation — base, then fringe, `$38.50/10.71`;
 *   · the gross written this-project / all-projects, as columns (8) and (9)
 *     ask for it;
 *   · **the worker identifier showing the last four digits only**, because
 *     29 CFR 5.5(a)(3)(ii)(B) forbids full identifying numbers on weekly
 *     transmittals — the one detail that earns trust instantly, since an
 *     incumbent's users hand-redact this every week.
 *
 * **The figures are example data and the caption says so**, but the RATE is
 * real: it is read from the determination this page just looked up, so the
 * example is not a number we invented. The table therefore carries
 * `data-wd-number` / `data-modification` / `data-published`, which is gate G8
 * satisfied rather than side-stepped.
 *
 * Motion: none on page 1 — it is a document, and documents do not animate.
 */

import { formatDay, formatMoney, type Provenance } from '@/components/provenance';

export type ArtefactCrewMember = {
  name: string;
  /** Four digits. There is nowhere in this component to put more. */
  identifierLast4: string;
  classification: string;
  hours: number;
  baseRate: string;
  fringeRate: string;
};

export type Wh347ArtefactProps = {
  provenance: Provenance;
  crew: ArtefactCrewMember[];
  caption: string;
  projectName: string;
  countyLabel: string;
  weekEnding: string;
  payrollNumber: number;
};

/** The form prints base and fringe in one cell, separated by a slash. */
function rateNotation(base: string, fringe: string): string {
  return `${formatMoney(base)}/${Number(fringe).toFixed(2)}`;
}

export function Wh347Artefact({
  provenance,
  crew,
  caption,
  projectName,
  countyLabel,
  weekEnding,
  payrollNumber,
}: Wh347ArtefactProps) {
  const gross = (member: ArtefactCrewMember) => member.hours * Number(member.baseRate);
  const allWork = (member: ArtefactCrewMember) => gross(member) * 1.5;

  return (
    <figure
      className="wl-land__figure-block"
      data-testid="wh347-artefact"
      style={{ margin: 0, display: 'grid', gap: 'var(--wl-space-3)' }}
    >
      <div className="wl-doc-frame" data-wordcount="exclude">
        <div className="wl-doc-toolbar">
          <span>
            U.S. Department of Labor · WH-347 (Rev. January 2025) · OMB Control No. 1235-0008
          </span>
          <span>Payroll no. {payrollNumber}</span>
        </div>

        <div className="wl-land__doc-scroll">
          <div
            className="wl-doc"
            data-wd-number={provenance.wdNumber}
            data-modification={provenance.modificationNumber}
            data-published={provenance.publicationDate}
          >
            <h4>Payroll — for contractor&rsquo;s optional use</h4>
            <table>
              <caption className="wl-visually-hidden">
                Example page one of a WH-347 for {projectName}, week ending {weekEnding}
              </caption>
              <thead>
                <tr>
                  <th scope="col">(1) Worker</th>
                  <th scope="col">(1E) Identifying no.</th>
                  <th scope="col">(4) Classification</th>
                  <th scope="col">(6) Total hours</th>
                  <th scope="col">(7) Rate / fringe</th>
                  <th scope="col">(8) Gross, this project</th>
                  <th scope="col">(9) Gross, all work</th>
                </tr>
              </thead>
              <tbody>
                {crew.map((member) => (
                  <tr key={member.identifierLast4 + member.name}>
                    <td>{member.name}</td>
                    <td className="wl-num" data-testid="artefact-identifier">
                      XXX-XX-{member.identifierLast4}
                    </td>
                    <td>{member.classification}</td>
                    <td className="wl-num">{member.hours.toFixed(1)}</td>
                    <td className="wl-num">{rateNotation(member.baseRate, member.fringeRate)}</td>
                    <td className="wl-num">{formatMoney(gross(member))}</td>
                    <td className="wl-num">{formatMoney(allWork(member))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p style={{ marginBlockStart: 'var(--wl-space-3)' }}>
              PROJECT: {projectName} · {countyLabel} · WEEK ENDING {weekEnding} · WAGE
              DETERMINATION NO. {provenance.wdNumber} mod {provenance.modificationNumber} (published{' '}
              {formatDay(provenance.publicationDate)})
            </p>
          </div>
        </div>

        <p className="wl-land__callout">
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
              d="M2 14 L9 5 L16 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="square"
            />
          </svg>
          Last four digits only, in column 1E — 29 CFR 5.5(a)(3)(ii)(B) forbids a full identifying
          number, an address or a telephone number on a weekly transmittal.
        </p>

        <details
          className="wl-land__page2"
          data-testid="wh347-page-2"
          data-wl-click="wh347_artefact_expanded"
          data-wl-prop-page="2"
        >
          <summary>Statement of Compliance — page 2</summary>
          <div className="wl-doc" style={{ marginBlockStart: 'var(--wl-space-3)' }}>
            <p>
              I paid or supervised the payment of the laborers or mechanics working on the above
              project during the stated time period. I certify the following:
            </p>
            <ol>
              <li>
                The payroll information submitted with this statement is correct and complete for
                the above project during the above period, and the wage and fringe benefit rates
                paid to the workers are not less than the applicable rates for the classification(s)
                of work actually performed, as specified in the wage determination(s) incorporated
                into the contract.
              </li>
              <li>
                All regular payrolls and all other basic records that the contractor is required to
                maintain for this payroll period are complete and accurate and will be made
                available upon request.
              </li>
              <li>
                The classifications reported for each laborer or mechanic are the classification(s)
                of work that each worker actually performed.
              </li>
            </ol>
            <p>
              THE WILLFUL FALSIFICATION OF ANY OF THE ABOVE STATEMENTS MAY SUBJECT THE CONTRACTOR OR
              SUBCONTRACTOR TO CIVIL OR CRIMINAL PROSECUTION (SEE SECTION 1001 OF TITLE 18 AND
              SECTION 3729 OF TITLE 31 OF THE UNITED STATES CODE).
            </p>
          </div>
        </details>
      </div>

      <figcaption className="wl-land__note">{caption}</figcaption>
    </figure>
  );
}
