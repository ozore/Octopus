import Link from 'next/link';

import { InlineDisclaimer } from '@/components/disclaimer';
import { Panel } from '@/components/primitives';
import { ProvenanceCard } from '@/components/provenance';
import {
  CERTIFICATIONS,
  FALSIFICATION_WARNING,
  NO_REBATES_ATTESTATION,
  SOC_PREAMBLE,
} from '@/lib/documents/statement-of-compliance';
import { primaryActionLabel } from '@/lib/domain/payroll-math';
import { filerSettings, nextPayrollNumber } from '@/lib/repositories/payrolls';

import { acknowledgeWarningAction, certifyAndGenerateAction } from '../../actions';
import { loadPayroll } from '../../load';

export const dynamic = 'force-dynamic';

/**
 * `/projects/:id/weeks/:payrollId/certify` — the deliberate step.
 *
 * **THE THREE CERTIFICATIONS ARE SHOWN IN FULL, IN THE FORM'S OWN WORDS**, each
 * acknowledged, above a signature block that asks for exactly what page 2 asks
 * for: the certifying official's name, title, telephone number and email
 * (WL-05 B12). At launch there is one login per organisation, so there is no
 * role gate — the office manager prepares and the owner signs by putting his
 * name in that field, which is what the form itself asks for (UX §3 A10/A11,
 * finding M3).
 *
 * **BLOCKING FLAGS DISABLE THE PRIMARY ACTION AND THE BUTTON SAYS WHY.**
 * Warnings never disable anything: they are acknowledged, and the
 * acknowledgement is part of the record.
 */
