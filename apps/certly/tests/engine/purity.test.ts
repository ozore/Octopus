/**
 * THE ENGINE'S BOUNDARY, ENFORCED.
 *
 * `specs/05`'s first paragraph is an invariant, not a description: the engine
 * makes no model call, and it is pure and deterministic over two inputs. An
 * invariant that is only true because everyone remembers it is a convention.
 *
 * This test reads `src/lib/engine/*.ts` as text and fails on anything that
 * would make the engine impure — a clock, a random source, an import of the
 * database, an adapter, `next/*`, or a network call. It is deliberately a
 * source scan rather than a runtime check: the failure mode we are guarding
 * against is a well-meaning future edit, and a source scan catches it in the
 * diff that introduces it.
 *
 * `orgToday(timezone, now)` is the one place a `Date` appears, and it takes the
 * instant as an ARGUMENT — which is exactly the point.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { orgToday } from '../../src/lib/engine';

const ENGINE_DIR = join(import.meta.dirname, '..', '..', 'src', 'lib', 'engine');

const files = readdirSync(ENGINE_DIR).filter((name) => name.endsWith('.ts'));

const FORBIDDEN: { pattern: RegExp; why: string }[] = [
  { pattern: /\bDate\.now\s*\(/, why: 'a clock makes the output unreproducible' },
  { pattern: /\bnew Date\s*\(\s*\)/, why: 'a clock makes the output unreproducible' },
  { pattern: /\bMath\.random\s*\(/, why: 'randomness makes the output unreproducible' },
  { pattern: /\bfetch\s*\(/, why: 'the engine performs no I/O' },
  { pattern: /from\s+['"]next\//, why: 'the engine is framework-free' },
  { pattern: /from\s+['"].*\/db['"]/, why: 'the engine reads no database' },
  { pattern: /from\s+['"].*adapters/, why: 'the engine calls no adapter, and never a model' },
  { pattern: /from\s+['"]@octopus\/platform/, why: 'the engine depends on nothing but itself' },
  { pattern: /from\s+['"]@anthropic-ai/, why: 'THE ENGINE MAKES NO MODEL CALL — specs/05, first paragraph' },
  { pattern: /process\.env/, why: 'the engine reads no environment' },
];

describe('the engine is pure', () => {
  it('has files to check', () => {
    expect(files.length).toBeGreaterThan(4);
  });

  for (const name of files) {
    it(`${name} imports nothing impure and touches no ambient state`, () => {
      const source = readFileSync(join(ENGINE_DIR, name), 'utf8');
      // Strip block comments so the prose above (which names these very things)
      // does not fail the test that the prose describes.
      const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
      for (const { pattern, why } of FORBIDDEN) {
        expect(pattern.test(code), `${name} matches ${pattern} — ${why}`).toBe(false);
      }
    });
  }
});

describe('orgToday — the timezone boundary (specs/05 §7, §12)', () => {
  it('is the org’s local date, not the server’s', () => {
    // 2026-06-02T05:30:00Z is 22:30 on 1 June in Los Angeles.
    const instant = new Date('2026-06-02T05:30:00Z');
    expect(orgToday('America/Los_Angeles', instant)).toBe('2026-06-01');
    expect(orgToday('UTC', instant)).toBe('2026-06-02');
  });

  it('rolls over at local midnight, not at 00:00 UTC', () => {
    const before = new Date('2026-06-02T06:59:00Z'); // 23:59 on 1 June in LA
    const after = new Date('2026-06-02T07:01:00Z'); // 00:01 on 2 June in LA
    expect(orgToday('America/Los_Angeles', before)).toBe('2026-06-01');
    expect(orgToday('America/Los_Angeles', after)).toBe('2026-06-02');
  });

  it('gives a certificate expiring “today” in Los Angeles the whole day', () => {
    // The exact failure specs/05 §7 names: at 09:00 UTC on 1 June it is still
    // 02:00 on 1 June in Los Angeles, so an LA org's evaluation date is the
    // 1st — and a certificate expiring on the 1st is NOT expired. A server that
    // used its own date would already be wrong by then in the other direction:
    // at 06:00 UTC on the 2nd it is still the 1st in LA.
    expect(orgToday('America/Los_Angeles', new Date('2026-06-01T09:00:00Z'))).toBe('2026-06-01');
    expect(orgToday('America/Los_Angeles', new Date('2026-06-02T06:00:00Z'))).toBe('2026-06-01');
    expect(orgToday('UTC', new Date('2026-06-02T06:00:00Z'))).toBe('2026-06-02');
  });
});
