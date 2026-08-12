/**
 * The seams BETWEEN the four modules — the failures that only exist where two
 * teams' work meets, and that no module's own suite can see.
 *
 * Spec: ARCHITECTURE.md ADR-003 (the corpus is a build artifact the running
 * process must actually be able to read), ADR-006 (an inbound Shield notice goes
 * through the SAME classifier), ADR-007 (hosted Checkout, webhook-as-truth,
 * idempotent fulfilment), ADR-008 ¶1 (consent rides with the purchase and is
 * separable from it).
 *
 * Each test below corresponds to a defect that was actually present when the
 * four modules were first put together, and each would have been invisible from
 * inside any one of them.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createCheckoutForCase, InvalidCheckoutStateError } from '../src/lib/billing';
import { handleStripeWebhook } from '../src/lib/billing/webhook';
import type { Db } from '../src/lib/db';
import * as casesRepo from '../src/lib/db/repositories/cases';
import * as paymentsRepo from '../src/lib/db/repositories/payments';
import * as consentsRepo from '../src/lib/db/repositories/consents';
import { readMigrationStatements } from '../src/lib/db/migrations';
import { loadCorpusProvider } from '../src/lib/engine';
import { GOLDEN_SET, queueFixture } from '../src/lib/engine/evals';
import { MockAnthropicAdapter } from '../src/lib/adapters/anthropic.mock';
import { MockStripeAdapter } from '../src/lib/adapters/stripe.mock';
import { makeInboundClassifier } from '../src/worker/composition';
import { REASON_CODES } from '../src/lib/domain/reason-codes';

import { createTestDb, baseCaseInput } from './helpers/pglite-db';
import { makeTestAdapters } from './helpers/test-adapters';

// ---------------------------------------------------------------------------
// 1. The corpus actually reaches the running process
// ---------------------------------------------------------------------------

describe('the engine ↔ corpus seam (ADR-003)', () => {
  /**
   * THE REGRESSION THIS EXISTS FOR. `loadCorpusProvider` used to take a string
   * specifier and `await import(specifier)`. Under `next build` webpack cannot
   * resolve an expression, so it compiled that call into a context module that
   * threw MODULE_NOT_FOUND for every input — the web tier could never load the
   * corpus at all. Nothing failed visibly, because the one caller catches and
   * falls back to the synthetic fixture corpus. A test that merely asserted "a
   * provider comes back" would have passed against the fixture and missed it
   * entirely, so this asserts the provider is the REAL one.
   */
  it('loads the committed corpus, not a fixture stand-in', async () => {
    const corpus = await loadCorpusProvider();

    expect(corpus.listTaxonomy()).toHaveLength(REASON_CODES.length);
    // A content-derived hash. The fixture corpus cannot produce one.
    expect(corpus.promptBundleHash).toMatch(/^[0-9a-f]{64}$/);

    // And the slice carries real policy documents with resolvable clause ids.
    const slice = corpus.getSlice('AMZ.AUTH.INAUTHENTIC');
    expect(slice.policyDocs.length).toBeGreaterThan(0);
    for (const doc of slice.policyDocs) {
      for (const clause of doc.clauses) expect(clause.clauseId).toMatch(/#/);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Shield's inbound mail goes through the same classifier
// ---------------------------------------------------------------------------

describe('the worker ↔ engine seam (ADR-006)', () => {
  /**
   * `registerAllHandlers` names an `inboundClassifier` seam and the worker used
   * to call it with no options at all, so every monitoring alert said "we're not
   * confident enough in an automated read yet" forever — ADR-006's central claim
   * ("one adapter, zero new engines") was simply unimplemented. The seam is now
   * filled by `src/worker/composition.ts`.
   */
  it('classifies a forwarded notice through the real stage-1 pipeline', async () => {
    const fixture = GOLDEN_SET.find((f) => f.expected.kind === 'drafted');
    if (!fixture) throw new Error('no drafted fixture in the golden set');

    const corpus = await loadCorpusProvider();
    const model = new MockAnthropicAdapter();
    queueFixture(model, fixture, corpus.getSlice(fixture.label as never));

    const classify = makeInboundClassifier(corpus, model, 'http://localhost:3000');
    const result = await classify(fixture.notice);

    expect(result).not.toBeNull();
    // Seller-facing language, never the taxonomy code (Nielsen #2).
    expect(result?.summary).not.toMatch(/AMZ\.|WMT\./);
    // I4: the alert points at intake. It never says we filed anything.
    expect(result?.actionUrl).toBe('http://localhost:3000/appeal');
  });

  it('returns null rather than guessing when stage 1 declines (I5)', async () => {
    const refused = GOLDEN_SET.find((f) => f.expected.kind === 'escalate');
    if (!refused) throw new Error('no escalating fixture in the golden set');

    const corpus = await loadCorpusProvider();
    const model = new MockAnthropicAdapter();
    queueFixture(model, refused, corpus.getSlice('AMZ.AUTH.INAUTHENTIC'));

    const classify = makeInboundClassifier(corpus, model, 'http://localhost:3000');
    // Null is the honest answer: the caller's copy then says a person will look.
    expect(await classify(refused.notice)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 3. The web tier's checkout goes through the billing module
// ---------------------------------------------------------------------------

describe('the web ↔ billing seam (ADR-007)', () => {
  let db: Db;
  let close: () => Promise<void>;

  beforeEach(async () => {
    const created = await createTestDb();
    db = created.db;
    close = () => created.client.close();
  });

  afterEach(async () => {
    await close();
  });

  async function previewReadyCase(): Promise<string> {
    const row = await casesRepo.createCase(db, baseCaseInput() as never);
    await casesRepo.markClassifying(db, row.id);
    await casesRepo.markClassified(db, row.id);
    await casesRepo.markDrafting(db, row.id);
    await casesRepo.markCritiquing(db, row.id);
    await casesRepo.markPreviewReady(db, row.id);
    return row.id;
  }

  /**
   * The server action used to call `adapters.billing.createCheckoutSession`
   * directly and write the result into an in-process map. No `payments` row was
   * ever created — so the webhook, which looks a payment up BY SESSION ID, would
   * have thrown on every real purchase and no case would ever have unlocked.
   */
  it('creates a pending payment row that the webhook can then find', async () => {
    const caseId = await previewReadyCase();
    const adapters = makeTestAdapters();

    const { session } = await createCheckoutForCase(db, adapters, {
      caseId,
      tier: 'rescue',
      successUrl: 'http://localhost:3000/case/x/plan?session={CHECKOUT_SESSION_ID}',
      cancelUrl: 'http://localhost:3000/appeal/x',
      consent: { granted: true, textVersion: 'outcome-consent-v1' },
    });

    const pending = await paymentsRepo.getPaymentBySessionId(db, session.id);
    expect(pending?.status).toBe('pending');
    expect(pending?.caseId).toBe(caseId);
    expect(pending?.amountCents).toBe(14900);

    // The redirect grants nothing; the webhook does. Drive the real handler
    // with the payload Stripe would actually send — including the consent
    // metadata, which a hand-rolled event silently omits.
    const stripe = adapters.billing as MockStripeAdapter;
    const { payload, signature } = stripe.signedCompletedSession(session.id);
    await handleStripeWebhook(db, adapters, payload, signature);

    const paid = await paymentsRepo.getPaymentBySessionId(db, session.id);
    expect(paid?.status).toBe('paid');
    expect((await casesRepo.requireCase(db, caseId)).status).toBe('paid');

    // ADR-008 ¶1: consent was captured at payment, versioned, and stored.
    const consent = await consentsRepo.getConsentForCase(db, caseId);
    expect(consent?.granted).toBe(true);
    expect(consent?.textVersion).toBe('outcome-consent-v1');
  });

  it('refuses a checkout from a case that has no preview to sell', async () => {
    const row = await casesRepo.createCase(db, baseCaseInput() as never);

    await expect(
      createCheckoutForCase(db, makeTestAdapters(), {
        caseId: row.id,
        tier: 'rescue',
        successUrl: 'http://localhost:3000/s',
        cancelUrl: 'http://localhost:3000/c',
      }),
    ).rejects.toBeInstanceOf(InvalidCheckoutStateError);

    // And nothing was charged or recorded on the way to that refusal.
    expect(await paymentsRepo.getLatestPaymentForCase(db, row.id)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 4. Migrations are applied everywhere they are claimed to be
// ---------------------------------------------------------------------------

describe('the migration seam (Twelve-Factor X)', () => {
  /**
   * The PGlite harness used to read `drizzle/0000_init.sql` by name, so the
   * moment a second migration existed the tests would have kept passing against
   * the original schema while production moved on. Both the harness and the
   * app's own dev fallback now read the journal.
   */
  it('reads every migration in the journal, not just the first', () => {
    const statements = readMigrationStatements();
    expect(statements.length).toBeGreaterThan(0);
    // A column from 0001 — proof that later migrations are not being skipped.
    expect(statements.some((s) => s.includes('escalation_claimed_by'))).toBe(true);
  });

  it('applies them all to a fresh in-memory database', async () => {
    const { db, client } = await createTestDb();
    const row = await casesRepo.createCase(db, baseCaseInput() as never);
    await casesRepo.markClassifying(db, row.id);
    await casesRepo.markEscalated(db, row.id, 'low_confidence', 'needs a person');

    const claimed = await casesRepo.claimEscalation(db, row.id, 'reviewer-1');
    expect(claimed?.escalationClaimedBy).toBe('reviewer-1');

    const open = await casesRepo.listOpenEscalations(db);
    expect(open.map((c) => c.id)).toContain(row.id);

    await casesRepo.resolveEscalation(db, row.id, 'reviewed and returned');
    expect(await casesRepo.listOpenEscalations(db)).toHaveLength(0);
    expect((await casesRepo.listResolvedEscalations(db)).map((c) => c.id)).toContain(row.id);

    await client.close();
  });
});
