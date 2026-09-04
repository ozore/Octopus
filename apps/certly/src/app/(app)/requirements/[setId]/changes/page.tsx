import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Disclaimer } from '@/components/Disclaimer';
import { getDb } from '@/lib/db';
import { COVERAGE_PROSE, ENDORSEMENT_PROSE, LIMIT_PROSE, type Requirement } from '@/lib/engine';
import { getRequirementSetView } from '@/lib/repos/requirements';
import { TEMPLATE_LIBRARY_VERSION, getTemplate } from '@/lib/templates';
import { diffAgainstTemplate } from '@/lib/templates/diff';
import { track } from '@octopus/platform/events';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * THE DIFF — `specs/02` §3, screen 5 of five, and the other half of the promise
 * made in §2.
 *
 * "A template is copied, not referenced" is a promise that nothing changes
 * under a customer. Its cost is drift: a customer who copied a subcontract
 * exhibit in 2026 is still running 2026's numbers in 2028. This screen is where
 * the cost is paid back — it says what the library says now, row by row, and
 * the customer chooses. It changes nothing by itself.
 */

const PROSE = {
  coverage: COVERAGE_PROSE as Record<string, string>,
  limit: LIMIT_PROSE as Record<string, string>,
  endorsement: ENDORSEMENT_PROSE as Record<string, string>,
};

export default async function TemplateChangesPage({ params }: { params: Promise<{ setId: string }> }) {
  const { setId } = await params;
  const { org, user } = await requireOrg();
  const db = await getDb();

  const view = await getRequirementSetView(db, org.id, setId);
  if (!view) notFound();

  await track(db, { name: 'template_update_previewed', orgId: org.id, userId: user.id, props: { set_id: setId } });

  const template = view.set.sourceTemplateId ? getTemplate(view.set.sourceTemplateId) : null;
  const mine: Requirement[] = view.rows.map((row) => ({
    id: row.id,
    kind: row.kind as Requirement['kind'],
    coverage: row.coverage as Requirement['coverage'],
    limitLabel: row.limitLabel as Requirement['limitLabel'],
    minAmount: row.minAmount,
    combinable: row.combinable,
    endorsementKey: row.endorsementKey as Requirement['endorsementKey'],
    acceptsForms: row.acceptsForms ?? [],
    condition: (row.condition ?? null) as Requirement['condition'],
    otherLabel: row.otherLabel,
    label: row.label,
    severity: row.severity as Requirement['severity'],
    note: row.note,
    sortOrder: row.sortOrder,
  }));

  const diff = diffAgainstTemplate({
    mine,
    template: view.set.sourceTemplateId ? template : null,
    copiedVersion: view.set.sourceTemplateVersion,
    libraryVersion: TEMPLATE_LIBRARY_VERSION,
    prose: PROSE,
    retiredNote: view.set.sourceTemplateId && !template ? undefined : null,
  });

  return (
    <main>
      <header className="c-page__head">
        <div>
          <h1 className="c-page__title">What changed in the library</h1>
          <p className="c-page__lede">
            {view.set.name} — your copy is version {view.set.version}, taken from library version{' '}
            {view.set.sourceTemplateVersion ?? '—'}. The library ships version {TEMPLATE_LIBRARY_VERSION}.
          </p>
        </div>
      </header>

      <p className="c-gap-3">
        <Link className="c-btn c-btn--quiet" href={`/requirements/${setId}`}>
          ← Back to the editor
        </Link>
      </p>

      <Disclaimer of="templates" />

      {!view.set.sourceTemplateId ? (
        <p className="notice" data-testid="hand-built">
          This set was built by hand, so there is no library template to compare it with.
        </p>
      ) : diff.retired ? (
        <p className="notice warn" data-testid="template-retired">
          {diff.retiredNote}
        </p>
      ) : diff.upToDate ? (
        <p className="notice" data-testid="diff-up-to-date">
          Nothing in the library has moved since you copied it. Your edits are yours and are not listed
          here as differences.
        </p>
      ) : (
        <section className="c-card">
          <div className="c-card__head">
            <h2 className="c-card__title">Row by row</h2>
            <span className="c-xs c-muted">
              {diff.addedCount} added · {diff.changedCount} changed · {diff.removedCount} not in the
              library
            </span>
          </div>
          <div className="c-table-wrap">
            <table className="c-table">
              <thead>
                <tr>
                  <th>Requirement</th>
                  <th>Change</th>
                  <th>Yours</th>
                  <th>The library</th>
                </tr>
              </thead>
              <tbody>
                {diff.rows
                  .filter((row) => row.change !== 'unchanged')
                  .map((row) => (
                    <tr key={row.key} data-testid={`diff-${row.change}`}>
                      <td className="c-table__party">{row.label}</td>
                      <td className="c-table__meta">{row.change}</td>
                      <td className="c-num">{row.fields.map((f) => `${f.field}: ${f.from}`).join('; ') || '—'}</td>
                      <td className="c-num">{row.fields.map((f) => `${f.field}: ${f.to}`).join('; ') || '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <p className="c-small c-muted">
            Nothing here has been applied. Edit the rows you want in the editor; comparisons already run
            keep the version they were run against.
          </p>
        </section>
      )}
    </main>
  );
}
