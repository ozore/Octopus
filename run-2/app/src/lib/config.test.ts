/**
 * Config fails closed at boot — Twelve-Factor III, asserted rather than asserted-to.
 *
 * These cases are chosen because each one is a way the product could boot LOOKING
 * fine and be wrong in a way nothing downstream would notice: an in-memory
 * database in production, mock adapters in production, a superuser connection that
 * silently voids every RLS policy, or an unpinned CA schema hash.
 */

import { describe, expect, it } from 'vitest';

import { getConfig } from './config';

const PROD_MINIMUM = {
  NODE_ENV: 'production',
  DATABASE_DRIVER: 'postgres',
  DATABASE_URL: 'postgres://db/ratepin',
  ADAPTER_MODE: 'live',
  ANTHROPIC_API_KEY: 'sk-ant-test',
  STRIPE_SECRET_KEY: 'sk_test',
  STRIPE_WEBHOOK_SECRET: 'whsec_test',
  R2_ACCOUNT_ID: 'acct',
  R2_ACCESS_KEY_ID: 'key',
  R2_SECRET_ACCESS_KEY: 'secret',
  R2_ENDPOINT: 'https://r2.example.test',
  RESEND_API_KEY: 're_test',
  KMS_KEY_URI: 'kms://ratepin',
} satisfies Record<string, string>;

describe('development defaults', () => {
  it('boots with nothing set, because a developer is not a deploy', () => {
    const config = getConfig({});
    expect(config.NODE_ENV).toBe('development');
    expect(config.DATABASE_DRIVER).toBe('postgres');
    expect(config.ADAPTER_MODE).toBe('live');
  });

  it('pins the CA eCPR schema by content hash, with a default (ADR-009)', () => {
    // The XSD advertises version="1.0" while DIR publishes it as V1.3. Version
    // attributes lie; hashes do not.
    expect(getConfig({}).DIR_XSD_SHA256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('rejects a malformed pinned hash rather than falling back to the default', () => {
    expect(() => getConfig({ DIR_XSD_SHA256: 'V1.3' })).toThrow(/DIR_XSD_SHA256/);
  });

  it('orders the freshness ladder: STALE must be later than DATED', () => {
    expect(() =>
      getConfig({ FRESHNESS_DATED_HOURS: '72', FRESHNESS_SLA_HOURS: '24' }),
    ).toThrow(/FRESHNESS_SLA_HOURS/);
  });
});

describe('production refuses the test substrate', () => {
  it('accepts a complete production environment', () => {
    expect(() => getConfig({ ...PROD_MINIMUM })).not.toThrow();
  });

  it('refuses pglite in production', () => {
    expect(() => getConfig({ ...PROD_MINIMUM, DATABASE_DRIVER: 'pglite' })).toThrow(
      /DATABASE_DRIVER/,
    );
  });

  it('refuses mock adapters in production', () => {
    expect(() => getConfig({ ...PROD_MINIMUM, ADAPTER_MODE: 'mock' })).toThrow(/ADAPTER_MODE/);
  });

  it('refuses a role that would bypass row-level security', () => {
    expect(() => getConfig({ ...PROD_MINIMUM, DATABASE_APP_ROLE: 'postgres' })).toThrow(
      /DATABASE_APP_ROLE/,
    );
  });

  it('names every missing credential at once, not one per restart', () => {
    const thrown = (() => {
      try {
        getConfig({ NODE_ENV: 'production' });
        return '';
      } catch (error) {
        return (error as Error).message;
      }
    })();
    for (const key of ['DATABASE_URL', 'ANTHROPIC_API_KEY', 'STRIPE_WEBHOOK_SECRET', 'KMS_KEY_URI']) {
      expect(thrown).toContain(key);
    }
  });
});

describe('the measurement gates start locked (CORRECTIONS.md §0.2)', () => {
  it('has no gate flag at all, so a deploy cannot promote a claim', () => {
    // Build review claims H-1: `CLAIM_G1_RATE_CORRECTNESS … CLAIM_G5_AUTONOMY` were
    // inert env booleans, and a dormant promotion surface is still a promotion
    // surface — "nobody here can promote a claim by editing copy" was false while
    // anyone with deploy access could promote one by setting a variable. Zod strips
    // unknown keys, so setting them now parses to nothing.
    const config: Record<string, unknown> = getConfig({
      CLAIM_G1_RATE_CORRECTNESS: 'true',
      CLAIM_G2_FORM_ACCEPTANCE: 'true',
      CLAIM_G3_CORPUS_COMPLETENESS: 'true',
      CLAIM_G4_TIME_SAVED: 'true',
      CLAIM_G5_AUTONOMY: 'true',
    });
    for (const key of Object.keys(config)) {
      expect(key, 'no gate flag may survive config parsing').not.toMatch(/^CLAIM_G/);
    }
  });

  it('leaves the staleness guarantee unadvertised until G6 clears', () => {
    expect(getConfig({}).CREDIT_GUARANTEE_ADVERTISED).toBe(false);
  });
});
