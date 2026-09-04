/**
 * `npm run kb:pull --workspace apps/wagelens -- --state TX`
 *
 * The development pull: build a corpus from SAM.gov, on the command line,
 * without a queue, a cron or a browser — the same parser, the same gates and
 * the same transaction the daily job uses, so what it proves is the pipeline
 * rather than a script.
 *
 *   --state XX        two-letter state code (index is filtered server-side)
 *   --limit N         stop after N determinations (default 25). BOUNDED BY
 *                     DEFAULT on purpose: the whole national corpus is 4,235
 *                     records and ~24 minutes serial, and nobody means to do
 *                     that by typing a command with no flags.
 *   --full            no bound. Use for the real thing.
 *   --history         also pull /history for every determination fetched
 *   --counties        pull the state's county dictionary first (default on
 *                     when --state is given)
 *   --mock            replay tests/fixtures/ instead of the network
 *   --data-dir PATH   persist PGlite to a directory instead of memory
 *   --database-url U  use Postgres instead of PGlite
 *
 * Prints a table of what was ingested and exits non-zero on a gate failure, so
 * it is usable as a smoke test as well as a tool.
 */

import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { applyMigrations, platformMigrationsDir, schema, type Db } from '@octopus/platform/db';

import { appMigrationsDir } from '../lib/db';
import {
  corpusHealth,
  fetchHistory,
  ingestCounties,
  ingestDetermination,
  refreshIndex,
  type SamAdapter,
} from '../lib/kb';
import { defaultUserAgent } from '../lib/kb/adapter';
import { LiveSamAdapter } from '../lib/kb/sam.live';
import { MockSamAdapter } from '../lib/kb/sam.mock';

type Args = {
  state?: string;
  limit: number;
  full: boolean;
  history: boolean;
  counties: boolean;
  mock: boolean;
  dataDir?: string;
  databaseUrl?: string;
};

function parseArgs(argv: string[]): Args {
  const args: Args = { limit: 25, full: false, history: true, counties: true, mock: false };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    const value = argv[i + 1];
    switch (flag) {
      case '--state':
        args.state = value?.toUpperCase();
        i += 1;
        break;
      case '--limit':
        args.limit = Number(value ?? 25);
        i += 1;
        break;
      case '--full':
        args.full = true;
        break;
      case '--no-history':
        args.history = false;
        break;
      case '--no-counties':
        args.counties = false;
        break;
      case '--mock':
        args.mock = true;
        break;
      case '--data-dir':
        args.dataDir = value;
        i += 1;
        break;
      case '--database-url':
        args.databaseUrl = value;
        i += 1;
        break;
      default:
        break;
    }
  }
  return args;
}

async function openDb(args: Args): Promise<{ db: Db; close: () => Promise<void> }> {
  const dirs = [platformMigrationsDir(), appMigrationsDir()];
  const url = args.databaseUrl ?? process.env['DATABASE_URL'];
  if (url) {
    const sql = postgres(url, { max: 2 });
    await applyMigrations({ unsafe: (s: string) => sql.unsafe(s) }, dirs);
    return { db: drizzlePg(sql, { schema }) as Db, close: async () => sql.end() };
  }
  // PGlite with an optional data directory, so a developer can pull once and
  // keep the corpus between runs.
  const client = args.dataDir ? new PGlite(args.dataDir) : new PGlite();
  await applyMigrations(client, dirs);
  return { db: drizzle(client, { schema }) as Db, close: () => client.close() };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const adapter: SamAdapter = args.mock
    ? new MockSamAdapter()
    : new LiveSamAdapter({
        baseUrl: process.env['SAM_API_BASE_URL'] ?? 'https://sam.gov/api/prod',
        userAgent:
          process.env['SAM_USER_AGENT'] ??
          defaultUserAgent(
            process.env['APP_NAME'] ?? 'Octopus',
            process.env['APP_BASE_URL'] ?? 'https://example.invalid',
          ),
        ratePerSecond: Number(process.env['SAM_RATE_LIMIT_PER_SECOND'] ?? 4),
      });

  const started = Date.now();
  const { db, close } = await openDb(args);

  const label = args.mock ? 'fixtures' : (process.env['SAM_API_BASE_URL'] ?? 'sam.gov');
  console.log(
    `kb:pull · source ${label} · ${args.state ? `state ${args.state}` : 'national'} · ` +
      `${args.full ? 'FULL' : `limit ${args.limit}`}`,
  );

  if (args.counties && args.state) {
    const counties = await ingestCounties(db, adapter, args.state);
    console.log(`  counties      ${counties}`);
  }

  // The index pass, with the fetches performed inline rather than enqueued:
  // there is no drain on a command line.
  const pending: Array<{ wdNumber: string; modificationNumber: number; record: unknown }> = [];
  const index = await refreshIndex(db, adapter, {
    ...(args.state ? { state: args.state } : {}),
    onNewPair: async (pair) => {
      pending.push(pair);
    },
  });

  if (index.status === 'aborted_on_gate') {
    console.error(`  ABORTED on pre-flight: ${index.failureReason}`);
    await close();
    process.exit(1);
  }

  console.log(`  index seen    ${index.seen}`);
  console.log(`  new pairs     ${pending.length}`);

  const budget = args.full ? pending.length : Math.min(args.limit, pending.length);
  let determinations = 0;
  let classifications = 0;
  let rateGroups = 0;
  let histories = 0;
  let revisions = 0;
  const failures: Array<{ wd: string; error: string }> = [];

  for (const pair of pending.slice(0, budget)) {
    try {
      const result = await ingestDetermination(db, adapter, {
        wdNumber: pair.wdNumber,
        revision: pair.modificationNumber,
        indexRecord: pair.record as never,
        trigger: 'pull',
      });
      if (result.status === 'inserted') {
        determinations += 1;
        classifications += result.classifications;
        rateGroups += result.rateGroups;
      }
    } catch (error) {
      failures.push({ wd: `${pair.wdNumber}/${pair.modificationNumber}`, error: String(error) });
      continue;
    }
    if (args.history) {
      try {
        const history = await fetchHistory(db, adapter, pair.wdNumber);
        histories += 1;
        revisions += history.revisions;
      } catch (error) {
        failures.push({ wd: `${pair.wdNumber}/history`, error: String(error) });
      }
    }
  }

  const health = await corpusHealth(db);
  const seconds = ((Date.now() - started) / 1000).toFixed(1);

  console.log('');
  console.log(`  determinations  ${determinations}`);
  console.log(`  rate groups     ${rateGroups}`);
  console.log(`  classifications ${classifications}`);
  console.log(`  histories       ${histories} (${revisions} revisions)`);
  console.log(`  failures        ${failures.length}`);
  for (const failure of failures.slice(0, 10)) {
    console.log(`    ${failure.wd}: ${failure.error.slice(0, 160)}`);
  }
  console.log('');
  console.log(
    `  corpus now: ${health.activeDeterminations} active · ` +
      `${health.supersededRevisionsHeld} superseded · ` +
      `${health.classifications} classification rows · ` +
      `${health.counties} counties`,
  );
  console.log(`  ${seconds}s`);
  if (!args.full && pending.length > budget) {
    console.log(`  (${pending.length - budget} more available — re-run with --full)`);
  }

  await close();
  process.exit(failures.length > 0 && determinations === 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
