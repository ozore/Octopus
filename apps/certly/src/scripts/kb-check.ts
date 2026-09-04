/**
 * `npm run kb:check` — the knowledge-base gate the specs name.
 *
 * `specs/02` §11, `specs/03` §15, `KNOWLEDGE_BASE.md` §E. Six checks, one exit
 * code, no network:
 *
 *  1. every requirement template validates against its schema;
 *  2. every template source is a real URL with a `last_verified` date, and a
 *     row older than 180 days is REPORTED (not failed — KB §E's rule is that a
 *     stale row shows its date in the app, and the customer decides);
 *  3. every `form_edition` the knowledge base treats as current exists in the
 *     committed JSON Schema (KB §E's re-opened gate: this is the check that
 *     makes B-01's class of error impossible rather than merely fixed);
 *  4. every golden-set fixture named in `specs/03` §15 is present — G17 is
 *     reported as PENDING until the 2025/12 blank is fetched;
 *  5. every present fixture has an expected-value file, ONCE the labelling has
 *     started. An empty `expected/` reports a backlog and passes; a partially
 *     filled one fails on the gap. Failing a build for work nobody has begun
 *     teaches people to ignore the build; failing it the moment the set is
 *     half-labelled is what keeps it complete;
 *  6. every expected file names `labelled_by`, `labelled_on` and a DIFFERENT
 *     `reviewed_by` (PLAN.md §A10's two-pass discipline).
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { templateSchema } from '../lib/templates/schema';
import { FORM_EDITIONS } from '../lib/engine';

const HERE = dirname(fileURLToPath(import.meta.url));
const APP_ROOT = resolve(HERE, '..', '..');
const LIBRARY = join(APP_ROOT, 'src', 'lib', 'templates', 'library');
const FIXTURES = join(APP_ROOT, 'tests', 'fixtures', 'coi');
const EXPECTED = join(FIXTURES, 'expected');
const SCHEMA = resolve(
  APP_ROOT,
  '..',
  '..',
  'phase-4-revenue',
  'certly',
  'specs',
  'schema',
  'coi.v1.schema.json',
);

/** `specs/03` §15's canonical membership. G18–G21 are synthetic and have no file. */
const GOLDEN_SET: { id: string; file: string; pending?: string }[] = [
  { id: 'G1', file: 'wisdot-insurance-cert-example-acord25-2016-03.pdf' },
  { id: 'G2', file: 'OSFL-coi-sample.pdf' },
  { id: 'G3', file: 'durham-county-sample-coi-consultant-contractor.pdf' },
  { id: 'G4', file: 'Sample-COI-Vendors-08-03-2020.pdf' },
  { id: 'G5', file: 'story-county-ia-coi.pdf' },
  { id: 'G6', file: 'temecula-ca-sample-insurance-certificate.pdf' },
  { id: 'G7', file: 'los-alamitos-ca-coi-sample.pdf' },
  { id: 'G8', file: 'riverside-ca-risk-management-sample-coi.pdf' },
  { id: 'G9', file: 'nyc-dycd-insurance-sample-package25.pdf' },
  { id: 'G10', file: 'nyc-dycd-fy2023-proof-of-insurance-sample-package.pdf' },
  { id: 'G11', file: 'essex-county-ny-fairgrounds-sample-cert.pdf' },
  { id: 'G12', file: 'tn-suppliers-certificate-of-insurance.pdf' },
  { id: 'G13', file: 'mcgough-subcontractor-sample-coi-exhibit-b.pdf' },
  { id: 'G14', file: 'idaho-iceworld-coi-sample.pdf' },
  { id: 'G15', file: 'certificates_how_to_read_and_review_with_acord_forms.pdf' },
  { id: 'G16', file: 'nevada-risk-cert-and-endorsement-samples.pdf' },
  {
    id: 'G17',
    file: 'acord25-2025-12-blank.pdf',
    pending:
      'the current edition (2025/12). Fetch it before writing the extractor — the command is in tests/fixtures/coi/MANIFEST.md. M4 cannot be declared done while a golden-set fixture is a URL.',
  },
];

/** Editions `KNOWLEDGE_BASE.md` §A.2 treats as real; 2025/12 is CURRENT. */
const KB_EDITIONS = ['2010/05', '2014/01', '2016/03', '2025/12'];

const STALE_AFTER_DAYS = 180;

export type CheckReport = {
  failures: string[];
  warnings: string[];
  notes: string[];
};

