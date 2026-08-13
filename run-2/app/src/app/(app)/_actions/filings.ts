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

import { sql } from 'drizzle-orm';

import { getDb } from '@/db';
import { meterFiling } from '@/platform/billing/meter';
import { sha256Hex } from '@/platform/ids';
import { recordAcceptanceConfirmation } from '@/platform/ops/gates';

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

/**
 * G2's counter, written by the only party who can know the answer.
 *
 * ARCHITECTURE §14 instruments G2 at "`filing_events` of kind `acceptance_confirmed`,
 * recorded by in-product confirmation". There was no in-product confirmation:
 * `recordAcceptanceConfirmation` had zero call sites, no `filing_events` kind was
 * ever written, and `form_acceptance_confirmations` was permanently empty — so
 * `/status` published `0 / 50` and `0 / 25` for a gate that no code path could
 * advance, beside a sentence describing the gates as counters. This action is that
 * path.
 *
 * WHAT THIS ACTION MAY NOT DO, AND DOES NOT. It may not infer. Acceptance is
 * unobservable from inside our system — that is precisely why the gate exists — so
 * the only input is what the customer says a receiving party did, and a rejection is
 * recorded exactly as readily as an acceptance. There is no branch here that treats
 * one of the two as the answer worth keeping.
 */
export async function confirmAcceptanceAction(formData: FormData): Promise<void> {
  const filingId = String(formData.get('filingId') ?? '');
  const session = await requireSession(`/app/filings/${filingId}`);
  const now = appClock().now();

  const accepted = formData.get('accepted') === 'true';
  const kindInput = String(formData.get('artifactKind') ?? 'wh347_pdf');
  const artifactKind = kindInput === 'ecpr_xml' ? 'ecpr_xml' : 'wh347_pdf';
  const receiverInput = String(formData.get('receiver') ?? 'gc');
  const receiver: 'gc' | 'agency' | 'dir_portal' =
    receiverInput === 'agency' ? 'agency' : receiverInput === 'dir_portal' ? 'dir_portal' : 'gc';
  const detail = String(formData.get('rejectionDetail') ?? '').slice(0, 500);

  await writeAs(session, async (tx) => {
    const filing = await readFiling(tx, filingId);
    if (filing === null) return;

    // Keyed on the filing, the artifact kind and the receiver, so pressing the
    // button twice records one fact. The id is derived rather than random for that
    // reason — a counter that can be inflated by a double-click is not a counter.
    await recordAcceptanceConfirmation(
      tx,
      {
        id: confirmationId(filingId, artifactKind, receiver),
        accountId: session.accountId,
        filingId,
        artifactKind,
        receiver,
        accepted,
        rejectionDetail: accepted || detail.length === 0 ? null : detail,
        confirmedBy: session.userId,
      },
      appClock(),
    );

    await tx.execute(sql`
      INSERT INTO filing_events (account_id, filing_id, at, kind, payload)
      VALUES (${session.accountId}::uuid, ${filingId}::uuid, ${now.toISOString()}::timestamptz,
              'acceptance_confirmed',
              ${JSON.stringify({ artifact_kind: artifactKind, receiver, accepted })}::jsonb)
    `);
  });

  revalidatePath(`/app/filings/${filingId}`);
  redirect(`/app/filings/${filingId}?confirmed=${accepted ? 'accepted' : 'rejected'}`);
}

/** A uuid derived from the three fields that identify one confirmation. */
function confirmationId(filingId: string, artifactKind: string, receiver: string): string {
  const digest = sha256Hex(`acceptance:${filingId}:${artifactKind}:${receiver}`);
  return [
    digest.slice(0, 8),
    digest.slice(8, 12),
    `5${digest.slice(13, 16)}`,
    ((parseInt(digest.slice(16, 17), 16) & 0x3) | 0x8).toString(16) + digest.slice(17, 20),
    digest.slice(20, 32),
  ].join('-');
}
