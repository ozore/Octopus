/**
 * S20 — `/app/settings/memory`, the classification memory and the column maps.
 *
 * AUTHORITY: `USER_JOURNEY.md` §6.3 (what the memory is keyed on and why),
 * §6.3.1 (the permission table, restated for the reader whose memory this is),
 * §6.4 ("changing memory does **not** alter filings already generated. Artifacts are
 * immutable"), §5.1 (remembered column maps).
 *
 * Every row shows its SOURCE — deterministic, model-ranked, or confirmed by you —
 * because "which of my answers were mine" is the question this screen exists to
 * answer. No row anywhere shows another company's count.
 */

import Link from 'next/link';

import { PICKER_FOOTNOTE } from '@/classify';

import { forgetColumnMapAction, forgetMemoryAction } from '../../../_actions/settings';
import { readAs, requireSession } from '../../../_lib/auth';
import { MEMORY_IMMUTABILITY_NOTE } from '../../../_lib/copy';
import { listColumnMaps, MAP_TARGETS } from '../../../_lib/imports';
import { listMemory } from '../../../_lib/resolve';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Classification memory — Ratepin' };

const SOURCE_LABEL: Readonly<Record<string, string>> = {
  user_confirmed: 'you confirmed it',
  deterministic: 'matched on the determination’s own text',
  llm_ranked: 'you chose it from a ranked list',
};

export default async function MemoryPage(): Promise<React.ReactElement> {
  const session = await requireSession('/app/settings/memory');
  const view = await readAs(session, async (tx) => ({
    memory: await listMemory(tx),
    maps: await listColumnMaps(tx),
  }));

  return (
    <div className="rp-stack rp-stack--section">
      <section className="rp-stack rp-measure">
        <h1>Classification memory</h1>
        <p className="rp-t-lead">
          Every payroll title you have answered, and what you answered. Memory is keyed on the wage
          determination’s group rather than on the project, so one answer covers every project
          carrying that group — and it survives a re-pin to a new revision.
        </p>
        <p>{PICKER_FOOTNOTE}</p>
      </section>

      {view.memory.length === 0 ? (
        <div className="rp-empty">
          <p className="rp-empty__title">Nothing remembered yet</p>
          <p className="rp-empty__body">
            The first filing on a new account asks about every distinct payroll title once. After
            that they resolve silently, and this page is where you change your mind.
          </p>
        </div>
      ) : (
        <div className="rp-tablewrap">
          <table className="rp-table">
            <caption className="rp-sr-only">Remembered classifications</caption>
            <thead>
              <tr>
                <th scope="col">Your payroll title</th>
                <th scope="col">Classification</th>
                <th scope="col">Where it came from</th>
                <th scope="col">Filings using it</th>
                <th scope="col">Forget it</th>
              </tr>
            </thead>
            <tbody>
              {view.memory.map((entry) => (
                <tr key={entry.observationId}>
                  <th scope="row" className="rp-num">
                    {entry.titleRaw}
                    <span className="rp-t-micro"> normalized: {entry.titleNorm}</span>
                  </th>
                  <td>
                    {entry.chosenClassNorm}
                    <span className="rp-t-micro rp-num">
                      {' '}
                      {entry.chosenIdentifier} · {String(entry.wdNumber)} r{entry.revision}
                    </span>
                  </td>
                  <td>
                    {SOURCE_LABEL[entry.provenance] ?? entry.provenance} ·{' '}
                    <span className="rp-num">{entry.resolvedAtLevel.replace('_', '-')}</span>
                  </td>
                  <td className="rp-td--num">{entry.affectedFilings}</td>
                  <td>
                    <form action={forgetMemoryAction}>
                      <input type="hidden" name="observationId" value={String(entry.observationId)} />
                      <button type="submit" className="rp-btn rp-btn--quiet rp-btn--sm">
                        Forget
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="rp-measure">{MEMORY_IMMUTABILITY_NOTE}</p>

      <section className="rp-stack">
        <h2>Column maps</h2>
        <p className="rp-measure">
          The mapping from your payroll export’s columns onto the WH-347’s own fields. It is applied
          without asking on every upload whose header matches, which is the whole point of keeping
          it. Forget one and the next upload proposes a mapping again.
        </p>
        {view.maps.length === 0 ? (
          <p>No column map has been confirmed yet.</p>
        ) : (
          <div className="rp-tablewrap">
            <table className="rp-table">
              <thead>
                <tr>
                  <th scope="col">Uploaded</th>
                  <th scope="col">Project</th>
                  <th scope="col">Fields mapped</th>
                  <th scope="col">Deduction columns</th>
                  <th scope="col">Forget it</th>
                </tr>
              </thead>
              <tbody>
                {view.maps.map((entry) => (
                  <tr key={entry.importId}>
                    <th scope="row" className="rp-num">
                      {entry.uploadedAt.toISOString().slice(0, 10)}
                    </th>
                    <td>{entry.projectName ?? '—'}</td>
                    <td className="rp-td--num">
                      {Object.keys(entry.map.targets).length} of {MAP_TARGETS.length}
                    </td>
                    <td className="rp-num">
                      {entry.map.deductions.length === 0
                        ? '—'
                        : entry.map.deductions
                            .map((column) => `${column.rawLabel} → ${column.category}`)
                            .join(' · ')}
                    </td>
                    <td>
                      <form action={forgetColumnMapAction}>
                        <input type="hidden" name="importId" value={entry.importId} />
                        <button type="submit" className="rp-btn rp-btn--quiet rp-btn--sm">
                          Forget
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rp-stack rp-measure">
        <h2>What leaves this account, and what does not</h2>
        <p>
          Your payroll data is never sent to a model. The only thing that ever reaches one is a
          normalized job title of 128 characters or fewer, and only when a classification is
          unmapped. The model’s response schema has no numeric field, so it cannot emit a rate.
        </p>
        <p>
          Your confirmed answers apply to your filings and to nobody else’s. Where five or more
          unrelated companies have independently mapped the same title, that fact may change the{' '}
          <em>order</em> of a candidate list for someone else — and nothing else. It never selects,
          never pre-fills and never auto-applies.
        </p>
        <p>
          <Link href="/app/settings/data">Export or delete everything</Link>
        </p>
      </section>
    </div>
  );
}
