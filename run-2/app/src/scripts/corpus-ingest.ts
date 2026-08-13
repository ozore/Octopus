/**
 * `npm run corpus:ingest` — the nightly job, D5's 02:00 ET DBRA crawl.
 *
 * AUTHORITY: `CORPUS_DESIGN.md` §9.1 (the schedule), §9.2 (the stages).
 * `ARCHITECTURE.md` §2.2 factor XII: an admin process, run from an identical
 * release image.
 *
 * ---------------------------------------------------------------------------
 * THE CANARY IS INJECTED, AND ITS ABSENCE FAILS CLOSED
 *
 * G1 requires the golden payroll suite to be re-scored against the CANDIDATE corpus
 * before promotion, and `snap_promoted_complete` refuses a promoted row whose
 * `golden_suite_pass` is not TRUE. The suite belongs to the engine, and
 * `promotion/**` must not import `engine/**` (`ARCHITECTURE.md` §3.9), so this
 * script is where the two meet.
 *
 * When the engine has not registered a suite, the fallback runner returns
 * `pass: false` and the snapshot HELDs. That is deliberate and it is the correct
 * reading of G1: a corpus that has not been scored against known answers has not
 * been verified, and an unverified corpus does not get promoted just because the
 * scorer is missing. The freshness clock keeps running, filings on pinned projects
 * continue, and the banner ages — which is exactly the behaviour every other
 * ingest failure produces.
 */

import { closeDb, getDb } from '@/db';
import { getConfig } from '@/lib/config';

import { runIngest, SamClient, httpFetcher, type CanaryRunner } from '@/corpus';

/**
 * Resolve the engine's golden-suite runner without a static import.
 *
 * The specifier is computed so the type checker does not resolve a module this
 * package may not contain yet, and the shape is validated at run time rather than
 * asserted — an `any` crossing this boundary would be a hole in exactly the gate
 * that blocks the build.
 */
async function resolveCanary(): Promise<CanaryRunner> {
  const specifier = ['@', '/engine/canary'].join('');
  try {
    const loaded: unknown = await import(/* @vite-ignore */ specifier);
    const candidate = (loaded as { runGoldenSuite?: unknown }).runGoldenSuite;
    if (typeof candidate === 'function') {
      return async (): Promise<{ pass: boolean; lines: number; detail: string }> => {
        const verdict: unknown = await (candidate as () => Promise<unknown>)();
        const shape = verdict as { pass?: unknown; lines?: unknown; detail?: unknown };
        if (typeof shape.pass !== 'boolean' || typeof shape.lines !== 'number') {
          return {
            pass: false,
            lines: 0,
            detail: 'the golden suite returned a shape this build does not recognise',
          };
        }
        return {
          pass: shape.pass,
          lines: shape.lines,
          detail: typeof shape.detail === 'string' ? shape.detail : '',
        };
      };
    }
  } catch {
    // Fall through to the fail-closed runner.
  }
  return async () => ({
    pass: false,
    lines: 0,
    detail:
      'no golden payroll suite is registered, so the candidate corpus has not been scored ' +
      'against known answers. G1 requires 100% exact match before promotion; the snapshot is ' +
      'HELD, the previous snapshot stays current, and filings on pinned projects are unaffected.',
  });
}

async function main(): Promise<void> {
  const config = getConfig();
  const db = await getDb();

  const client = new SamClient({
    indexBase: config.SAM_INDEX_BASE,
    wdolBase: config.SAM_WDOL_BASE,
    fetcher: httpFetcher(),
  });

  const result = await runIngest({
    db,
    client,
    canary: await resolveCanary(),
    maxDocumentsPerRun: Number(process.env['CORPUS_MAX_DOCS'] ?? '250'),
  });

  // Structured, one line, no interpretation. The ingest report is read by a machine
  // first and a person never — every failure mode in §13 terminates in a product
  // state, not in somebody's inbox.
  process.stdout.write(
    `${JSON.stringify({
      snapshot: result.snapshotRef,
      state: result.state,
      newRevisions: result.newRevisions,
      blockingVariances: result.blockingVariances,
      quarantined: result.quarantined.length,
      quarantineDetail: result.quarantined.slice(0, 20),
      merkleRoot: result.merkleRoot,
      holdReason: result.holdReason,
      probes: result.probes.map((p) => ({ probe: p.probe, result: p.result, detail: p.detail })),
    })}\n`,
  );

  await closeDb();
  // A held snapshot is an ordinary event, not a failed job: exiting non-zero would
  // page somebody, and there is nobody to page (A3, A5).
  process.exit(0);
}

void main().catch((error: unknown) => {
  process.stderr.write(`corpus:ingest failed: ${String(error)}\n`);
  process.exit(1);
});