export default async function CertifyPage({
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
  const blocked = validation.errors.length > 0;

  if (payroll.status !== 'draft') {
    return (
      <Panel title="Already certified">
        <p className="wl-sm">
          Payroll #{payroll.payrollNumber} was certified on{' '}
          {payroll.certifiedAt?.toISOString().slice(0, 10)}.{' '}
          <Link href={`/projects/${id}/weeks/${payroll.id}/wh347`}>Open its documents</Link>.
        </p>
      </Panel>
    );
  }

  return (
    <>
      <div className="wl-row wl-row--between">
        <div>
          <h1>Review and certify</h1>
          <p className="wl-sm wl-muted">
            {project.name} · week ending {payroll.weekEndingDate} · payroll #{provisional}{' '}
            (provisional) — number assigned when you certify
          </p>
        </div>
        <Link className="wl-btn wl-btn--ghost wl-btn--sm" href={`/projects/${id}/weeks/${payroll.id}`}>
          Back to the grid
        </Link>
      </div>

      <div
        data-wd-number={provenance.wdNumber}
        data-modification={provenance.modificationNumber}
        data-published={provenance.publicationDate}
        className="wl-stack"
      >
        <ProvenanceCard
          provenance={provenance}
          scope={project.locationDescription || project.stateCode}
          classification={`${lines.length} line${lines.length === 1 ? '' : 's'} · ${payroll.noWorkPerformed ? 'no work performed' : 'hours entered'}`}
        />

        {query['invalid'] ? (
          <div className="wl-alert wl-alert--error" role="alert" data-testid="certify-refused">
            <div>
              <p className="wl-alert__title">Certification was refused.</p>
              <p className="wl-alert__body">
                Every flag below has to be cleared first — each one is something that makes the form
                itself invalid.
              </p>
            </div>
          </div>
        ) : null}

        {blocked ? (
          <Panel title={`${validation.errors.length} flag(s) to clear`}>
            <ul className="wl-stack-2" data-testid="blocking-flags">
              {validation.errors.map((issue, index) => (
                <li key={`${issue.ruleId}-${index}`} className="wl-alert wl-alert--error">
                  <div>
                    <p className="wl-alert__title">{issue.ruleId}</p>
                    <p className="wl-alert__body">{issue.message}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        ) : null}

        {validation.warnings.length > 0 ? (
          <Panel title="Warnings — shown, recorded, and never blocking">
            <ul className="wl-stack-2" data-testid="warning-flags">
              {validation.warnings.map((issue, index) => (
                <li key={`${issue.ruleId}-${index}`} className="wl-alert wl-alert--warn">
                  <div>
                    <p className="wl-alert__title">{issue.ruleId}</p>
                    <p className="wl-alert__body">{issue.message}</p>
                    <form action={acknowledgeWarningAction}>
                      <input type="hidden" name="payrollId" value={payroll.id} />
                      <input type="hidden" name="ruleId" value={issue.ruleId} />
                      <input type="hidden" name="deltaCents" value={issue.deltaCents ?? 0} />
                      <button
                        className="wl-btn wl-btn--ghost wl-btn--sm"
                        type="submit"
                        data-testid={`acknowledge-${issue.ruleId}`}
                      >
                        I have checked this
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
            <p className="wl-xs wl-muted">
              A rate below the determination can be lawful — an approved conformance, an apprentice
              percentage, or a different modification governing your contract. The judgement is
              yours; we show it every time and record that you saw it.
            </p>
          </Panel>
        ) : null}

        <Panel title="Statement of Compliance">
          <div className="wl-signature">
            <p className="wl-sm">{SOC_PREAMBLE}</p>
            <ul className="wl-signature__certs">
              {CERTIFICATIONS.map((text, index) => (
                <li key={index}>
                  <label className="wl-row">
                    <input type="checkbox" name={`cert${index}`} form="certify-form" required />
                    <span className="wl-xs">{text}</span>
                  </label>
                </li>
              ))}
              <li>
                <label className="wl-row">
                  <input type="checkbox" name="noRebates" form="certify-form" required />
                  <span className="wl-xs">{NO_REBATES_ATTESTATION}</span>
                </label>
              </li>
            </ul>
            <p className="wl-2xs wl-signature__notice" data-testid="falsification-warning">
              {FALSIFICATION_WARNING}
            </p>
          </div>
        </Panel>

        <Panel title="Certifying official">
          <form action={certifyAndGenerateAction} id="certify-form" className="wl-stack">
            <input type="hidden" name="payrollId" value={payroll.id} />
            {/* The grid stamps this; THRESHOLDS §5 P1 reads it. */}
            <input type="hidden" name="minutesInGrid" value="0" />
            <div className="wl-cols-2">
              <label className="wl-field">
                <span className="wl-field__label">Name</span>
                <input
                  className="wl-input"
                  name="officialName"
                  defaultValue={payroll.certifyingOfficialName ?? settings.official.name}
                  required
                />
              </label>
              <label className="wl-field">
                <span className="wl-field__label">Title</span>
                <input
                  className="wl-input"
                  name="officialTitle"
                  defaultValue={payroll.certifyingOfficialTitle ?? settings.official.title}
                  required
                />
              </label>
              <label className="wl-field">
                <span className="wl-field__label">Telephone number</span>
                <input
                  className="wl-input"
                  name="officialPhone"
                  defaultValue={payroll.certifyingOfficialPhone ?? settings.official.phone}
                  required
                />
              </label>
              <label className="wl-field">
                <span className="wl-field__label">Email address</span>
                <input
                  className="wl-input"
                  type="email"
                  name="officialEmail"
                  defaultValue={payroll.certifyingOfficialEmail ?? settings.official.email}
                  required
                />
              </label>
            </div>
            <label className="wl-field">
              <span className="wl-field__label">Additional remarks</span>
              <textarea
                className="wl-textarea"
                name="remarks"
                rows={3}
                defaultValue={payroll.additionalRemarks ?? ''}
              />
            </label>
            <label className="wl-row">
              <input type="checkbox" name="isFinal" defaultChecked={payroll.isFinal} />
              <span className="wl-sm">This is the final payroll for this project.</span>
            </label>
            <button
              className="wl-btn wl-btn--primary wl-btn--lg"
              type="submit"
              disabled={blocked}
              data-testid="certify-and-generate"
            >
              {primaryActionLabel('Certify and generate', validation.errors.length)}
            </button>
            <p className="wl-xs wl-muted">
              Certifying writes payroll #{provisional} — or the next free number, if another draft
              on this project certifies first — and produces the WH-347 and the Statement of
              Compliance. Retained until three years after the prime contract completes.
            </p>
          </form>
        </Panel>
      </div>

      <InlineDisclaimer />
    </>
  );
}
