/**
 * SECURITY C-3 — no row of this database ever holds a redeemable sign-in token.
 *
 * The defect this file exists to keep closed: the queued sign-in mail carried the
 * live URL in `email_outbox.payload`. `email_outbox` is a FLEET surface — no tenant
 * policy, `SELECT` held by `ratepin_app`, and until `retention.sweep` learned to
 * call `purgeDeadSessions` nothing ever removed a row — so a single `SELECT` on one
 * table was account takeover for every sign-in of the last fifteen minutes, plus a
 * permanent record of every address that had ever signed in.
 *
 * The fix is structural rather than hygienic: the row carries the link's ID, and
 * the token is created inside the send (`mintMagicLinkToken`, called by
 * `drainOutbox`). The property that follows is the one asserted here, and it is
 * stronger than "the payload no longer has a `url` field" — it is that NO STRING
 * ANYWHERE IN THE OUTBOX REDEEMS, at any point in the message's life, checked by
 * actually trying to redeem every string in it.
 *
 * EVERYTHING RUNS UNDER `asApp()`. This is the pglite harness's NOBYPASSRLS role,
 * the posture production runs in. A test of a credential store that runs as a
 * superuser is testing a different database from the one the attacker reads.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { sql } from 'drizzle-orm';
import { afterEach, describe, expect, it } from 'vitest';

import { rowsOf } from '../../src/db';
import {
  MAGIC_LINK_TEMPLATE,
  mintMagicLinkToken,
  redeemMagicLink,
  requestMagicLink,
} from '../../src/platform/auth/magic-link';
import { purgeDeadSessions } from '../../src/platform/auth/session';
import { fixedClock } from '../../src/platform/clock';
import {
  assertNoRedeemableToken,
  createRecordingMailer,
  drainOutbox,
  queueEmail,
} from '../../src/platform/ops/outbox';
import { createPlatformDb } from './helpers';
import type { TestDb } from '../helpers/pglite';

let tdb!: TestDb;
let open = false;

afterEach(async () => {
  if (!open) return;
  open = false;
  await tdb.close();
});

const BASE = 'https://app.ratepin.test';
const NOW = new Date('2026-08-13T12:00:00.000Z');
const clock = fixedClock(NOW);
const EMAIL = 'dee@riovista.test';

async function setup(): Promise<void> {
  tdb = await createPlatformDb();
  open = true;
}

/** Queue a sign-in mail exactly as `_actions/auth.ts` does. */
async function requestSignIn(next: string | null = null): Promise<string> {
  const issued = await requestMagicLink(tdb.db, { email: EMAIL }, { clock });
  await queueEmail(
    tdb.db,
    {
      accountId: null,
      to: EMAIL,
      template: MAGIC_LINK_TEMPLATE,
      payload: { link_id: issued.id, next, expires_at: issued.expiresAt.toISOString() },
      idempotencyKey: `magic:${issued.id}`,
    },
    clock,
  );
  return issued.id;
}

/** Every string reachable in any outbox payload, flattened. */
async function outboxStrings(): Promise<readonly string[]> {
  const rows = rowsOf<{ payload: Record<string, unknown> | null }>(
    await tdb.db.execute(sql`SELECT payload FROM email_outbox`),
  );
  const found: string[] = [];
  const walk = (value: unknown): void => {
    if (typeof value === 'string') found.push(value);
    else if (Array.isArray(value)) value.forEach(walk);
    else if (value !== null && typeof value === 'object') Object.values(value).forEach(walk);
  };
  for (const row of rows) walk(row.payload ?? {});
  return found;
}

/**
 * The class-closing assertion. Not "the payload has no `url` key" — every string in
 * every row, tried against the real redemption path. A token that redeems is a
 * token, whatever field it is hiding in.
 */
async function expectNothingInTheOutboxRedeems(): Promise<void> {
  const strings = await outboxStrings();
  expect(strings.length, 'the scan found no strings, so it proved nothing').toBeGreaterThan(0);
  for (const candidate of strings) {
    // The token as it would appear bare, and as it would appear inside a URL.
    const bare = candidate;
    const fromUrl = candidate.includes('token=')
      ? (new URL(candidate, BASE).searchParams.get('token') ?? candidate)
      : candidate;
    for (const attempt of new Set([bare, fromUrl])) {
      const outcome = await tdb.asApp(() => redeemMagicLink(tdb.db, attempt, { clock }));
      expect(outcome.ok, `a string in email_outbox redeemed: ${attempt}`).toBe(false);
    }
  }
}

