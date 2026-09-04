/**
 * `events:check` — `specs/00-event-vocabulary.md` §1, implemented.
 *
 * THE RULE: an event name exists if and only if it has a row in that file.
 * Four competing vocabularies existed before it (REVIEW.md B-14), which is how
 * a funnel comes to measure two different things with one word.
 *
 * What this script does, in order:
 *
 *  1. parse the registry out of the spec (§2 product events, §3 landing events)
 *     and the RETIRED names out of §4;
 *  2. compare it to `src/lib/events/names.ts`, which is GENERATED from it — the
 *     union type is what makes a typo a compile error rather than a silent hole
 *     in a funnel;
 *  3. fail on any retired name appearing in `src/`.
 *
 * `--write` regenerates `names.ts`. Run it after the spec changes; commit the
 * result. Like `check-design-system.ts`, an absent spec folder is reported
 * rather than failing: an app must build from its own Root Directory on Vercel,
 * where `phase-4-revenue/` does not exist.
 */

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export const APP_ROOT = join(HERE, '..', '..');
export const EVENT_SPEC_PATH = join(
  APP_ROOT,
  '..',
  '..',
  'phase-4-revenue',
  'certly',
  'specs',
  '00-event-vocabulary.md',
);
export const NAMES_PATH = join(APP_ROOT, 'src', 'lib', 'events', 'names.ts');

export type Registry = { product: string[]; landing: string[]; retired: string[] };

const NAME = /^[a-z][a-z0-9_]*$/;

/** `` `activated{minutes_from_signup}` `` → `activated`. */
function cleanName(token: string): string | null {
  const bare = token.replace(/\*\*/g, '').replace(/`/g, '').replace(/\{.*$/, '').trim();
  return NAME.test(bare) ? bare : null;
}

function section(md: string, from: string, to: string): string {
  const start = md.indexOf(from);
  const end = md.indexOf(to);
  if (start < 0 || end < 0) throw new Error(`events:check — cannot find section ${from}`);
  return md.slice(start, end);
}

export function parseRegistry(md: string): Registry {
  const product: string[] = [];
  // §2's tables: the event name is the FIRST cell of a two-cell row.
  for (const line of section(md, '## 2. Product events', '## 3. Landing-page events').split('\n')) {
    if (!line.startsWith('|')) continue;
    const cells = line.replace(/^\||\|$/g, '').split('|');
    if (cells.length < 2) continue;
    const name = cleanName(cells[0] ?? '');
    if (name && name !== 'event') product.push(name);
  }

  // §3 is prose: a `·`-separated run of backticked names.
  const landing: string[] = [];
  for (const match of section(md, '## 3. Landing-page events', '## 4. Retired names').matchAll(
    /`([^`]+)`/g,
  )) {
    const name = cleanName(match[1] ?? '');
    if (name && name.startsWith('lp_')) landing.push(name);
  }

  // §4's first column is what may never appear again.
  const retired: string[] = [];
  for (const line of md.slice(md.indexOf('## 4. Retired names')).split('\n')) {
    if (!line.startsWith('|')) continue;
    const first = (line.replace(/^\||\|$/g, '').split('|')[0] ?? '').trim();
    // The row can list several: `signup_start`, `trial_start`, `paid`.
    for (const token of first.split(',')) {
      const name = cleanName(token);
      if (name && name !== 'retired' && name !== 'name') retired.push(name);
    }
  }

  return {
    product: [...new Set(product)],
    landing: [...new Set(landing)],
    retired: [...new Set(retired)],
  };
}

export function renderNamesModule(registry: Registry): string {
  const list = (names: string[]): string => names.map((n) => `  '${n}',`).join('\n');
  return `/**
 * GENERATED FROM \`phase-4-revenue/certly/specs/00-event-vocabulary.md\`.
 * Do not edit by hand: run \`npm run events:check -- --write\`.
 *
 * \`specs/00\` §1 is the single source of every event name in Certly, and this
 * union is how a typo becomes a compile error instead of a silent hole in a
 * funnel. A name that is not here does not exist; a name in §4 (retired) is
 * refused by \`events:check\`.
 */

/** §2 — product events, owned by the spec that defines the emission point. */
export const PRODUCT_EVENTS = [
${list(registry.product)}
] as const;

/** §3 — landing-page events. Anonymous and pre-account, hence the \`lp_\` prefix. */
export const LANDING_EVENTS = [
${list(registry.landing)}
] as const;

/** §4 — names that must never appear again. */
export const RETIRED_EVENTS = [
${list(registry.retired)}
] as const;

export type ProductEventName = (typeof PRODUCT_EVENTS)[number];
export type LandingEventName = (typeof LANDING_EVENTS)[number];
export type EventName = ProductEventName | LandingEventName;

export const EVENT_NAMES: readonly EventName[] = [...PRODUCT_EVENTS, ...LANDING_EVENTS];

const REGISTRY = new Set<string>(EVENT_NAMES);

/** Runtime guard for the one place a name arrives as data: \`/api/events\`. */
export function isEventName(value: unknown): value is EventName {
  return typeof value === 'string' && REGISTRY.has(value);
}

export function isLandingEventName(value: unknown): value is LandingEventName {
  return typeof value === 'string' && (LANDING_EVENTS as readonly string[]).includes(value);
}
`;
}

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next') continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (['.ts', '.tsx'].includes(extname(entry))) out.push(path);
  }
  return out;
}

