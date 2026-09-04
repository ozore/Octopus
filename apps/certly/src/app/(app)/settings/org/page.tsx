import Link from 'next/link';

import {
  addAlternateHolderAction,
  updateEntityBlockAction,
  updateOrgAction,
} from '@/lib/settings/actions';
import { getDb } from '@/lib/db';
import { ensureOrgSettings } from '@/lib/repos';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * THE ENTITY BLOCK IS A FEATURE, NOT A PROFILE FIELD (`specs/13` intro).
 *
 * M5's certificate-holder check reads it, so a wrong entity block silently
 * produces wrong verdicts. The screen therefore states the blast radius BEFORE
 * the save rather than after it (A1), and alternate holders exist because a
 * certificate is often made out to the managing agent rather than the owning
 * entity and both are correct — without that field, every such certificate goes
 * to review forever and the customer concludes the product is broken.
 */
export default async function OrgSettingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { org } = await requireOrg();
  const db = await getDb();
  const settings = await ensureOrgSettings(db, org.id);

  return (
    <main className="c-prose">
      <p className="c-xs c-muted">
        <Link href="/settings">Settings</Link> · Organisation
      </p>
      <h1>Organisation</h1>

      {params['saved'] ? (
        <p className="notice" data-testid="org-saved">
          Saved.
          {params['saved'] === 'entity'
            ? ' Every vendor is being re-compared against the new certificate holder.'
            : ''}
        </p>
      ) : null}
      {params['error'] === 'length' ? (
        <p className="notice error">The entity block needs between 1 and 500 characters.</p>
      ) : null}

      <form action={updateOrgAction} className="c-stack">
        <label className="c-field" htmlFor="name">
          <span className="c-field__label">Name</span>
          <input className="c-input" id="name" name="name" defaultValue={org.name} required />
        </label>
        <label className="c-field" htmlFor="timezone">
          <span className="c-field__label">Timezone</span>
          <span className="c-field__hint">
            Every expiry is evaluated against midnight in this zone, and reminders send in it.
          </span>
          <input className="c-input" id="timezone" name="timezone" defaultValue={settings.timezone} />
        </label>
        <button className="c-btn c-btn--primary" type="submit">
          Save
        </button>
      </form>

      <hr className="c-hr" />

      <h2>Certificate holder</h2>
      <p className="c-small">
        This is the string we match the certificate holder box against. Changing it changes what
        every comparison decides, so saving it re-compares every vendor.
      </p>
      <form action={updateEntityBlockAction} className="c-stack">
        <label className="c-field" htmlFor="entityBlock">
          <span className="c-field__label">The exact name and address</span>
          <textarea
            className="c-textarea"
            id="entityBlock"
            name="entityBlock"
            maxLength={500}
            defaultValue={settings.entityBlock ?? ''}
            placeholder="Acme Property Management LLC, 100 Main St, Suite 4, Austin TX 78701"
            required
          />
        </label>
        <p className="c-small c-muted" data-testid="entity-warning">
          Saving this re-evaluates every vendor in this account.
        </p>
        <button className="c-btn c-btn--primary" type="submit" data-testid="save-entity-block">
          Save and re-compare
        </button>
      </form>

      <h2>Also accepted as the holder</h2>
      <p className="c-small">
        A managing agent, a lender, a former entity name. A certificate made out to any of these is
        treated as made out to you.
      </p>
      <ul className="c-small" data-testid="alternate-holders">
        {(settings.alternateHolders ?? []).map((holder) => (
          <li key={holder}>{holder}</li>
        ))}
      </ul>
      <form action={addAlternateHolderAction} className="c-row">
        <label className="c-field" htmlFor="holder" style={{ flex: 1 }}>
          <span className="c-field__label">Add another accepted holder</span>
          <input className="c-input" id="holder" name="holder" required />
        </label>
        <button className="c-btn c-btn--secondary" type="submit">
          Add
        </button>
      </form>
    </main>
  );
}
