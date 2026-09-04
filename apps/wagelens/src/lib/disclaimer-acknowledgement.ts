/**
 * WL-11 V3 — the standing disclaimer is acknowledged once, and the record says
 * WHICH disclaimer was acknowledged.
 *
 * A row that says "she agreed" is worth very little a year later; a row that
 * says "she agreed to *this text*, and here is its hash" is evidence. So the
 * version is the **content hash of `/legal/disclaimer` as it was rendered**,
 * and a material change to the words produces a different hash and one further
 * prompt — exactly once, because the unique index on `(user_id,
 * disclaimer_version)` makes a second write a no-op at the database level
 * rather than in application code.
 *
 * **The product's name is normalised out of the hash before it is taken.** The
 * founder's rename (WL-11 V8, PLAN.md A3) changes every rendered string in the
 * document and changes nothing about what the customer agreed to; re-prompting
 * every account over a word swap would train people to click past the one
 * screen in this product that must not be clicked past.
 *
 * This module deliberately holds no UI. The onboarding screen that calls it
 * lives in the signed-in app, which sub-wave B's other agents own; the write,
 * the hash and the idempotence live here so that whichever screen calls it
 * cannot get them subtly different.
 */

import { createHash } from 'node:crypto';
import { and, eq } from 'drizzle-orm';

import { getEnv } from '@/env';
import { disclaimerAcknowledgements } from '@/lib/schema';
import { newId } from '@octopus/platform';
import type { Db } from '@octopus/platform/db';
import { disclaimerContent } from '@octopus/platform/legal';

/** A stand-in for the product's name while hashing, so a rename is not a
 *  material change. Never rendered anywhere. */
const NAME_TOKEN = '{{PRODUCT}}';

/**
 * The content hash of the disclaimer document as this deploy renders it.
 * Stable across a rename, different after an edit to the words.
 */
export function disclaimerVersion(): string {
  const env = getEnv();
  const doc = disclaimerContent({
    appName: NAME_TOKEN,
    companyName: env.COMPANY_NAME,
    address: env.COMPANY_ADDRESS,
    supportEmail: env.SUPPORT_EMAIL,
    productDescription: 'federal Davis-Bacon wage determinations and certified payroll documents',
  });
  const canonical = [
    doc.title,
    doc.intro,
    ...doc.sections.flatMap((section) => [section.heading, ...section.paragraphs]),
  ]
    .join('\n')
    .split(env.APP_NAME)
    .join(NAME_TOKEN)
    .replace(/\s+/g, ' ')
    .trim();
  return createHash('sha256').update(canonical).digest('hex');
}

/** Has this user acknowledged the disclaimer as it currently reads? */
export async function hasAcknowledgedDisclaimer(
  db: Db,
  userId: string,
  version = disclaimerVersion(),
): Promise<boolean> {
  const [row] = await db
    .select({ id: disclaimerAcknowledgements.id })
    .from(disclaimerAcknowledgements)
    .where(
      and(
        eq(disclaimerAcknowledgements.userId, userId),
        eq(disclaimerAcknowledgements.disclaimerVersion, version),
      ),
    )
    .limit(1);
  return Boolean(row);
}

/**
 * Record the acknowledgement. Idempotent: calling it twice writes one row,
 * because the unique index — not a `SELECT` first — is what decides.
 */
export async function recordDisclaimerAcknowledgement(
  db: Db,
  input: { orgId: string; userId: string; version?: string },
): Promise<{ version: string }> {
  const version = input.version ?? disclaimerVersion();
  await db
    .insert(disclaimerAcknowledgements)
    .values({
      id: newId('ack'),
      orgId: input.orgId,
      userId: input.userId,
      disclaimerVersion: version,
    })
    .onConflictDoNothing();
  return { version };
}
