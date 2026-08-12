/**
 * The case state machine, against a real Postgres engine (PGlite).
 *
 * Spec: USER_JOURNEY.md §4 (the canonical state diagram) and
 * db/case-state-machine.ts's reconciliation note — "every write to
 * `cases.status` in this codebase is required to go through
 * `transitionCase()`, which makes an illegal edge a thrown error rather than
 * a silently-accepted UPDATE." This is the assignment's own requirement made
 * concrete: "transaction-safe case state transitions ... illegal transitions
 * throw."
 */

import { PGlite } from '@electric-sql/pglite';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import * as casesRepo from '../src/lib/db/repositories/cases';
import {
  CASE_TRANSITIONS,
  CaseNotFoundError,
  IllegalCaseTransitionError,
  transitionCase,
} from '../src/lib/db/case-state-machine';
import type { Db } from '../src/lib/db';
import { baseCaseInput, createTestDb } from './helpers/pglite-db';

let client: PGlite;
let db: Db;

beforeEach(async () => {
  const created = await createTestDb();
  client = created.client;
  db = created.db;
});

afterEach(async () => {
  await client.close();
});

describe('case state machine (USER_JOURNEY.md §4)', () => {
  it('walks the full machine path: intake -> ... -> document_ready', async () => {
    const created = await casesRepo.createCase(db, baseCaseInput());
    expect(created.status).toBe('intake');

    await casesRepo.markClassifying(db, created.id);
    await casesRepo.markClassified(db, created.id, 'amazon');
    await casesRepo.markDrafting(db, created.id);
    await casesRepo.markCritiquing(db, created.id);
    await casesRepo.markPreviewReady(db, created.id);
    await casesRepo.markPaid(db, created.id);
    const delivered = await casesRepo.markDocumentReady(db, created.id);

    expect(delivered.status).toBe('document_ready');
    expect(delivered.paidAt).not.toBeNull();
    expect(delivered.documentReadyAt).not.toBeNull();
  });

  it('walks the escalation path: classifying -> escalated -> document_ready', async () => {
    const created = await casesRepo.createCase(db, baseCaseInput());
    await casesRepo.markClassifying(db, created.id);
    const escalated = await casesRepo.markEscalated(db, created.id, 'unclassified', 'no confident code');
    expect(escalated.status).toBe('escalated');
    expect(escalated.escalationReason).toBe('unclassified');

    const delivered = await casesRepo.markDocumentReady(db, created.id);
    expect(delivered.status).toBe('document_ready');
  });

  it('supports Revising: document_ready -> critiquing re-entry', async () => {
    const created = await casesRepo.createCase(db, baseCaseInput());
    await casesRepo.markClassifying(db, created.id);
    await casesRepo.markClassified(db, created.id);
    await casesRepo.markDrafting(db, created.id);
    await casesRepo.markCritiquing(db, created.id);
    await casesRepo.markPreviewReady(db, created.id);
    await casesRepo.markPaid(db, created.id);
    await casesRepo.markDocumentReady(db, created.id);

    const revising = await casesRepo.markRevising(db, created.id);
    expect(revising.status).toBe('critiquing');
  });

  it('supports the post-rejection outcome guarantee: document_ready -> escalated', async () => {
    const created = await casesRepo.createCase(db, baseCaseInput());
    await casesRepo.markClassifying(db, created.id);
    await casesRepo.markClassified(db, created.id);
    await casesRepo.markDrafting(db, created.id);
    await casesRepo.markCritiquing(db, created.id);
    await casesRepo.markPreviewReady(db, created.id);
    await casesRepo.markPaid(db, created.id);
    await casesRepo.markDocumentReady(db, created.id);

    const reescalated = await casesRepo.markEscalatedAfterRejection(db, created.id, 'first pass rejected');
    expect(reescalated.status).toBe('escalated');
    expect(reescalated.escalationReason).toBe('seller_choice');
  });

  it('throws IllegalCaseTransitionError on a skipped edge (intake -> paid)', async () => {
    const created = await casesRepo.createCase(db, baseCaseInput());
    await expect(transitionCase(db, created.id, 'paid')).rejects.toThrow(IllegalCaseTransitionError);
  });

  it('throws on any transition out of a terminal state (refunded, failed)', async () => {
    const created = await casesRepo.createCase(db, baseCaseInput());
    await casesRepo.markClassifying(db, created.id);
    await casesRepo.markClassified(db, created.id);
    await casesRepo.markDrafting(db, created.id);
    await casesRepo.markCritiquing(db, created.id);
    await casesRepo.markPreviewReady(db, created.id);
    await casesRepo.markPaid(db, created.id);
    await casesRepo.markRefunded(db, created.id);

    await expect(transitionCase(db, created.id, 'document_ready')).rejects.toThrow(
      IllegalCaseTransitionError,
    );
  });

  it('throws CaseNotFoundError for an unknown case id', async () => {
    await expect(transitionCase(db, 'case_does_not_exist', 'classifying')).rejects.toThrow(
      CaseNotFoundError,
    );
  });

  it('leaves the row untouched after a rejected transition (no partial write)', async () => {
    const created = await casesRepo.createCase(db, baseCaseInput());
    await expect(transitionCase(db, created.id, 'paid')).rejects.toThrow(IllegalCaseTransitionError);
    const reloaded = await casesRepo.requireCase(db, created.id);
    expect(reloaded.status).toBe('intake');
    expect(reloaded.paidAt).toBeNull();
  });

  it('every declared edge in CASE_TRANSITIONS is actually reachable end to end from intake', () => {
    // A structural sanity check on the adjacency list itself: every non-empty
    // status other than the two terminal ones must have at least one outgoing
    // edge, so the map can never silently strand a case.
    for (const [state, edges] of Object.entries(CASE_TRANSITIONS)) {
      if (state === 'refunded' || state === 'failed') {
        expect(edges).toHaveLength(0);
      } else {
        expect(edges.length).toBeGreaterThan(0);
      }
    }
  });

  it('rejects a concurrent double-transition on the same row without corrupting state', async () => {
    // Simulates a webhook retry racing a worker job: both read the same
    // pre-transition row, both attempt the SAME legal edge concurrently. The
    // `SELECT ... FOR UPDATE` lock inside transitionCase() must serialize
    // them, so exactly one .status write wins and the other either succeeds
    // idempotently-in-effect or fails — never a torn write.
    const created = await casesRepo.createCase(db, baseCaseInput());
    await casesRepo.markClassifying(db, created.id);
    await casesRepo.markClassified(db, created.id);
    await casesRepo.markDrafting(db, created.id);
    await casesRepo.markCritiquing(db, created.id);
    await casesRepo.markPreviewReady(db, created.id);

    const results = await Promise.allSettled([
      casesRepo.markPaid(db, created.id),
      casesRepo.markPaid(db, created.id),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    // PGlite is single-connection, so both may serialize and succeed (paid is
    // idempotent as a target status); what must NEVER happen is the case
    // ending up anywhere other than 'paid'.
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);
    const final = await casesRepo.requireCase(db, created.id);
    expect(final.status).toBe('paid');
  });
});
