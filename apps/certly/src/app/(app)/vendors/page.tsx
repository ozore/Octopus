import Link from 'next/link';

import { Disclaimer } from '@/components/Disclaimer';
import { StatusPill } from '@/components/StatusPill';
import { createVendorAction } from '@/lib/actions';
import { getDb } from '@/lib/db';
import { orgToday } from '@/lib/engine';
import { countTrackedVendors, ensureOrgSettings, listVendors } from '@/lib/repos';
import { VENDOR_STATUS, vendorWord, type VendorState } from '@/lib/status';
import { limitOf, withinLimit } from '@octopus/platform/billing';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * THE VENDOR LIST — `specs/04` §3, sub-wave A's share of it.
 *
 * What is here: the list, the add-one form, the entitlement gate, and the
 * missing-mailbox prompt that `specs/04` A7 requires. What is NOT here, and
 * belongs to sub-wave B: the CSV import screen (the parser and the repository
 * are done and tested — this page needs the three-step mapper UI), vendor
 * detail, bulk actions and search.
 *
 * THE PERSONAL-DATA RULE IS VISIBLE IN THE FORM. There is a field for a
 * BUSINESS MAILBOX and a field for a ROLE, and no field for a person's name.
 * Certly never scrapes, purchases, guesses or infers a contact address
 * (PLAN.md §D5).
 */

const MESSAGES: Record<string, string> = {
  created: 'Vendor added.',
  limit_reached: 'You have used every tracked vendor on this plan. Upgrade in billing to add more.',
  invalid: 'Enter a vendor name.',
};

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { org, entitlement } = await requireOrg();
  const db = await getDb();

  const settings = await ensureOrgSettings(db, org.id);
  const today = orgToday(settings.timezone, new Date());
  const vendors = await listVendors(db, org.id, 200);
  const tracked = await countTrackedVendors(db, org.id);
  const vendorLimit = limitOf(entitlement, 'vendors', 25);
  const canCreate = withinLimit(entitlement, 'vendors', tracked);
  const message = typeof params['state'] === 'string' ? MESSAGES[params['state']] : undefined;

  return (
    <main>
      <header className="c-page__head">
        <div>
          <h1 className="c-page__title">Vendors</h1>
          <p className="c-page__lede">
            {tracked} tracked of{' '}
            {typeof vendorLimit === 'number' && vendorLimit < 0 ? 'unlimited' : String(vendorLimit)}.
            A vendor who has not sent anything yet still occupies a slot — finding those is the point.
          </p>
        </div>
      </header>

      {message ? (
        <p className={`notice${params['state'] === 'created' ? '' : ' error'}`} data-testid="vendor-message">
          {message}
        </p>
      ) : null}

      {vendors.length === 0 ? (
        <section className="c-empty" data-testid="vendors-empty">
          <p className="c-empty__title">No vendors yet.</p>
          <p className="c-muted">
            Add one below, or import your list. Most managers paste in the spreadsheet they already
            keep; Certly maps the columns and tells you which rows it could not take.
          </p>
        </section>
      ) : (
        <section className="c-card">
          <div className="c-table-wrap">
            <table className="c-table">
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Status</th>
                  <th>Contact mailbox</th>
                  <th>Earliest required expiry</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => {
                  const state = vendor.status as VendorState;
                  return (
                    <tr key={vendor.id}>
                      <td className="c-table__party" data-testid="vendor-row">
                        {vendor.name}
                      </td>
                      <td>
                        <StatusPill state={VENDOR_STATUS[state]} word={vendorWord(state)} asOf={today} />
                      </td>
                      <td className="c-table__meta">
                        {vendor.contactEmail ?? (
                          <span data-testid="missing-contact">
                            No mailbox — Certly cannot chase this renewal until you add one.
                          </span>
                        )}
                      </td>
                      <td className="c-date">{vendor.earliestRequiredExpiry ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="c-card">
        <div className="c-card__head">
          <h2 className="c-card__title">Add a vendor</h2>
        </div>
        {canCreate ? (
          <form action={createVendorAction}>
            <label className="c-field">
              <span className="c-field__label">Vendor name</span>
              <input className="c-input" name="name" type="text" required placeholder="Harbour Roofing" />
            </label>
            <label className="c-field">
              <span className="c-field__label">Business mailbox (optional)</span>
              <span className="c-field__hint">
                A shared mailbox at the vendor or their agency. Certly never guesses an address, and it
                stores no personal name for a vendor contact.
              </span>
              <input className="c-input" name="contactEmail" type="email" placeholder="office@harbour.test" />
            </label>
            <label className="c-field">
              <span className="c-field__label">What that mailbox is (optional)</span>
              <span className="c-field__hint">A role, such as “office” or “accounts” — not a person.</span>
              <input className="c-input" name="contactLabel" type="text" placeholder="office" />
            </label>
            <button className="c-btn c-btn--primary" type="submit">
              Add vendor
            </button>
          </form>
        ) : (
          <p className="notice warn">
            Plan limit reached at {tracked} tracked vendors.{' '}
            <Link href="/settings/billing">Upgrade</Link> to add more.
          </p>
        )}
      </section>

      {/* Surface 3 of the eleven (KB §F.4): the vendor list renders a status. */}
      <Disclaimer of="primary" />
    </main>
  );
}