export function runKbCheck(today = new Date()): CheckReport {
  const failures: string[] = [];
  const warnings: string[] = [];
  const notes: string[] = [];

  // --- 1 & 2. Templates ----------------------------------------------------
  const templateFiles = readdirSync(LIBRARY).filter((name) => name.endsWith('.json'));
  if (templateFiles.length === 0) failures.push('the template library is empty');

  for (const name of templateFiles) {
    const raw = JSON.parse(readFileSync(join(LIBRARY, name), 'utf8')) as unknown;
    const parsed = templateSchema.safeParse(raw);
    if (!parsed.success) {
      failures.push(`template ${name} does not validate: ${parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`);
      continue;
    }
    const template = parsed.data;
    if (template.id !== name.replace(/\.json$/, '')) {
      failures.push(`template ${name} declares id "${template.id}" — the file name and the id must match`);
    }
    for (const source of template.sources) {
      try {
        const url = new URL(source.url);
        if (url.protocol !== 'https:') failures.push(`${template.id}: ${source.url} is not https`);
      } catch {
        failures.push(`${template.id}: ${source.url} is not a URL`);
      }
      const age = Math.floor((today.getTime() - Date.parse(source.last_verified)) / 86_400_000);
      if (Number.isNaN(age)) failures.push(`${template.id}: last_verified "${source.last_verified}" is not a date`);
      else if (age > STALE_AFTER_DAYS) {
        // KB §E: a stale row shows its DATE in the app — not a warning banner,
        // and not a failed build. The customer decides how much to trust it.
        warnings.push(`${template.id}: ${source.url} was last checked ${age} days ago (over ${STALE_AFTER_DAYS})`);
      }
    }
    if (template.unverified) {
      notes.push(`${template.id} ships flagged UNVERIFIED, as KNOWLEDGE_BASE.md §B requires`);
    }
  }

  // --- 3. The form-edition gate (KB §E, REVIEW.md B-01) --------------------
  if (existsSync(SCHEMA)) {
    // Parsed, not grepped. `"form_edition"` also appears in the top-level
    // `required` array, so a lazy regex finds `document_kind`'s enum instead
    // and reports every edition as missing — which is how a gate that is
    // supposed to catch a real drift ends up crying wolf on day one.
    const schema = JSON.parse(readFileSync(SCHEMA, 'utf8')) as {
      properties?: { form_edition?: { enum?: string[] } };
    };
    const declared = schema.properties?.form_edition?.enum ?? [];
    if (declared.length === 0) {
      failures.push('specs/schema/coi.v1.schema.json has no form_edition enum');
    }
    for (const edition of KB_EDITIONS) {
      if (!declared.includes(edition)) {
        failures.push(
          `form_edition "${edition}" is named by KNOWLEDGE_BASE.md §A.2 but is not in specs/schema/coi.v1.schema.json`,
        );
      }
    }
    for (const edition of FORM_EDITIONS) {
      if (edition !== 'unknown' && !declared.includes(edition)) {
        failures.push(`the app's FORM_EDITIONS has "${edition}" and the committed schema does not`);
      }
    }
  } else {
    notes.push(`the committed schema is not in this checkout (${SCHEMA}) — the edition gate was skipped`);
  }

  // --- 4 & 5 & 6. The golden set ------------------------------------------
  const present = GOLDEN_SET.filter((entry) => existsSync(join(FIXTURES, entry.file)));
  const missing = GOLDEN_SET.filter((entry) => !existsSync(join(FIXTURES, entry.file)));

  for (const entry of missing) {
    if (entry.pending) notes.push(`${entry.id} is PENDING — ${entry.pending}`);
    else failures.push(`golden-set fixture ${entry.id} (${entry.file}) is missing`);
  }

  const expectedFiles = existsSync(EXPECTED)
    ? readdirSync(EXPECTED).filter((name) => name.endsWith('.json') && name !== 'redacted-names.json')
    : [];

  if (expectedFiles.length === 0) {
    notes.push(
      `the golden set is NOT LABELLED: ${present.length} fixtures, 0 expected-value files. ` +
        'This is the only wave-2 item with a multi-day serial dependency — see ' +
        'tests/fixtures/coi/expected/README.md. Nothing in M4 can be measured until it is done.',
    );
  } else {
    // The switch: once labelling has started, an unlabelled fixture is a failure.
    for (const entry of present) {
      const expectedName = `${entry.file.replace(/\.pdf$/i, '')}.json`;
      if (!expectedFiles.includes(expectedName)) {
        failures.push(`golden-set fixture ${entry.id} has no expected-value file (${expectedName})`);
      }
    }
    for (const name of expectedFiles) {
      const label = JSON.parse(readFileSync(join(EXPECTED, name), 'utf8')) as Record<string, unknown>;
      for (const key of ['fixture', 'golden_id', 'labelled_by', 'labelled_on', 'reviewed_by', 'expected']) {
        if (label[key] === undefined || label[key] === null || label[key] === '') {
          failures.push(`${name} is missing "${key}"`);
        }
      }
      if (label['labelled_by'] && label['labelled_by'] === label['reviewed_by']) {
        failures.push(`${name}: labelled_by and reviewed_by are the same — PLAN.md §A10 requires two independent passes`);
      }
    }
    if (!existsSync(join(EXPECTED, 'redacted-names.json'))) {
      failures.push(
        'expected/redacted-names.json is missing — specs/03 §15.3 needs it before any accuracy number is published',
      );
    }
  }

  return { failures, warnings, notes };
}

const isEntry = process.argv[1] ? resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url)) : false;

if (isEntry) {
  const report = runKbCheck();
  for (const note of report.notes) console.log(`note    ${note}`);
  for (const warning of report.warnings) console.warn(`warn    ${warning}`);
  for (const failure of report.failures) console.error(`FAIL    ${failure}`);
  console.log(
    `\nkb:check — ${report.failures.length} failures, ${report.warnings.length} warnings, ${report.notes.length} notes.`,
  );
  process.exit(report.failures.length > 0 ? 1 : 0);
}
