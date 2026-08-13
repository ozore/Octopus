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
 * It runs in the request rather than behind a queue, and it is available in every
 * billing state including `restricted`: export-on-cancel is a capability of that
 * state, not a favour. The bundle is built into a recording sink and its manifest is
 * shown; nothing here can refuse for a reason involving money.
 */
export async function buildExportAction(): Promise<void> {
  const session = await requireSession('/app/settings/data');
  const db = await getDb();
  const sink = createRecordingSink();
  const bundle = await buildExport(db, session.accountId, { sink, clock: appClock() });
  revalidatePath('/app/settings/data');
  redirect(`/app/settings/data?exported=${encodeURIComponent(bundle.exportKey)}`);
}

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
