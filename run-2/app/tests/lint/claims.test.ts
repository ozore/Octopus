/**
 * `claims-lint` — CORRECTIONS.md §3.3/§3.4, EXECUTED.
 *
 * AUTHORITY: `CORRECTIONS.md` §3.2 (two severities, and the measured red rates that
 * decide which blocks), §3.3 (the machine-readable probes and the one-line
 * extractor), §3.4 (where it runs and what it does not do); `PLAN.md` A3 (no
 * escalation path to a human), A5 (fail closed, unattended).
 *
 * ===========================================================================
 * WHY THE PROBES ARE EXTRACTED AND NOT TYPED OUT
 *
 * §3.3 is explicit about the mechanism: *"`claims-lint` reads only that file, so the
 * register cannot drift from what CI enforces."* Three suites in this repository had
 * each hand-transcribed a subset of the register into their own `PROBES` array, and
 * three transcriptions of one document are three things that can silently disagree
 * with it — the register can be amended and every lint stay green, which is the
 * precise failure the sentence forbids.
 *
 * This file runs the extractor §3.3 names:
 *
 *     sed -n '/^```json \[STRUCK:ALL\]/,/^```$/p' CORRECTIONS.md | sed '1d;$d'
 *
 * in TypeScript rather than in shell, over the register at its authoritative path.
 * Amend the register and this test changes behaviour on the next run, with nobody
 * remembering to update it.
 *
 * ===========================================================================
 * TWO SEVERITIES, AND ONLY ONE OF THEM BLOCKS
 *
 * §3.2 is the load-bearing finding of that document and it is honoured here rather
 * than improved on. `probes` — the struck strings themselves — BLOCK: measured red
 * rate 0/209 after the negation guard. `hygiene` — the broader category bans
 * ("any penalty figure", "any hours-per-week numeral") — DO NOT BLOCK: measured
 * 100% false-positive rate, five hits and all five legitimate copy, including the
 * landing page's own honesty section. A lint that red-flags correct work is a lint
 * somebody disables, and the disabling happens quietly, and then nothing is
 * enforced. The hygiene matches are collected and reported as an advisory count.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

// ===========================================================================
// The register, read from disk
// ===========================================================================

const REGISTER = resolve(process.cwd(), '..', 'phase-2-build', 'CORRECTIONS.md');

interface RegisterEntry {
  readonly id: string;
  readonly subject: string;
  readonly probes: readonly string[];
  readonly hygiene?: readonly string[];
}

interface Register {
  readonly version: number;
  readonly as_of: string;
  readonly negation_guard: string;
  readonly entries: readonly RegisterEntry[];
}

/** §3.3's extractor, in TypeScript: the fenced block tagged `[STRUCK:ALL]`, minus
 *  its two fence lines. Deliberately literal — a looser reader that found "some
 *  JSON block" could pick up a different one after an edit. */
export function extractRegister(markdown: string): Register {
  const lines = markdown.split('\n');
  const start = lines.findIndex((line) => line.startsWith('```json [STRUCK:ALL]'));
  if (start < 0) throw new Error(`${REGISTER} has no \`\`\`json [STRUCK:ALL] block`);
  const end = lines.findIndex((line, index) => index > start && line.trimEnd() === '```');
  if (end < 0) throw new Error(`the [STRUCK:ALL] block in ${REGISTER} is unterminated`);
  return JSON.parse(lines.slice(start + 1, end).join('\n')) as Register;
}

const register = extractRegister(readFileSync(REGISTER, 'utf8'));
const negationGuard = new RegExp(register.negation_guard, 'i');

// ===========================================================================
// The surfaces
// ===========================================================================

/**
 * EVERY RENDERED SURFACE, NOT THREE OF THEM.
 *
 * `src/app/**` is the whole of what a customer can read: marketing, the free tools,
 * the authenticated product and `/status`. The engine, the corpus and the platform
 * are excluded because they render nothing — with the two exceptions named below,
 * which are copy modules that happen to live outside `app/`.
 */
const SURFACE_ROOTS = [
  resolve(process.cwd(), 'src', 'app'),
  resolve(process.cwd(), 'src', 'engine', 'citations.ts'),
  resolve(process.cwd(), 'src', 'engine', 'exceptions.ts'),
];

