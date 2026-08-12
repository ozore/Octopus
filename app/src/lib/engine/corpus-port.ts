/**
 * The engine's port onto the corpus module (`src/lib/corpus/`).
 *
 * Spec: LLM_ENGINE.md §5.3 (`CorpusSlice`), E3 (per-stage slices), ADR-003
 * (no vector DB — retrieval is a code-keyed lookup on a build artifact).
 *
 * The corpus module owns the *data*; `domain/types.ts` owns the *types*. This
 * file owns neither — it is a two-method interface so that the engine can be
 * tested against a fixture corpus with no build artifact on disk, and so that a
 * corpus release cannot reach into engine internals.
 *
 * `adaptCorpusModule` exists because the corpus module's export *names* are its
 * own business: the contract this engine depends on is (a) the L1 taxonomy in a
 * deterministic order and (b) a total `ReasonCode → CorpusSlice` function. Any
 * module exposing those under one of the accepted names binds without a change
 * here; anything else fails loudly at wiring time with a message naming what was
 * missing, rather than at the first customer request.
 */

import { CorpusIntegrityError } from './errors';
import type { ReasonCode } from '../domain/reason-codes';
import type { CorpusSlice, TaxonomyRecord } from '../domain/types';

export interface CorpusProvider {
  readonly corpusRelease: number;
  readonly promptBundleHash: string;
  /**
   * The full L1 taxonomy, in a deterministic order. Stage 1 cannot route without
   * seeing every code's trigger phrases (§2.5), and this list is serialised into
   * a *cached* prefix — so the order must be stable across processes, not merely
   * within one (§3.1).
   */
  listTaxonomy(): readonly TaxonomyRecord[];
  /** Stage 2. Total over the 33 codes; throws for anything outside them. */
  getSlice(code: ReasonCode): CorpusSlice;
}

type Unknown = Record<string, unknown>;

const TAXONOMY_ALIASES = ['listTaxonomy', 'listTaxonomyRecords', 'taxonomyRecords', 'listL1'];
const SLICE_ALIASES = ['getSlice', 'getCorpusSlice', 'sliceFor', 'retrieveSlice'];
const RELEASE_ALIASES = ['corpusRelease', 'CORPUS_RELEASE'];
const HASH_ALIASES = ['promptBundleHash', 'PROMPT_BUNDLE_HASH'];

function pick(mod: Unknown, names: readonly string[]): unknown {
  for (const name of names) {
    if (mod[name] !== undefined) return mod[name];
  }
  return undefined;
}

/** Structurally adapt whatever `src/lib/corpus/` exports onto `CorpusProvider`. */
export function adaptCorpusModule(mod: unknown): CorpusProvider {
  const record = (mod ?? {}) as Unknown;
  const nested = (record.corpusProvider ?? record.default ?? record) as Unknown;

  const listTaxonomy = pick(nested, TAXONOMY_ALIASES) ?? pick(record, TAXONOMY_ALIASES);
  const getSlice = pick(nested, SLICE_ALIASES) ?? pick(record, SLICE_ALIASES);

  if (typeof listTaxonomy !== 'function' || typeof getSlice !== 'function') {
    throw new CorpusIntegrityError(
      `corpus module does not satisfy CorpusProvider: needs one of [${TAXONOMY_ALIASES.join(
        ', ',
      )}] and one of [${SLICE_ALIASES.join(', ')}]`,
    );
  }

  const release = pick(nested, RELEASE_ALIASES) ?? pick(record, RELEASE_ALIASES);
  const hash = pick(nested, HASH_ALIASES) ?? pick(record, HASH_ALIASES);

  return {
    corpusRelease: typeof release === 'number' ? release : 0,
    promptBundleHash: typeof hash === 'string' ? hash : 'unbuilt',
    listTaxonomy: () => (listTaxonomy as () => readonly TaxonomyRecord[]).call(nested),
    getSlice: (code: ReasonCode) => (getSlice as (c: ReasonCode) => CorpusSlice).call(nested, code),
  };
}

/**
 * Late-bound loader for the composition root. The engine's own entry points take
 * a `CorpusProvider` explicitly (dependency injection, so the test suite needs
 * no build artifact); this helper exists for the worker, which wants the real
 * corpus and should fail loudly if the bundle has not been built.
 */
export async function loadCorpusProvider(specifier = '../corpus/index.js'): Promise<CorpusProvider> {
  try {
    const mod: unknown = await import(/* @vite-ignore */ specifier);
    return adaptCorpusModule(mod);
  } catch (cause) {
    if (cause instanceof CorpusIntegrityError) throw cause;
    throw new CorpusIntegrityError(
      `corpus module "${specifier}" could not be loaded: ${(cause as Error).message}`,
    );
  }
}
