import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { basePlatformEnv, createEnv, EnvironmentError, parseEnv } from '../src/env';

const base = {
  APP_NAME: 'WageLens',
  APP_BASE_URL: 'https://wagelens.test',
  DATABASE_DRIVER: 'pglite',
  ADAPTER_MODE: 'mock',
};

describe('env', () => {
  it('parses the offline shape with defaults', () => {
    const env = parseEnv(base);
    expect(env.APP_NAME).toBe('WageLens');
    expect(env.SESSION_TTL_DAYS).toBe(30);
    expect(env.LOGIN_TOKEN_TTL_MINUTES).toBe(15);
    expect(env.SESSION_COOKIE_NAME).toBe('octopus_session');
    expect(env.BILLING_ENABLED).toBe(true);
  });

  it('requires DATABASE_URL when the driver is postgres', () => {
    expect(() => parseEnv({ ...base, DATABASE_DRIVER: 'postgres' })).toThrow(EnvironmentError);
  });

  it('refuses pglite and mock adapters in production', () => {
    expect(() =>
      parseEnv({
        ...base,
        NODE_ENV: 'production',
        DATABASE_URL: 'postgres://x/y',
        DATABASE_DRIVER: 'postgres',
        ADAPTER_MODE: 'mock',
      }),
    ).toThrow(/only live adapters/);

    expect(() =>
      parseEnv({ ...base, NODE_ENV: 'production', DATABASE_DRIVER: 'pglite' }),
    ).toThrow(/pglite is a dev\/test-only fallback/);
  });

  it('requires ops and cron secrets in production', () => {
    expect(() =>
      parseEnv({
        NODE_ENV: 'production',
        DATABASE_DRIVER: 'postgres',
        DATABASE_URL: 'postgres://x/y',
        ADAPTER_MODE: 'live',
        RESEND_API_KEY: 're_x',
        STRIPE_SECRET_KEY: 'sk_x',
        STRIPE_WEBHOOK_SECRET: 'whsec_x',
      }),
    ).toThrow(/OPS_SHARED_SECRET is required[\s\S]*CRON_SECRET is required|CRON_SECRET is required/);
  });

  it('requires vendor credentials only when ADAPTER_MODE=live', () => {
    expect(() => parseEnv({ ...base, ADAPTER_MODE: 'live' })).toThrow(/RESEND_API_KEY is required/);
    expect(parseEnv({ ...base, ADAPTER_MODE: 'mock' }).RESEND_API_KEY).toBeUndefined();
  });

  it('extends per app without losing the shared rules', () => {
    const { parseEnv: parseApp } = createEnv(
      basePlatformEnv.extend({ WAGELENS_WDOL_SNAPSHOT: z.string().default('2026-09') }),
    );
    const env = parseApp(base);
    expect(env.WAGELENS_WDOL_SNAPSHOT).toBe('2026-09');
    expect(() => parseApp({ ...base, DATABASE_DRIVER: 'postgres' })).toThrow(
      /DATABASE_URL is required/,
    );
  });
});
