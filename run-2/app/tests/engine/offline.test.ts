/**
 * THE OFFLINE GUARANTEE AND THE IMPORT BOUNDARY, PROVED RATHER THAN DECLARED.
 *
 * AUTHORITY: `ARCHITECTURE.md` §3.9 (the boundary table), §3.10 ("a CI step walks
 * the TypeScript import graph and fails on any edge in the 'may never' column … it
 * is the difference between I1/I3 being architecture and being a preference"), §6.1
 * (the third enforcement is "a test that runs the entire golden canary suite with
 * outbound network disabled at the process level and asserts 100% pass"),
 * `ENGINE.md` §11.3 (the type boundary plus the lint that replaced the grep), §14.
 *
 * ===========================================================================
 * WHY A TEST AND NOT A CODE REVIEW
 *
 * "The single most valuable rule: `engine/**` may not transitively reach `fetch`.
 * When someone, under Friday pressure, adds 'just check SAM for the newest revision
 * before we render,' the build goes red and states which invariant it violated."
 *
 * This file is that rule, scoped to the paths this module owns. It walks the real
 * files on disk rather than the module registry, because an import that is present
 * but unused would still be an edge in the graph — and because the failure message
 * has to name the file, which a runtime check cannot do.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

import { REGULATORY_FIXTURES } from '@/engine/canary/fixtures';
import { runSuite } from '@/engine/canary/run';

const ROOT = join(process.cwd(), 'src', 'engine');

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : full.endsWith('.ts') ? [full] : [];
  });
}

/**
 * Comments are stripped before every scan below, and that is a scoping decision
 * rather than a convenience.
 *
 * These modules DOCUMENT what they may not do — "no `Date.now()`, no `Intl`, no
 * `Math.random`"; "no 'we'll get back to you'" — because a rule that is only
 * enforced and never explained gets deleted by the next person who finds it
 * inconvenient. `CORRECTIONS.md` §1 makes the same distinction with its marker
 * convention: quoting a forbidden claim in order to forbid it stays legal, while
 * reprinting it does not. A scanner that could not tell the two apart would force
 * every one of these files to stop explaining itself.
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
}

const FILES = walk(ROOT).map((path) => {
  const source = readFileSync(path, 'utf8');
  return {
    path,
    rel: relative(process.cwd(), path),
    source,
    code: stripComments(source),
  };
});

const IMPORT_RE = /(?:^|\n)\s*(?:import|export)\s[^;]*?from\s+['"]([^'"]+)['"]/g;

function importsOf(source: string): string[] {
  const found: string[] = [];
  for (const match of source.matchAll(IMPORT_RE)) {
    const specifier = match[1];
    if (specifier !== undefined) found.push(specifier);
  }
  return found;
}

/** `@/lib/*` is this repository's `domain/**`: value types with no edges. */
const ARITHMETIC_ALLOWED = new Set(['@/lib/money', '@/lib/types']);

/** The engine as a whole may additionally construct refusals, which is a pure
 *  value constructor over the same domain types. */
const ENGINE_ALLOWED = new Set([...ARITHMETIC_ALLOWED, '@/lib/result']);

