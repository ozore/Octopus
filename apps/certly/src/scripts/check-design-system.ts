/**
 * BUILD-TIME IDENTITY CHECK.
 *
 * `src/styles/design-system.css` is a COPY of
 * `phase-4-revenue/certly/design-system.css`, which `REVIEW.md` signed and
 * `identity/contrast.py` certifies. The copy exists because an app must build
 * from its own Root Directory on Vercel; the check exists because a copy with
 * no equality test is a fork waiting to happen — one "quick" hex edit here and
 * the certified contrast tables stop describing what ships.
 *
 * Runs as `prebuild`, as `npm run identity:check`, and again inside the vitest
 * suite (tests/identity.test.ts) so a change is caught by whichever gate the
 * author ran.
 *
 * WHEN THE SOURCE IS ABSENT the check PASSES with a printed note. A Vercel
 * deployment can be configured without "Include source files outside of the
 * Root Directory" (DEPLOY_VERCEL.md §1 says to turn it on, but a deploy that
 * is otherwise correct must not fail on a documentation file), and the file
 * genuinely may not be there. CI checks out the whole repo, so the gate that
 * matters always has both files.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

export const APP_CSS_PATH = resolve(here, '..', 'styles', 'design-system.css');
export const SOURCE_CSS_PATH = resolve(
  here,
  '..',
  '..',
  '..',
  '..',
  'phase-4-revenue',
  'certly',
  'design-system.css',
);

export type IdentityCheck =
  | { status: 'ok'; sha256: string }
  | { status: 'source_absent'; sha256: string }
  | { status: 'drift'; appSha: string; sourceSha: string };

const sha = (path: string): string =>
  createHash('sha256').update(readFileSync(path)).digest('hex');

export function checkDesignSystem(): IdentityCheck {
  const appSha = sha(APP_CSS_PATH);
  if (!existsSync(SOURCE_CSS_PATH)) return { status: 'source_absent', sha256: appSha };
  const sourceSha = sha(SOURCE_CSS_PATH);
  return appSha === sourceSha
    ? { status: 'ok', sha256: appSha }
    : { status: 'drift', appSha, sourceSha };
}

/** `import.meta.url` equals the entry when run as a script, not when imported. */
const isEntry = process.argv[1] ? resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url)) : false;

if (isEntry) {
  const result = checkDesignSystem();
  if (result.status === 'drift') {
    console.error(
      [
        'identity:check FAILED — src/styles/design-system.css has drifted from the signed source.',
        `  app    ${result.appSha}  ${APP_CSS_PATH}`,
        `  source ${result.sourceSha}  ${SOURCE_CSS_PATH}`,
        '',
        'The signed file is the source of truth. Either copy it over the app copy:',
        `  cp ${join('phase-4-revenue', 'certly', 'design-system.css')} ${join('apps', 'certly', 'src', 'styles', 'design-system.css')}`,
        'or, if the change is a real design decision, it belongs to the Brand Director:',
        'edit phase-4-revenue/certly/design-system.css, re-run identity/contrast.py (exit 0),',
        'and copy the result here.',
      ].join('\n'),
    );
    process.exit(1);
  }
  if (result.status === 'source_absent') {
    console.log(
      `identity:check skipped — ${SOURCE_CSS_PATH} is not in this checkout. App copy sha256 ${result.sha256}.`,
    );
  } else {
    console.log(`identity:check ok — design-system.css matches the signed source (sha256 ${result.sha256}).`);
  }
}
