/**
 * S12-DIR — `/app/projects/[id]/dir`, the California eCPR identifiers.
 *
 * AUTHORITY: `USER_JOURNEY.md` §10.1 (what we cannot do for her, said at setup, and
 * the exact sentence that says it), §10.2 (two artifacts, two independent statuses),
 * §10.5 (the unhappy paths, including "she asks us to submit it for her", refused in
 * copy permanently), `drizzle/0001_ca_contractor_identity.sql` (why the contractor
 * block is one row per account and the DIR Project ID is one per project).
 *
 * ===========================================================================
 * WHY THIS SCREEN EXISTS AT ALL — build review NEW-7
 *
 * The eCPR emitter was correct, gated, tested and UNREACHABLE: the columns existed,
 * the chip blocked and named each missing field honestly, and no form on the product
 * could supply one. A truthful refusal a customer cannot clear, on a named
 * deliverable, with nobody to email, is the A3 failure mode wearing an honest
 * sentence. This screen is the way out the refusal names.
 *
 * ===========================================================================
 * IT IS NOT SHOWN OUTSIDE CALIFORNIA, AND THAT IS ENFORCED HERE
 *
 * A Virginia subcontractor must never be asked for a PWCR. The gate is
 * `project.stateCode`, checked before any field is rendered, and the sentence a
 * non-Californian reader gets is `ecprChip`'s own "not applicable" refusal rather
 * than a second wording of it — one fact, one sentence, whichever screen asks. The
 * project page links here only for a Californian project, so the address is reachable
 * but never advertised where it does not apply.
 *
 * ===========================================================================
 * EVERY FIELD SAYS WHY IT IS ASKED AND WHERE IT GOES
 *
 * The inputs are generated from `CONTRACTOR_FIELDS`, which carries per field: the
 * label, the reason DIR needs it, where the customer gets it (because Ratepin cannot
 * get it for her), the pinned schema's rule, and the XSD element the value is written
 * into. The same array names the fields in the blocked chip on the filing screen. A
 * customer therefore reads the same words in the block that told her something was
 * missing and above the box that fixes it.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { readAs, requireSession } from '../../../../_lib/auth';
import {
  CONTRACTOR_FIELDS,
  contractorFieldName,
  invalidValuesRefusal,
  missingContractorFields,
  readContractorIdentity,
  valueOf,
  type CaContractorIdentity,
  type ContractorField,
  type ContractorFieldName,
} from '../../../../_lib/ca-identity';
import { CALIFORNIA_IDENTIFIERS, WE_DO_NOT_FILE } from '../../../../_lib/copy';
import { NO_CONTRACTOR_FIELDS, ecprChip } from '../../../../_lib/filings';
import { readProject } from '../../../../_lib/projects';
import { RefusalView } from '@/app/_components/refusal';
import { SCHEMA_CONSTRAINTS } from '@/artifacts';

import { saveContractorIdentityAction, saveDirProjectIdAction } from './actions';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'California DIR identifiers — Ratepin' };

export default async function DirIdentifiersPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly id: string }>;
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  const session = await requireSession(`/app/projects/${id}/dir`);
  const query = searchParams === undefined ? {} : await searchParams;

  const view = await readAs(session, async (tx) => {
    const project = await readProject(tx, id);
    if (project === null) return null;
    return { project, identity: await readContractorIdentity(tx) };
  });
  if (view === null) notFound();

  const { project, identity } = view;

  /* -----------------------------------------------------------------------
     The gate. A project outside California is never asked for a PWCR, and the
     sentence it gets is the chip's own — `ecprChip` writes it once, for the
     filing screen and for this one.
     ----------------------------------------------------------------------- */
  if (project.stateCode.toUpperCase() !== 'CA') {
    const outside = ecprChip({
      project,
      contractor: NO_CONTRACTOR_FIELDS,
      workersMissingSsn: [],
      workerCount: 0,
      xsdObservedSha256: null,
      xsdObservedAt: null,
    });
    return (
      <div className="rp-stack rp-stack--section">
        <section className="rp-stack rp-measure">
          <h1>California DIR identifiers</h1>
          <p className="rp-t-lead rp-num">
            {project.name} · {project.countyName}, {project.stateCode}
          </p>
        </section>
        {outside.kind === 'blocked' ? <RefusalView refusal={outside.refusal} /> : null}
        <p>
          <Link href={`/app/projects/${id}`}>Back to {project.name}</Link>
        </p>
      </div>
    );
  }

  const invalid = invalidNames(query['invalid']);
  const missing = missingContractorFields(identity);
  const saved = typeof query['saved'] === 'string' ? query['saved'] : null;

  return (
    <div className="rp-stack rp-stack--section">
      <section className="rp-stack rp-measure">
        <h1>California DIR identifiers</h1>
        <p className="rp-t-lead rp-num">
          {project.name} · {project.countyName}, {project.stateCode}
        </p>
        <p>{CALIFORNIA_IDENTIFIERS}</p>
        <p>
          Everything on this page is printed into the eCPR XML file you upload to DIR, and into
          nothing else. Your WH-347 does not carry any of it and is unaffected by every state on
          this screen — §10.2: one filing, two artifacts, two independent statuses.
        </p>
        <p className="rp-t-micro">{WE_DO_NOT_FILE}</p>
      </section>

      {invalid.length > 0 ? <RefusalView refusal={invalidValuesRefusal(invalid)} /> : null}

      {saved === null ? null : (
        <div className="rp-alert rp-alert--notice" role="status">
          <span className="rp-alert__glyph" aria-hidden="true">
            ·
          </span>
          <div className="rp-alert__body">
            <p>
              {saved === 'project'
                ? 'The DIR Project ID is saved on this project.'
                : 'Your contractor details are saved on this account, and every project uses them.'}
            </p>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------
          1 — The company. Asked once, per DIR's own registration rule.
          --------------------------------------------------------------- */}
      <section className="rp-stack rp-measure">
        <h2>Your company</h2>
        <p>
          DIR issues all four of these to your <strong>company</strong>, not to a job: a public
          works contractor registration is issued under Labor Code §1725.5 and renewed annually,
          and your FEIN, licence and business address do not change from project to project. So
          Ratepin asks for them once and every Californian project on this account uses them. Fix
          a typo here and it is fixed everywhere.
        </p>
        {identity.assertedAt === null ? null : (
          <p className="rp-t-micro rp-num">
            Last recorded {identity.assertedAt.toISOString().slice(0, 16).replace('T', ' ')} UTC.
          </p>
        )}

        <form action={saveContractorIdentityAction} className="rp-stack rp-stack--tight">
          <input type="hidden" name="projectId" value={id} />
          {CONTRACTOR_FIELDS.map((field) => (
            <FieldRow key={field.name} field={field} identity={identity} invalid={invalid} />
          ))}
          <div className="rp-btn-row">
            <button type="submit" className="rp-btn rp-btn--primary">
              Save these details
            </button>
          </div>
        </form>
      </section>

      {/* ---------------------------------------------------------------
          2 — The awarding body's. Per project, because a PWC-100 is.
          --------------------------------------------------------------- */}
      <section className="rp-stack rp-measure">
        <h2>This project</h2>
        <p>
          The DIR Project ID is the one identifier here that is <strong>not yours</strong>. It
          comes into existence only when the awarding body files its PWC-100 for this specific
          job, so it is different on every project and Ratepin has no way to look it up — there is
          no public feed that maps your contract to their filing. Ask the awarding body, or read
          it off their notice.
        </p>
        <form action={saveDirProjectIdAction} className="rp-stack rp-stack--tight">
          <input type="hidden" name="projectId" value={id} />
          <div className="rp-field">
            <label className="rp-field__label" htmlFor="dir-project-id">
              DIR Project ID
            </label>
            <input
              id="dir-project-id"
              name="dirProjectId"
              className="rp-input rp-input--num"
              defaultValue={project.dirProjectId ?? ''}
              maxLength={40}
              autoComplete="off"
            />
            <p className="rp-field__help">
              Goes into <code>awardingBodyProjectId</code> in the file DIR receives. From the
              awarding body’s PWC-100 for this project.
            </p>
          </div>
          <div className="rp-btn-row">
            <button type="submit" className="rp-btn rp-btn--quiet">
              Save the project id
            </button>
          </div>
        </form>
      </section>

      {/* ---------------------------------------------------------------
          3 — What is still missing, named, with the one action that clears it.
          --------------------------------------------------------------- */}
      {missing.length > 0 || project.dirProjectId === null ? (
        <RefusalView
          refusal={{
            primitive: 'P-S',
            headline: `The California XML is blocked on this project — ${String(
              missing.length + (project.dirProjectId === null ? 1 : 0),
            )} identifier${missing.length + (project.dirProjectId === null ? 1 : 0) === 1 ? ' is' : 's are'} still missing`,
            blocked:
              'Ratepin will not emit an eCPR XML for this project until DIR’s required block is ' +
              'complete. Your WH-347 PDF is unaffected and downloads exactly as it does today.',
            because: `Still needed: ${[
              ...(project.dirProjectId === null
                ? ['the DIR Project ID from the awarding body’s PWC-100']
                : []),
              ...missing.map((field) => field.missingAs),
            ].join('; ')}. Every one of them is yours or the awarding body’s — Ratepin has no ` +
              'source it could take them from, and a defaulted registration number would be a ' +
              'wrong number on a payroll you certify under penalty of perjury.',
            clearedBy: {
              kind: 'onThisScreen',
              label: 'Fill the fields named above, on this page, and save — nothing else is needed.',
            },
            clearsItself: null,
            severity: 'blocked',
          }}
        />
      ) : (
        <section className="rp-stack rp-measure">
          <h2>What happens next</h2>
          <p>
            DIR’s required block is complete for this project. Generate a week’s filing and the CA
            eCPR XML appears beside the WH-347 with its own status. It is validated against the
            pinned schema (
            <span className="rp-num">{SCHEMA_CONSTRAINTS.schemaVersion}</span>) before it is
            offered, and it carries <em>generated, not acceptance-tested</em> until we have
            measured enough confirmed acceptances to remove that label from the counter rather
            than by deciding to.
          </p>
        </section>
      )}

      <section className="rp-stack rp-measure">
        <h2>Where each value ends up</h2>
        <p>
          One row per element of the pinned DIR schema, in the order the schema declares them.
          Nothing else on this account is written into the file.
        </p>
        <div className="rp-tablewrap">
          <table className="rp-table">
            <caption className="rp-sr-only">
              Fields collected on this screen and the XML element each is written into
            </caption>
            <thead>
              <tr>
                <th scope="col">Field</th>
                <th scope="col">Element in the DIR file</th>
                <th scope="col">Held by</th>
              </tr>
            </thead>
            <tbody>
              {CONTRACTOR_FIELDS.map((field) => (
                <tr key={field.name}>
                  <th scope="row">{field.label}</th>
                  <td className="rp-num">{field.element}</td>
                  <td>You</td>
                </tr>
              ))}
              <tr>
                <th scope="row">DIR Project ID</th>
                <td className="rp-num">awardingBodyProjectId</td>
                <td>The awarding body</td>
              </tr>
              <tr>
                <th scope="row">Worker Social Security number, nine digits</th>
                <td className="rp-num">ssn</td>
                <td>
                  <Link href="/app/workers">The worker roster</Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <p>
        <Link href={`/app/projects/${id}`}>Back to {project.name}</Link>
      </p>
    </div>
  );
}

