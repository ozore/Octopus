/**
 * The worker's composition root.
 *
 * Spec: ARCHITECTURE.md ADR-006 ("Shield adds one adapter and zero new engines"
 * — an inbound notice is "passed through the SAME classifier"), LLM_ENGINE.md
 * §2 (stage 1), CORPUS_DESIGN.md §4.4 (redaction: deterministic first,
 * model-assisted second, never model-only).
 *
 * WHY THIS FILE EXISTS AT ALL. `queue/worker-registration.ts` deliberately never
 * imports `lib/engine/`, and that is right: the email and outcome-capture
 * modules should not acquire a dependency on the model pipeline just to name the
 * seam where one belongs. But a seam nobody fills is a feature that does not
 * exist — before this, `registerAllHandlers` was called with no options at all,
 * so every inbound Shield notice reached the seller as "we're not confident
 * enough in an automated read yet", forever, and ADR-006's central claim was
 * unimplemented. A composition root is the one place allowed to know about
 * everything, so the wiring lives here rather than in either module.
 */

import { createHash } from 'node:crypto';

import { getEnv } from '../env';
import { getAdapters } from '../lib/adapters';
import type { AnthropicAdapter } from '../lib/adapters/anthropic';
import {
  applyThreshold,
  classify,
  createDeps,
  engineConfigFromEnv,
  loadCorpusProvider,
  type CorpusProvider,
} from '../lib/engine';
import { REASON_CODE_TABLE } from '../lib/domain/reason-codes';
import type { NoticeDocument } from '../lib/domain/types';
import type { InboundNoticeClassifier } from '../lib/email/handlers';
import type { RegisterAllHandlersOptions } from '../lib/queue/worker-registration';

/**
 * Stage 1 only — classification, not a draft.
 *
 * An inbound monitoring alert answers "what is this and does it need you today",
 * which is exactly what stage 1 produces. Running the full pipeline here would
 * bill three model calls and draft an appeal for a notice nobody has asked us to
 * appeal, so the classifier stops where the question does (I5: an escalation is
 * an outcome, and a monitoring alert that says "a person will look at this" is
 * the honest answer for a notice we could not read).
 */
export function makeInboundClassifier(
  corpus: CorpusProvider,
  model: AnthropicAdapter,
  appBaseUrl: string,
): InboundNoticeClassifier {
  const config = engineConfigFromEnv();

  return async function classifyInboundNotice(text) {
    // Shield mail has no case yet — the seller has not asked for anything. The
    // synthetic id is content-derived so the same forwarded notice classifies
    // identically on a retry, and it never becomes a `cases.id`.
    const sha256 = createHash('sha256').update(text, 'utf8').digest('hex');
    const notice: NoticeDocument = {
      caseId: `shield_${sha256.slice(0, 26)}`,
      text,
      sha256,
      receivedVia: 'email_forward',
    };

    const deps = createDeps({ model, corpus, config });
    const { response } = await classify(deps, notice);
    const outcome = applyThreshold(response, text, config);

    // Not confident enough is not a failure to report — it is the case that
    // routes to a person, and the caller's default copy says exactly that.
    if (outcome.kind !== 'classified') return null;

    const entry = REASON_CODE_TABLE[outcome.code];
    return {
      summary: `This looks like ${entry.plainEnglish.toLowerCase()}.`,
      // The alert links to intake, never to an auto-started appeal: I4 means we
      // act on the seller's instruction, and D6's monitoring promise is "you
      // hear about it first", not "we filed something for you".
      actionUrl: `${appBaseUrl.replace(/\/+$/, '')}/appeal`,
    };
  };
}

/**
 * Everything `registerAllHandlers` accepts, bound to the real implementations.
 *
 * The corpus is loaded ONCE per process here rather than per job: it is a
 * memoised read of an immutable directory (ADR-003), and a failure to read it
 * must surface at worker boot, not on the first inbound notice at 2am.
 */
export async function buildHandlerOptions(): Promise<RegisterAllHandlersOptions> {
  const env = getEnv();
  const corpus = await loadCorpusProvider();
  const adapters = getAdapters();

  return {
    inboundClassifier: makeInboundClassifier(corpus, adapters.model, env.APP_BASE_URL),
    // `modelAssistRedactor` is deliberately left UNBOUND. CORPUS_DESIGN §4.4
    // orders the passes "deterministic first, model-assisted second, never
    // model-only", so the deterministic pass is the gate and the model pass is
    // additive. Omitting it is therefore stricter, not weaker — the opposite of
    // the inbound classifier above, whose absence silently removed a promised
    // capability. Binding it is a real decision (a model reading raw notices in
    // a background job) and belongs to whoever makes it, not to default wiring.
  };
}
