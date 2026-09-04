/**
 * The database side of M8: purchase, generation, delivery, the share link and
 * the automatic refund.
 *
 * THE ORDER OF OPERATIONS IS THE SPECIFICATION. `specs/08` AC5b:
 *
 * > `needsCheckCount` … is **written before the Checkout session is created**,
 * > not after generation — otherwise the disclosure is retrospective and
 * > worthless.
 *
 * So `createEntryPackPurchase` writes the row, the gap count and the gap list
 * FIRST, and returns the playbook id that the checkout flow (M9/B2) then
 * charges against. A buyer who reaches Stripe has already been shown the number
 * that is on this row, and the delivered pack recomputes it from the same
 * function — `tests/packs.test.ts` asserts the two are equal for all nine
 * committed records.
 *
 * AND THE GATE COMES BEFORE THE MONEY. A record that is publishable but fails
 * `CORE_SET` is **"in preparation"**, is not purchasable, and returns a named
 * reason rather than a generic error (`specs/08` AC5, `BUILD.md` §4 D3 — six of
 * the nine committed records pass, and Florida's three fail on reciprocity).
 * `createEntryPackPurchase` refuses; there is no flag and no override.
 */

import { and, eq, isNull } from 'drizzle-orm';

import { newId } from '@octopus/platform';
import { organisations } from '@octopus/platform/db';
import type { Db } from '@octopus/platform/db';
import { track } from '@octopus/platform/events';
import { enqueue } from '@octopus/platform/jobs';

import { getEnv } from '@/env';
import { getDocumentStore } from '@/lib/documents';
import { entryPackReadiness, getKbRecord, isTrade } from '@/lib/kb/accessors';
import { currentSnapshotId } from '@/lib/kb/snapshot';
import type { StateTradeRecord, Trade } from '@/lib/kb/types';
import { ONE_OFF_PRICES } from '@/lib/plans';
import { licences, oneOffPurchases, playbooks } from '@/lib/schema';

import { assembleEntryPack, gapDisclosure, type GapDisclosure } from './assemble';
import { assertPackIntegrity, PlaybookIntegrityError } from './integrity';
import { renderPackPdf } from './pdf';
import type { EntryPack, Holding, PackMode } from './types';

export const ENTRY_PACK_JOB = 'stateready.entry_pack_generate';
/** `specs/08` §Screens: the share link expires. Ninety days, like the guarantee. */
export const SHARE_TOKEN_DAYS = 90;

export type PurchaseRefusal =
  | { status: 'not_covered'; state: string; trades: string[] }
  | { status: 'in_preparation'; state: string; blockedBy: { recordId: string; missingCore: string[] }[] }
  | { status: 'no_trades' };

export type PurchaseResult = { status: 'ok'; playbookId: string; disclosure: GapDisclosure } | PurchaseRefusal;

export function recordsFor(state: string, trades: readonly string[]): StateTradeRecord[] {
  const out: StateTradeRecord[] = [];
  for (const trade of trades) {
    if (!isTrade(trade)) continue;
    const record = getKbRecord(state, trade);
    if (record) out.push(record);
  }
  return out;
}

