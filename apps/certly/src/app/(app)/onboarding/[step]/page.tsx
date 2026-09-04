import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Disclaimer } from '@/components/Disclaimer';
import { getEnv } from '@/env';
import { getDb } from '@/lib/db';
import {
  addOneVendorAction,
  applyTemplateAction,
  pasteVendorsAction,
  setAudienceAction,
  setEntityBlockAction,
  uploadFirstCertificateAction,
} from '@/lib/onboarding/actions';
import { ensureOnboarding } from '@/lib/onboarding/repo';
import { AUDIENCES, blockedBy, isOnboardingStep, stepSpec, type OnboardingStep } from '@/lib/onboarding/steps';
import { ensureOrgSettings, listVendors } from '@/lib/repos';
import { listTemplates, type Audience } from '@/lib/templates';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * ONE JOB PER SCREEN — `specs/11` §4. Back always works, nothing is modal, and
 * no step ever loses what has already been typed (§10).
 */

const ERRORS: Record<string, string> = {
  audience: 'Pick one so we can show you the right templates.',
  length: 'The entity block needs between 1 and 500 characters.',
  template: 'Pick a template — you can edit every row afterwards.',
  empty: 'Nothing to add yet.',
  vendor: 'Pick which vendor this certificate belongs to.',
  file: 'Choose a file first.',
  vendor_limit: 'That is more vendors than this plan tracks. Nothing was lost — see billing.',
  document_limit: 'Free onboarding covers three documents. See billing to continue.',
  read_only: 'This account is read-only until billing is restarted.',
  rejected: 'We could not accept that file.',
  reader_unavailable:
    'Reading certificates is not switched on in this environment yet, so this step cannot finish here.',
};

