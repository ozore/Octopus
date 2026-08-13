'use server';

/**
 * Generation and release — J7 and J9.
 *
 * AUTHORITY: `USER_JOURNEY.md` §7 (generate, preview, download), §9.3 ("Run the
 * week" — N independent jobs with idempotency keys), `ARCHITECTURE.md` §9.5 (a
 * DRAFT never posts a meter event), ADR-013 (an amendment is a new filing).
 *
 * METERING IS POST-COMMIT AND KEYED ON THE FILING ID, so a retry cannot double-bill:
 * `meterFiling` is idempotent in three independent places, and it refuses outright
 * for a status that is not certifiable. We do not charge for the artifact we told
 * you not to sign.
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getDb } from '@/db';
import { meterFiling } from '@/platform/billing/meter';

import { requireSession, writeAs } from '../_lib/auth';
import { appClock, stripeGateway } from '../_lib/deps';
import { generateFiling, readFiling, releaseFiling } from '../_lib/filings';
import { buildBoard } from '../_lib/week';

export async function generateFilingAction(formData: FormData): Promise<void> {
  const weekId = String(formData.get('weekId') ?? '');
  const session = await requireSession('/app/week');
  const db = await getDb();
  const now = appClock().now();

  const generated = await writeAs(session, async (tx) =>
    generateFiling(db, tx, {
      accountId: session.accountId,
      userId: session.userId,
      weekId,
      now,
      amendsFilingId: String(formData.get('amendsFilingId') ?? '') || null,
    }),
  );

  if (generated === null) {
    // No pin, no rate table, no filing. The project page carries the §4.5 sentence.
    redirect(String(formData.get('returnTo') ?? '/app'));
  }

  revalidatePath('/app/week');
  redirect(`/app/filings/${generated.filingId}`);
}

/**
 * §9.3 — run the week.
 *
 * Each project is generated independently, so one project's failure leaves the other
 * eight untouched. The cost was disclosed before this button, never after the charge.
 */
export async function runWeekAction(formData: FormData): Promise<void> {
  const weekEnding = String(formData.get('weekEnding') ?? '');
  const session = await requireSession('/app/week');
  const db = await getDb();
  const now = appClock().now();

  const board = await writeAs(session, async (tx) =>
    buildBoard(db, tx, { accountId: session.accountId, weekEnding, now }),
  );

  for (const row of board.rows) {
    if (row.weekId === null) continue;
    if (row.group !== 'ready' && row.group !== 'narrowed') continue;
    await writeAs(session, async (tx) =>
      generateFiling(db, tx, {
        accountId: session.accountId,
        userId: session.userId,
        weekId: row.weekId as string,
        now,
      }),
    );
  }

  revalidatePath('/app/week');
  redirect(`/app/week?weekEnding=${encodeURIComponent(weekEnding)}&ran=1`);
}

/**
 * Release, and meter — in that order, and only for a status that may be billed.
 *
 * Called when an artifact is downloaded. `meterFiling` re-reads the filing and
 * refuses on `DRAFT_NOT_CERTIFIABLE` and on a filing that is not released, so this
 * action cannot bill by getting the order wrong.
 */
export async function releaseFilingAction(formData: FormData): Promise<void> {
  const filingId = String(formData.get('filingId') ?? '');
  const session = await requireSession(`/app/filings/${filingId}`);
  const db = await getDb();
  const now = appClock().now();

  const filing = await writeAs(session, async (tx) => readFiling(tx, filingId));
  if (filing === null) redirect('/app');

  await writeAs(session, async (tx) =>
    releaseFiling(tx, { accountId: session.accountId, filingId, now }),
  );

  await meterFiling(
    db,
    { accountId: session.accountId, filingId },
    { stripe: stripeGateway(), clock: appClock() },
  );

  revalidatePath(`/app/filings/${filingId}`);
  redirect(`/app/filings/${filingId}?released=1`);
}
