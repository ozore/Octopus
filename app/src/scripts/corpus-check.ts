/**
 * The corpus build gate — a Twelve-Factor XII admin process, run in CI before
 * the image is built.
 *
 * Spec: CORPUS_DESIGN.md §7 (the quality gates), §3.7 stage 6 (write the
 * manifest — hashes, counts, cache key), ADR-003, ADR-008 (a corpus release must
 * be attributable to an exact content hash).
 *
 * WHAT THIS IS FOR, given that nothing at run time depends on its output: the
 * corpus is read from `corpus/` at boot, so this script does not *produce* the
 * thing the app loads. It produces the two facts a deploy needs to be honest —
 * whether every gate passes, and what `PROMPT_BUNDLE_HASH` should be stamped as
 * — and it fails the build rather than letting a corpus with a broken citation
 * chain reach a paying seller. `computePromptBundleHash` is derived from content
 * only, so a deploy that changes no policy text re-uses the warm prompt cache
 * (LLM_ENGINE.md §3.1).
 *
 * Usage:
 *   npm run corpus:check              # gates only, non-zero exit on violation
 *   npm run corpus:check -- --manifest build/manifest.json
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import {
  buildCorpus,
  buildManifest,
  canonicalRecords,
  readOntologySchemas,
  readRawCorpus,
  resolveCorpusDir,
  runAllGates,
} from '../lib/corpus';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function main(): void {
  const dir = resolveCorpusDir();
  const corpusRelease = Number(process.env['CORPUS_RELEASE'] ?? 0);

  const raw = readRawCorpus(dir, corpusRelease);
  const bundle = buildCorpus(raw);
  const violations = runAllGates(bundle, raw.allFiles, {
    schemas: readOntologySchemas(dir),
    records: canonicalRecords(raw),
  });

  const manifest = buildManifest(bundle);

  for (const v of violations) {
    process.stderr.write(`${JSON.stringify({ event: 'corpus.gate_violation', ...v })}\n`);
  }

  process.stdout.write(
    `${JSON.stringify({
      event: violations.length === 0 ? 'corpus.check_passed' : 'corpus.check_failed',
      corpus_release: manifest.corpusRelease,
      prompt_bundle_hash: manifest.promptBundleHash,
      violations: violations.length,
      counts: manifest.counts,
      // The honest half (manifest.ts): what the corpus CANNOT do is reported
      // alongside what it can, so a hole stays visible instead of becoming
      // invisible through a count of what exists.
      codes_not_draftable: manifest.coverage.codesNotDraftable.map((c) => c.code),
    })}\n`,
  );

  const manifestPath = arg('manifest');
  if (manifestPath) {
    mkdirSync(dirname(manifestPath), { recursive: true });
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  }

  if (violations.length > 0) process.exitCode = 1;
}

main();
