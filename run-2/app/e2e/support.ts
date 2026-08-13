/**
 * The journey harness — everything the browser cannot do for itself.
 *
 * Three jobs, and each exists because the alternative would have been to fake
 * something:
 *
 * 1. **SCREENSHOTS.** Numbered, into `phase-2-build/screenshots/`, so the sequence
 *    on disk is the sequence a customer walks. The dev overlay is hidden first —
 *    see `hideDevIndicator` for why the journey runs against `next dev` at all.
 *
 * 2. **THE MAGIC LINK.** Ratepin has no passwords, so signing in inside a browser
 *    means standing in for the mail provider. The outbox row the app wrote holds the
 *    link's ID and no credential (security C-3), so the harness does what the
 *    worker's drain does — mint the token, then click the link. It still does not
 *    mint a session, set a cookie or call `redeemMagicLink`: everything after the
 *    click is the product's.
 *
 * 3. **THE STRIPE WEBHOOK.** ADR-007 makes webhooks the only input that moves
 *    entitlement, so an account cannot acquire a plan any other way — not by a
 *    server action, not by a form. `stripeEvent` signs a payload with the configured
 *    secret and POSTs it to the product's own `/api/stripe/webhook`, which is
 *    exactly what Stripe does. Nothing here writes a billing row directly.
 *
 * THE DATABASE HANDLE IS READ-ONLY IN SPIRIT AND ALMOST SO IN FACT. It reads the
 * outbox and the account id. Every state change in the journey is made by driving
 * the product.
 */

