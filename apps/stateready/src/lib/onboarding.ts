/**
 * What happens the first time an organisation exists — `specs/09` D1 and
 * `specs/13`'s signup metric.
 *
 * TWO THINGS THE PLATFORM CANNOT DO FOR US, both of which have to happen on the
 * login callback rather than later:
 *
 *  1. **`organisation_created`.** `THRESHOLDS.md` T1's denominator is
 *     *"organisations with `organisation_created`"* and `specs/13` defines
 *     Signups as distinct events of that name. The platform emits `signed_up`,
 *     which is a different name for a slightly different thing (a USER), so the
 *     app emits its own on the organisation's first appearance. Emitting it
 *     anywhere later would count a subset of signups and quietly move T1.
 *  2. **The trial grant, with its counter.** *"First 100 signups"* is enforced,
 *     not aspirational (`specs/09` AC11): the cohort number is assigned inside
 *     the same transaction as the insert, so the cohort `THRESHOLDS.md`
 *     evaluates at n = 100 contains exactly one trial design.
 *
 * It is idempotent on both: `trial_grants.org_id` is the primary key, and the
 * event is emitted only when the grant is new.
 */

import { eq } from 'drizzle-orm';
import type { Db } from '@octopus/platform/db';
import { track } from '@octopus/platform/events';

import { grantTrial } from './trial';
import { ensureRecipient } from './repos/alerts';
import { trialGrants } from './schema';
import { TRIAL_COHORT_CAP, TRIAL_DAYS } from './plans';

export async function onOrganisationReady(
  db: Db,
  input: { orgId: string; userId: string; isInternal?: boolean; now?: Date },
): Promise<{ granted: boolean; cohortNumber: number }> {
  const now = input.now ?? new Date();
  const [existing] = await db
    .select({ orgId: trialGrants.orgId })
    .from(trialGrants)
    .where(eq(trialGrants.orgId, input.orgId))
    .limit(1);

  const grant = await grantTrial(db, {
    orgId: input.orgId,
    now,
    ...(input.isInternal === undefined ? {} : { isInternal: input.isInternal }),
  });

  // Every member is a digest recipient by default; a compliance team of two
  // must each be told, each with their own mute list (`specs/06` AC5).
  await ensureRecipient(db, { userId: input.userId, orgId: input.orgId, now });

  if (existing) return { granted: false, cohortNumber: grant.cohortNumber };

  await track(db, {
    name: 'organisation_created',
    orgId: input.orgId,
    userId: input.userId,
    props: { cohort_number: grant.cohortNumber, within_first_100: grant.cohortNumber <= TRIAL_COHORT_CAP },
  });
  await track(db, {
    name: 'trial_started',
    orgId: input.orgId,
    userId: input.userId,
    props: { days: TRIAL_DAYS, cohort_number: grant.cohortNumber },
  });
  return { granted: true, cohortNumber: grant.cohortNumber };
}
