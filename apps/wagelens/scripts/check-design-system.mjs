/**
 * Build-time drift check for the identity stylesheet.
 *
 * `src/styles/design-system.css` is a COPY of the identity fleet's signed file
 * at `phase-4-revenue/wagelens/design-system.css`. A copy is the right shape —
 * the app must build from its own directory on Vercel, and importing across the
 * workspace root would make the app's bundle depend on a planning directory —
 * but a copy silently rots. This script is what stops that: it compares the two
 * byte for byte and fails the build on any difference, naming the direction.
 *
 * The check is SKIPPED, not failed, when the source is absent (a deploy built
 * from the app's Root Directory alone). Failing there would make the deploy
 * depend on files Vercel was told not to fetch; the gate that matters runs in
 * CI, where the whole repository is checked out.
 *
 *   node scripts/check-design-system.mjs
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const copy = join(here, '..', 'src', 'styles', 'design-system.css');
const source = resolve(here, '..', '..', '..', 'phase-4-revenue', 'wagelens', 'design-system.css');

const sha = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

if (!existsSync(source)) {
  console.log(`[design-system] source not present (${source}) — skipping the drift check.`);
  process.exit(0);
}

if (!existsSync(copy)) {
  console.error(`[design-system] MISSING: ${copy}`);
  process.exit(1);
}

const a = sha(source);
const b = sha(copy);

if (a !== b) {
  console.error(
    [
      '[design-system] DRIFT: the app stylesheet is not the identity fleet’s file.',
      `  source ${source}`,
      `         sha256 ${a}`,
      `  copy   ${copy}`,
      `         sha256 ${b}`,
      '',
      '  The identity author owns the source. If the source changed, refresh the copy:',
      '    cp phase-4-revenue/wagelens/design-system.css apps/wagelens/src/styles/design-system.css',
      '  If the COPY was edited, revert it: components style themselves from the',
      '  semantic --wl-* tokens, never by editing the system (IDENTITY arbitration).',
    ].join('\n'),
  );
  process.exit(1);
}

console.log(`[design-system] ok — copy matches source (sha256 ${a.slice(0, 12)}…)`);
