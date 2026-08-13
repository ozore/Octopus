/**
 * S13 — `/app/projects/[id]/imports/new`, the CSV upload.
 *
 * AUTHORITY: `USER_JOURNEY.md` §5.1 (this screen's job is to **disappear after the
 * first use**), §5.2 (the SSN sentence), §5.4, §5.5 (component **M**, shared).
 *
 * The remembered map is fetched here, on the server, and handed to the wizard. When
 * it matches the file's header the wizard applies it with no confirmation step — no
 * modal, no "does this look right?" — and prints one quiet line saying where it came
 * from. That is heuristic #6 and WCAG 2.2 SC 3.3.7 in the same behaviour.
 */

import { notFound } from 'next/navigation';

import { ingestPayrollAction } from '../../../../../_actions/imports';
import { ImportWizard } from '../../../../../_components/import-wizard';
import { readAs, requireSession } from '../../../../../_lib/auth';
import { appClock } from '../../../../../_lib/deps';
import { rememberedMap } from '../../../../../_lib/imports';
import { readProject } from '../../../../../_lib/projects';

export const dynamic = 'force-dynamic';

export default async function NewImportPage({
  params,
}: {
  readonly params: Promise<{ readonly id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  const session = await requireSession(`/app/projects/${id}/imports/new`);
  const now = appClock().now();

  const view = await readAs(session, async (tx) => {
    const project = await readProject(tx, id);
    if (project === null) return null;
    const remembered = await rememberedMap(tx, { projectId: id, header: [] });
    return { project, remembered };
  });

  if (view === null) notFound();

  return (
    <div className="rp-stack rp-stack--section">
      <section className="rp-stack rp-measure">
        <h1>Upload payroll — {view.project.name}</h1>
        <p className="rp-t-lead">
          Drop the CSV your payroll system exports. Ratepin reads it in your browser, maps the
          columns onto the WH-347’s own fields, and posts the rows. The file itself never leaves
          your machine and is never stored, which is why changing a mapping later means uploading
          the file again.
        </p>
      </section>

      <ImportWizard
        action={ingestPayrollAction}
        projectId={id}
        remembered={
          view.remembered === null
            ? null
            : {
                map: view.remembered.map,
                uploadedOn: view.remembered.uploadedAt.toISOString().slice(0, 10),
                // The remembered map is only APPLIED when the file has the same
                // header shape. A map from a different export is offered, not used:
                // silently applying the wrong map is a wrong rate on a signed form.
                //
                // That comparison is NOT made here and cannot be: the file is parsed
                // in the browser and never uploaded, so this component has no header
                // to compare against — which is why `rememberedMap` is called with an
                // empty one. The wizard decides it in `onFile`, where the header
                // exists. Passing a server-side `sameShape` was passing a constant
                // `false`, and §5.1's silent re-application never once happened.
              }
        }
        defaultWeekEnding={now.toISOString().slice(0, 10)}
      />

      <section className="rp-stack rp-measure">
        <h2>What blocks, and what does not</h2>
        <ul className="rp-stack rp-stack--tight">
          <li>
            A file whose encoding is ambiguous is refused outright. Guessing turns Núñez into
            NuÃ±ez on a document you sign.
          </li>
          <li>
            The same file uploaded twice in the same week is recognised by its digest. You are
            offered the filing it already produced, or an amendment — which is a distinct legal
            document rather than an edit to a signed one.
          </li>
          <li>
            A deduction column with no 29 CFR 3.5 paragraph blocks its worker’s rows. There is no
            “Other”: “Other” on a signed form asserts that the deduction is permissible, and whether
            yours is permissible is a legal question about your specific deduction that Ratepin does
            not answer.
          </li>
          <li>
            Column 6B, the fringe credit, is printed exactly as you give it and disclaimed on the
            artifact. Ratepin does not verify that a plan is bona fide or annualized under 29 CFR
            5.25(c) — those are findings about your plan, not arithmetic.
          </li>
        </ul>
      </section>
    </div>
  );
}
