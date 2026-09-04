import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createAdminMetricsHandler,
  createCronDrainHandler,
  createLoginCallbackHandler,
  createLoginRequestHandler,
  createSignOutHandler,
  createStripeWebhookHandler,
} from '../src/http';
import { getSessionByToken, requestMagicLink } from '../src/auth';
import { startCheckout } from '../src/billing';
import { enqueue } from '../src/jobs';
import { jobs, organisations, subscriptions } from '../src/db/schema';
import { newId } from '../src/ids';
import { createTestHarness, type TestHarness } from '../src/testing';

let h: TestHarness;
beforeEach(async () => {
  h = await createTestHarness();
});
afterEach(async () => {
  await h.close();
});

const post = (url: string, body: unknown, headers: Record<string, string> = {}) =>
  new Request(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

function cookieValue(header: string | null, name: string): string | undefined {
  return header
    ?.split(';')[0]
    ?.split('=')
    .slice(1)
    .join('=')
    .replace(new RegExp(`^${name}=`), '');
}

describe('login routes', () => {
  it('answers the same shape whether or not the address has an account', async () => {
    const handler = createLoginRequestHandler();
    const response = await handler(
      post('http://localhost:3000/api/auth/request', { email: 'stranger@contractor.test' }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { status: string; devUrl?: string };
    expect(body.status).toBe('sent');
    expect(body.devUrl).toContain('/login/callback?token=');
  });

  it('returns 429 when the per-email limit is exhausted', async () => {
    const handler = createLoginRequestHandler();
    let last = 200;
    for (let i = 0; i < h.env.LOGIN_RATE_LIMIT_PER_EMAIL_PER_HOUR + 1; i += 1) {
      const response = await handler(
        post('http://localhost:3000/api/auth/request', { email: 'flood@contractor.test' }),
      );
      last = response.status;
    }
    expect(last).toBe(429);
  });

  it('exchanges the emailed token for an httpOnly session cookie and redirects', async () => {
    await requestMagicLink(
      { db: h.db, adapters: h.adapters, env: h.env },
      { email: 'owner@contractor.test', redirectTo: '/settings' },
    );
    const url = h.adapters.email.lastUrl() as string;

    const response = await createLoginCallbackHandler()(new Request(url));
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe('http://localhost:3000/settings');

    const setCookie = response.headers.get('set-cookie');
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Lax');
    expect(setCookie).toContain('Path=/');

    const token = cookieValue(setCookie, h.env.SESSION_COOKIE_NAME) as string;
    const session = await getSessionByToken(h.db, token, h.env);
    expect(session?.user.email).toBe('owner@contractor.test');
  });

  it('sends a bad or replayed token back to the login page with a reason', async () => {
    const handler = createLoginCallbackHandler();
    const missing = await handler(new Request('http://localhost:3000/login/callback'));
    expect(missing.headers.get('location')).toContain('/login?error=missing_token');

    const bad = await handler(new Request('http://localhost:3000/login/callback?token=nope'));
    expect(bad.headers.get('location')).toContain('/login?error=invalid');
  });

  it('signs out by revoking the row, not just clearing the cookie', async () => {
    await requestMagicLink(
      { db: h.db, adapters: h.adapters, env: h.env },
      { email: 'bye@contractor.test' },
    );
    const callback = await createLoginCallbackHandler()(
      new Request(h.adapters.email.lastUrl() as string),
    );
    const token = cookieValue(callback.headers.get('set-cookie'), h.env.SESSION_COOKIE_NAME) as string;

    const response = await createSignOutHandler()(
      post('http://localhost:3000/api/auth/signout', {}, {
        cookie: `${h.env.SESSION_COOKIE_NAME}=${token}`,
      }),
    );
    expect(response.status).toBe(303);
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
    expect(await getSessionByToken(h.db, token, h.env)).toBeNull();
  });
});

describe('stripe webhook route', () => {
  it('rejects a missing or invalid signature and accepts a valid one', async () => {
    const handler = createStripeWebhookHandler();

    const noSignature = await handler(post('http://localhost:3000/api/stripe/webhook', {}));
    expect(noSignature.status).toBe(400);

    const bad = await handler(
      post('http://localhost:3000/api/stripe/webhook', { id: 'evt_1', type: 'x' }, {
        'stripe-signature': 'deadbeef',
      }),
    );
    expect(bad.status).toBe(400);

    const [org] = await h.db
      .insert(organisations)
      .values({ id: newId('org'), name: 'Ridgeline', slug: 'ridgeline-hook' })
      .returning();
    const started = await startCheckout(
      { db: h.db, adapters: h.adapters, plans: h.plans, env: h.env as never },
      { orgId: org?.id as string, planKey: 'starter' },
    );
    if (started.status !== 'ok') throw new Error('checkout failed');

    const event = h.adapters.billing.completedCheckoutEvent(started.sessionId);
    const { payload, signature } = h.adapters.billing.signed(event);
    const ok = await handler(
      new Request('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': signature },
        body: payload,
      }),
    );
    expect(ok.status).toBe(200);
    expect(await h.db.select().from(subscriptions)).toHaveLength(1);

    // A retry of the same event is a 200 no-op, not a 500.
    const replay = await handler(
      new Request('http://localhost:3000/api/stripe/webhook', {
        method: 'POST',
        headers: { 'stripe-signature': signature },
        body: payload,
      }),
    );
    expect(replay.status).toBe(200);
    expect((await replay.json()).status).toBe('duplicate');
  });
});

describe('cron drain route', () => {
  it('refuses anything but the configured bearer secret', async () => {
    const handler = createCronDrainHandler();
    expect((await handler(new Request('http://localhost:3000/api/cron/drain'))).status).toBe(401);
    expect(
      (
        await handler(
          new Request('http://localhost:3000/api/cron/drain', {
            headers: { authorization: 'Bearer wrong' },
          }),
        )
      ).status,
    ).toBe(401);
  });

  it('drains a batch and reports what it did', async () => {
    h.registry.override('test.drain', async () => {});
    await enqueue(h.db, { kind: 'test.drain' });

    const response = await createCronDrainHandler()(
      new Request('http://localhost:3000/api/cron/drain', {
        headers: { authorization: `Bearer ${h.env.CRON_SECRET}` },
      }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { claimed: number; succeeded: number };
    // The housekeeping job is enqueued by the route itself, then drained.
    expect(body.claimed).toBeGreaterThanOrEqual(2);
    expect(body.succeeded).toBeGreaterThanOrEqual(2);

    const rows = await h.db.select().from(jobs);
    expect(rows.every((r) => r.status === 'done')).toBe(true);
  });

  it('accepts the x-cron-secret header for a manual run', async () => {
    const response = await createCronDrainHandler({ scheduleHousekeeping: false })(
      new Request('http://localhost:3000/api/cron/drain', {
        headers: { 'x-cron-secret': h.env.CRON_SECRET as string },
      }),
    );
    expect(response.status).toBe(200);
  });
});

describe('admin route', () => {
  it('is closed without the ops secret and renders the table with it', async () => {
    const handler = createAdminMetricsHandler();
    expect((await handler(new Request('http://localhost:3000/admin'))).status).toBe(401);
    expect(
      (await handler(new Request('http://localhost:3000/admin?secret=wrong'))).status,
    ).toBe(401);

    const response = await handler(
      new Request('http://localhost:3000/admin', {
        headers: { authorization: `Bearer ${h.env.OPS_SHARED_SECRET}` },
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(response.headers.get('cache-control')).toBe('no-store');
    const html = await response.text();
    expect(html).toContain('admin metrics');
    expect(html).toContain('Last 7 days');
    expect(html).toContain('MRR');
  });

  it('accepts the secret from a query string, for a browser', async () => {
    const response = await createAdminMetricsHandler()(
      new Request(`http://localhost:3000/admin?secret=${h.env.OPS_SHARED_SECRET}`),
    );
    expect(response.status).toBe(200);
  });
});
