/**
 * The appeal flow, end to end, with no network and no API key.
 *
 * Spec: ARCHITECTURE.md §2.2 factor X and §6.4 (per-commit runs use recorded
 * responses; live-model runs are nightly), USER_JOURNEY.md §6, I2, I5.
 *
 * WHAT THESE TESTS ARE ACTUALLY GUARDING. The screens are only as honest as the
 * stream behind them, and three of that stream's properties are invisible until
 * they break in front of a seller:
 *
 *  - The narration reaches every stage and ends. A run that stops emitting after
 *    stage 2 leaves a spinner where a checkpoint should be — the exact failure
 *    USER_JOURNEY §6 is written to prevent.
 *  - The preview carries CITED clauses. If it can arrive with zero, I2 has a
 *    hole and the product's central claim is decoration.
 *  - A refused category escalates instead of drafting. That is I5, and it is the
 *    difference between honest triage and burning a seller's one attempt (R3).
 *
 * The `preview → paid` funnel starts at the first of these, which is why the run
 * is worth a test rather than a manual click-through.
 */

import { afterEach, describe, expect, it } from 'vitest';

import { GOLDEN_SET } from '@/lib/engine/evals';
import { loadCorpusProvider } from '@/lib/engine';

import { ensureRun } from './appeal-run';
import { createCase, getCase, resetCaseStore } from './case-store';
import { STAGE_KEYS, type ProgressEvent } from './progress';
import { resetRuns, subscribe } from './run-registry';

afterEach(() => {
  resetCaseStore();
  resetRuns();
});

function fixtureNotice(id: string): string {
  const fixture = GOLDEN_SET.find((f) => f.id === id);
  if (!fixture) throw new Error(`golden fixture ${id} not found`);
  return fixture.notice;
}

/** Drives one case to completion and returns everything the stream emitted. */
async function runCase(notice: string): Promise<ProgressEvent[]> {
  const record = createCase(notice);
  const run = ensureRun(record);
  return new Promise((resolve) => {
    const events: ProgressEvent[] = [];
    subscribe(run, (event) => {
      events.push(event);
      if (event.type === 'done') resolve(events);
    });
  });
}

