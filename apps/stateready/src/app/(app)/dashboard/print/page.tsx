import { PrintableDeadlineTable } from '@/components/board';
import { PaperSurface } from '@/components/paper';
import { Disclaimer } from '@/components/provenance';
import { StatusChip, TileGrid } from '@/components/status';
import { getDb } from '@/lib/db';
import { buildBoard } from '@/lib/repos/board';
import { requireOrg } from '@octopus/platform/next';

export const dynamic = 'force-dynamic';

/**
 * `/dashboard/print` — the compliance export. `specs/07` §Other views, AC6.
 *
 * **This is what gets emailed to a general contractor or a private-equity
 * diligence team, which makes it a distribution channel and not a feature.** It
 * therefore carries the status band, the full deadline table, and — on every
 * derived rule — the citation URL and the `last_verified` date.
 *
 * IT IS A PAPER PAGE THE BROWSER PRINTS, NOT A SERVER-RENDERED PDF, and that is
 * a recorded deviation (**BUILD.md §4 D7**). The spec asks for a PDF; shipping
 * one would mean adding a rendering engine to a workspace whose whole test lane
 * is "no network, no keys", to produce a document that `design-system.css`
 * already produces better: `@media print` forces the paper theme, expands the
 * status hatches so a black-and-white bid packet still separates the four, and
 * prints every provenance link as a full URL after the rule it belongs to. The
 * customer gets a PDF from the print dialog; the CSV at `/dashboard/export` is
 * the fallback `specs/07` §Errors promises.
 */
export default async function PrintPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { org } = await requireOrg();
  const db = await getDb();
  const today = new Date().toISOString().slice(0, 10);
  const state = typeof params['state'] === 'string' ? params['state'] : null;

  const model = await buildBoard(db, org.id, today, { state });

  return (
    <PaperSurface className="sr-container sr-stack" testId="print-view">
      <header>
        <p className="sr-eyebrow">Compliance summary</p>
        <h1 data-testid="print-title">{org.name}</h1>
        <p className="sr-meta">
          As at <span className="sr-number">{today}</span>
          {state ? ` · ${state} only` : ''} · {model.cards.length} deadline
          {model.cards.length === 1 ? '' : 's'}
        </p>
        <div className="sr-row">
          <StatusChip status={model.dashboard.worstStatus} />
          <span>{model.statusLine}</span>
        </div>
      </header>

      <section>
        <h2 className="sr-eyebrow">The board</h2>
        <TileGrid tiles={model.dashboard.tiles} />
      </section>

      <section>
        <h2 className="sr-eyebrow">Every deadline, with the rule behind it</h2>
        <PrintableDeadlineTable cards={model.cards} />
      </section>

      <section>
        <h2 className="sr-eyebrow">What we do and do not derive</h2>
        <p className="small">
          {org.name} operates in {model.coverage.operatingStates}{' '}
          {model.coverage.operatingStates === 1 ? 'state' : 'states'}; StateReady derives deadlines from a
          published board rule for {model.coverage.coveredStates} of them.
          {model.coverage.notDerived.length > 0
            ? ` Tracked but not derived: ${model.coverage.notDerived
                .map((pair) => `${pair.state} ${pair.trade}`)
                .join(', ')}.`
            : ''}
        </p>
      </section>

      <p className="small">
        Print this page to save it as a PDF. Printing forces the paper theme and prints every source
        link in full after the rule it belongs to.
      </p>

      <Disclaimer />
    </PaperSurface>
  );
}
