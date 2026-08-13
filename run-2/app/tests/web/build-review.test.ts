/**
 * NO SCREEN MAY REDIRECT TO A STATE IT DOES NOT RENDER.
 *
 * Source: `run-2/phase-2-build/build-review/autonomy-degradation.md` H3 (six billing
 * outcomes redirected to a query parameter no screen read, so "Re-check my payment
 * status" — which §11.7 calls "the whole of the escalation path" — and "Open the
 * billing portal" — the only route to cancellation — both returned a byte-identical
 * page) and C3 (the deletion screen rendered one of its seven outcomes).
 *
 * The enumeration is the mechanism. These tests read every `redirect()` target out of
 * the actions and require the screen to carry a branch for each, because that is what
 * stops the next added outcome from being a silent no-op — and under A3 a silent
 * no-op is the state a customer would otherwise resolve by emailing somebody.
 *
 * They are source-level on purpose: these are server components whose failure mode is
 * a MISSING branch, and a rendering test can only assert on branches that exist.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { GATE_MECHANISM, GATE_KEYS, gateSentence, type GateReading } from '../../src/platform/ops/gates';

function source(path: string): string {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

/** Every `?name=value` a file redirects with, as `name:value` pairs, plus the names
 *  redirected with an interpolated value. */
function redirectOutcomes(text: string): { readonly names: Set<string>; readonly values: Set<string> } {
  const names = new Set<string>();
  const values = new Set<string>();
  for (const match of text.matchAll(/\?([a-z_]+)=([^`'"$}\s&]*)/g)) {
    names.add(match[1]!);
    if (match[2] && match[2].length > 0) values.add(match[2]);
  }
  return { names, values };
}

describe('the billing screen renders every outcome its actions can produce', () => {
  const actions = source('src/app/(app)/_actions/billing.ts');
  const screen = source('src/app/(app)/app/settings/billing/page.tsx');

  it('reads every redirect parameter name, not just `refund`', () => {
    const { names } = redirectOutcomes(actions);
    expect(names.size).toBeGreaterThanOrEqual(5);
    for (const name of names) {
      expect(screen, `the billing screen never reads ?${name}=`).toContain(`'${name}'`);
    }
  });

  it('carries a distinguishable sentence for every value those redirects carry', () => {
    const { values } = redirectOutcomes(actions);
    // The literal outcome values — `no_customer`, `no_subscription`, `unknown_plan`,
    // `declined`, `no_payment`, … Interpolated ones (`${result.kind}`,
    // `${outcome.status}`) are covered by the lookup tables' default branches, which
    // the next assertion pins.
    expect(values.size).toBeGreaterThanOrEqual(4);
    for (const value of values) {
      expect(screen, `the billing screen says nothing about ?…=${value}`).toContain(value);
    }
  });

  it('has a fallback sentence for a status neither side enumerated', () => {
    // Stripe can answer with a status this screen has no sentence for. The screen
    // must still say what happened, because "the page reloaded unchanged" is the one
    // outcome A3 cannot produce.
    expect(screen).toMatch(/said\[rechecked\] \?\?/);
    expect(screen).toMatch(/said\[error\] \?\?/);
  });
});

describe('the deletion screen renders every outcome its actions can produce', () => {
  const actions = source('src/app/(app)/_actions/settings.ts');
  const screen = source('src/app/(app)/app/settings/data/page.tsx');

  it('names each reason the deletion module can refuse with', () => {
    // The union members of `DeletionRequestResult` and `UndoResult`, which the action
    // puts straight into the redirect.
    for (const reason of [
      'name_mismatch',
      'already_scheduled',
      'no_account',
      'not_scheduled',
      'window_closed',
      'already_executed',
      'scheduled',
      'undone',
    ]) {
      expect(screen, `the deletion screen says nothing about ?deletion=${reason}`).toContain(reason);
    }
  });

  it('offers the export as a file rather than as a redirect parameter', () => {
    expect(screen).toContain('/api/exports');
    // The old dead end: a key printed with no link to it.
    expect(screen).not.toContain('Export built:');
    expect(actions).not.toContain('?exported=');
  });
});

describe('a locked gate may describe the mechanism and may not promise the outcome', () => {
  function locked(key: (typeof GATE_KEYS)[number]): GateReading {
    return {
      key,
      description: 'test',
      state: 'locked',
      measured: null,
      unit: 'test',
      denominator: null,
      windowDays: null,
      consecutiveDays: 0,
      thresholds: [],
    };
  }

  it('withholds the outcome sentence on every gate while it is locked', () => {
    for (const key of GATE_KEYS) {
      expect(gateSentence(locked(key)).outcome).toBeNull();
    }
  });

  it('keeps the service-credit promise out of G6’s mechanism sentence', () => {
    // D10 G6: the auto-credit must fire correctly in a chaos test BEFORE the
    // guarantee is advertised anywhere, and CORRECTIONS §4 F-4 names the string. It
    // shipped inside the MECHANISM sentence, which renders while the gate is locked,
    // so the one gate-locked money promise in the product was on the landing page.
    expect(GATE_MECHANISM.G6).not.toMatch(/credit accrues automatically/i);
    expect(gateSentence(locked('G6')).outcome).toBeNull();
    expect(gateSentence({ ...locked('G6'), state: 'unlocked' }).outcome).toMatch(
      /credit accrues automatically/i,
    );
  });

  it('does not imply a published address G5 has no way to receive mail at', () => {
    expect(GATE_MECHANISM.G5).not.toMatch(/every address this company publishes/i);
    expect(GATE_MECHANISM.G5).toMatch(/registry/i);
  });

  it('claims only what `gateSentence` actually enforces, on both pages that describe it', () => {
    // "Nobody here can promote a claim by editing copy" is a claim about a mechanism
    // — on the two pages whose subject is not making claims about mechanisms we have
    // not measured — and it is false: the copy lint is a per-sentence string
    // blacklist, so a paraphrase passes it. What IS enforced is the return type.
    for (const path of ['src/app/(marketing)/page.tsx', 'src/app/status/page.tsx']) {
      const text = source(path);
      expect(text, path).not.toMatch(/Nobody here can promote a claim by editing copy/);
      expect(text, path).toMatch(/no override parameter/);
    }
  });
});