export type CheckResult =
  | { status: 'absent'; reason: string }
  | { status: 'drift'; problems: string[] }
  | { status: 'ok'; counts: { product: number; landing: number; retired: number } };

export function checkEvents(): CheckResult {
  if (!existsSync(EVENT_SPEC_PATH)) {
    return { status: 'absent', reason: `no ${EVENT_SPEC_PATH} in this checkout` };
  }
  const registry = parseRegistry(readFileSync(EVENT_SPEC_PATH, 'utf8'));
  const problems: string[] = [];

  const generated = readFileSync(NAMES_PATH, 'utf8');
  if (generated !== renderNamesModule(registry)) {
    problems.push('src/lib/events/names.ts is out of date — run `npm run events:check -- --write`');
  }

  // A retired name in shipped source is the failure this rule exists for.
  const retired = new Set(registry.retired);
  const live = new Set([...registry.product, ...registry.landing]);
  for (const path of walk(join(APP_ROOT, 'src'))) {
    if (path === NAMES_PATH) continue;
    const source = readFileSync(path, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const match of source.matchAll(/'([a-z][a-z0-9_]*)'/g)) {
      const token = match[1] ?? '';
      if (retired.has(token) && !live.has(token)) {
        problems.push(`${path}: retired event name '${token}' (specs/00 §4)`);
      }
    }
  }

  return problems.length > 0
    ? { status: 'drift', problems }
    : {
        status: 'ok',
        counts: {
          product: registry.product.length,
          landing: registry.landing.length,
          retired: registry.retired.length,
        },
      };
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop() ?? '')) {
  if (process.argv.includes('--write')) {
    const registry = parseRegistry(readFileSync(EVENT_SPEC_PATH, 'utf8'));
    writeFileSync(NAMES_PATH, renderNamesModule(registry));
    process.stdout.write(
      `events:check — wrote ${registry.product.length} product + ${registry.landing.length} landing names\n`,
    );
  } else {
    const result = checkEvents();
    if (result.status === 'absent') {
      process.stdout.write(`events:check — SKIPPED (${result.reason})\n`);
    } else if (result.status === 'drift') {
      process.stderr.write(`events:check — FAILED\n  ${result.problems.join('\n  ')}\n`);
      process.exitCode = 1;
    } else {
      process.stdout.write(
        `events:check — ok (${result.counts.product} product, ${result.counts.landing} landing, ${result.counts.retired} retired)\n`,
      );
    }
  }
}
