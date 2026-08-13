/**
 * S14 — `/app/imports/[id]/map`, the mapping this import used.
 *
 * AUTHORITY: `USER_JOURNEY.md` §5.1 (the map is remembered), §5.4 (the duplicate
 * branch: "This is the same file you uploaded at 15:12" and the two real choices),
 * §5.5 (component **M** is shared with the free generator).
 *
 * The mapping WIDGET lives on S13, because it needs the file and Ratepin does not
 * keep the file. This screen is the record of what the map was, so a customer can
 * check it without re-uploading, and the honest sentence about why re-mapping needs
 * a re-upload is on the page rather than in a footnote.
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { readAs, requireSession } from '../../../../_lib/auth';
import { MAP_TARGETS, readImport } from '../../../../_lib/imports';
import { RefusalView } from '@/app/_components/refusal';

export const dynamic = 'force-dynamic';

export default async function ImportMapPage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ readonly id: string }>;
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  const query = await searchParams;
  const session = await requireSession(`/app/imports/${id}/map`);
  const record = await readAs(session, async (tx) => readImport(tx, id));
  if (record === null) notFound();

  const duplicate = query['duplicate'] === '1';

  return (
    <div className="rp-stack rp-stack--section">
      <section className="rp-stack rp-measure">
        <h1>Column mapping</h1>
        <p className="rp-t-lead rp-num">
          {record.projectName ?? 'Project'} · uploaded{' '}
          {record.uploadedAt.toISOString().slice(0, 16).replace('T', ' ')} · {record.rowCount} rows
        </p>
      </section>

      {duplicate ? (
        <RefusalView
          refusal={{
            primitive: 'P-S',
            headline: `This is the same file you uploaded at ${record.uploadedAt.toISOString().slice(11, 16)}`,
            blocked:
              'Ratepin did not create a second week from it. Imports are idempotent on the file’s ' +
              'digest, so nothing was written twice.',
            because:
              'The bytes you just uploaded hash to the digest already recorded against this ' +
              'import.',
            clearedBy: {
              kind: 'onThisScreen',
              label: 'Two things you can do, and they are different documents',
            },
            clearsItself: null,
            severity: 'narrowed',
          }}
        >
            <div className="rp-btn-row">
              {record.weekId === null ? null : (
                <Link className="rp-btn rp-btn--quiet" href={`/app/imports/${id}/resolve`}>
                  Open the week this file produced
                </Link>
              )}
              {record.projectId === null ? null : (
                <Link
                  className="rp-btn rp-btn--quiet"
                  href={`/app/projects/${record.projectId}/imports/new`}
                >
                  Upload it again as an amendment
                </Link>
              )}
            </div>
            <p className="rp-t-micro">
              An amended certified payroll is a distinct legal document, not an edit to a signed
              one. It gets its own sequence number and you sign it again.
            </p>
        </RefusalView>
      ) : null}

      <section className="rp-stack">
        <h2>What each WH-347 field was read from</h2>
        <div className="rp-tablewrap">
          <table className="rp-table">
            <thead>
              <tr>
                <th scope="col">WH-347 field</th>
                <th scope="col">Your column</th>
              </tr>
            </thead>
            <tbody>
              {MAP_TARGETS.map((spec) => {
                const index = record.map.targets[spec.target];
                return (
                  <tr key={spec.target}>
                    <th scope="row">{spec.label}</th>
                    <td className="rp-num">
                      {index === undefined
                        ? '— not in this file —'
                        : (record.map.header[index] ?? `Column ${index + 1}`)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {record.map.deductions.length === 0 ? null : (
        <section className="rp-stack">
          <h2>Deduction columns</h2>
          <div className="rp-tablewrap">
            <table className="rp-table">
              <thead>
                <tr>
                  <th scope="col">Column</th>
                  <th scope="col">29 CFR 3.5 paragraph</th>
                </tr>
              </thead>
              <tbody>
                {record.map.deductions.map((column) => (
                  <tr key={column.columnIndex} data-row={column.category === 'UNMAPPED' ? 'blocked' : undefined}>
                    <th scope="row">{column.rawLabel}</th>
                    <td>{column.category === 'UNMAPPED' ? 'not named — these rows are blocked' : column.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="rp-stack rp-measure">
        <h2>Changing this mapping</h2>
        <p>
          Ratepin did not keep the file. The rows are here, the mapping is here, and the payroll
          export itself was never uploaded — which is the whole reason there is no copy of your
          crew’s pay sitting in an object store. To change how a column was read, upload the file
          again; the map you confirmed is applied automatically and you change only the part that
          was wrong.
        </p>
        {record.projectId === null ? null : (
          <div className="rp-btn-row">
            <Link className="rp-btn rp-btn--quiet" href={`/app/projects/${record.projectId}/imports/new`}>
              Upload this week again
            </Link>
            {record.weekId === null ? null : (
              <Link className="rp-btn rp-btn--primary" href={`/app/imports/${id}/resolve`}>
                Go to resolution
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
