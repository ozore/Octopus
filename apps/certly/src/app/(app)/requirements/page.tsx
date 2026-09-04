import Link from 'next/link';

import { Disclaimer } from '@/components/Disclaimer';
import { getDb } from '@/lib/db';
import { ensureOrgSettings } from '@/lib/repos';
import { listRequirementSets, listVendorTypes } from '@/lib/repos/requirements';
import type { Audience } from '@/lib/templates';
import {
  assignRequirementSetAction,
  createRequirementSetAction,
  createVendorTypeAction,
  deleteRequirementSetAction,
  duplicateRequirementSetAction,
} from './actions';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * ASSIGNMENT — `specs/02` §3, screen 4 of five.
 *
 * The table a customer comes back to: which vendor type gets which requirement
 * set, with the organisation default at the top.
 *
 * `specs/02` §8's resolution order is stated on the screen, not just
 * implemented, because it is the thing a customer gets wrong: **the vendor type
 * wins; the organisation default is the fallback; a vendor with no type gets
 * the default.** A rule that is only in the code is a rule the customer
 * discovers by being surprised.
 */

const AUDIENCES: { key: Audience; label: string }[] = [
  { key: 'pm', label: 'Property manager' },
  { key: 'hoa', label: 'Homeowners association' },
  { key: 'gc', label: 'General contractor' },
  { key: 'tenant', label: 'Commercial landlord' },
];

