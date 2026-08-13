'use client';

/**
 * THE ARTIFACT HERO — the WH-347 at true geometry, in the three states the engine
 * can produce, and there is no fourth.
 *
 * AUTHORITY: `identity/landing/index.html` §"THE HERO" (ported, not redesigned),
 * `USER_JOURNEY.md` §8.8 (P-B: DRAFT — NOT CERTIFIABLE, signature block withheld
 * rather than greyed), §8.9 (the provenance footer), `DESIGN_SYSTEM.md` §1 R2/R3.
 *
 * WHY THIS IS A CLIENT COMPONENT AND NOTHING ELSE ON THE PAGE IS. The flipper is
 * the one piece of the landing that has to react to a click: the whole argument of
 * the page is *what changes between the three states and what does not*, and a
 * reader has to be able to move between them without a navigation. Everything else
 * — the prices, the corpus figures, the gate cards — is rendered on the server from
 * data, because none of it is interactive and all of it must be readable with
 * JavaScript disabled.
 *
 * THE MARKUP FOR ALL THREE STATES IS ALWAYS IN THE DOM. Visibility is driven by
 * `data-when` in CSS against `data-state` on the root; this component only moves
 * one attribute. That is deliberate: a sceptical reader can open the inspector and
 * confirm that the DRAFT sheet really has no signature line in it, rather than
 * taking a screenshot's word for it.
 *
 * NO NUMBER IN THIS FILE IS TYPED. Every money figure comes from
 * `_data/specimen.ts`, which computes it with the money kernel from the
 * determination's own rates.
 */

import { useId, useState } from 'react';

import { Cents, Hours } from '@/lib/money';

import {
  rateInCents,
  SPECIMEN_BLOCKED,
  SPECIMEN_COMPUTED,
  SPECIMEN_COMPUTED_1,
  SPECIMEN_COMPUTED_2,
  SPECIMEN_COMPUTED_4,
  SPECIMEN_HEADER,
  type ArtifactState,
  type SpecimenWorker,
} from '../_data/specimen';

/** The grid prints money without a currency symbol — the form's own convention,
 *  and the column headers carry the unit. */
function amount(value: Cents): string {
  return Cents.toDollarString(value).replace('$', '');
}

/** Whole hours print whole. `Hours` is hundredths internally; a payroll that
 *  reported 7.25 would print 7.25 rather than being rounded away. */
function hrs(value: Hours): string {
  const text = Hours.toDecimalString(value);
  return text.endsWith('.00') ? text.slice(0, -3) : text;
}

function dayCells(days: readonly (Hours | null)[]): React.ReactElement[] {
  return days.map((day, index) => (
    <td key={index} className="rp-w347__n">
      {day === null ? '—' : hrs(day)}
    </td>
  ));
}

const STATES: readonly { readonly value: ArtifactState; readonly glyph: string; readonly label: string }[] = [
  { value: 'certifiable', glyph: '●', label: 'Certifiable' },
  { value: 'dated', glyph: '◐', label: 'Certifiable (dated)' },
  { value: 'draft', glyph: '✕', label: 'Draft — not certifiable' },
];

function WorkerRows({ worker, when }: { worker: SpecimenWorker; when?: string }): React.ReactElement {
  const { input } = worker;
  const rowAttrs = when === undefined ? {} : { 'data-when': when };
  return (
    <>
      <tr data-worker={String(input.no)} {...rowAttrs}>
        <td rowSpan={2} className="rp-w347__c">
          {input.no}
        </td>
        <td rowSpan={2}>{input.name}</td>
        <td rowSpan={2} className="rp-w347__c">
          {input.idNo}
        </td>
        <td rowSpan={2} className="rp-w347__c">
          (J)
        </td>
        <td rowSpan={2} className="rp-w347__cls">
          {input.classification.name}
          <br />
          <span className="rp-w347__tag">
            {input.classification.group}
            {input.mappingNote === null ? '' : ` · ${input.mappingNote}`}
          </span>
        </td>
        <td className="rp-w347__c">S</td>
        {dayCells(input.straightDays)}
        <td className="rp-w347__n">{hrs(worker.straightHours)}</td>
        <td
          className={
            input.no === 1 ? 'rp-w347__n rp-w347__traced' : 'rp-w347__n'
          }
        >
          {amount(rateInCents(worker.straightRate))}
        </td>
        <td rowSpan={2} className="rp-w347__n">
          {amount(worker.col6B)}
        </td>
        <td rowSpan={2} className="rp-w347__n">
          {amount(worker.col6C)}
        </td>
        <td rowSpan={2} className="rp-w347__n">
          {amount(worker.gross)}
        </td>
        <td rowSpan={2} className="rp-w347__n">
          {amount(worker.gross)}
        </td>
        <td rowSpan={2} className="rp-w347__n">
          {amount(worker.fica)}
        </td>
        <td rowSpan={2} className="rp-w347__n">
          {amount(input.federalTax)}
        </td>
        <td rowSpan={2} className="rp-w347__n">
          {amount(input.otherDeductions)}
        </td>
        <td rowSpan={2} className="rp-w347__n">
          {amount(worker.deductionsTotal)}
        </td>
        <td rowSpan={2} className="rp-w347__n">
          {amount(worker.net)}
        </td>
      </tr>
      <tr data-line="ot" {...rowAttrs}>
        <td className="rp-w347__c">O</td>
        {dayCells(input.premiumDays)}
        <td className="rp-w347__n">{hrs(worker.premiumHours)}</td>
        <td className="rp-w347__n">{amount(rateInCents(worker.overtimeRate))}</td>
      </tr>
    </>
  );
}

