/**
 * `prebuild` gate — specs/12 §Edge cases, founder prerequisite P10.
 *
 * A missing legal address is a LAUNCH BLOCKER, not a TODO: CAN-SPAM requires a
 * postal address in commercial mail, and this product sends alert digests. So
 * the build fails rather than shipping a placeholder one.
 *
 * The rule lives in `src/lib/legal/address.ts` and is unit-tested there; this
 * script is the thing that runs it before `next build`. It is plain ESM with no
 * imports so it works before any compilation step, and it duplicates only the
 * placeholder list, which `tests/legal.test.ts` asserts is identical to the
 * module's.
 */
const PLACEHOLDERS = [
  'address on file with the founder',
  'address on file',
  'tbd',
  'todo',
  'n/a',
  'coming soon',
];

const address = (process.env.COMPANY_ADDRESS ?? '').trim();

function fail(reason) {
  console.error('\n  StateReady build refused.\n');
  console.error(`  ${reason}\n`);
  console.error('  Set COMPANY_ADDRESS in the deployment environment. `.env.example` ships it blank');
  console.error('  on purpose — see specs/12 and PREREQUISITES P10.\n');
  process.exit(1);
}

if (address.length === 0) {
  fail('COMPANY_ADDRESS is empty, and every alert email carries a CAN-SPAM footer built from it.');
}
if (PLACEHOLDERS.includes(address.toLowerCase())) {
  fail(`COMPANY_ADDRESS is the placeholder "${address}", which is the shared platform default rather than an address.`);
}
if (!/\s/.test(address)) {
  fail(`COMPANY_ADDRESS "${address}" does not look like a postal address.`);
}
