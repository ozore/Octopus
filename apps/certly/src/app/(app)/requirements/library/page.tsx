import Link from 'next/link';

import { Disclaimer } from '@/components/Disclaimer';
import { getDb } from '@/lib/db';
import { listTemplates, type Audience } from '@/lib/templates';
import { ensureOrgSettings } from '@/lib/repos';
import { track } from '@octopus/platform/events';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * THE TEMPLATE LIBRARY — `specs/02` §3, screen 1 of five.
 *
 * The library ships as JSON in the repo and this page reads it directly, never
 * the database (`specs/02` §5). A template is CONTENT; a customer's requirement
 * set is a copy of it.
 *
 * WHAT MAKES THIS DIFFERENTIATOR D3, and what must survive every redesign:
 * **every row shows where its number came from and when that was checked.**
 * Per-vendor-type templates are table stakes; templates that cite a dated,
 * fetchable source are not. `template_source_opened` is the honest test of it
 * (`specs/02` §10) — if nobody ever clicks a source, sourcing is marketing
 * rather than product and the Should list gets re-ranked.
 */

const AUDIENCES: { key: Audience; label: string; blurb: string }[] = [
  { key: 'pm', label: 'Property manager', blurb: 'Residential and commercial buildings, and the trades that work on them.' },
  { key: 'hoa', label: 'Homeowners association', blurb: 'Association property, and improvements made to it.' },
  { key: 'gc', label: 'General contractor', blurb: 'Subcontractors, sourced from five published subcontract exhibits.' },
  { key: 'tenant', label: 'Commercial landlord', blurb: 'Tenants under a lease. The weakest-sourced audience, and it says so.' },
];

export default async function TemplateLibraryPage() {
  const { org, user } = await requireOrg();
  const db = await getDb();
  const settings = await ensureOrgSettings(db, org.id);
  const preferred = (settings.audience as Audience | null) ?? null;

  await track(db, {
    name: 'template_library_opened',
    orgId: org.id,
    userId: user.id,
    props: { audience: preferred },
  });

  return (
    <main>
      <header className="c-page__head">
        <div>
          <h1 className="c-page__title">Template library</h1>
          <p className="c-page__lede">
            Start from a template and edit it to match your own contract. A template is a copy: when we
            update the library next quarter, nothing of yours changes until you choose it.
          </p>
        </div>
        <Link className="c-btn c-btn--secondary" href="/requirements">
          Your requirement sets
        </Link>
      </header>

      {/* Surface 9 of the eleven (KB §F.4): §F.2, adjacent to the limits and
          not in a footer. */}
      <Disclaimer of="templates" />

      {AUDIENCES.map((audience) => {
        const templates = listTemplates(audience.key);
        return (
          <section className="c-card" key={audience.key} data-testid={`audience-${audience.key}`}>
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
                    <tr key={template.id} data-testid={`template-${template.id}`}>
                      <td className="c-table__party">
                        <Link href={`/requirements/library/${template.id}`}>{template.label}</Link>
                        {template.unverified ? (
                          <span className="c-req__mark" data-testid={`unverified-${template.id}`}>
                            {' '}
                            {template.unverifiedNote}
                          </span>
                        ) : null}
                      </td>
                      <td className="c-table__meta">{template.coverageSummary}</td>
                      <td className="c-num">{template.rowCount}</td>
                      <td className="c-num" data-testid={`sources-${template.id}`}>
                        sourced from {template.sourceCount} {template.sourceCount === 1 ? 'document' : 'documents'}
                      </td>
                      <td className="c-date">{template.lastVerified ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </main>
  );
}
