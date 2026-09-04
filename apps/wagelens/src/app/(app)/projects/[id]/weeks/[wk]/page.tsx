import Link from 'next/link';

import { InlineDisclaimer } from '@/components/disclaimer';
import { EmptyState, Panel, StatusPill } from '@/components/primitives';
import { ProvenanceCard, Rate, type Provenance } from '@/components/provenance';
import { cents, weekDates, weekDayLabels } from '@/lib/domain/payroll-math';
import { filerSettings, nextPayrollNumber } from '@/lib/repositories/payrolls';

import { copyLastWeekAction, noWorkPerformedAction, removeLineAction } from '../actions';
import { loadPayroll, statusTone, statusWord } from '../load';
import { HoursGrid, type GridLine } from './hours-grid';

export const dynamic = 'force-dynamic';

/**
 * `/projects/:id/weeks/:payrollId` — WL-05's grid.
 *
 * **THE NUMBER IN THE HEADER IS PROVISIONAL AND THE HEADER SAYS SO IN FOUR
 * WORDS** (finding M4). A draft holds no `payroll_number`; the label is
 * `nextPayrollNumber() + 1` computed on read, it may move if another draft on
 * the same project certifies first, and pretending otherwise is how a numbered
 * gap gets invented.
 *
 * A certified payroll renders the same grid FROZEN. Editing one is refused in
 * the repository, not only here: the path to a correction is reopen-and-
 * supersede, because a signed federal statement is never edited in place.
 */
