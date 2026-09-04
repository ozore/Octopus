/**
 * The suite's fixtures and harness.
 *
 * Every test runs on **PGlite with the real committed migrations** — the
 * platform's first, then this app's — so a repository test exercises the same
 * constraints production has: the check on `base_rate > 0`, the unique index on
 * `(wd_number, modification_number)`, the foreign key into `organisations`.
 * No container, no network, no credential.
 *
 * The SAM adapter is always the mock, replaying `tests/fixtures/`. That is not
 * a convenience: the fixtures were captured from the live service and are
 * committed, so a test that passes here is a test about the data SAM actually
 * returns rather than about data we invented to make a test pass.
 */

import { newId } from '@octopus/platform';
import { organisations, users } from '@octopus/platform/db';
import { createTestDb, makeTestAdapters, testEnv } from '@octopus/platform/testing';

import { MockSamAdapter } from '../src/lib/kb/sam.mock';
import { appMigrationsDir } from '../src/lib/db';

export const APP_TEST_ENV = {
  APP_NAME: 'WageLens',
  APP_SLUG: 'wagelens',
  STRIPE_PRICE_CREW: 'price_test_crew',
  STRIPE_PRICE_SHOP: 'price_test_shop',
};

export async function makeDb() {
  return createTestDb([appMigrationsDir()]);
}

export function makeSam(options?: ConstructorParameters<typeof MockSamAdapter>[0]) {
  return new MockSamAdapter(options);
}

export function makeEnv() {
  return testEnv(APP_TEST_ENV);
}

export { makeTestAdapters };

export async function seedOrg(
  db: Awaited<ReturnType<typeof makeDb>>['db'],
  name = 'Ridgeline Mechanical LLC',
) {
  const [org] = await db
    .insert(organisations)
    .values({ id: newId('org'), name, slug: `org-${Math.random().toString(36).slice(2, 8)}` })
    .returning();
  const [user] = await db
    .insert(users)
    .values({ id: newId('usr'), email: `owner-${Math.random().toString(36).slice(2, 8)}@example.test` })
    .returning();
  return { orgId: org?.id as string, userId: user?.id as string };
}

/** The Harris County index fixture, as records — six determinations, three of
 *  them "Heavy", which is what makes the F3 branch real. */
export function harrisIndexRecords() {
  return new MockSamAdapter().indexRecordsFromFixture();
}