/** The licences this organisation already holds, for the reciprocity paragraph. */
export async function holdingsFor(db: Db, orgId: string): Promise<Holding[]> {
  const rows = await db
    .select({
      state: licences.state,
      trade: licences.trade,
      kbLicenceTypeId: licences.kbLicenceTypeId,
      customTypeName: licences.customTypeName,
    })
    .from(licences)
    .where(and(eq(licences.orgId, orgId), eq(licences.status, 'active')));

  const seen = new Set<string>();
  const out: Holding[] = [];
  for (const row of rows) {
    if (!isTrade(row.trade)) continue;
    const key = `${row.state}:${row.trade}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      state: row.state.toUpperCase(),
      trade: row.trade,
      description: row.customTypeName ?? row.kbLicenceTypeId ?? null,
    });
  }
  return out;
}

/**
 * The pre-purchase disclosure, and the preview document behind it. **No
 * database write, no charge, no side effect** — which is what lets the screen
 * that shows the gap count be rendered before anything is paid for.
 */
export function previewEntryPack(input: {
  state: string;
  trades: readonly string[];
  today: string;
  holdings?: readonly Holding[];
  organisationName?: string | null;
  mode?: PackMode;
}): { records: StateTradeRecord[]; pack: EntryPack | null; disclosure: GapDisclosure | null } {
  const records = recordsFor(input.state, input.trades);
  if (records.length === 0) return { records, pack: null, disclosure: null };
  const pack = assembleEntryPack({
    records,
    today: input.today,
    mode: input.mode ?? 'preview',
    holdings: input.holdings ?? [],
    organisationName: input.organisationName ?? null,
  });
  return { records, pack, disclosure: gapDisclosure(records, input.today) };
}

/**
 * Price, from `plans.ts` — the canonical four one-offs. The first state is
 * $750 and credits in full against an annual plan taken within 90 days
 * (`OFFER.md` §6.3); every state after it is $1,500. The count of previous
 * purchases decides which, so the ladder is a query rather than a flag someone
 * has to remember to set.
 */
export async function entryPackPriceCents(db: Db, orgId: string): Promise<number> {
  const previous = await db.select({ id: playbooks.id }).from(playbooks).where(eq(playbooks.orgId, orgId));
  return previous.length === 0 ? ONE_OFF_PRICES.entryPackFirst.amountCents : ONE_OFF_PRICES.entryPack.amountCents;
}

export async function createEntryPackPurchase(
  db: Db,
  input: { orgId: string; state: string; trades: readonly string[]; today: string; userId?: string | null },
): Promise<PurchaseResult> {
  const trades = input.trades.filter(isTrade);
  if (trades.length === 0) return { status: 'no_trades' };

  const records = recordsFor(input.state, trades);
  if (records.length !== trades.length) {
    return { status: 'not_covered', state: input.state.toUpperCase(), trades: [...trades] };
  }

  const blockedBy = records
    .map((record) => ({ recordId: record.record_id, ...entryPackReadiness(record, input.today) }))
    .filter((r) => !r.ready)
    .map((r) => ({ recordId: r.recordId, missingCore: r.missingCore }));

  if (blockedBy.length > 0) {
    await track(db, {
      name: 'uncovered_state_waitlisted',
      orgId: input.orgId,
      props: { state: input.state.toUpperCase(), trades, reason: 'in_preparation' },
    });
    return { status: 'in_preparation', state: input.state.toUpperCase(), blockedBy };
  }

  const disclosure = gapDisclosure(records, input.today);
  const playbookId = newId('pbk');

  // THE GAP COUNT IS WRITTEN HERE — before the Checkout session exists.
  await db.insert(playbooks).values({
    id: playbookId,
    orgId: input.orgId,
    targetState: input.state.toUpperCase(),
    trades: [...trades],
    status: 'awaiting_payment',
    priceCents: await entryPackPriceCents(db, input.orgId),
    kbSnapshotId: await currentSnapshotId(db),
    needsCheckCount: disclosure.needsCheckCount,
    disclosedGaps: disclosure.gaps.map((gap) => gap.label),
  });

  await track(db, {
    name: 'playbook_checkout_started',
    orgId: input.orgId,
    userId: input.userId ?? null,
    props: {
      playbookId,
      state: input.state.toUpperCase(),
      trades,
      needsCheckCount: disclosure.needsCheckCount,
    },
  });

  return { status: 'ok', playbookId, disclosure };
}

/**
 * Payment landed. Called by the billing webhook (M9/B2) with the payment
 * intent; queues the generation job and nothing else, because generation must
 * survive the webhook's own timeout.
 */
export async function markEntryPackPaid(
  db: Db,
  input: { playbookId: string; stripePaymentIntentId?: string | null; today: string },
): Promise<void> {
  const rows = await db
    .update(playbooks)
    .set({
      status: 'queued',
      ...(input.stripePaymentIntentId ? { stripePaymentIntentId: input.stripePaymentIntentId } : {}),
    })
    .where(eq(playbooks.id, input.playbookId))
    .returning();
  const row = rows[0];
  if (!row) return;

  await track(db, {
    name: 'playbook_purchased',
    orgId: row.orgId,
    props: { playbookId: row.id, state: row.targetState, trades: row.trades, priceCents: row.priceCents },
  });
  await enqueue(db, {
    kind: ENTRY_PACK_JOB,
    payload: { playbookId: input.playbookId, today: input.today },
    dedupeKey: `entry-pack:${input.playbookId}`,
  });
}

function shareToken(): string {
  return newId('shr').replace(/^shr_/, '');
}

export type GenerationResult =
  | { status: 'ready'; playbookId: string; needsCheckCount: number; pdfBytes: number }
  | { status: 'failed'; playbookId: string; reason: string; failures: string[] };

/**
 * Generate and deliver. Deterministic, no model, no network.
 *
 * On an integrity failure NOTHING IS DELIVERED: the row goes to `failed`, the
 * one-off purchase is marked refunded with the reason, and `playbook_refunded`
 * is emitted so `/admin` sees it. `specs/08` §Errors calls this a **blocking**
 * admin alert, and it is: the assertion tripping means the knowledge base and
 * the renderer disagree about what a board said, which is the one bug this
 * product cannot ship past.
 */
export async function generateEntryPack(
  db: Db,
  input: { playbookId: string; today: string },
): Promise<GenerationResult> {
  const rows = await db.select().from(playbooks).where(eq(playbooks.id, input.playbookId));
  const row = rows[0];
  if (!row) return { status: 'failed', playbookId: input.playbookId, reason: 'not_found', failures: [] };

  await db.update(playbooks).set({ status: 'generating' }).where(eq(playbooks.id, row.id));

  const trades = (row.trades as string[]).filter(isTrade) as Trade[];
  const records = recordsFor(row.targetState, trades);
  const holdings = await holdingsFor(db, row.orgId);
  // The watermark is the BUYING ORGANISATION'S NAME, on every page and on the
  // share link (`specs/08` AC8) — not its id, which means nothing to the COO
  // this gets forwarded to.
  const org = (await db.select({ name: organisations.name }).from(organisations).where(eq(organisations.id, row.orgId)))[0];

  const fail = async (reason: string, failures: string[]): Promise<GenerationResult> => {
    await db.update(playbooks).set({ status: 'failed' }).where(eq(playbooks.id, row.id));
    await db
      .update(oneOffPurchases)
      .set({ status: 'refunded', refundReason: reason })
      .where(eq(oneOffPurchases.playbookId, row.id));
    await track(db, {
      name: 'playbook_refunded',
      orgId: row.orgId,
      props: { playbookId: row.id, reason, failures: failures.slice(0, 20) },
    });
    return { status: 'failed', playbookId: row.id, reason, failures };
  };

  if (records.length === 0) return fail('record_unavailable', []);

  const pack = assembleEntryPack({
    records,
    today: input.today,
    mode: 'full',
    holdings,
    organisationName: org?.name ?? null,
  });

  try {
    assertPackIntegrity(pack, records);
  } catch (error) {
    if (error instanceof PlaybookIntegrityError) return fail('integrity_assertion', error.failures);
    throw error;
  }

  const pdf = await renderPackPdf(pack);
  const store = getDocumentStore(getEnv());
  const stored = await store.put({
    orgId: row.orgId,
    filename: `state-entry-pack-${row.targetState.toLowerCase()}-${trades.join('-')}.pdf`,
    contentType: 'application/pdf',
    body: pdf,
  });

  const expires = new Date(`${input.today}T00:00:00Z`);
  expires.setUTCDate(expires.getUTCDate() + SHARE_TOKEN_DAYS);

  await db
    .update(playbooks)
    .set({
      status: 'ready',
      contentJson: pack as unknown as Record<string, unknown>,
      pdfStorageKey: stored.key,
      shareToken: row.shareToken ?? shareToken(),
      shareExpiresAt: expires,
      needsCheckCount: pack.needsCheckCount,
      disclosedGaps: pack.gaps.map((gap) => (gap.scope ? `${gap.scope} — ${gap.label}` : gap.label)),
      generatedAt: new Date(),
    })
    .where(eq(playbooks.id, row.id));

  await track(db, {
    name: 'playbook_generated',
    orgId: row.orgId,
    props: { playbookId: row.id, needsCheckCount: pack.needsCheckCount, pdfBytes: pdf.byteLength },
  });

  return { status: 'ready', playbookId: row.id, needsCheckCount: pack.needsCheckCount, pdfBytes: pdf.byteLength };
}

export async function getPlaybook(db: Db, orgId: string, playbookId: string) {
  const rows = await db
    .select()
    .from(playbooks)
    .where(and(eq(playbooks.id, playbookId), eq(playbooks.orgId, orgId)));
  return rows[0] ?? null;
}

export async function listPlaybooks(db: Db, orgId: string) {
  return db.select().from(playbooks).where(eq(playbooks.orgId, orgId));
}

export type SharedPack =
  | { status: 'ok'; pack: EntryPack; organisationName: string | null }
  | { status: 'expired' }
  | { status: 'not_found' };

/**
 * `/share/:token` — logged out, read-only, expiring, watermarked. Their COO and
 * their lawyer open this, which is why it is the pack's cheapest distribution
 * mechanism and why it must not need an account.
 */
export async function packByShareToken(db: Db, token: string, now: Date): Promise<SharedPack> {
  const rows = await db
    .select()
    .from(playbooks)
    .where(and(eq(playbooks.shareToken, token), eq(playbooks.status, 'ready')));
  const row = rows[0];
  if (!row || !row.contentJson) return { status: 'not_found' };
  if (row.shareExpiresAt && row.shareExpiresAt.getTime() < now.getTime()) return { status: 'expired' };
  const pack = row.contentJson as unknown as EntryPack;
  return { status: 'ok', pack, organisationName: pack.organisationName };
}

/** Revocation is a null token, not a deleted row: the pack itself survives. */
export async function revokeShareToken(db: Db, orgId: string, playbookId: string): Promise<void> {
  await db
    .update(playbooks)
    .set({ shareToken: null, shareExpiresAt: null })
    .where(and(eq(playbooks.id, playbookId), eq(playbooks.orgId, orgId)));
}

/** Used by `/admin` and by the drift job: which packs have no share link left. */
export async function unsharedPlaybooks(db: Db, orgId: string) {
  return db
    .select()
    .from(playbooks)
    .where(and(eq(playbooks.orgId, orgId), isNull(playbooks.shareToken)));
}