import { createHash, createHmac, randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { expect, type APIRequestContext, type Page } from '@playwright/test';
import postgres from 'postgres';

export const SHOTS = resolve(__dirname, '../../phase-2-build/screenshots');

export const DATABASE_URL =
  process.env['E2E_DATABASE_URL'] ??
  process.env['DATABASE_URL'] ??
  'postgres://postgres:ratepin@127.0.0.1:5432/ratepin';

/** The secret `playwright.config.ts` hands the server. Signing with anything else is
 *  a 401, which is the point of signing at all. */
export const WEBHOOK_SECRET = process.env['STRIPE_WEBHOOK_SECRET'] ?? 'whsec_e2e_journey';

export function db(): postgres.Sql {
  return postgres(DATABASE_URL, { max: 1, prepare: false });
}

/**
 * `next dev` paints a floating build-status button into every page. It is not part
 * of the product and it would appear in the corner of sixteen screenshots.
 *
 * The journey runs against `next dev` rather than a production build for a reason
 * that is worth writing down: `src/lib/config.ts` refuses `ADAPTER_MODE=mock` under
 * `NODE_ENV=production`, and Next inlines `NODE_ENV` into the server bundle at build
 * time — so a production build of this application can only ever run against live
 * Stripe, live SAM and live R2. A journey against a production build would therefore
 * be a journey against the internet, which is the one thing the whole test story
 * refuses. The trade is stated here rather than hidden: what these screenshots show
 * is the dev server's render of the same components, the same CSS and the same
 * server code.
 */
export async function hideDevIndicator(page: Page): Promise<void> {
  await page.addStyleTag({
    content: [
      'nextjs-portal, [data-nextjs-toast], #__next-build-watcher { display: none !important }',
      /**
       * And un-stick the header for the capture only.
       *
       * `fullPage: true` stitches a tall image, and a `position: sticky` header is
       * painted where the viewport happened to be — so the wordmark lands in the
       * middle of the WH-347 on every long screen. Nothing about the product is
       * changed by this; a sticky header is correct on a screen you scroll and
       * meaningless on an image you do not.
       */
      '.rp-header { position: static !important }',
    ].join('\n'),
  });
}

let counter = 0;

/** Numbered in call order, so the directory listing reads as the journey. */
export async function shot(page: Page, name: string): Promise<string> {
  mkdirSync(SHOTS, { recursive: true });
  counter += 1;
  const file = `${String(counter).padStart(2, '0')}-${name}.png`;
  await hideDevIndicator(page);
  /**
   * NOT `networkidle`. The dev server holds an HMR channel open for the life of the
   * page, so the network is never idle and the wait burns its whole timeout on every
   * capture. `load` plus one settled frame is what actually matters here: the design
   * system's motion allow-list has nothing that would smear a capture, and the only
   * late arrival is font metrics.
   */
  await page.waitForLoadState('load').catch(() => undefined);
  await page.evaluate(() => document.fonts.ready).catch(() => undefined);
  await page.screenshot({ path: resolve(SHOTS, file), fullPage: true, animations: 'disabled' });
  return file;
}

/**
 * Sign in the way a customer does: type the address, wait for the outbox row the
 * server action queued, open the link.
 *
 * THE HARNESS IS THE MAILER, and that is a change from reading a URL out of the row.
 * Security C-3: an outbox row carries the magic link's ID and no credential — the
 * token is minted inside the send, by `mintMagicLinkToken`, and exists only in the
 * message. There is nothing redeemable in the database to read, which is the whole
 * point of the fix, so this function does exactly what the worker's outbox drain
 * does: take the reference, mint the token, open the link. It still does not create
 * a session, set a cookie, or call `redeemMagicLink` — the product does all of that,
 * from the click.
 */
export async function signIn(page: Page, email: string): Promise<void> {
  const sql = db();
  try {
    const before = await sql<{ count: string }[]>`
      SELECT count(*)::text AS count FROM email_outbox WHERE to_address = ${email}
    `;
    const seen = Number(before[0]?.count ?? '0');

    await page.goto('/signin');
    await page.getByLabel('Email address').fill(email);
    await page.getByRole('button', { name: 'Send me a link' }).click();
    await page.waitForURL(/state=sent/);

    let linkId: string | null = null;
    for (let attempt = 0; attempt < 40 && linkId === null; attempt += 1) {
      const rows = await sql<{ payload: { link_id?: string } }[]>`
        SELECT payload FROM email_outbox
         WHERE to_address = ${email} AND template = 'magic_link'
         ORDER BY queued_at DESC LIMIT 1
      `;
      const candidate = rows[0]?.payload?.link_id ?? null;
      const after = await sql<{ count: string }[]>`
        SELECT count(*)::text AS count FROM email_outbox WHERE to_address = ${email}
      `;
      if (candidate && Number(after[0]?.count ?? '0') > seen) linkId = candidate;
      else await new Promise((done) => setTimeout(done, 250));
    }
    if (linkId === null) throw new Error(`no magic link was queued for ${email}`);

    // The send. `hashToken` is `sha256(token)` in lowercase hex (src/platform/ids.ts)
    // and the token is 256 bits of CSPRNG entropy, base64url — the same two lines
    // `mintMagicLinkToken` runs, spelled in the harness's own driver.
    const token = randomBytes(32).toString('base64url');
    const claimed = await sql<{ id: string }[]>`
      UPDATE auth_magic_links
         SET token_hash = ${createHash('sha256').update(token, 'utf8').digest('hex')}
       WHERE id = ${linkId}::uuid AND consumed_at IS NULL AND expires_at > now()
      RETURNING id
    `;
    if (claimed.length !== 1) throw new Error(`the magic link for ${email} was not mintable`);

    const url = new URL('/auth/callback', 'http://127.0.0.1');
    url.searchParams.set('token', token);
    await page.goto(url.pathname + url.search);
    await page.waitForURL(/\/app/);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

/** The account the signed-in email owns. Read, never written. */
export async function accountIdFor(email: string): Promise<string> {
  const sql = db();
  try {
    const rows = await sql<{ account_id: string }[]>`
      SELECT m.account_id FROM memberships m
        JOIN users u ON u.id = m.user_id
       WHERE u.email = ${email}
       ORDER BY m.created_at ASC LIMIT 1
    `;
    const id = rows[0]?.account_id;
    if (!id) throw new Error(`no account for ${email}`);
    return id;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

/**
 * POST a signed Stripe event at the product, exactly as Stripe would.
 *
 * The signature scheme is Stripe's: `t={unix},v1={hmac_sha256(t + "." + body)}`.
 * `verifyStripeSignature` checks the timestamp against a 300-second tolerance, so
 * the clock here has to be the real one.
 */
export async function stripeEvent(
  request: APIRequestContext,
  event: Record<string, unknown>,
): Promise<{ status: number; body: unknown }> {
  const payload = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac('sha256', WEBHOOK_SECRET)
    .update(`${String(timestamp)}.${payload}`)
    .digest('hex');

  const response = await request.post('/api/stripe/webhook', {
    headers: {
      'content-type': 'application/json',
      'stripe-signature': `t=${String(timestamp)},v1=${signature}`,
    },
    data: payload,
  });
  return { status: response.status(), body: await response.json().catch(() => null) };
}

/** A unique address per run, so a re-run is a new account rather than a collision. */
export function freshEmail(label: string): string {
  return `${label}.${Date.now().toString(36)}@journey.ratepin.test`;
}

/**
 * A3, asserted on every screen the journey visits rather than once at the end.
 *
 * IT LOOKS FOR AFFORDANCES, NOT FOR WORDS. `tests/lint/claims.test.ts` already scans
 * source text with `CORRECTIONS.md` §3.2's negation guard, and it has to, because
 * this product says "there is no telephone number on this site and no contact form"
 * out loud — a sentence a naive substring scan flags as the very thing it denies.
 * What a browser can check that a source scan cannot is whether anything on the
 * rendered page is CLICKABLE toward a person: a mail or telephone link, a control
 * whose accessible name offers contact, or a third-party widget that would inject
 * one after load. Those are the escalation paths; the prose describing their absence
 * is not one.
 */
export async function noEscalationPath(page: Page): Promise<void> {
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  await expect(page.locator('a[href^="tel:"]')).toHaveCount(0);
  await expect(page.locator('a[href^="sms:"]')).toHaveCount(0);

  const offer = /contact (us|support|sales)|live chat|chat with|talk to (us|sales)|help desk|support ticket|open a ticket|email us|call us/i;
  for (const control of await page.getByRole('link').all()) {
    expect(((await control.textContent()) ?? '').replace(/\s+/g, ' '), page.url()).not.toMatch(offer);
  }
  for (const control of await page.getByRole('button').all()) {
    expect(((await control.textContent()) ?? '').replace(/\s+/g, ' '), page.url()).not.toMatch(offer);
  }

  // No third-party origin may load script into a Ratepin page: a widget is an
  // escalation path somebody else controls, and it can appear after review.
  const foreign = await page.evaluate(() =>
    [...document.querySelectorAll('script[src], iframe[src]')]
      .map((element) => element.getAttribute('src') ?? '')
      .filter((src) => /^https?:\/\//i.test(src) && !src.startsWith(location.origin)),
  );
  expect(foreign, `third-party embed on ${page.url()}`).toEqual([]);
}
