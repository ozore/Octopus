/**
 * Reset the TENANT half of the database before a run, and nothing else.
 *
 * The journey creates an account and walks it from nothing to a signed WH-347, so
 * it has to start from nothing. What it must NOT start from is an empty mirror: the
 * corpus — `wd_*`, `corpus_*`, `county_class_rate`, `plans`, the regulatory
 * constants — is what `npm run seed` fetched out of the recorded SAM.gov bytes, and
 * re-ingesting it per run would make a browser suite responsible for a nightly job.
 *
 * So this truncates customer data and leaves the mirror standing. `accounts` cascades
 * to projects, imports, weeks, filings, artifacts, subscriptions and meter events;
 * the platform tables outside that graph are named explicitly.
 *
 * IT RUNS AS THE OWNER, and it is the only thing in this suite that writes. The
 * application's own connection is configured in `playwright.config.ts`.
 */

import postgres from 'postgres';

const TENANT_TABLES = [
  'accounts',
  'users',
  'auth_magic_links',
  'auth_sessions',
  'email_outbox',
  'rate_card_purchases',
  'stripe_events',
  'payroll_title',
] as const;

export default async function globalSetup(): Promise<void> {
  const url =
    process.env['E2E_DATABASE_URL'] ?? 'postgres://postgres:ratepin@127.0.0.1:5432/ratepin';
  const sql = postgres(url, { max: 1, prepare: false });
  try {
    await sql.unsafe(`TRUNCATE ${TENANT_TABLES.join(', ')} RESTART IDENTITY CASCADE`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}
