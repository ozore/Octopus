/**
 * Health check for the Fly `web` process.
 *
 * Reports the release's attribution stamps (corpus release, prompt bundle hash,
 * pinned model IDs) because those are the values that must match what is stamped
 * on every case row — a health check that only says "ok" cannot tell you that a
 * release is serving a corpus version you did not intend (ADR-008).
 */

import { getEnv } from '../../../env';

export const dynamic = 'force-dynamic';

export function GET(): Response {
  const env = getEnv();
  return Response.json({
    status: 'ok',
    corpus_release: env.CORPUS_RELEASE,
    prompt_bundle_hash: env.PROMPT_BUNDLE_HASH,
    models: {
      classify: env.MODEL_CLASSIFY,
      draft: env.MODEL_DRAFT,
      critique: env.MODEL_CRITIQUE,
    },
    time_guarantee_advertised: env.TIME_GUARANTEE_ADVERTISED,
  });
}
