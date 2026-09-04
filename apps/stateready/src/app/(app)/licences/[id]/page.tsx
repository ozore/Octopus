import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CeMeter, ConflictPanel, DatesPanel, DocumentsPanel } from '@/components/licences';
import { RequirementsPanel } from '@/components/requirements';
import { StatusChip } from '@/components/status';
import {
  addCeRecordAction,
  archiveLicenceAction,
  setQualifierDisassociationAction,
  updateLicenceAction,
  uploadDocumentAction,
} from '@/lib/actions';
import { getDb } from '@/lib/db';
import { ALLOWED_DOCUMENT_TYPES } from '@/lib/documents';
import { buildLicenceView } from '@/lib/repos/licence-view';
import { possibleDuplicates } from '@/lib/repos/licences';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * M4 — `/licences/:id`. `specs/04` §Screens.
 *
 * Header, then three panels: **Dates**, **Requirements**, **Documents**.
 *
 * The two properties this screen exists for:
 *
 *  - **`expirySource` is visible.** "You entered this" and "we worked this out
 *    from Texas's rule" are different levels of trust and the customer is
 *    entitled to know which they are reading.
 *  - **A field with no board answer is a rendered row, not a missing one.** The
 *    Requirements panel names every requirement the board publishes *and every
 *    one it does not* — see `components/requirements.tsx`.
 */