export function ArtifactHero(): React.ReactElement {
  const [state, setState] = useState<ArtifactState>('certifiable');
  const groupName = useId();
  const h = SPECIMEN_HEADER;
  const one = SPECIMEN_COMPUTED_1;
  const two = SPECIMEN_COMPUTED_2;

  return (
    <div data-state={state}>
      <fieldset className="rp-lp-switch">
        <legend className="rp-lp-switch__legend">
          Artifact status — the three the engine can produce, and there is no fourth
        </legend>
        <div className="rp-lp-switch__set">
          {STATES.map((option) => (
            <label key={option.value} className="rp-lp-switch__opt">
              <input
                type="radio"
                name={groupName}
                value={option.value}
                checked={state === option.value}
                onChange={() => {
                  setState(option.value);
                }}
              />
              <span className="rp-lp-switch__face">
                <span aria-hidden="true">{option.glyph}</span> {option.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="rp-row rp-lp-statusrow">
        <span className="rp-status rp-status--certifiable rp-status--lg" data-when="certifiable">
          <span className="rp-status__glyph" aria-hidden="true">
            ●
          </span>{' '}
          CERTIFIABLE
        </span>
        <span className="rp-status rp-status--dated rp-status--lg" data-when="dated">
          <span className="rp-status__glyph" aria-hidden="true">
            ◐
          </span>{' '}
          CERTIFIABLE (DATED)
        </span>
        <span className="rp-status rp-status--draft rp-status--lg" data-when="draft">
          <span className="rp-status__glyph" aria-hidden="true">
            ✕
          </span>{' '}
          DRAFT — NOT CERTIFIABLE
        </span>
        <p className="rp-t-data rp-ink-2 rp-lp-statusnote">
          <span data-when="certifiable">
            Four lines resolved. Signature block rendered. This filing is billable.
          </span>
          <span data-when="dated">
            The rate did not move. Our knowledge of successor modifications aged. Signature block
            still rendered.
          </span>
          <span data-when="draft">
            One line will not resolve. Signature block withheld — structurally absent, not greyed.
            This filing is never billed.
          </span>
        </p>
      </div>

      <div className="rp-lp-scroll">
        <div className="rp-lp-paper">
          <article className="rp-sheet" aria-label="WH-347 certified payroll, sample artifact">
            <div className="rp-sheet__mark" aria-hidden="true" data-when="draft">
              <span>DRAFT — NOT CERTIFIABLE</span>
              <span>DRAFT — NOT CERTIFIABLE</span>
              <span>DRAFT — NOT CERTIFIABLE</span>
            </div>

            <div className="rp-sheet__body">
              <div className="rp-sheet__band" data-when="draft">
                <span>DRAFT — NOT CERTIFIABLE · 1 UNRESOLVED LINE</span>
                <span className="rp-sheet__band-note">
                  Payroll title <b>{SPECIMEN_BLOCKED.rawTitle}</b> (entry {SPECIMEN_BLOCKED.no}) is
                  not mapped to a classification on {h.wdNumber}. Signature block withheld.
                </span>
              </div>

              <div className="rp-w347__title">
                <div>
                  <span className="rp-w347__name">PAYROLL</span>
                  <span className="rp-w347__spec">SPECIMEN</span>
                  <p className="rp-w347__use">
                    Form WH-347 · For Contractor&rsquo;s Optional Use · Rev. January 2025
                  </p>
                </div>
                <span className="rp-w347__omb">
                  OMB No. 1235-0008 · Expires 01/31/2028 · Page 1 of 2
                </span>
              </div>

              <div className="rp-w347__head">
                <div className="rp-w347__cell">
                  <span className="rp-w347__lab">
                    Name of contractor <b>☐</b> or subcontractor <b>☑</b>
                  </span>
                  <span className="rp-w347__val">{h.contractor}</span>
                  <span className="rp-w347__lab rp-w347__lab--gap">Address</span>
                  <span className="rp-w347__val">{h.address}</span>
                </div>
                <div className="rp-w347__cell">
                  <span className="rp-w347__lab">Project and location</span>
                  <span className="rp-w347__val">{h.project}</span>
                  <span className="rp-w347__val rp-w347__val--id rp-w347__val--plain">
                    {h.location}
                  </span>
                  <span className="rp-w347__lab rp-w347__lab--gap">Project or contract no.</span>
                  <span className="rp-w347__val rp-w347__val--id">{h.contractNo}</span>
                </div>
                <div className="rp-w347__cell">
                  <span className="rp-w347__lab">Payroll no.</span>
                  <span className="rp-w347__val rp-w347__val--id">{h.payrollNo}</span>
                  <span className="rp-w347__lab rp-w347__lab--gap">For week ending</span>
                  <span className="rp-w347__val rp-w347__val--id">{h.weekEnding}</span>
                </div>
                <div className="rp-w347__cell rp-w347__cell--wd">
                  <span className="rp-w347__lab">Wage determination no.</span>
                  <span className="rp-w347__val rp-w347__val--id">{h.wdNumber}</span>
                  <span className="rp-w347__lab rp-w347__lab--gap">Modification · published</span>
                  <span className="rp-w347__val rp-w347__val--id">
                    {h.modification} · {h.published}
                  </span>
                </div>
              </div>

              <table className="rp-w347__grid">
                <caption className="rp-sr-only">
                  Sample WH-347 payroll grid for week ending {h.weekEnding}, four workers.
                </caption>
                <thead>
                  <tr>
                    <th rowSpan={2} scope="col">
                      1A
                      <br />
                      No.
                    </th>
                    <th rowSpan={2} scope="col" className="rp-w347__hl">
                      1B–1D
                      <br />
                      Worker name
                    </th>
                    <th rowSpan={2} scope="col">
                      1E
                      <br />
                      ID no.
                    </th>
                    <th rowSpan={2} scope="col">
                      2<br />
                      (J)/(RA)
                    </th>
                    <th rowSpan={2} scope="col" className="rp-w347__hl">
                      3<br />
                      Labor classification
                    </th>
                    <th rowSpan={2} scope="col">
                      &nbsp;
                    </th>
                    <th colSpan={7} scope="colgroup">
                      4 — Hours worked each day
                    </th>
                    <th rowSpan={2} scope="col">
                      5<br />
                      Total
                      <br />
                      hrs
                    </th>
                    <th rowSpan={2} scope="col">
                      6A
                      <br />
                      Rate
                      <br />
                      paid
                      <br />
                      $/hour
                    </th>
                    <th rowSpan={2} scope="col">
                      6B
                      <br />
                      Fringe
                      <br />
                      credit
                      <br />
                      $/week
                    </th>
                    <th rowSpan={2} scope="col">
                      6C
                      <br />
                      Cash in
                      <br />
                      lieu
                      <br />
                      $/week
                    </th>
                    <th rowSpan={2} scope="col">
                      7A
                      <br />
                      Gross
                      <br />
                      this proj.
                    </th>
                    <th rowSpan={2} scope="col">
                      7B
                      <br />
                      Gross
                      <br />
                      all work
                    </th>
                    <th colSpan={4} scope="colgroup">
                      8 — Deductions, all work
                    </th>
                    <th rowSpan={2} scope="col">
                      9<br />
                      Net
                      <br />
                      paid
                    </th>
                  </tr>
                  <tr>
                    {h.dayLabels.map((label) => {
                      const [day, date] = label.split(' ');
                      return (
                        <th key={label} scope="col">
                          {day}
                          <br />
                          {date}
                        </th>
                      );
                    })}
                    <th scope="col">FICA</th>
                    <th scope="col">
                      Fed.
                      <br />
                      tax
                    </th>
                    <th scope="col">Other</th>
                    <th scope="col">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {SPECIMEN_COMPUTED.map((worker) => (
                    <WorkerRows key={worker.input.no} worker={worker} />
                  ))}

                  <WorkerRows worker={SPECIMEN_COMPUTED_4} when="certifiable dated" />

                  {/* Entry 4, blocked. The payroll title verbatim, and no money at
                      all — a blocked line does not get a "best guess" rate. */}
                  <tr data-worker="4" data-blocked="true" data-when="draft">
                    <td rowSpan={2} className="rp-w347__c">
                      {SPECIMEN_BLOCKED.no}
                    </td>
                    <td rowSpan={2}>{SPECIMEN_BLOCKED.name}</td>
                    <td rowSpan={2} className="rp-w347__c">
                      {SPECIMEN_BLOCKED.idNo}
                    </td>
                    <td rowSpan={2} className="rp-w347__c">
                      —
                    </td>
                    <td rowSpan={2} className="rp-w347__cls">
                      <span className="rp-w347__raw">{SPECIMEN_BLOCKED.rawTitle}</span>
                      <br />
                      <span className="rp-w347__tag">unmapped payroll title · line blocked</span>
                    </td>
                    <td className="rp-w347__c">S</td>
                    {dayCells(SPECIMEN_BLOCKED.straightDays)}
                    <td className="rp-w347__n">{hrs(SPECIMEN_BLOCKED.hours)}</td>
                    <td className="rp-w347__n rp-w347__void">BLOCKED</td>
                    {Array.from({ length: 9 }, (_, index) => (
                      <td key={index} rowSpan={2} className="rp-w347__n rp-w347__void">
                        —
                      </td>
                    ))}
                  </tr>
                  <tr data-line="ot" data-blocked="true" data-when="draft">
                    <td className="rp-w347__c">O</td>
                    {dayCells([null, null, null, null, null, null, null])}
                    <td className="rp-w347__n">0</td>
                    <td className="rp-w347__n rp-w347__void">—</td>
                  </tr>
                </tbody>
              </table>

              <div className="rp-w347__foot">
                <span>
                  <b>6B and 6C are weekly totals, not hourly rates</b> — WHD&rsquo;s instructions ask
                  for the &ldquo;total&rdquo; in both. 6A is the only hourly column on the form, and
                  it excludes cash paid in lieu. Entry 1: {hrs(one.totalHours)} h ×{' '}
                  {Cents.toDollarString(
                    rateInCents(one.input.planCreditPerHour),
                  )} = {Cents.toDollarString(one.col6B)} and {hrs(one.totalHours)} h ×{' '}
                  {Cents.toDollarString(rateInCents(one.input.cashInLieuPerHour))} ={' '}
                  {Cents.toDollarString(one.col6C)}; {Cents.toDollarString(one.col6B)} +{' '}
                  {Cents.toDollarString(one.col6C)} = {Cents.toDollarString(one.fringeDischarged)} ={' '}
                  {hrs(one.totalHours)} h × the determination&rsquo;s{' '}
                  {Cents.toDollarString(rateInCents(one.input.classification.fringe))} fringe,
                  discharged by the combination method of 29 CFR 5.31(b)(3).
                </span>
                <span>
                  6B is a customer-asserted hourly plan credit multiplied by the week&rsquo;s hours.
                  Ratepin neither computed nor verified annualization under 29 CFR 5.25(c).
                </span>
                <span>
                  6C is cash <b>wages</b>, counted once inside 7A — never added to 7A a second time,
                  and never a deduction in column 8.
                </span>
                <span>
                  Contract value band, recorded by the contractor at project setup:{' '}
                  <b>over $100,000</b>, so the overtime clauses of 29 CFR 5.5(b) are in this contract
                  and CWHSSA attaches. Entry {two.input.no}: {hrs(two.premiumHours)} h over 40 × 0.5
                  × {Cents.toDollarString(rateInCents(two.straightRate))} ={' '}
                  {Cents.toDollarString(two.premiumCash)} premium, inside 7A. At or under $100,000 no
                  CWHSSA premium is computed; &ldquo;unknown&rdquo; withholds the signature block
                  rather than guess either way.
                </span>
                <span>
                  Hours in any premium-labelled column count toward the 40-hour threshold unless the
                  row proves a ≥1.5× rate was actually paid; an unprovable premium label blocks the
                  line.
                </span>
                <span>
                  Every rate × hours product is rounded half-up to cents at the line, then summed in
                  cents. No product on this sheet has a remainder.
                </span>
              </div>

              <div className="rp-signature" data-when="certifiable dated">
                <div className="rp-w347__sigrow">
                  <div>
                    <div className="rp-signature__line" />
                    <p className="rp-signature__caption">
                      Signature — contractor or authorised agent · date
                    </p>
                  </div>
                  <p className="rp-w347__certs">
                    Statement of compliance on page 2: boxes <strong>1, 2, 3 and 6</strong> always
                    checked; box <strong>5</strong> checked because a fringe credit is claimed (Σ 6B
                    &gt; 0); box <strong>4</strong> not checked — no apprentice or trainee on this
                    payroll. Those six boxes are the form&rsquo;s own. What the signature certifies
                    is the <strong>three</strong> things numbered (1)–(3) in{' '}
                    <strong>29 CFR 5.5(a)(3)(ii)(C)</strong>; falsification reachable under 18 U.S.C.
                    1001 and 31 U.S.C. 3729.
                  </p>
                </div>
              </div>

              <div className="rp-signature rp-signature--withheld" data-when="draft">
                <p className="rp-signature__withheld-title">SIGNATURE BLOCK WITHHELD</p>
                <p className="rp-signature__withheld-why">
                  There is no signature line on this document. Entry {SPECIMEN_BLOCKED.no}&rsquo;s
                  payroll title <b>{SPECIMEN_BLOCKED.rawTitle}</b> does not map to a classification
                  on {h.wdNumber}, so Ratepin cannot support the third certification of 29 CFR
                  5.5(a)(3)(ii)(C) — that each worker was paid the rate specified in the applicable
                  wage determination. Resolve the line in the classification picker and the block is
                  rendered.
                </p>
              </div>

              <div className="rp-prov" data-when="certifiable" data-freshness="current">
                <p className="rp-prov__claim">
                  Rates of record: WD {h.wdNumber}, Modification {h.modification}, published{' '}
                  {h.published}.
                </p>
                <p className="rp-prov__freshness">
                  No newer modification existed as of {h.checkedAt}.
                </p>
                <p className="rp-prov__build">
                  Corpus snapshot {h.snapshot} · engine {h.engineVersion} · generated {h.generatedAt}
                </p>
                <p className="rp-prov__boundary">
                  Ratepin computes and formats. The contractor certifies and files.
                </p>
                <p className="rp-prov__url">{h.verifyUrl}</p>
              </div>

              <div className="rp-prov" data-when="dated" data-freshness="dated">
                <p className="rp-prov__claim">
                  Rates of record: WD {h.wdNumber}, Modification {h.modification}, published{' '}
                  {h.published}.
                </p>
                <p className="rp-prov__freshness">
                  Newer-modification check unavailable since {h.datedSince}. This filing reads
                  Modification {h.modification} as pinned at award.
                </p>
                <p className="rp-prov__build">
                  Corpus snapshot {h.snapshot} · engine {h.engineVersion} · generated {h.generatedAt}
                </p>
                <p className="rp-prov__boundary">
                  Ratepin computes and formats. The contractor certifies and files.
                </p>
                <p className="rp-prov__url">{h.verifyUrl}</p>
              </div>

              <div className="rp-prov" data-when="draft" data-freshness="current">
                <p className="rp-prov__claim">
                  Rates of record: WD {h.wdNumber}, Modification {h.modification}, published{' '}
                  {h.published}.
                </p>
                <p className="rp-prov__freshness">
                  No newer modification existed as of {h.checkedAt}.
                </p>
                <p className="rp-prov__blocked">
                  1 unresolved line — entry {SPECIMEN_BLOCKED.no}, payroll title{' '}
                  {SPECIMEN_BLOCKED.rawTitle}. Signature block withheld.
                </p>
                <p className="rp-prov__build">
                  Corpus snapshot {h.snapshot} · engine {h.engineVersion} · generated {h.generatedAt}
                </p>
                <p className="rp-prov__boundary">
                  Ratepin computes and formats. The contractor certifies and files.
                </p>
                <p className="rp-prov__url">{h.verifyUrl}</p>
              </div>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
