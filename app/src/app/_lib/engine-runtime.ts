/**
 * The web tier's one call into the appeal engine — SERVER ONLY.
 *
 * Spec: LLM_ENGINE.md (the pipeline), ARCHITECTURE.md I1/I2/I5, D9.
 *
 * THE RULE THIS FILE EXISTS TO KEEP: the UI talks to `@/lib/engine`'s exported
 * contract and to nothing inside it. There is no import of a vendor SDK here, no
 * prompt string, no stage re-implementation, and above all no second copy of the
 * pipeline's control flow — `runPipeline` owns the ordering, the bounded
 * evaluator-optimizer loop and both escalation exits, and a route handler that
 * re-derived any of that would be a second I1 to keep in sync with the first.
 *
 * WHAT THIS FILE DOES ADD is a *witness* on the corpus port. `retrieve()` is the
 * first place in the pipeline where the classified reason code becomes a value,
 * so wrapping `getSlice` is how the stream learns the code the moment stage 1
 * decides it — without the engine having to grow a UI-shaped event. Narration
 * that lags the machine by a stage is exactly the Nielsen #1 failure the
 * streaming preview exists to prevent (USER_JOURNEY §6).
 *
 * TWO BINDINGS, DECIDED INDEPENDENTLY, AND THE INDEPENDENCE IS THE POINT:
 *
 *  - The CORPUS comes from `src/lib/corpus/`, a build artifact
 *    (`npm run corpus:build`, ARCHITECTURE.md §3.3). If it is absent — a fresh
 *    checkout — the engine's own synthetic fixture corpus stands in, outside
 *    production only.
 *  - The MODEL surface follows `ADAPTER_MODE`. In `mock` the run is scripted
 *    from the recorded golden-set responses, because per-commit runs are
 *    deterministic and free by design and no test may need a key or a network
 *    call (ARCHITECTURE.md §2.2 factor X, §6.4).
 *
 * Both facts travel to the screen (`syntheticCorpus`, `recordedModel`) and are
 * shown rather than hidden. LLM_ENGINE §8.1 requires synthetic material to be
 * labelled wherever it surfaces; a page that served fixture policy text as if it
 * were the corpus would be the same defect class as C-1.
 */

import { getAdapters } from '@/lib/adapters';
import type { AnthropicAdapter } from '@/lib/adapters/anthropic';
import {
  createDeps,
  loadCorpusProvider,
  runPipeline,
  type CorpusProvider,
  type EngineEvent,
  type EngineEventSink,
  type EngineRunResult,
} from '@/lib/engine';
import { REASON_CODE_TABLE, isReasonCode, type ReasonCode } from '@/lib/domain/reason-codes';
import type { NoticeDocument } from '@/lib/domain/types';

import type { ProgressEvent, StageKey } from './progress';
import { STAGE_LABELS } from './progress';
import { adapterMode } from './runtime-env';

export type EngineBinding = {
  corpus: CorpusProvider;
  model: AnthropicAdapter;
  /** True when no corpus bundle was found and the fixture corpus stood in. */
  syntheticCorpus: boolean;
  /** True when the model surface was the recorded/mock adapter, not a live model. */
  recordedModel: boolean;
};

// ---------------------------------------------------------------------------
// Binding the corpus and the model
// ---------------------------------------------------------------------------

/**
 * Late-bound, through the engine's own loader. The specifier is resolved at
 * runtime rather than bundled, which is deliberate: `src/lib/corpus/` is emitted
 * by `npm run corpus:build`, so a checkout that has not run it must still build
 * and boot. `loadCorpusProvider` throws `CorpusIntegrityError` when the module
 * is absent or does not satisfy `CorpusProvider`; both are "no built corpus".
 */
async function loadBuiltCorpus(): Promise<CorpusProvider | null> {
  try {
    return await loadCorpusProvider();
  } catch {
    return null;
  }
}

/**
 * Picks the recorded fixture whose notice most resembles the pasted one, so the
 * dev path exercises a plausible reason code rather than always the first.
 * Scoring is deliberately dumb: verbatim quote hits dominate, distinctive word
 * overlap breaks ties. This is a development affordance, not a classifier — the
 * real classification is stage 1's job and only stage 1's.
 */
function scoreFixture(notice: string, fixtureNotice: string, quotes: readonly string[]): number {
  const hay = notice.toLowerCase();
  const quoteHits = quotes.filter((q) => hay.includes(q.toLowerCase())).length * 10;
  const words = new Set(
    fixtureNotice
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 5),
  );
  let overlap = 0;
  for (const w of words) if (hay.includes(w)) overlap += 1;
  return quoteHits + overlap;
}

/**
 * Scripts the mock adapter with the recorded responses for the closest golden
 * fixture, against the slice the ACTIVE corpus returns. Deriving the citations
 * from the live slice rather than from literals is the point (LLM_ENGINE §8.2):
 * a clause rename then breaks the recording loudly, instead of leaving a preview
 * citing a clause id that no longer exists.
 */