describe('a queued sign-in mail carries a reference, never a credential', () => {
  it('leaves nothing redeemable in the outbox between request and send', async () => {
    await setup();
    await tdb.asApp(() => requestSignIn());

    const payload = rowsOf<{ payload: Record<string, unknown> }>(
      await tdb.db.execute(sql`SELECT payload FROM email_outbox`),
    )[0]?.payload;
    expect(Object.keys(payload ?? {}).sort()).toEqual(['expires_at', 'link_id', 'next']);

    await expectNothingInTheOutboxRedeems();
  });

  it('is unredeemable BEFORE the send, not merely unsent', async () => {
    await setup();
    const linkId = await tdb.asApp(() => requestSignIn());

    // The row is born with the digest of a token that was generated, never returned
    // and discarded, so `token_hash` is NOT NULL and yet nobody holds a preimage.
    // The proof is that the digest CHANGES when the send mints the real one.
    const digest = async (): Promise<string> =>
      rowsOf<{ token_hash: string }>(
        await tdb.db.execute(sql`SELECT token_hash FROM auth_magic_links WHERE id = ${linkId}::uuid`),
      )[0]!.token_hash;

    const before = await digest();
    const minted = await tdb.asApp(() =>
      mintMagicLinkToken(tdb.db, linkId, { baseUrl: BASE, clock }),
    );
    expect(minted).not.toBeNull();
    expect(await digest(), 'the send did not mint a new token').not.toBe(before);
  });

  it('mints inside the send, hands it to the mailer, and stores none of it back', async () => {
    await setup();
    await tdb.asApp(() => requestSignIn('/app/projects/new'));

    const mailer = createRecordingMailer();
    const result = await tdb.asApp(() =>
      drainOutbox(tdb.db, { mailer, baseUrl: BASE, clock }),
    );
    expect(result).toEqual({ sent: 1, failed: 0 });

    // What the mail provider is handed: a path the renderer knows how to render,
    // carrying the token — and the `next` the customer was heading for.
    const linkPath = mailer.sent[0]?.payload['link_path'];
    expect(typeof linkPath).toBe('string');
    const url = new URL(String(linkPath), BASE);
    expect(url.pathname).toBe('/auth/callback');
    expect(url.searchParams.get('next')).toBe('/app/projects/new');
    const token = url.searchParams.get('token');
    expect(token).toBeTruthy();

    // The row is unchanged: the credential went to the mailer and to nowhere else.
    await expectNothingInTheOutboxRedeems();

    // And it is a real credential — single-use, exactly as before.
    const first = await tdb.asApp(() => redeemMagicLink(tdb.db, String(token), { clock }));
    expect(first.ok, first.ok ? '' : `redemption failed: ${first.reason}`).toBe(true);
    const second = await tdb.asApp(() => redeemMagicLink(tdb.db, String(token), { clock }));
    expect(second.ok).toBe(false);
  });

  it('declines to mail a link that died before the worker got to it', async () => {
    await setup();
    await tdb.asApp(() => requestSignIn());

    // Sixteen minutes later: the link has expired. Sending it would deliver a mail
    // whose only button lands on "this link was already used" for a link the
    // customer never used.
    const late = fixedClock(new Date(NOW.getTime() + 16 * 60_000));
    const mailer = createRecordingMailer();
    const result = await tdb.asApp(() =>
      drainOutbox(tdb.db, { mailer, baseUrl: BASE, clock: late }),
    );
    expect(result).toEqual({ sent: 0, failed: 1 });
    expect(mailer.sent).toHaveLength(0);

    const row = rowsOf<{ last_error: string | null; sent_at: string | null }>(
      await tdb.db.execute(sql`SELECT last_error, sent_at FROM email_outbox`),
    )[0];
    expect(row?.sent_at, 'an unsent message must not be marked sent').toBeNull();
    expect(row?.last_error).toContain('could not be resolved');
  });
});

describe('the write site refuses a credential outright', () => {
  it('throws rather than storing anything that looks like a bearer token', () => {
    for (const hostile of [
      { url: 'https://app.ratepin.test/auth/callback?token=abc' },
      { deep: { link: 'https://app.ratepin.test/auth/callback?token=abc' } },
      { list: ['/auth/callback?token=abc'] },
      { link_path: '/somewhere?token=abc' },
    ]) {
      expect(() => assertNoRedeemableToken('probe', hostile)).toThrow(/bearer credential/);
    }
  });

  it('leaves the payloads the product legitimately queues alone', () => {
    expect(() =>
      assertNoRedeemableToken('deletion_scheduled', {
        effective_at: '2026-08-20T12:00:00.000Z',
        undo_window_days: 7,
        link_path: '/app/settings/data',
      }),
    ).not.toThrow();
  });

  it('is wired into queueEmail, so no caller can opt out of it', async () => {
    await setup();
    await expect(
      tdb.asApp(() =>
        queueEmail(
          tdb.db,
          {
            accountId: null,
            to: EMAIL,
            template: MAGIC_LINK_TEMPLATE,
            payload: { url: `${BASE}/auth/callback?token=abc` },
            idempotencyKey: 'magic:hostile',
          },
          clock,
        ),
      ),
    ).rejects.toThrow(/bearer credential/);
    expect(await outboxStrings()).toHaveLength(0);
  });

  it('is what the sign-in action actually queues', () => {
    // The finding named a line: `_actions/auth.ts:53` wrote `url: issued.url`. The
    // store-level assertions above cannot see the action, so this one reads it.
    const source = readFileSync(
      resolve(process.cwd(), 'src/app/(app)/_actions/auth.ts'),
      'utf8',
    );
    expect(source).toContain('link_id: issued.id');
    expect(source).not.toMatch(/\burl:\s*/);
    expect(source).not.toContain('issued.url');
  });
});

describe('the purge has a caller', () => {
  it('removes dead sessions, consumed links and sent payloads', async () => {
    await setup();
    await tdb.asApp(() => requestSignIn());
    const mailer = createRecordingMailer();
    await tdb.asApp(() => drainOutbox(tdb.db, { mailer, baseUrl: BASE, clock }));
    const token = new URL(String(mailer.sent[0]?.payload['link_path']), BASE).searchParams.get(
      'token',
    );
    await tdb.asApp(() => redeemMagicLink(tdb.db, String(token), { clock }));

    // A day later the sweep runs. The link is consumed; the message is sent.
    const later = fixedClock(new Date(NOW.getTime() + 86_400_000));
    const counts = await tdb.asApp(() => purgeDeadSessions(tdb.db, later));
    expect(counts.magicLinks).toBe(1);
    expect(counts.outboxPayloads).toBe(1);

    const links = rowsOf<{ n: string }>(
      await tdb.db.execute(sql`SELECT count(*)::text AS n FROM auth_magic_links`),
    )[0];
    expect(Number(links?.n)).toBe(0);
    expect(await outboxStrings()).toHaveLength(0);
  });
});