describe('the import boundary — §3.9 and §3.10', () => {
  it('finds the engine on disk (a passing walk over an empty tree proves nothing)', () => {
    expect(FILES.length).toBeGreaterThan(8);
    expect(FILES.some((f) => f.rel.includes('arithmetic'))).toBe(true);
  });

  it('src/engine/arithmetic/** imports only the domain value types and its own siblings', () => {
    for (const file of FILES.filter((f) => f.rel.includes(`engine/arithmetic/`))) {
      for (const specifier of importsOf(file.source)) {
        const relative = specifier.startsWith('.');
        expect(
          relative || ARITHMETIC_ALLOWED.has(specifier),
          `${file.rel} imports ${specifier}; arithmetic may read domain types only`,
        ).toBe(true);
      }
    }
  });

  /**
   * An ALLOWLIST, not a denylist, and that choice is the whole strength of the test.
   *
   * A denylist of `@anthropic-ai`, `stripe`, `drizzle`, `postgres`, `node:https` …
   * is a list of the vendors we happen to have thought of on the day we wrote it,
   * and the next dependency added to `package.json` is not on it. An allowlist fails
   * on ANY new edge and makes the author state, in this file, why the engine may
   * have it — which is the conversation §3.10 exists to force.
   */
  it('src/engine/** imports nothing outside the domain value types', () => {
    for (const file of FILES) {
      for (const specifier of importsOf(file.source)) {
        if (specifier.startsWith('.')) continue;
        expect(
          ENGINE_ALLOWED.has(specifier),
          `${file.rel} imports ${specifier}; the engine may reach @/lib/{money,types,result} only`,
        ).toBe(true);
      }
    }
  });

  it('src/engine/** contains no call that could reach the network', () => {
    const patterns = [/\bfetch\s*\(/, /XMLHttpRequest/, /WebSocket/, /\brequire\s*\(/, /EventSource/];
    for (const file of FILES) {
      for (const pattern of patterns) {
        expect(pattern.test(file.code), `${file.rel} matches ${String(pattern)}`).toBe(false);
      }
    }
  });

  it('src/engine/arithmetic/** reads no clock, no locale and no randomness — E1', () => {
    // A filing regenerated eighteen months later during a dispute must produce the
    // identical document. `new Date(...)` appears in the canary BUILDER as a fixed
    // instant on a pinned input, which is why that directory is excluded here and
    // the arithmetic is not.
    const patterns = [/Date\.now/, /new Date\(/, /Math\.random/, /\bIntl\./, /toLocale/];
    for (const file of FILES.filter((f) => f.rel.includes(`engine/arithmetic/`))) {
      for (const pattern of patterns) {
        expect(pattern.test(file.code), `${file.rel} matches ${String(pattern)}`).toBe(false);
      }
    }
  });

  /**
   * §11.3's lint, adapted to where the code actually lives.
   *
   * The rule as written forbids `/` "anywhere under `src/engine/arithmetic/**`
   * outside `money.ts`" — but `money.ts` is `src/lib/money.ts` in this build, a file
   * this module does not own. The rule's intent survives intact: confine the operator
   * that loses information to one named file whose every division is exact by
   * construction. `narrowing.ts` is that file, and both divisions in it round-trip
   * through `MicroDollars.of` / `MilliRate.of`, which throw on a non-integer.
   */
  it('the division operator appears in exactly one arithmetic file', () => {
    const offenders = FILES.filter((f) => f.rel.includes(`engine/arithmetic/`))
      .filter((f) => !f.rel.endsWith('narrowing.ts'))
      .filter((f) => /[^*/\s][ ]*\/[ ]*[^*/\s]/.test(f.code.replace(/'[^']*'|"[^"]*"|`[^`]*`/g, "''")))
      .map((f) => f.rel);
    expect(offenders).toEqual([]);
  });
});

describe('the offline guarantee — I3, executed', () => {
  it('fetch is disabled at the process level in this suite', async () => {
    await expect(fetch('https://sam.gov/api/prod/wdol/v1/wd/VA20260195/2')).rejects.toThrow(
      /Network access is disabled/,
    );
  });

  it('the whole fixture suite runs green with the socket closed', () => {
    // A green run proves generation made NO network call rather than merely that
    // none was configured — which is the difference between the claim being
    // executable and being a setting.
    const result = runSuite(REGULATORY_FIXTURES);
    expect(result.casesPassed).toBe(result.casesRun);
    expect(result.firstFailure).toBeNull();
  });

  it('a filing needs nothing but a week and a rate table', () => {
    // The strongest statement of I3 available in a unit test: the input pair is two
    // plain values, so there is nothing to time out, retry or circuit-break.
    for (const testCase of REGULATORY_FIXTURES) {
      expect(Object.keys(testCase.input).sort()).toEqual(['rates', 'week']);
    }
  });
});

describe('A3 — no escalation path can travel in a refusal', () => {
  it('no engine string offers a person, a queue or a wait', () => {
    // `Refusal` has no field in which a support address could travel, which is the
    // mechanism. This is the second belt: a sentence that TALKS about contacting
    // someone is as bad as a field that links to them.
    const banned = [
      /mailto:/i,
      /contact (us|support)/i,
      /support@/i,
      /get back to you/i,
      /our team/i,
      /open a ticket/i,
      /reach out/i,
      /business days/i,
    ];
    for (const file of FILES) {
      for (const pattern of banned) {
        expect(pattern.test(file.code), `${file.rel} matches ${String(pattern)}`).toBe(false);
      }
    }
  });

  it('no engine string makes a correctness, acceptance, coverage or outcome claim', () => {
    // `CORRECTIONS.md` F-1…F-4: those four families are gate-locked on counters, and
    // the engine holds no counter. Everything it says is mechanism, quotation or
    // declined conclusion.
    const banned = [
      /100% accurate/i,
      /guaranteed correct/i,
      /error[- ]free/i,
      /never wrong/i,
      /accepted by the/i,
      /GC[- ]approved/i,
      /every wage determination/i,
      /complete coverage/i,
      /saves? \d/i,
      /zero human minutes/i,
    ];
    for (const file of FILES) {
      for (const pattern of banned) {
        expect(pattern.test(file.code), `${file.rel} matches ${String(pattern)}`).toBe(false);
      }
    }
  });
});