export default async function RequirementsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const { org } = await requireOrg();
  const db = await getDb();
  const settings = await ensureOrgSettings(db, org.id);
  const sets = await listRequirementSets(db, org.id);
  const types = await listVendorTypes(db, org.id);
  const error = typeof query['error'] === 'string' ? query['error'] : null;
  const orgDefault = sets.find((set) => set.isOrgDefault) ?? null;

  return (
    <main>
      <header className="c-page__head">
        <div>
          <h1 className="c-page__title">Requirements</h1>
          <p className="c-page__lede">
            What Certly checks every certificate against. The vendor type wins; the organisation default
            is the fallback; a vendor with no type gets the default.
          </p>
        </div>
        <Link className="c-btn c-btn--primary" href="/requirements/library" data-testid="open-library">
          Template library
        </Link>
      </header>

      {/* Surface 9 of the eleven (KB §F.4): §F.2, adjacent to the limits. */}
      <Disclaimer of="templates" />

      {error ? (
        <p className="notice error" data-testid="requirements-error">
          {error}
        </p>
      ) : null}
      {query['assigned'] ? (
        <p className="notice" data-testid="requirements-assigned">
          Assigned. New certificates are compared against it from now on; existing comparisons keep the
          version they were run against.
        </p>
      ) : null}

      {sets.length === 0 ? (
        <section className="c-empty" data-testid="requirements-empty">
          <p className="c-empty__title">No requirement sets yet.</p>
          <p className="c-muted">
            Start from a template — every row shows where its number came from and when that was
            checked — then edit it to match your own contract.
          </p>
          <p className="c-gap-3">
            <Link className="c-btn c-btn--primary" href="/requirements/library">
              Open the template library
            </Link>
          </p>
        </section>
      ) : (
        <section className="c-card">
          <div className="c-card__head">
            <h2 className="c-card__title">Your requirement sets</h2>
            <span className="c-xs c-muted">
              {orgDefault ? `Default: ${orgDefault.name}` : 'No organisation default yet'}
            </span>
          </div>
          <div className="c-table-wrap">
            <table className="c-table">
              <thead>
                <tr>
                  <th>Set</th>
                  <th>Rows</th>
                  <th>Version</th>
                  <th>Applies to</th>
                  <th>From</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {sets.map((set) => (
                  <tr key={set.id} data-testid={`set-${set.id}`}>
                    <td className="c-table__party">
                      <Link href={`/requirements/${set.id}`} data-testid={`open-set-${set.id}`}>
                        {set.name}
                      </Link>
                      {set.isOrgDefault ? <span className="badge" data-testid="org-default"> organisation default</span> : null}
                    </td>
                    <td className="c-num">{set.rowCount}</td>
                    <td className="c-num">{set.version}</td>
                    <td className="c-table__meta">
                      {set.vendorCount} {set.vendorCount === 1 ? 'vendor' : 'vendors'} ·{' '}
                      {set.vendorTypeCount} {set.vendorTypeCount === 1 ? 'type' : 'types'}
                    </td>
                    <td className="c-table__meta">{set.sourceTemplateId ?? 'built by hand'}</td>
                    <td>
                      <div className="c-gap-2">
                        {!set.isOrgDefault ? (
                          <form action={assignRequirementSetAction}>
                            <input type="hidden" name="setId" value={set.id} />
                            <input type="hidden" name="vendorTypeId" value="org_default" />
                            <button className="c-btn c-btn--secondary c-btn--sm" type="submit">
                              Make default
                            </button>
                          </form>
                        ) : null}
                        <form action={duplicateRequirementSetAction}>
                          <input type="hidden" name="setId" value={set.id} />
                          <button className="c-btn c-btn--quiet c-btn--sm" type="submit">
                            Duplicate
                          </button>
                        </form>
                        <form action={deleteRequirementSetAction}>
                          <input type="hidden" name="setId" value={set.id} />
                          <button className="c-btn c-btn--quiet c-btn--sm" type="submit">
                            Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="c-card" data-testid="vendor-types">
        <div className="c-card__head">
          <h2 className="c-card__title">Vendor types</h2>
          <span className="c-xs c-muted">{types.length}</span>
        </div>
        <p className="c-small c-muted">
          A vendor type is how one group of vendors gets stricter requirements than another — roofers
          and window cleaners are not the same risk, and one set for both is either too strict or too
          loose.
        </p>

        {types.length > 0 ? (
          <div className="c-table-wrap">
            <table className="c-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Requirement set</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {types.map((type) => (
                  <tr key={type.id}>
                    <td className="c-table__party">{type.label}</td>
                    <td className="c-table__meta">
                      {sets.find((set) => set.id === type.requirementSetId)?.name ?? (
                        <span className="c-muted">
                          none — falls back to {orgDefault?.name ?? 'the organisation default'}
                        </span>
                      )}
                    </td>
                    <td>
                      <form action={assignRequirementSetAction} className="c-gap-2">
                        <input type="hidden" name="vendorTypeId" value={type.id} />
                        <select className="c-select" name="setId" aria-label={`Requirement set for ${type.label}`}>
                          {sets.map((set) => (
                            <option key={set.id} value={set.id}>
                              {set.name}
                            </option>
                          ))}
                        </select>
                        <button className="c-btn c-btn--secondary c-btn--sm" type="submit">
                          Assign
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        <form action={createVendorTypeAction} className="c-gap-2">
          <input className="c-input" name="label" placeholder="Roofing" aria-label="Vendor type name" />
          <select className="c-select" name="setId" aria-label="Requirement set for the new type" defaultValue="">
            <option value="">no set yet — use the default</option>
            {sets.map((set) => (
              <option key={set.id} value={set.id}>
                {set.name}
              </option>
            ))}
          </select>
          <button className="c-btn c-btn--secondary c-btn--sm" type="submit">
            Add vendor type
          </button>
        </form>
      </section>

      <section className="c-card">
        <div className="c-card__head">
          <h2 className="c-card__title">Start a set from scratch</h2>
        </div>
        <p className="c-small c-muted">
          Most people should start from a template instead — a template carries a dated source for every
          number, and a blank set carries none.
        </p>
        <form action={createRequirementSetAction} className="c-gap-2">
          <input className="c-input" name="name" placeholder="Snow removal, 2027 season" aria-label="New set name" />
          <select className="c-select" name="audience" defaultValue={settings.audience ?? 'pm'} aria-label="Audience">
            {AUDIENCES.map((audience) => (
              <option key={audience.key} value={audience.key}>
                {audience.label}
              </option>
            ))}
          </select>
          <button className="c-btn c-btn--secondary c-btn--sm" type="submit">
            Create empty set
          </button>
        </form>
      </section>
    </main>
  );
}