export default async function OnboardingStepPage({
  params,
  searchParams,
}: {
  params: Promise<{ step: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { step } = await params;
  const query = await searchParams;
  if (!isOnboardingStep(step) || step === 'finding') notFound();

  const { org } = await requireOrg();
  const db = await getDb();
  const view = await ensureOnboarding(db, org.id);
  const settings = await ensureOrgSettings(db, org.id);
  const spec = stepSpec(step as OnboardingStep);
  const blocked = blockedBy(step as OnboardingStep, view.steps);
  const error = typeof query['error'] === 'string' ? ERRORS[query['error']] : undefined;

  return (
    <main className="c-prose">
      <p className="c-xs c-muted">
        <Link href="/onboarding">Your first audit</Link> · step {spec.n} of 6
      </p>
      <h1>{spec.title}</h1>
      <p className="c-muted">{spec.lede}</p>

      {error ? (
        <p className="notice error" data-testid="step-error">
          {error}
          {typeof query['reason'] === 'string' ? ` ${query['reason']}` : ''}
        </p>
      ) : null}

      {blocked ? (
        <p className="notice warn" data-testid="step-blocked">
          {stepSpec(step as OnboardingStep).prerequisiteReason}{' '}
          <Link href={`/onboarding/${blocked.key}`}>Go to step {blocked.n}</Link>.
        </p>
      ) : null}

      {step === 'who' ? <WhoStep /> : null}
      {step === 'entity' ? <EntityStep current={settings.entityBlock} /> : null}
      {step === 'requirements' ? <RequirementsStep audience={settings.audience} /> : null}
      {step === 'vendors' ? <VendorsStep orgId={org.id} query={query} /> : null}
      {step === 'certificate' ? <CertificateStep orgId={org.id} blocked={Boolean(blocked)} /> : null}
    </main>
  );
}

function WhoStep() {
  return (
    <form action={setAudienceAction} className="c-stack">
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="c-field__label">What do you manage?</legend>
        {AUDIENCES.map((audience, index) => (
          <label className="c-row" key={audience.key} htmlFor={`audience-${audience.key}`}>
            <input
              id={`audience-${audience.key}`}
              type="radio"
              name="audience"
              value={audience.key}
              defaultChecked={index === 0}
            />
            <span>
              <strong>{audience.label}</strong>{' '}
              <span className="c-xs c-muted">{audience.note}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <button className="c-btn c-btn--primary" type="submit" data-testid="save-audience">
        Continue
      </button>
    </form>
  );
}

function EntityStep({ current }: { current: string | null }) {
  return (
    <form action={setEntityBlockAction} className="c-stack">
      <label className="c-field" htmlFor="entityBlock">
        <span className="c-field__label">Certificate holder — exactly as it should be printed</span>
        <span className="c-field__hint">
          This is not a profile field: it is what we match the certificate holder box against, so a
          vague answer here produces a vague answer later.
        </span>
        <textarea
          className="c-textarea"
          id="entityBlock"
          name="entityBlock"
          maxLength={500}
          defaultValue={current ?? ''}
          placeholder="Acme Property Management LLC, 100 Main St, Suite 4, Austin TX 78701"
          required
        />
      </label>
      <button className="c-btn c-btn--primary" type="submit" data-testid="save-entity">
        Continue
      </button>
    </form>
  );
}

function RequirementsStep({ audience }: { audience: string | null }) {
  const list = listTemplates((audience as Audience | null) ?? undefined);
  const templates = list.length > 0 ? list : listTemplates();
  return (
    <div className="c-stack">
      <Disclaimer of="templates" />
      <div className="c-stack">
        {templates.map((template) => (
          <section className="c-card" key={template.id}>
            <h2 className="c-card__title">{template.label}</h2>
            <p className="c-small c-muted">{template.summary}</p>
            <p className="c-xs c-muted">
              {template.rowCount} requirements · {template.coverageSummary} ·{' '}
              {template.sourceCount} sources, last checked {template.lastVerified ?? 'unknown'}
            </p>
            <form action={applyTemplateAction}>
              <input type="hidden" name="templateId" value={template.id} />
              <button
                className="c-btn c-btn--primary c-btn--sm"
                type="submit"
                data-testid={`apply-template-${template.id}`}
              >
                Use this
              </button>
            </form>
          </section>
        ))}
      </div>
    </div>
  );
}

async function VendorsStep({
  orgId,
  query,
}: {
  orgId: string;
  query: Record<string, string | string[] | undefined>;
}) {
  const db = await getDb();
  const vendors = await listVendors(db, orgId, 10);
  const created = Number(query['created'] ?? 0);
  const duplicates = Number(query['duplicates'] ?? 0);
  const over = Number(query['over'] ?? 0);

  return (
    <div className="c-stack">
      {created > 0 ? (
        <p className="notice" data-testid="paste-result">
          {created} vendor{created === 1 ? '' : 's'} added
          {duplicates > 0 ? `, ${duplicates} duplicate${duplicates === 1 ? '' : 's'} skipped` : ''}
          {over > 0 ? `, ${over} over your plan's limit and not added` : ''}.
        </p>
      ) : null}

      {/* The paste box comes BEFORE the importer: copy-a-column-and-paste is
          the fastest path out of a spreadsheet, and making people export and
          map a CSV first loses the ones who would have pasted in ten seconds. */}
      <form action={pasteVendorsAction} className="c-stack">
        <label className="c-field" htmlFor="vendors">
          <span className="c-field__label">Paste your list</span>
          <span className="c-field__hint">
            One per line. “Name”, “Name, email” and “Name &lt;email&gt;” all work. Up to 500 lines.
          </span>
          <textarea
            className="c-textarea"
            id="vendors"
            name="vendors"
            rows={8}
            placeholder={'Northgate Landscaping, office@northgate.example\nHarbor Roofing\nBlue Line Facility Services <ap@bluelinefs.example>'}
          />
        </label>
        <button className="c-btn c-btn--primary" type="submit" data-testid="paste-vendors">
          Add these vendors
        </button>
      </form>

      <details>
        <summary className="c-small">Add one by hand instead</summary>
        <form action={addOneVendorAction} className="c-stack" style={{ marginTop: 'var(--c-space-3)' }}>
          <label className="c-field" htmlFor="one-name">
            <span className="c-field__label">Vendor name</span>
            <input className="c-input" id="one-name" name="name" required />
          </label>
          <label className="c-field" htmlFor="one-email">
            <span className="c-field__label">Business mailbox (optional)</span>
            <input className="c-input" id="one-email" name="email" type="email" />
          </label>
          <button className="c-btn c-btn--secondary" type="submit" data-testid="add-one-vendor">
            Add vendor
          </button>
        </form>
      </details>

      {vendors.length > 0 ? (
        <>
          <p className="c-small c-muted">On your list so far:</p>
          <ul className="c-small" data-testid="vendor-preview">
            {vendors.map((vendor) => (
              <li key={vendor.id}>{vendor.name}</li>
            ))}
          </ul>
          <Link className="c-btn c-btn--primary" href="/onboarding/certificate">
            Next: one certificate
          </Link>
        </>
      ) : null}
    </div>
  );
}

async function CertificateStep({ orgId, blocked }: { orgId: string; blocked: boolean }) {
  const db = await getDb();
  const env = getEnv();
  const vendors = await listVendors(db, orgId, 100);
  if (blocked) return null;

  return (
    <div className="c-stack">
      <form action={uploadFirstCertificateAction} className="c-stack">
        <label className="c-field" htmlFor="vendorId">
          <span className="c-field__label">Which vendor is this certificate for?</span>
          <select className="c-select" id="vendorId" name="vendorId" required>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
        </label>
        <label className="c-field" htmlFor="file">
          <span className="c-field__label">The certificate</span>
          <span className="c-field__hint">A PDF or a photo of one. Nothing is sent anywhere else.</span>
          <input className="c-input" id="file" name="file" type="file" accept=".pdf,image/*" required />
        </label>
        <button className="c-btn c-btn--primary" type="submit" data-testid="upload-certificate">
          Read this certificate
        </button>
      </form>

      {env.ADAPTER_MODE === 'mock' ? (
        <p className="notice warn c-small" data-testid="stub-reader-notice">
          This environment has no document reader configured, so the reading you are about to see is a
          stand-in record rather than a reading of your file. Everything after it — the comparison, the
          finding, the audit trail — is real.
        </p>
      ) : null}

      <p className="c-small c-muted">
        No certificate to hand? That is normal at 11pm. Add the vendor’s email on the previous step and
        send them an upload link from their vendor page instead.
      </p>
    </div>
  );
}
