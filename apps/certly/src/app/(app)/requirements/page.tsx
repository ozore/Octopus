import Link from 'next/link';

import { Disclaimer } from '@/components/Disclaimer';
import { getDb } from '@/lib/db';
import { listTemplates, type Audience } from '@/lib/templates';
import { ensureOrgSettings } from '@/lib/repos';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * THE REQUIREMENT-TEMPLATE LIBRARY — `specs/02` §3, read-only in sub-wave A.
 *
 * The library ships as JSON in the repo and this page reads it directly, never
 * the database (`specs/02` §5). What sub-wave B's M2 agent adds: the preview,
 * the apply action, the editor, the assignment table and the diff view. The
 * data, the schema, the loader and `applyTemplate` are done and tested.
 *
 * WHAT MAKES THIS DIFFERENTIATOR D3, and what must survive every redesign:
 * **every row shows where its number came from and when that was checked.**
 * Per-vendor-type templates are table stakes; templates that cite a dated,
 * fetchable source are not. A row whose source is over 180 days old shows its
 * date — a date, not a warning banner (KB §E). That division of labour is
 * deliberate: the customer decides how much to trust it.
 */

const AUDIENCES: { key: Audience; label: string; blurb: string }[] = [
  { key: 'pm', label: 'Property manager', blurb: 'Residential and commercial buildings, and the trades that work on them.' },
  { key: 'hoa', label: 'Homeowners association', blurb: 'Association property, and improvements made to it.' },
  { key: 'gc', label: 'General contractor', blurb: 'Subcontractors, sourced from five published subcontract exhibits.' },
  { key: 'tenant', label: 'Commercial landlord', blurb: 'Tenants under a lease. The weakest-sourced audience, and it says so.' },
];

export default async function RequirementsPage() {
  const { org } = await requireOrg();
  const db = await getDb();
  const settings = await ensureOrgSettings(db, org.id);
  const preferred = (settings.audience as Audience | null) ?? null;

  return (
    <main>
      <header className="c-page__head">
        <div>
          <h1 className="c-page__title">Requirements</h1>
          <p className="c-page__lede">
            Start from a template and edit it to match your own contract. A template is a copy: when we
            update the library next quarter, nothing of yours changes until you choose it.
          </p>
        </div>
      </header>

      {/* Surface 9 of the eleven (KB §F.4): §F.2, adjacent to the limits and
          not in a footer. */}
      <Disclaimer of="templates" />

      {AUDIENCES.map((audience) => {
        const templates = listTemplates(audience.key);
        return (
          <section className="c-card" key={audience.key}>
            <div className="c-card__head">
              <h2 className="c-card__title">
                {audience.label}
                {preferred === audience.key ? <span className="badge"> your audience</span> : null}
              </h2>
              <span className="c-xs c-muted">{templates.length} templates</span>
            </div>
            <p className="c-small c-muted">{audience.blurb}</p>

            <div className="c-table-wrap">
              <table className="c-table">
                <thead>
                  <tr>
                    <th>Template</th>
                    <th>What it checks</th>
                    <th>Rows</th>
                    <th>Sources</th>
                    <th>Last checked</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((template) => (
                    <tr key={template.id}>
                      <td className="c-table__party">
                        {template.label}
                        {template.unverified ? (
                          <span className="c-req__mark" data-testid={`unverified-${template.id}`}>
                            {' '}
                            {template.unverifiedNote}
                          </span>
                        ) : null}
                      </td>
                      <td className="c-table__meta">{template.coverageSummary}</td>
                      <td className="c-num">{template.rowCount}</td>
                      <td className="c-num">{template.sourceCount}</td>
                      <td className="c-date">{template.lastVerified ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      <p className="c-small c-muted">
        Applying a template, editing a set and assigning one to a vendor type land with M2 in the next
        sub-wave. The library, its schema and the copy-on-apply behaviour are already here — see{' '}
        <Link href="/design">the identity reference</Link> for the states these screens paint.
      </p>
    </main>
  );
}
