/**
 * The magic-link landing's one decision that is not "did the token redeem".
 *
 * `?next=` carries the screen she was trying to reach, and the old guard was
 * `next.startsWith('/')`. That admits a PROTOCOL-RELATIVE url:
 * `new URL('//attacker.example.com/x', base)` resolves to
 * `https://attacker.example.com/x`, so the callback sent the browser off-site with
 * the session cookie already set — an open redirect on the one domain the product
 * asks customers to trust with a login link, and a phishing primitive on the exact
 * action sign-in trains them to perform.
 *
 * The replacement is a positive check rather than a longer blacklist: resolve
 * against our own base and compare origins. A spelling nobody thought of still has
 * to land on this origin or it does not run.
 */

import { describe, expect, it } from 'vitest';

import { safeDestination } from '../../src/app/(app)/auth/callback/route';

const BASE = 'https://app.ratepin.test';

describe('the post-sign-in destination', () => {
  it('keeps an ordinary in-product path', () => {
    expect(safeDestination('/app/projects/new', BASE).toString()).toBe(
      'https://app.ratepin.test/app/projects/new',
    );
  });

  it('defaults to the dashboard when there is no next', () => {
    expect(safeDestination(null, BASE).toString()).toBe('https://app.ratepin.test/app');
    expect(safeDestination('', BASE).toString()).toBe('https://app.ratepin.test/app');
  });

  it('refuses every off-origin spelling, including the protocol-relative one', () => {
    for (const hostile of [
      '//attacker.example.com/harvest',
      '///attacker.example.com/harvest',
      'https://attacker.example.com/harvest',
      'http://attacker.example.com',
      '\\\\attacker.example.com',
      'javascript:alert(1)',
      '//app.ratepin.test.attacker.example.com/',
    ]) {
      const landed = safeDestination(hostile, BASE);
      expect(landed.origin, `${hostile} escaped the origin`).toBe(BASE);
      expect(landed.toString(), `${hostile} was followed`).toBe('https://app.ratepin.test/app');
    }
  });

  it('does not let a same-origin absolute url through as something else', () => {
    // Same origin is fine — it is our own screen, spelled the long way.
    expect(safeDestination('https://app.ratepin.test/app/week', BASE).toString()).toBe(
      'https://app.ratepin.test/app/week',
    );
  });
});