function filesUnder(path: string): string[] {
  if (statSync(path).isFile()) return [path];
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const full = join(path, entry.name);
    if (entry.isDirectory()) return filesUnder(full);
    return /\.(tsx?|css)$/.test(entry.name) ? [full] : [];
  });
}

const SURFACES = SURFACE_ROOTS.flatMap(filesUnder);

/**
 * WHAT A CUSTOMER CAN READ, WHICH IS NOT THE SAME AS WHAT THE FILE CONTAINS.
 *
 * This codebase documents its refusals in the code that performs them, so the
 * sentences *"A3 forbids an escalation path anywhere in the compliance flow"* and
 * *"a `mailto:` or a contact-support component fails the build"* appear in module
 * headers — as specifications of an ABSENCE. Linting them as if they were copy
 * makes the lint fire on the comments that explain why the lint exists, and §3.2 is
 * unambiguous about where that ends: a lint that red-flags correct work is a lint
 * somebody disables.
 *
 * Comments are therefore removed before matching. A comment cannot reach a screen,
 * so nothing that could reach a customer is lost. The `//` strip deliberately skips
 * `://` so that a URL is never truncated into invisibility.
 */
function renderableText(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

/** Sentence-at-a-time, because the negation guard is defined per sentence: §3.2's
 *  distinction is between *"DBA penalties run to $28,619"* and *"there is no DBA
 *  civil money penalty"*, and only a sentence boundary can tell them apart. */
function sentencesOf(text: string): string[] {
  return renderableText(text).replace(/\s*\n\s*/g, ' ').split(/(?<=[.!?])\s+/);
}

interface Hit {
  readonly file: string;
  readonly entry: string;
  readonly probe: string;
  readonly sentence: string;
}

function scan(patterns: readonly string[], entryId: string): Hit[] {
  const hits: Hit[] = [];
  for (const source of patterns) {
    const probe = new RegExp(source, 'i');
    for (const file of SURFACES) {
      for (const sentence of sentencesOf(readFileSync(file, 'utf8'))) {
        if (!probe.test(sentence)) continue;
        if (negationGuard.test(sentence)) continue;
        hits.push({
          file: relative(process.cwd(), file),
          entry: entryId,
          probe: source,
          sentence: sentence.trim().slice(0, 200),
        });
      }
    }
  }
  return hits;
}

// ===========================================================================
// The tests
// ===========================================================================

describe('the corrections register itself', () => {
  it('parses, and every one of its regexes compiles', () => {
    expect(register.version).toBeGreaterThanOrEqual(2);
    expect(register.entries.length).toBeGreaterThan(0);
    for (const entry of register.entries) {
      for (const source of [...entry.probes, ...(entry.hygiene ?? [])]) {
        expect(() => new RegExp(source, 'i')).not.toThrow();
      }
    }
    expect(() => new RegExp(register.negation_guard, 'i')).not.toThrow();
  });

  it('is read from the register rather than transcribed into this file', () => {
    // The count is asserted loosely on purpose: a tight number would be a second
    // transcription, and this test exists to have none. What matters is that the
    // six entries and their ~35 patterns arrived from disk.
    expect(register.entries.map((entry) => entry.id)).toEqual(
      expect.arrayContaining(['X-1', 'X-2', 'X-3', 'X-4', 'X-5', 'X-6']),
    );
    const patterns = register.entries.flatMap((entry) => entry.probes);
    expect(patterns.length).toBeGreaterThanOrEqual(20);
  });

  it('lints a surface set large enough to mean something', () => {
    expect(SURFACES.length).toBeGreaterThan(50);
  });
});

describe('§3.4 — a struck claim on a shipping surface fails the build', () => {
  for (const entry of register.entries) {
    it(`reprints nothing struck under ${entry.id} (${entry.subject})`, () => {
      expect(scan(entry.probes, entry.id)).toEqual([]);
    });
  }

  it('proves the probes can fire, so green is not vacuous', () => {
    /**
     * A lint whose patterns match nothing anywhere is indistinguishable from a lint
     * that is not running. This feeds the register's own patterns a sentence that
     * should trip them, through the same matcher the scan uses.
     */
    const guilty = 'Davis-Bacon exposure runs to a civil money penalty of $28,619 per violation.';
    const innocent = 'There is no Davis-Bacon civil money penalty; the figure belongs to another statute.';
    const patterns = register.entries
      .flatMap((entry) => entry.probes)
      .map((source) => new RegExp(source, 'i'));

    expect(patterns.some((probe) => probe.test(guilty))).toBe(true);
    // …and the negation guard is what keeps a correction from being an incident.
    expect(negationGuard.test(innocent)).toBe(true);
  });
});

describe('§3.2 — the hygiene set is recorded and never blocks', () => {
  it('reports its matches as an advisory count rather than a failure', () => {
    const advisory = register.entries.flatMap((entry) => scan(entry.hygiene ?? [], entry.id));
    /**
     * NO ASSERTION ON THE COUNT, AND THAT IS THE POINT. §3.2 measured a 100%
     * false-positive rate for this set on Scope A: written the obvious way, the
     * category ban would have failed the build on five pieces of copy doing exactly
     * what the brand asks, including the landing page's own "we do not say this"
     * section. A probe with that red rate is a specification bug, not an incident.
     *
     * The matches are surfaced so a reviewer sees them, which is the disposition
     * §3.2 gives `advisory_variance` in the ingest path.
     */
    expect(Array.isArray(advisory)).toBe(true);
    if (advisory.length > 0) {
      process.stdout.write(
        `\n  copy_advisory — ${String(advisory.length)} hygiene match(es), non-blocking:\n` +
          advisory.map((hit) => `    ${hit.entry} ${hit.file}: ${hit.sentence}\n`).join(''),
      );
    }
  });
});

// ===========================================================================
// A3 — the autonomy lint, over the same whole-app surface
// ===========================================================================

/**
 * Three suites each carried a partial version of this over their own route group.
 * A3 is a property of the PRODUCT, not of a route group, so it is asserted once,
 * over everything a customer can read.
 *
 * `ARCHITECTURE.md` §10.5 permits exactly ONE contact address in the entire product,
 * on the billing page, for card disputes — and every message it receives increments
 * G5's counter. No such address is currently rendered anywhere, and the address list
 * that `platform/ops/inbound.ts` counts against is a REGISTRY, not an affordance;
 * that module is outside the surface set below for that reason.
 */
const AUTONOMY_PROBES: readonly { readonly name: string; readonly pattern: RegExp }[] = [
  {
    name: 'contact affordance',
    pattern:
      /\b(contact us|contact form|contact our|get in touch|reach out|live chat|help ?desk|support (queue|team|ticket|line)|customer (support|service)|talk to (sales|us|someone)|book a (demo|call)|schedule a call|request a quote|open a ticket|submit a request)\b/i,
  },
  { name: 'mail address', pattern: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/ },
  { name: 'mailto link', pattern: /mailto:/i },
  { name: 'telephone number', pattern: /tel:\+?\d|\b1[-.\s]?800[-.\s]?\d{3}[-.\s]?\d{4}\b/ },
  {
    name: 'promise that a person will act',
    pattern:
      /\b(our team|a member of (our|the) team|our (staff|agents|specialists|experts) will|we[’']?ll (get back|respond|reply|review|look into|call)|reply to this email|someone will (be in touch|contact|reach)|a (human|person|specialist) will|we will review your|manual review)\b/i,
  },
  { name: 'escalation path', pattern: /\b(escalate (to|this)|escalation (path|process|team)|raise a case)\b/i },
];

describe('A3 — no escalation path to a human, anywhere a customer can read', () => {
  for (const probe of AUTONOMY_PROBES) {
    it(`renders no ${probe.name}`, () => {
      const hits: string[] = [];
      for (const file of SURFACES) {
        for (const sentence of sentencesOf(readFileSync(file, 'utf8'))) {
          if (!probe.pattern.test(sentence)) continue;
          // Stating that the product HAS no contact affordance is the copy doing its
          // job — "none of the four ends in 'contact us'" is the sentence A3 wants,
          // not the one it forbids. Same guard, same reason as §3.2's.
          if (negationGuard.test(sentence)) continue;
          hits.push(`${relative(process.cwd(), file)}: ${sentence.trim().slice(0, 160)}`);
        }
      }
      expect(hits).toEqual([]);
    });
  }

  it('still fires on rendered copy after comments are stripped', () => {
    /**
     * Stripping comments is what stopped this lint failing on the module headers
     * that DESCRIBE the absence. It would also be an excellent way to accidentally
     * lint nothing, so each probe is fed a sentence it must catch — through
     * `sentencesOf`, the same path the scan uses, wrapped as rendered JSX text.
     */
    const guilty: Readonly<Record<string, string>> = {
      'contact affordance': '<p>Contact us and we will sort out the rate.</p>',
      'mail address': '<a>support@ratepin.com</a>',
      'mailto link': '<a href="mailto:help@ratepin.com">Email</a>',
      'telephone number': '<a href="tel:+15551234567">Call</a>',
      'promise that a person will act': '<p>Our team will review your filing within one business day.</p>',
      'escalation path': '<p>We will escalate this to a specialist.</p>',
    };
    for (const probe of AUTONOMY_PROBES) {
      const sentence = guilty[probe.name];
      expect(sentence, `no vacuity fixture for ${probe.name}`).toBeDefined();
      if (sentence === undefined) continue;
      const [only] = sentencesOf(sentence);
      expect(probe.pattern.test(only ?? ''), `${probe.name} matched nothing`).toBe(true);
      expect(negationGuard.test(only ?? ''), `${probe.name} fixture reads as a negation`).toBe(false);
    }
  });

  it('requests no external asset, so no third party can inject copy either', () => {
    // A support widget arrives as a script tag, and a font request is a beacon. Both
    // are refused structurally rather than by policy.
    for (const file of SURFACES) {
      const text = renderableText(readFileSync(file, 'utf8'));
      expect(text).not.toMatch(/<script\s+src=["']https?:/i);
      expect(text).not.toMatch(/@import\s+url\(\s*["']?https?:/i);
      expect(text).not.toMatch(/fonts\.(googleapis|gstatic)\.com/i);
      // HOSTNAMES, not brand words: a bare `drift` matches the verb, and the third
      // failure this file produced on its first run was its own comment about two
      // implementations having drifted.
      expect(text).not.toMatch(
        /(intercom\.io|widget\.intercom|zendesk\.com|zdassets|drift\.com|js\.driftt|crisp\.chat|tawk\.to|freshchat|hs-scripts\.com|hubspot)/i,
      );
    }
  });
});

// ===========================================================================
// The four gate-locked claims
// ===========================================================================

describe('§0.2 — a gate-locked outcome is not stated while its gate is locked', () => {
  const GATED: readonly { readonly gate: string; readonly pattern: RegExp }[] = [
    { gate: 'G1 rate correctness', pattern: /\b(100% accurate|fully accurate|error[- ]free|guaranteed correct|never wrong|no mistakes|rates? (are|is) (always )?correct)\b/i },
    { gate: 'G2 form acceptance', pattern: /\b(agency[- ]approved|gc[- ]approved|guaranteed acceptance|passes agency review|accepted by the (dir|dol)|will be accepted)\b/i },
    { gate: 'G3 corpus completeness', pattern: /\b(every wage determination|all wage determinations|complete coverage|always (current|up to date)|never stale)\b/i },
    { gate: 'G4 time saved', pattern: /\b(saves? (you )?\d|saving \d|cuts? .{0,20}by \d+ ?%|in (half|seconds) instead)\b/i },
    { gate: 'G5 autonomy', pattern: /\b(zero human minutes|no humans? involved|fully autonomous|runs itself|completely automated company)\b/i },
  ];

  for (const claim of GATED) {
    it(`states no ${claim.gate} outcome`, () => {
      const hits: string[] = [];
      for (const file of SURFACES) {
        for (const sentence of sentencesOf(readFileSync(file, 'utf8'))) {
          if (!claim.pattern.test(sentence)) continue;
          if (negationGuard.test(sentence)) continue;
          hits.push(`${relative(process.cwd(), file)}: ${sentence.trim().slice(0, 160)}`);
        }
      }
      expect(hits).toEqual([]);
    });
  }
});