async function bindRecordedModel(
  noticeText: string,
  corpus: CorpusProvider,
): Promise<AnthropicAdapter> {
  const { fixtureSlice, GOLDEN_SET, queueFixture } = await import('@/lib/engine/evals');
  const { MockAnthropicAdapter } = await import('@/lib/adapters/anthropic.mock');

  let best = GOLDEN_SET[0];
  let bestScore = -1;
  for (const fixture of GOLDEN_SET) {
    const quotes = fixture.recorded.candidates.flatMap((c) => c.quotes);
    const score = scoreFixture(noticeText, fixture.notice, quotes);
    if (score > bestScore) {
      best = fixture;
      bestScore = score;
    }
  }
  if (!best) throw new Error('the golden set is empty; cannot script a recorded run');

  // A fresh mock per run: the adapter is a scripted queue, so sharing the
  // process-wide singleton across two concurrent previews would interleave two
  // sellers' recorded responses.
  const model = new MockAnthropicAdapter();
  const code = isReasonCode(best.label) ? best.label : 'AMZ.AUTH.INAUTHENTIC';
  let slice;
  try {
    slice = corpus.getSlice(code);
    queueFixture(model, best, slice);
  } catch {
    // A corpus release that has not yet grown this code still has to produce a
    // narratable run in development; the fixture slice is the fallback.
    queueFixture(model, best, fixtureSlice(code));
  }
  return model;
}

export async function bindEngine(noticeText: string): Promise<EngineBinding> {
  const built = await loadBuiltCorpus();

  if (!built && process.env.NODE_ENV === 'production') {
    // Twelve-Factor V: the corpus bundle is a BUILD artifact. A production image
    // without one is a broken build, and serving synthetic policy text to a
    // paying seller would be worse than failing loudly.
    throw new Error(
      'corpus bundle missing: run `npm run corpus:build` — the synthetic fixture corpus is never served in production',
    );
  }

  const corpus =
    built ?? (await import('@/lib/engine/evals')).createFixtureCorpus();

  // The MODEL surface follows ADAPTER_MODE, never corpus availability: a built
  // corpus in a mock-mode process still has no API key, and per-commit runs use
  // recorded responses precisely so they are deterministic and free
  // (ARCHITECTURE.md §2.2 factor X).
  if (adapterMode() === 'live') {
    return { corpus, model: getAdapters().model, syntheticCorpus: !built, recordedModel: false };
  }
  return {
    corpus,
    model: await bindRecordedModel(noticeText, corpus),
    syntheticCorpus: !built,
    recordedModel: true,
  };
}

// ---------------------------------------------------------------------------
// Running one preview, narrated
// ---------------------------------------------------------------------------

/** `stage_complete` → which node just finished, and which starts next. */
const STAGE_ORDER: readonly StageKey[] = ['read', 'identify', 'clause', 'draft', 'check'];

function advance(emit: (e: ProgressEvent) => void, finished: StageKey, detail?: string) {
  emit({ type: 'stage', key: finished, state: 'done', ...(detail ? { detail } : {}) });
  const next = STAGE_ORDER[STAGE_ORDER.indexOf(finished) + 1];
  if (next) emit({ type: 'stage', key: next, state: 'active' });
}

export type RunOutcome = {
  result: EngineRunResult;
  syntheticCorpus: boolean;
  recordedModel: boolean;
  /** Populated by the corpus witness the moment stage 1 decides. */
  reasonCode?: ReasonCode;
  rubricLabels: Record<string, string>;
};

/**
 * Runs one appeal preview and narrates it. `emit` is called synchronously from
 * inside the pipeline's own event sink, so the caller can forward each event to
 * an SSE stream as it happens rather than after the fact.
 */
export async function runNarratedPipeline(
  notice: NoticeDocument,
  emit: (event: ProgressEvent) => void,
): Promise<RunOutcome> {
  const binding = await bindEngine(notice.text);

  let reasonCode: ReasonCode | undefined;
  let rubricLabels: Record<string, string> = {};

  // The witness (see the header note): `retrieve()` is where the code first
  // becomes a value, so this is the earliest honest moment to name it on screen.
  const witnessed: CorpusProvider = {
    corpusRelease: binding.corpus.corpusRelease,
    promptBundleHash: binding.corpus.promptBundleHash,
    listTaxonomy: () => binding.corpus.listTaxonomy(),
    getSlice: (code) => {
      const slice = binding.corpus.getSlice(code);
      reasonCode = code;
      rubricLabels = Object.fromEntries(slice.rubric.criteria.map((c) => [c.id, c.label]));
      advance(emit, 'read');
      advance(
        emit,
        'identify',
        `Found it — this is a ${REASON_CODE_TABLE[code].plainEnglish.toLowerCase()} case.`,
      );
      return slice;
    },
  };

  const events: EngineEventSink = {
    emit(event: EngineEvent) {
      switch (event.type) {
        case 'stage_complete':
          if (event.stage === 'retrieve') advance(emit, 'clause');
          else if (event.stage === 'draft') advance(emit, 'draft');
          else if (event.stage === 'critique') advance(emit, 'check');
          break;
        case 'draft_iteration':
          // A second pass is the evaluator-optimizer doing its job, not a stall.
          if (event.iteration > 1) {
            emit({
              type: 'stage',
              key: 'draft',
              state: 'active',
              detail: 'Tightening the draft where our own check found a gap…',
            });
          }
          break;
        default:
          break;
      }
    },
  };

  emit({ type: 'stage', key: 'read', state: 'active' });

  const deps = createDeps({ model: binding.model, corpus: witnessed, events });
  const result = await runPipeline(deps, notice);

  return {
    result,
    syntheticCorpus: binding.syntheticCorpus,
    recordedModel: binding.recordedModel,
    ...(reasonCode ? { reasonCode } : {}),
    rubricLabels,
  };
}

/** The label a pending node carries before anything has happened. */
export function pendingLabel(key: StageKey): string {
  return STAGE_LABELS[key].pending;
}