export default async function WeekPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; wk: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id, wk } = await params;
  const query = await searchParams;
  const { db, org, payroll, project, lines, provenance, validation } = await loadPayroll(wk);
  const settings = await filerSettings(db, org.id);
  const provisional = await nextPayrollNumber(db, project.id, org.id);
  const isDraft = payroll.status === 'draft';

  const gridLines: GridLine[] = lines.map((line) => ({
    id: line.id,
    entryNo: line.workerEntryNo,
    name: `${line.lastName}, ${line.firstName}${line.middleInitial ? ` ${line.middleInitial}` : ''}`,
    classificationLabel: line.classificationLabel,
    identifyingNoLast4: line.identifyingNoLast4,
    workerStatus: line.workerStatus,
    hoursSt: (line.hoursSt as string[] | null) ?? ['0', '0', '0', '0', '0', '0', '0'],
    hoursOt: (line.hoursOt as string[] | null) ?? ['0', '0', '0', '0', '0', '0', '0'],
    totalHoursSt: line.totalHoursSt,
    totalHoursOt: line.totalHoursOt,
    rateSt: line.rateSt,
    rateOt: line.rateOt,
    fringeCreditHourly: line.fringeCreditHourly,
    paymentInLieuHourly: line.paymentInLieuHourly,
    grossProject: line.grossProject,
    grossAllWork: line.grossAllWork,
    dedTaxWithholdings: line.dedTaxWithholdings,
    dedFica: line.dedFica,
    dedOther: line.dedOther,
    dedOtherNote: line.dedOtherNote ?? '',
    dedTotal: line.dedTotal,
    netPay: line.netPay,
    wdBaseRate: line.wdBaseRate,
    wdFringeRate: line.wdFringeRate,
    belowDetermination:
      cents(line.rateSt) + cents(line.fringeCreditHourly) + cents(line.paymentInLieuHourly) <
      cents(line.wdBaseRate) + cents(line.wdFringeRate),
  }));

  return (
    <>
      <div className="wl-row wl-row--between">
        <div>
          <h1>
            Payroll {payroll.payrollNumber === null ? `#${provisional}` : `#${payroll.payrollNumber}`}
            {payroll.payrollNumber === null ? ' (provisional)' : ''}
          </h1>
          <p className="wl-sm wl-muted">
            {project.name} · week ending {payroll.weekEndingDate} ·{' '}
            <StatusPill tone={statusTone(payroll)}>{statusWord(payroll)}</StatusPill>
            {payroll.payrollNumber === null ? ' · number assigned when you certify' : null}
          </p>
        </div>
        <Link className="wl-btn wl-btn--ghost wl-btn--sm" href={`/projects/${id}/submissions`}>
          All payrolls
        </Link>
      </div>

      {/* Gate G8: every currency figure below sits inside an element carrying
          the determination it was computed from. */}
      <div
        data-wd-number={provenance.wdNumber}
        data-modification={provenance.modificationNumber}
        data-published={provenance.publicationDate}
        className="wl-stack"
      >
        <ProvenanceCard
          provenance={provenance}
          scope={`${project.locationDescription || project.stateCode} · week ending ${payroll.weekEndingDate}`}
          classification={`${lines.length} line${lines.length === 1 ? '' : 's'}`}
        />

        {query['copied'] ? (
          <div className="wl-alert wl-alert--success" role="status" data-testid="copied-banner">
            <div>
              <p className="wl-alert__title">Copied {query['copied']} line(s) from last week.</p>
              <p className="wl-alert__body">
                Hours, rates, deductions and fringe credits all came across. Correct what changed.
              </p>
            </div>
          </div>
        ) : null}

        {payroll.noWorkPerformed ? (
          <div className="wl-alert wl-alert--info" role="status" data-testid="no-work-banner">
            <div>
              <p className="wl-alert__title">No covered work performed this week.</p>
              <p className="wl-alert__body">
                This still has to be certified: a no-work week is a filed payroll, and it consumes
                its number.
              </p>
            </div>
          </div>
        ) : null}

        {isDraft ? (
          <div className="wl-toolbar">
            <form action={copyLastWeekAction}>
              <input type="hidden" name="payrollId" value={payroll.id} />
              <button className="wl-btn wl-btn--secondary wl-btn--sm" type="submit" data-testid="copy-last-week">
                Copy last week
              </button>
            </form>
            <form action={noWorkPerformedAction}>
              <input type="hidden" name="payrollId" value={payroll.id} />
              <button className="wl-btn wl-btn--ghost wl-btn--sm" type="submit" data-testid="no-work-performed">
                No work performed this week
              </button>
            </form>
            <span className="wl-toolbar__spacer" />
            <Link
              className="wl-btn wl-btn--primary wl-btn--sm"
              href={`/projects/${id}/weeks/${payroll.id}/certify`}
              data-testid="review-and-certify"
            >
              Review and certify
              {validation.errors.length > 0
                ? ` · ${validation.errors.length} flag${validation.errors.length === 1 ? '' : 's'} to clear`
                : ''}
            </Link>
          </div>
        ) : (
          <div className="wl-toolbar">
            <span className="wl-sm">
              Certified {payroll.certifiedAt?.toISOString().slice(0, 10)}. The grid is frozen.
            </span>
            <span className="wl-toolbar__spacer" />
            <Link
              className="wl-btn wl-btn--secondary wl-btn--sm"
              href={`/projects/${id}/weeks/${payroll.id}/wh347`}
            >
              Documents
            </Link>
          </div>
        )}

        {lines.length === 0 && !payroll.noWorkPerformed ? (
          <Panel title="Nothing to enter yet">
            <EmptyState
              title="No crew is mapped to this project."
              action={
                <p className="wl-sm">
                  Map your workers to their classifications on{' '}
                  <Link href={`/projects/${id}/crew`}>the crew screen</Link>, then copy last week or
                  start typing.
                </p>
              }
            />
          </Panel>
        ) : isDraft ? (
          <HoursGrid
            payrollId={payroll.id}
            projectId={id}
            lines={gridLines}
            dayLabels={weekDayLabels(payroll.weekEndingDate)}
            dayDates={weekDates(payroll.weekEndingDate)}
            defaultDailyHours={settings.defaultDailyHours}
          />
        ) : (
          <FrozenGrid lines={gridLines} dayLabels={weekDayLabels(payroll.weekEndingDate)} provenance={provenance} />
        )}

        {validation.errors.length > 0 || validation.warnings.length > 0 ? (
          <Panel title="Flags">
            <ul className="wl-stack-2" data-testid="validation-panel">
              {validation.errors.map((issue, index) => (
                <li key={`e-${issue.ruleId}-${index}`} className="wl-alert wl-alert--error">
                  <div>
                    <p className="wl-alert__title">
                      {issue.ruleId} · blocking
                    </p>
                    <p className="wl-alert__body">{issue.message}</p>
                  </div>
                </li>
              ))}
              {validation.warnings.map((issue, index) => (
                <li key={`w-${issue.ruleId}-${index}`} className="wl-alert wl-alert--warn">
                  <div>
                    <p className="wl-alert__title">{issue.ruleId} · warning, not a block</p>
                    <p className="wl-alert__body">{issue.message}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="wl-xs wl-muted">
              We block what makes the form invalid. We never block what is your legal judgement — a
              rate below the determination can be lawful, and refusing to file would be worse than
              saying so.
            </p>
          </Panel>
        ) : null}

        {isDraft && lines.length > 0 ? (
          <details>
            <summary className="wl-sm">Remove a line</summary>
            <ul className="wl-stack-2">
              {lines.map((line) => (
                <li key={line.id} className="wl-row">
                  <form action={removeLineAction}>
                    <input type="hidden" name="payrollId" value={payroll.id} />
                    <input type="hidden" name="lineId" value={line.id} />
                    <button className="wl-btn wl-btn--ghost wl-btn--sm" type="submit">
                      Remove {line.lastName}, {line.firstName} — {line.classificationLabel}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </details>
        ) : null}
      </div>

      <InlineDisclaimer />
    </>
  );
}

/** A certified payroll's grid, read-only, with every rate carrying its source. */
function FrozenGrid({
  lines,
  dayLabels,
  provenance,
}: {
  lines: GridLine[];
  dayLabels: string[];
  provenance: Provenance;
}) {
  return (
    <div className="wl-grid-wrap">
      <table className="wl-grid" data-testid="frozen-grid">
        <thead>
          <tr>
            <th scope="col" className="wl-sticky-1">
              (1) Worker
            </th>
            <th scope="col" className="wl-sticky-2">
              (3) Classification
            </th>
            {dayLabels.map((label) => (
              <th scope="col" key={label} className="wl-grid__day">
                {label}
              </th>
            ))}
            <th scope="col">(5)</th>
            <th scope="col">(6A)</th>
            <th scope="col">(7A)</th>
            <th scope="col">(9)</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.id}>
              <th scope="row" className="wl-sticky-1 wl-grid__worker">
                {line.entryNo}. {line.name}
                <br />
                <span className="wl-2xs wl-muted">ID {line.identifyingNoLast4}</span>
              </th>
              <td className="wl-sticky-2 wl-grid__class">{line.classificationLabel}</td>
              {line.hoursSt.map((hours, index) => (
                <td key={index} className="wl-num">
                  {hours}
                  {Number(line.hoursOt[index] ?? 0) > 0 ? ` +${line.hoursOt[index]}` : ''}
                </td>
              ))}
              <td className="wl-num">
                {line.totalHoursSt}/{line.totalHoursOt}
              </td>
              <td className="wl-num">
                <Rate base={line.rateSt} fringe={line.fringeCreditHourly} provenance={provenance} />
              </td>
              <td className="wl-num">{line.grossProject}</td>
              <td className="wl-num">{line.netPay}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