export default async function LicencePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { org } = await requireOrg();
  const db = await getDb();
  const today = new Date().toISOString().slice(0, 10);

  const view = await buildLicenceView(db, org.id, id, today);
  if (!view) notFound();

  const duplicates = view.licence.licenceNumber
    ? (await possibleDuplicates(db, org.id, view.licence.state, view.licence.licenceNumber)).filter(
        (row) => row.id !== view.licence.id,
      )
    : [];

  const message = (key: string) => (typeof query[key] === 'string' ? String(query[key]) : null);

  return (
    <>
      <p className="sr-eyebrow">
        <Link href="/licences">Licences</Link> · {view.stateName}
      </p>
      <div className="sr-row sr-row--between">
        <div>
          <h1 className="sr-mb-0" data-testid="licence-title">
            {view.typeName}
          </h1>
          <p className="sr-meta">
            {view.holderName}
            {view.licence.licenceNumber ? (
              <span className="sr-number"> · {view.licence.licenceNumber}</span>
            ) : null}{' '}
            · {view.stateName} {view.licence.trade}
          </p>
        </div>
        <StatusChip status={view.status} />
      </div>

      {message('created') ? (
        <p className="notice" data-testid="licence-created">
          Saved. Everything below came from the state&apos;s own published rule unless it says otherwise.
        </p>
      ) : null}
      {message('saved') ? <p className="notice">Saved, and the dates re-derived.</p> : null}
      {message('uploaded') ? <p className="notice">Attached.</p> : null}
      {message('ce') ? <p className="notice">Hours recorded.</p> : null}
      {message('error') ? (
        <p className="notice error" data-testid="licence-error">
          {message('error')}
        </p>
      ) : null}

      {view.uncoveredBanner ? (
        <p className="notice warn" data-testid="uncovered-banner">
          {view.uncoveredBanner} <Link href="/coverage">See what we hold.</Link>
        </p>
      ) : null}

      {duplicates.length > 0 ? (
        <p className="notice warn" data-testid="duplicate-warning">
          {duplicates.length === 1 ? 'Another licence' : `${duplicates.length} other licences`} in{' '}
          {view.licence.state} carries this number. Some boards reuse numbers across classes, so this is a
          warning, not a block — but it is worth a look.
        </p>
      ) : null}

      {view.conflict ? <ConflictPanel conflict={view.conflict} stateName={view.stateName} /> : null}

      <div className="sr-two-up sr-mt-6">
        <DatesPanel view={view} />

        <section className="sr-card" data-testid="edit-panel">
          <h2 className="sr-card__title">Correct the record</h2>
          <p className="sr-meta">
            Changing a date re-derives everything below it and re-schedules the alerts in the same step.
          </p>
          <form action={updateLicenceAction} className="sr-stack">
            <input name="licenceId" type="hidden" value={view.licence.id} />
            <label className="sr-field" htmlFor="licenceNumber">
              <span className="sr-field__label">Licence number</span>
              <input
                className="sr-input"
                defaultValue={view.licence.licenceNumber ?? ''}
                id="licenceNumber"
                maxLength={64}
                name="licenceNumber"
                type="text"
              />
            </label>
            <label className="sr-field" htmlFor="issuedOn">
              <span className="sr-field__label">Issued on</span>
              <input
                className="sr-input"
                defaultValue={view.licence.issuedOn ?? ''}
                id="issuedOn"
                name="issuedOn"
                type="date"
              />
            </label>
            <label className="sr-field" htmlFor="expiresOn">
              <span className="sr-field__label">Expires on</span>
              <input
                className="sr-input"
                defaultValue={view.licence.expiresOn ?? ''}
                id="expiresOn"
                name="expiresOn"
                type="date"
              />
              <span className="sr-field__hint">
                Clear it and we will go back to deriving it, where the state publishes a rule.
              </span>
            </label>
            <label className="sr-field" htmlFor="notes">
              <span className="sr-field__label">Notes</span>
              <textarea
                className="sr-textarea"
                defaultValue={view.licence.notes ?? ''}
                id="notes"
                name="notes"
                rows={2}
              />
            </label>
            <p className="sr-row">
              <button className="sr-btn sr-btn--primary" data-testid="save-licence" type="submit">
                Save
              </button>
            </p>
          </form>

          {/* M16 — the HR event that starts the replacement clock. */}
          <form action={setQualifierDisassociationAction} className="sr-stack sr-mt-6">
            <input name="licenceId" type="hidden" value={view.licence.id} />
            <label className="sr-field" htmlFor="disassociatedOn">
              <span className="sr-field__label">The qualifier on this licence left on</span>
              <input
                className="sr-input"
                defaultValue={view.licence.qualifierDisassociatedOn ?? ''}
                id="disassociatedOn"
                name="disassociatedOn"
                type="date"
              />
              <span className="sr-field__hint">
                This starts the replacement clock where the board publishes one. See{' '}
                <Link href="/qualifiers">the qualifier watch</Link>.
              </span>
            </label>
            <p className="sr-row">
              <button className="sr-btn sr-btn--secondary" data-testid="set-qualifier" type="submit">
                Save the qualifier date
              </button>
            </p>
          </form>

          <form action={archiveLicenceAction} className="sr-mt-6">
            <input name="licenceId" type="hidden" value={view.licence.id} />
            <button className="sr-btn sr-btn--danger" type="submit">
              Archive this licence
            </button>
            <span className="sr-field__hint">Archived, never deleted. The record and its documents stay.</span>
          </form>
        </section>
      </div>

      {view.ceComputation?.required ? (
        <section className="sr-card sr-mt-6" data-testid="ce-panel">
          <h2 className="sr-card__title">Continuing education</h2>
          <CeMeter ce={view.ceComputation} />
          <form action={addCeRecordAction} className="sr-form-grid sr-mt-6">
            <input name="licenceId" type="hidden" value={view.licence.id} />
            <label className="sr-field" htmlFor="hours">
              <span className="sr-field__label">Hours</span>
              <input
                className="sr-input"
                id="hours"
                max={100}
                min={0.5}
                name="hours"
                required
                step={0.5}
                type="number"
              />
            </label>
            <label className="sr-field" htmlFor="subject">
              <span className="sr-field__label">Subject</span>
              <input className="sr-input" id="subject" name="subject" type="text" />
              <span className="sr-field__hint">
                Matched against the board&apos;s own subject breakdown, never guessed.
              </span>
            </label>
            <label className="sr-field" htmlFor="deliveryMode">
              <span className="sr-field__label">Taken</span>
              <select className="sr-select" defaultValue="unknown" id="deliveryMode" name="deliveryMode">
                <option value="unknown">not recorded</option>
                <option value="classroom">in a classroom</option>
                <option value="online">online</option>
              </select>
            </label>
            <label className="sr-field" htmlFor="provider">
              <span className="sr-field__label">Provider</span>
              <input className="sr-input" id="provider" name="provider" type="text" />
            </label>
            <label className="sr-field" htmlFor="completedOn">
              <span className="sr-field__label">Completed on</span>
              <input className="sr-input" id="completedOn" name="completedOn" required type="date" />
            </label>
            <p className="sr-row">
              <button className="sr-btn sr-btn--secondary" data-testid="add-ce" type="submit">
                Record hours
              </button>
            </p>
          </form>
          {view.ce.length > 0 ? (
            <ul className="sr-feed sr-mt-6" data-testid="ce-records">
              {view.ce.map((record) => (
                <li className="sr-feed__item" key={record.id}>
                  <span className="sr-feed__date">{record.completedOn}</span>
                  <span className="sr-feed__state">{Number(record.hours)} h</span>
                  <span className="sr-feed__what">
                    {record.subject ?? 'no subject recorded'}
                    {record.provider ? ` · ${record.provider}` : ''}
                    {record.deliveryMode !== 'unknown' ? ` · ${record.deliveryMode}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <div className="sr-mt-6">
        <RequirementsPanel
          boardName={view.board?.name}
          boardUrl={view.board?.url}
          rows={view.requirements}
        />
      </div>

      <div className="sr-mt-6">
        <DocumentsPanel documents={view.documents} licenceId={view.licence.id} />
        <form
          action={uploadDocumentAction}
          className="sr-row sr-mt-6"
          data-testid="upload-form"
          encType="multipart/form-data"
        >
          <input name="licenceId" type="hidden" value={view.licence.id} />
          <label className="sr-field sr-mb-0" htmlFor="file">
            <span className="sr-field__label">Attach a photo of the card, or a PDF</span>
            <input
              accept={ALLOWED_DOCUMENT_TYPES.join(',')}
              className="sr-input"
              id="file"
              name="file"
              type="file"
            />
            <span className="sr-field__hint">
              Up to 20 MB. We check what the file really is, not what it is called.
            </span>
          </label>
          <button className="sr-btn sr-btn--secondary" data-testid="upload-document" type="submit">
            Attach
          </button>
        </form>
      </div>
    </>
  );
}
