/**
 * S15 — `/app/imports/[id]/resolve`, the classification and deduction pickers.
 *
 * AUTHORITY: `USER_JOURNEY.md` §6 (J6 entire), §6.1 (what each candidate shows and
 * what is above them — nothing), §6.3 (the memory that removes the question
 * permanently, and the per-tenant counter that is the only number we may print),
 * §6.4 (L-E's reduced-mode sentence, L-F's conformance path and the plain statement
 * that Ratepin does not file SF-1444s), §5.4 (the deduction picker's closed list of
 * ten paragraphs).
 *
 * ===========================================================================
 * WHAT IS BELOW THE PICKERS
 *
 * The determination's own classification list, and after that nothing. No chat
 * bubble, no "ask an expert", no mailto. That absence is A3 and it is the point of
 * the screen: the only exit from a blocked line is a click on a row of the
 * determination itself.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { memoryResolutionLine } from '@/classify';
import { CONFORMANCE_CITATION, CONFORMANCE_PATH, CONFORMANCE_RULE, PICKER_FOOTNOTE } from '@/classify';
import { getDb } from '@/db';

import { categoriseDeductionAction, confirmClassificationAction } from '../../../../_actions/imports';
import { generateFilingAction } from '../../../../_actions/filings';
import { Picker, type PickerCandidate } from '../../../../_components/picker';
import { readAs, requireSession } from '../../../../_lib/auth';
import { readImport, unmappedDeductions } from '../../../../_lib/imports';
import { currentPin, readProject } from '../../../../_lib/projects';
import { resolveWeek } from '../../../../_lib/resolve';
import { readWeek } from '../../../../_lib/filings';
import { rate } from '../../../../../(free)/_lib/format';
import type { Classification } from '@/lib/types';

export const dynamic = 'force-dynamic';

const DEDUCTION_CHOICES: readonly { readonly value: string; readonly label: string }[] = [
  { value: 'STATUTORY', label: '(a) Tax required by law to be withheld' },
  { value: 'BONA_FIDE_PREPAYMENT', label: '(b) Repayment of a bona fide prepayment of wages' },
  { value: 'COURT_PROCESS', label: '(c) Amounts required by court process' },
  { value: 'BENEFIT_FUND', label: '(d) Contributions to a medical, pension or life-insurance fund' },
  { value: 'CREDIT_UNION', label: '(e) Credit-union loan repayment or share purchase' },
  { value: 'GOVERNMENTAL', label: '(f) Voluntary contributions to a governmental agency' },
  { value: 'CHARITABLE_501C3', label: '(g) Voluntary contributions to a 501(c)(3)' },
  { value: 'UNION_DUES', label: '(h) Initiation fees and membership dues under a CBA' },
  { value: 'BOARD_LODGING_FACILITIES', label: '(i) Board, lodging or other facilities at reasonable cost' },
  { value: 'SAFETY_EQUIPMENT', label: '(j) Safety equipment of nominal value bought by the worker' },
];

function toCandidate(classification: Classification): PickerCandidate {
  return {
    ordinal: classification.ordinal,
    className: classification.className,
    classNameVerbatim: classification.classNameVerbatim,
    rateIdentifier: classification.rateIdentifier,
    baseRate: rate(classification.baseRate),
    fringeRate: rate(classification.fringeRate),
    sourceLineStart: classification.sourceLineStart,
    sourceLineEnd: classification.sourceLineEnd,
    wdNumber: String(classification.wdNumber),
    revision: classification.revision,
  };
}

export default async function ResolvePage({
  params,
}: {
  readonly params: Promise<{ readonly id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  const session = await requireSession(`/app/imports/${id}/resolve`);
  const db = await getDb();

  const view = await readAs(session, async (tx) => {
    const record = await readImport(tx, id);
    if (record === null || record.weekId === null) return null;
    const week = await readWeek(tx, record.weekId);
    if (week === null) return null;
    const project = await readProject(tx, week.projectId);
    const pin = await currentPin(tx, week.projectId);
    if (project === null || pin === null) {
      return { record, week, project, pin: null, resolution: null, deductions: [] };
    }
    return {
      record,
      week,
      project,
      pin,
      resolution: await resolveWeek(db, tx, {
        accountId: session.accountId,
        weekId: record.weekId,
        project,
        pin,
      }),
      deductions: await unmappedDeductions(tx, record.weekId),
    };
  });

  if (view === null) notFound();

  if (view.pin === null || view.resolution === null) {
    return (
      <div className="rp-stack rp-stack--section rp-measure">
        <h1>This project has no revision of record</h1>
        <p>
          Nothing can be priced without a pin, so nothing is computed here. Every filing on an
          unpinned project can only ever be DRAFT — NOT CERTIFIABLE, and that was stated when the
          project was created rather than discovered now.
        </p>
        {view.record.projectId === null ? null : (
          <Link href={`/app/projects/${view.record.projectId}`}>Back to the project</Link>
        )}
      </div>
    );
  }

  const { resolution } = view;
  const total = resolution.resolved.length + resolution.blocked.length;
  const clear = resolution.blocked.length === 0 && view.deductions.length === 0;

  return (
    <div className="rp-stack rp-stack--section">
      <section className="rp-stack rp-measure">
        <h1>Resolve this week</h1>
        <p className="rp-t-lead rp-num">
          {view.project?.name} · week ending {view.week.weekEnding} ·{' '}
          {String(view.pin.wdNumber)} revision {view.pin.revision}
        </p>
        {/* §6.3's one publishable number: HER counter, about HER account. Not a claim
            about anyone else, so it cannot trip a copy gate. */}
        <p>{memoryResolutionLine(resolution.resolved.length, total)}</p>
      </section>

      {resolution.blocked.map((entry) => {
        const level = entry.outcome.level;
        const preSelected =
          entry.outcome.preSelected === null
            ? null
            : (resolution.classifications.find((row) => row.id === entry.outcome.preSelected)
                ?.ordinal ?? null);

        return (
          <Picker
            key={entry.rawTitle}
            action={confirmClassificationAction}
            hidden={{ importId: id, weekId: view.week.weekId }}
            rawTitle={entry.rawTitle}
            workers={entry.workers}
            hours={(entry.hoursHundredths / 100).toFixed(2)}
            headline={
              entry.outcome.refusal?.primitive === 'P-A'
                ? entry.outcome.refusal.headline
                : `Choose the classification for “${entry.rawTitle}”`
            }
            detail={entry.outcome.refusal?.primitive === 'P-A' ? entry.outcome.refusal.detail : ''}
            level={level}
            banner={entry.outcome.banner}
            preSelectedOrdinal={preSelected}
            candidates={entry.outcome.picker.map((candidate) => toCandidate(candidate.classification))}
            fullList={resolution.classifications.map(toCandidate)}
            footnote={PICKER_FOOTNOTE}
            conformance={
              level === 'L_F'
                ? {
                    rule: CONFORMANCE_RULE,
                    citation: CONFORMANCE_CITATION,
                    path: CONFORMANCE_PATH,
                    declined:
                      'Ratepin does not conclude whether the work this title names is listed on ' +
                      'this determination, and does not prepare or file SF-1444 conformance ' +
                      'requests. The row stays blocked and the filing carries it as an exception.',
                  }
                : null
            }
          />
        );
      })}

      {view.deductions.length > 0 ? (
        <section className="rp-stack">
          <h2>Deductions with no paragraph</h2>
          <p className="rp-measure">
            “Other” on a signed form asserts that the deduction is permissible. Whether yours is
            permissible under 29 CFR part 3 is a legal question about your specific deduction, and
            Ratepin does not answer it. Name the paragraph it actually falls under, or leave the row
            blocked.
          </p>
          {view.deductions.map((deduction) => (
            <form
              className="rp-pick"
              key={deduction.rawLabel}
              action={categoriseDeductionAction}
            >
              <input type="hidden" name="importId" value={id} />
              <input type="hidden" name="weekId" value={view.week.weekId} />
              <input type="hidden" name="rawLabel" value={deduction.rawLabel} />
              <div className="rp-pick__legend">
                <p className="rp-pick__title">{deduction.rawLabel}</p>
                <p className="rp-pick__stakes">
                  On {deduction.workerWeekIds.length} worker
                  {deduction.workerWeekIds.length === 1 ? '' : 's'} this week
                </p>
              </div>
              <div className="rp-field">
                <label className="rp-field__label" htmlFor={`ded-${deduction.rawLabel}`}>
                  29 CFR 3.5 paragraph
                </label>
                <select
                  id={`ded-${deduction.rawLabel}`}
                  name="category"
                  className="rp-select"
                  defaultValue=""
                >
                  <option value="">— choose the paragraph —</option>
                  {DEDUCTION_CHOICES.map((choice) => (
                    <option key={choice.value} value={choice.value}>
                      {choice.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="rp-btn-row">
                <button type="submit" className="rp-btn rp-btn--primary">
                  Use this paragraph, and remember it
                </button>
              </div>
            </form>
          ))}
        </section>
      ) : null}

      <section className="rp-stack rp-measure">
        <h2>Generate</h2>
        <p>
          {clear
            ? 'Every line on this week resolves. The status gate runs next, and it decides whether the signature block renders.'
            : 'You can generate now. The unresolved rows are carried as exceptions, the artifact renders in full, and the signature block is withheld — which is what a draft is for. Nothing is billed for a draft.'}
        </p>
        <form action={generateFilingAction}>
          <input type="hidden" name="weekId" value={view.week.weekId} />
          <input type="hidden" name="returnTo" value={`/app/imports/${id}/resolve`} />
          <div className="rp-btn-row">
            <button type="submit" className="rp-btn rp-btn--primary">
              Generate the WH-347
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