/** One labelled input, with the reason it is asked for and the element it lands in.
 *  Generated rather than hand-written nine times, so the ninth cannot quietly lose
 *  its explanation. */
function FieldRow({
  field,
  identity,
  invalid,
}: {
  readonly field: ContractorField;
  readonly identity: CaContractorIdentity;
  readonly invalid: readonly ContractorFieldName[];
}): React.ReactElement {
  const value = valueOf(identity, field.name) ?? '';
  const bad = invalid.includes(field.name);
  const inputId = `ca-${field.name}`;
  const helpId = `${inputId}-help`;

  return (
    <div className="rp-field rp-field--wide">
      <label className="rp-field__label" htmlFor={inputId}>
        {field.label}
      </label>
      {field.name === 'licenseType' ? (
        <select
          id={inputId}
          name={field.name}
          className="rp-select"
          defaultValue={value}
          aria-describedby={helpId}
          {...(bad ? { 'aria-invalid': true as const } : {})}
        >
          <option value="">— not chosen —</option>
          {SCHEMA_CONSTRAINTS.licenseTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={inputId}
          name={field.name}
          className={`rp-input${field.name === 'pwcr' || field.name === 'fein' ? ' rp-input--num' : ''}`}
          defaultValue={value}
          maxLength={field.maxLength}
          autoComplete="off"
          aria-describedby={helpId}
          {...(bad ? { 'aria-invalid': true as const } : {})}
        />
      )}
      <p className="rp-field__help" id={helpId}>
        {field.why} {field.source}
        {field.rule === null ? '' : ` ${field.rule}`} Goes into <code>{field.element}</code> in the
        file DIR receives.
      </p>
    </div>
  );
}

/** The refused field names, read out of the address bar and CHECKED against the
 *  field list. An unknown value is dropped rather than echoed: a refusal that named
 *  a field which does not exist would be copy authored by whoever edited the URL. */
function invalidNames(raw: string | string[] | undefined): readonly ContractorFieldName[] {
  if (typeof raw !== 'string' || raw === '') return [];
  const names: ContractorFieldName[] = [];
  for (const part of raw.split('.')) {
    const name = contractorFieldName(part);
    if (name !== null && !names.includes(name)) names.push(name);
  }
  return names;
}