describe('a drafted case', () => {
  it('narrates every stage and ends', async () => {
    const events = await runCase(fixtureNotice('GS-01'));

    for (const key of STAGE_KEYS) {
      const done = events.some(
        (e) => e.type === 'stage' && e.key === key && e.state === 'done',
      );
      expect(done, `stage "${key}" never reported done`).toBe(true);
    }
    expect(events.at(-1)?.type).toBe('done');
  });

  it('names the reason code in the seller’s language, not the code (Nielsen #2)', async () => {
    const events = await runCase(fixtureNotice('GS-01'));
    const identified = events.find(
      (e) => e.type === 'stage' && e.key === 'identify' && e.state === 'done',
    );
    expect(identified).toBeDefined();
    if (identified?.type === 'stage') {
      expect(identified.detail).toMatch(/^Found it — this is a .+ case\.$/);
      // The raw taxonomy code never appears in the narration.
      expect(identified.detail).not.toMatch(/AMZ\.|WMT\./);
    }
  });

  it('delivers a preview whose every policy reference is a cited clause (I2)', async () => {
    const events = await runCase(fixtureNotice('GS-01'));
    const preview = events.find((e) => e.type === 'preview');
    expect(preview).toBeDefined();
    if (preview?.type !== 'preview') return;

    expect(preview.preview.clauses.length).toBeGreaterThan(0);
    for (const clause of preview.preview.clauses) {
      // Each field can only have come from a citation object resolved against
      // the per-case corpus allowlist; none of them is model prose.
      expect(clause.citedText.length).toBeGreaterThan(0);
      expect(clause.clauseId).toMatch(/#/);
      // An absolute URI, whatever the scheme. Published policy pages resolve to
      // https; the L3 appeal-pattern documents are internal and resolve to a
      // `corpus://` URI (lib/corpus/retrieval.ts), because there is no public
      // page to send a seller to and inventing one would be the same defect
      // class as an uncited clause.
      expect(clause.sourceUrl).toMatch(/^[a-z][a-z0-9+.-]*:\/\//);
      expect(clause.documentTitle.length).toBeGreaterThan(0);
    }
  });

  it('shows the critique before the paywall, complete rather than teased', async () => {
    const events = await runCase(fixtureNotice('GS-01'));
    const preview = events.find((e) => e.type === 'preview');
    if (preview?.type !== 'preview') throw new Error('no preview');

    expect(preview.preview.critique.criteria.length).toBeGreaterThan(0);
    expect(preview.preview.critique.readinessScore).toBeGreaterThanOrEqual(0);
    expect(preview.preview.critique.readinessScore).toBeLessThanOrEqual(100);
    // Every criterion the rubric defines is present — a partial list would be
    // the teaser USER_JOURNEY §1.4 rules out.
    for (const criterion of preview.preview.critique.criteria) {
      expect(preview.preview.rubricLabels[criterion.id]).toBeTruthy();
    }
  });

  it('carries corpus and model provenance to the screen (LLM_ENGINE §8.1)', async () => {
    const events = await runCase(fixtureNotice('GS-01'));
    const preview = events.find((e) => e.type === 'preview');
    if (preview?.type !== 'preview') throw new Error('no preview');

    // Ground truth, resolved exactly as the runtime resolves it: a checkout that
    // has run `corpus:build` serves the built corpus, one that has not serves
    // the engine's fixture corpus. Either is legal outside production — what is
    // NOT legal is a preview that fails to say which one it was, because a
    // screen presenting fixture policy text as corpus text is the same defect
    // class as C-1 (marketing a mechanism the system does not have).
    const built = await loadCorpusProvider().then(
      () => true,
      () => false,
    );
    expect(preview.preview.syntheticCorpus).toBe(!built);
    // ADAPTER_MODE=mock in this lane, so the run was scripted from recorded
    // responses — no network, no key (ARCHITECTURE.md §2.2 factor X).
    expect(preview.preview.recordedModel).toBe(true);
  });

  it('leaves the case in preview_ready with its result persisted', async () => {
    const record = createCase(fixtureNotice('GS-01'));
    const run = ensureRun(record);
    await new Promise<void>((resolve) => {
      subscribe(run, (e) => e.type === 'done' && resolve());
    });

    const after = getCase(record.id);
    expect(after?.status).toBe('preview_ready');
    expect(after?.classification?.code).toBeTruthy();
    expect(after?.sections?.rootCause).toBeTruthy();
    expect(after?.critique).toBeTruthy();
  });
});

describe('a refused category', () => {
  it('escalates rather than drafting (I5), and routes to a referral', async () => {
    // GS-08 is a trademark complaint: a counsel-referral code that escalates
    // regardless of how confident the classifier is.
    const events = await runCase(fixtureNotice('GS-08'));

    expect(events.some((e) => e.type === 'preview')).toBe(false);

    const escalated = events.find((e) => e.type === 'escalated');
    expect(escalated).toBeDefined();
    if (escalated?.type === 'escalated') {
      expect(escalated.disposition).toBe('refer_out');
    }
  });

  it('marks the blocked node in the timeline so the wait does not just stop', async () => {
    const events = await runCase(fixtureNotice('GS-08'));
    expect(
      events.some((e) => e.type === 'stage' && e.state === 'blocked'),
    ).toBe(true);
  });
});

describe('the run registry', () => {
  it('runs a case once, however many readers attach', async () => {
    const record = createCase(fixtureNotice('GS-01'));

    const first = ensureRun(record);
    const second = ensureRun(record);
    expect(second).toBe(first);

    await new Promise<void>((resolve) => {
      subscribe(first, (e) => e.type === 'done' && resolve());
    });

    // A late reader gets the whole narration replayed, not an empty stream —
    // Twelve-Factor IX: the seller will not paste twice.
    const replayed: ProgressEvent[] = [];
    subscribe(ensureRun(record), (e) => replayed.push(e));
    expect(replayed.some((e) => e.type === 'preview')).toBe(true);
    expect(replayed.filter((e) => e.type === 'done')).toHaveLength(1);
  });
});
