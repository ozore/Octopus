'use server';

/**
 * Settings mutations — J6's memory editor, J5's remembered maps, and J12.
 *
 * AUTHORITY: `USER_JOURNEY.md` §6.4 ("changing memory does not alter filings already
 * generated. Artifacts are immutable"), §12.1 (export: one button, one ZIP, any
 * tier, any billing state), §12.2 (deletion: consequence as the headline, typed
 * confirmation, 7-day undo), §12.4 (the undo link lives on the screen as well as in
 * the email, because email is never the sole channel for a reversible destructive
 * action).
 */

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getDb } from '@/db';
import { buildExport, createRecordingSink } from '@/platform/account/export';
import { requestAccountDeletion, undoAccountDeletion } from '@/platform/account/deletion';

import { requireSession, writeAs } from '../_lib/auth';
import { appClock, stripeGateway } from '../_lib/deps';
import { forgetColumnMap } from '../_lib/imports';
import { forgetMemory } from '../_lib/resolve';

export async function forgetMemoryAction(formData: FormData): Promise<void> {
  const session = await requireSession('/app/settings/memory');
  const observationId = Number(formData.get('observationId') ?? 0);
  await writeAs(session, async (tx) => forgetMemory(tx, observationId));
  revalidatePath('/app/settings/memory');
  redirect('/app/settings/memory?forgotten=1');
}

export async function forgetColumnMapAction(formData: FormData): Promise<void> {
  const session = await requireSession('/app/settings/memory');
  const importId = String(formData.get('importId') ?? '');
  await writeAs(session, async (tx) => forgetColumnMap(tx, importId));
  revalidatePath('/app/settings/memory');
  redirect('/app/settings/memory?forgotten=map');
}

/**
 * §12.1 — the export.
 *
 * There is no action here any more, and that is the fix rather than an omission: the
 * export is `GET /api/exports`, which builds the bundle in the request and returns
 * the ZIP as the response. A server action could only redirect to a screen, and a
 * screen that says "export built" beside a key nothing wrote is the dead end the
 * build review found. The button on `/app/settings/data` is a link to that route.
 */

/**
 * §12.2 — deletion.
 *
 * The typed confirmation is a P-A closed choice: the only accepted value is the
 * account's own name. There is no second "are you sure?" dialog, because a second
 * dialog is a click and a click is not a decision.
 */
export async function requestDeletionAction(formData: FormData): Promise<void> {
  const session = await requireSession('/app/settings/data');
  const db = await getDb();
  const typed = String(formData.get('confirmation') ?? '');
  const exportFirst = formData.get('skipExport') !== 'true';

  // §12.2 runs the export first by default. The bundle is BUILT here — the walk, the
  // manifest and every digest — so a deletion is never scheduled against an account
  // whose archive could not be assembled, and the key is recorded on the deletion row.
  // The customer's copy of the bytes is the ZIP at `/api/exports`, which stays open
  // for the whole undo window and is linked from this screen and from the email.
  let exportKey: string | null = null;
  if (exportFirst) {
    const sink = createRecordingSink();
    const bundle = await buildExport(db, session.accountId, { sink, clock: appClock() });
    exportKey = bundle.exportKey;
  }

  const outcome = await requestAccountDeletion(
    db,
    { accountId: session.accountId, requestedBy: session.userId, typedConfirmation: typed },
    { stripe: stripeGateway(), clock: appClock(), exportKey },
  );

  revalidatePath('/app/settings/data');
  redirect(
    outcome.ok
      ? '/app/settings/data?deletion=scheduled'
      : `/app/settings/data?deletion=${outcome.reason}`,
  );
}

/** §12.4 — the undo, on the screen for the whole seven days. */
export async function undoDeletionAction(): Promise<void> {
  const session = await requireSession('/app/settings/data');
  const db = await getDb();
  const outcome = await undoAccountDeletion(db, session.accountId, appClock());
  revalidatePath('/app/settings/data');
  redirect(outcome.ok ? '/app/settings/data?deletion=undone' : `/app/settings/data?deletion=${outcome.reason}`);
}
