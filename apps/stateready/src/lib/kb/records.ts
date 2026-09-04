/**
 * The committed knowledge base, as modules.
 *
 * WHY THE RECORDS ARE COPIED INTO THE APP AND IMPORTED, NOT READ FROM
 * `phase-4-revenue/`. Two reasons, and the decision is recorded in BUILD.md and
 * CLAUDE.md because it is the first thing the next agent will want to change:
 *
 *  1. **Deployability.** Vercel builds with the Root Directory set to
 *     `apps/stateready`. Files outside it are present in the build container
 *     (the "include source files outside the Root Directory" switch) but are
 *     NOT traced into a serverless function's bundle — Next traces what the
 *     module graph reaches, and a runtime `readFile('../../phase-4-revenue/…')`
 *     reaches nothing. A static import is traced, bundled and typed.
 *  2. **Reproducibility.** A snapshot is a statement about the world on a date
 *     (`specs/14`). Records the app serves must move only when the app is
 *     deployed, so they belong to the app's own tree and its own git history.
 *
 * The copy is kept honest by `tests/kb-copy.test.ts`, which byte-compares every
 * file under `kb/` and `src/styles/design-system.css` against
 * `phase-4-revenue/stateready/`. It fails the build on any divergence, in either
 * direction, and prints the file. `npm run kb:check` runs the same comparison
 * from the command line for a pre-commit check.
 *
 * `resolveJsonModule` is on (tsconfig.base.json), so these are typed at the
 * import site and `next build` bundles them.
 */

import flElectrical from '../../../kb/kb-data/fl-electrical.json';
import flHvac from '../../../kb/kb-data/fl-hvac.json';
import flPlumbing from '../../../kb/kb-data/fl-plumbing.json';
import ncElectrical from '../../../kb/kb-data/nc-electrical.json';
import ncHvac from '../../../kb/kb-data/nc-hvac.json';
import ncPlumbing from '../../../kb/kb-data/nc-plumbing.json';
import txElectrical from '../../../kb/kb-data/tx-electrical.json';
import txHvac from '../../../kb/kb-data/tx-hvac.json';
import txPlumbing from '../../../kb/kb-data/tx-plumbing.json';

import sourcesBaseline from '../../../kb/kb-data/_sources.json';
import launchStates from '../../../kb/kb-data/_launch_states.json';

import sourcedValueSchema from '../../../kb/ontology/schema.sourced_value.json';
import stateTradeRecordSchema from '../../../kb/ontology/schema.state_trade_record.json';
import officialHosts from '../../../kb/ontology/official-hosts.json';

import type { SourceBaselineEntry, StateTradeRecord } from './types';

/** Every committed record, in a stable order (the order `validate.py` walks). */
export const KB_RECORDS: readonly StateTradeRecord[] = [
  flElectrical,
  flHvac,
  flPlumbing,
  ncElectrical,
  ncHvac,
  ncPlumbing,
  txElectrical,
  txHvac,
  txPlumbing,
] as unknown as readonly StateTradeRecord[];

export const KB_SOURCE_BASELINE: Readonly<Record<string, SourceBaselineEntry>> = (
  sourcesBaseline as { sources: Record<string, SourceBaselineEntry> }
).sources;

export const KB_LAUNCH_STATES = launchStates as {
  definition: string;
  source_url: string;
  source_year: number;
  us_total_establishments: number;
  launch_share_pct: number;
  states: { rank: number; state: string; establishments: number; employment: number }[];
};

export const ONTOLOGY = {
  sourcedValue: sourcedValueSchema as Record<string, unknown>,
  stateTradeRecord: stateTradeRecordSchema as Record<string, unknown>,
  officialHosts: officialHosts as { hosts: Record<string, string>; rejected?: Record<string, string> },
};

/**
 * The snapshot version. In CI and locally this is the content hash of the
 * records themselves; on Vercel `VERCEL_GIT_COMMIT_SHA` names the commit that
 * carried them, which is what `specs/14`'s `kb_snapshots.version` wants ("git
 * sha of kb-data/ at build"). Both are stable for identical content, which is
 * what makes `loadSnapshot` idempotent across redeploys.
 */
export function kbVersion(): string {
  return process.env['VERCEL_GIT_COMMIT_SHA'] ?? process.env['KB_VERSION'] ?? 'local';
}
