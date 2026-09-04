/**
 * The repositories, on PGlite with the REAL committed migrations — enums,
 * foreign keys, CHECK constraints, partial unique indexes and the audit trigger
 * all present, so these tests exercise the constraints production has rather
 * than a hand-trimmed subset.
 */
import { and, eq, sql } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { appMigrationsDir } from '../src/lib/db';
import { renderSummary, writeAuditEvent, AUDIT_KINDS, getVendorActivity, getOrgActivity } from '../src/lib/audit';
import {
  applyTemplate,
  archiveVendor,
  countTrackedVendors,
  createVendor,
  ensureOrgSettings,
  importVendors,
  latestComparison,
  listVendors,
  loadRequirementSet,
  resolveRequirementSetId,
  runComparison,
  updateOrgSettings,
  vendorStatusCounts,
} from '../src/lib/repos';
import { auditEvents, comparisonResults, requirementSets, requirements, vendorTypes, vendors } from '../src/lib/schema';
import { newId } from '../src/lib/ids';
import { organisations, users } from '@octopus/platform/db';
import { newId as platformNewId } from '@octopus/platform';
import { createTestDb } from '@octopus/platform/testing';
import {
  coverage,
  extraction,
  limit,
  mention,
} from './engine/fixtures';


/**
 * Drizzle wraps a database error in "Failed query: …" and puts the real
 * message — the constraint name — on `cause`. Asserting on the wrapper would
 * pass for ANY failure, which is exactly the assertion these tests must not
 * make: the point is that a NAMED constraint refused the write.
 */
async function expectRefusedBy(operation: Promise<unknown> | (() => Promise<unknown>), pattern: RegExp): Promise<void> {
  try {
    await (typeof operation === 'function' ? operation() : operation);
  } catch (error) {
    const messages: string[] = [];
    let current: unknown = error;
    for (let depth = 0; depth < 5 && current instanceof Error; depth += 1) {
      messages.push(current.message);
      current = (current as { cause?: unknown }).cause;
    }
    expect(messages.join(' | ')).toMatch(pattern);
    return;
  }
  throw new Error(`expected the database to refuse this write with ${pattern}`);
}

let db: Awaited<ReturnType<typeof createTestDb>>;
let orgId: string;
let userId: string;
const actor = (): { kind: 'user'; userId: string } => ({ kind: 'user', userId });

beforeEach(async () => {
  db = await createTestDb([appMigrationsDir()]);
  orgId = platformNewId('org');
  userId = platformNewId('usr');
  await db.db.insert(organisations).values({ id: orgId, name: 'Rivergate Property Management', slug: `rivergate-${orgId.slice(-6)}` });
  await db.db.insert(users).values({ id: userId, email: `ana+${orgId.slice(-6)}@rivergate.test` });
});

afterEach(async () => {
  await db.close();
});

describe('migrations', () => {
  it('applies the app schema on top of the platform schema', async () => {
    const result = await db.client.query<{ table_name: string }>(
      `select table_name from information_schema.tables where table_schema='public' order by table_name`,
    );
    const tables = result.rows.map((row) => row.table_name);
    for (const table of [
      'organisations',
      'vendors',
      'requirement_sets',
      'requirements',
      'documents',
      'extractions',
      'certificates',
      'coverages',
      'coverage_limits',
      'comparisons',
      'comparison_results',
      'reminders',
      'suppressions',
      'recipient_sends',
      'upload_links',
      'gap_report_sessions',
      'gap_report_documents',
      'audit_events',
      'reports',
      'trial_consents',
    ]) {
      expect(tables, `missing table ${table}`).toContain(table);
    }
  });

  it('enforces the app’s foreign key onto the platform’s organisations table', async () => {
    await expect(
      db.db.insert(vendors).values({ id: newId('vendor'), orgId: 'org_missing', name: 'Nowhere' }),
    ).rejects.toThrow();
  });
});

describe('the CHECK constraints the specs asked for', () => {
  it('refuses the retired status word at the database level (B-02)', async () => {
    await expectRefusedBy(
      db.db.insert(vendors).values({ id: newId('vendor'), orgId, name: 'Acme', status: 'covered' }),
      /vendors_status/,
    );
  });

  it('refuses a requirement with a zero minimum (specs/02 §6)', async () => {
    const setId = await applyTemplate(db.db, { orgId, templateId: 'pm.baseline', actor: actor() });
    await expectRefusedBy(
      db.db.insert(requirements).values({
        id: newId('requirement'),
        requirementSetId: setId,
        orgId,
        kind: 'limit',
        coverage: 'general_liability',
        limitLabel: 'each_occurrence',
        minAmount: 0,
      }),
      /min_amount/,
    );
  });

  it('allows exactly one org-default requirement set (specs/02 §6)', async () => {
    await applyTemplate(db.db, { orgId, templateId: 'pm.baseline', actor: actor(), makeDefault: true });
    await expect(
      db.db.insert(requirementSets).values({
        id: newId('requirementSet'),
        orgId,
        name: 'A second default',
        audience: 'pm',
        isOrgDefault: true,
      }),
    ).rejects.toThrow();
  });

  it('lets a second application take the default over from the first', async () => {
    await applyTemplate(db.db, { orgId, templateId: 'pm.baseline', actor: actor(), makeDefault: true });
    const second = await applyTemplate(db.db, { orgId, templateId: 'pm.structural', actor: actor(), makeDefault: true });
    const defaults = await db.db
      .select({ id: requirementSets.id })
      .from(requirementSets)
      .where(and(eq(requirementSets.orgId, orgId), eq(requirementSets.isOrgDefault, true)));
    expect(defaults.map((row) => row.id)).toEqual([second]);
  });
});

describe('the extractions one-owner CHECK (specs/15 §5, REVIEW.md B-08)', () => {
  const insert = (values: Record<string, unknown>) =>
    db.db.execute(sql`
      INSERT INTO extractions (id, document_id, gap_report_document_id, org_id, status, model, prompt_hash, schema_version)
      VALUES (${values['id']}, ${values['documentId'] ?? null}, ${values['gapReportDocumentId'] ?? null},
              ${values['orgId'] ?? null}, 'pending', 'test-model', 'hash', 'coi.v1')`);

  it('refuses an extraction with no owner at all', async () => {
    await expectRefusedBy(insert({ id: 'ext_none' }), /extractions_one_owner/);
  });

  it('refuses an org extraction with no document', async () => {
    await expectRefusedBy(insert({ id: 'ext_orgonly', orgId }), /extractions_one_owner/);
  });

  it('refuses an extraction that claims BOTH owners', async () => {
    const sessionId = newId('gapReportSession');
    const gapDocId = newId('gapReportDocument');
    const docId = newId('document');
    await db.db.execute(sql`
      INSERT INTO gap_report_sessions (id, token_hash, purge_at) VALUES (${sessionId}, 'hash1', now() + interval '7 days')`);
    await db.db.execute(sql`
      INSERT INTO gap_report_documents (id, session_id, storage_key, mime, bytes, sha256)
      VALUES (${gapDocId}, ${sessionId}, 'gap/x.pdf', 'application/pdf', 10, 'sha1')`);
    await db.db.execute(sql`
      INSERT INTO documents (id, org_id, storage_key, mime, bytes, sha256)
      VALUES (${docId}, ${orgId}, 'org/x.pdf', 'application/pdf', 10, 'sha2')`);

    await expectRefusedBy(
      insert({ id: 'ext_both', documentId: docId, orgId, gapReportDocumentId: gapDocId }),
      /extractions_one_owner/,
    );
  });

  it('accepts each legal shape, and only those', async () => {
    const sessionId = newId('gapReportSession');
    const gapDocId = newId('gapReportDocument');
    const docId = newId('document');
    await db.db.execute(sql`
      INSERT INTO gap_report_sessions (id, token_hash, purge_at) VALUES (${sessionId}, 'hash2', now() + interval '7 days')`);
    await db.db.execute(sql`
      INSERT INTO gap_report_documents (id, session_id, storage_key, mime, bytes, sha256)
      VALUES (${gapDocId}, ${sessionId}, 'gap/y.pdf', 'application/pdf', 10, 'sha3')`);
    await db.db.execute(sql`
      INSERT INTO documents (id, org_id, storage_key, mime, bytes, sha256)
      VALUES (${docId}, ${orgId}, 'org/y.pdf', 'application/pdf', 10, 'sha4')`);

    await insert({ id: 'ext_org', documentId: docId, orgId });
    await insert({ id: 'ext_gap', gapReportDocumentId: gapDocId });

    const rows = await db.client.query<{ id: string }>('select id from extractions order by id');
    expect(rows.rows.map((r) => r.id)).toEqual(['ext_gap', 'ext_org']);
  });

  it('keeps the anonymous path outside every org, so an org read cannot reach it', async () => {
    const sessionId = newId('gapReportSession');
    const gapDocId = newId('gapReportDocument');
    await db.db.execute(sql`
      INSERT INTO gap_report_sessions (id, token_hash, purge_at) VALUES (${sessionId}, 'hash3', now() + interval '7 days')`);
    await db.db.execute(sql`
      INSERT INTO gap_report_documents (id, session_id, storage_key, mime, bytes, sha256)
      VALUES (${gapDocId}, ${sessionId}, 'gap/z.pdf', 'application/pdf', 10, 'sha5')`);
    await insert({ id: 'ext_anon', gapReportDocumentId: gapDocId });

    const scoped = await db.client.query(`select id from extractions where org_id = $1`, [orgId]);
    expect(scoped.rows).toHaveLength(0);
  });
});

describe('requirement sets (M2)', () => {
  it('copies a template rather than referencing it, and stamps the library version', async () => {
    const setId = await applyTemplate(db.db, { orgId, templateId: 'gc.trade.high_hazard', actor: actor(), makeDefault: true });
    const [set] = await db.db.select().from(requirementSets).where(eq(requirementSets.id, setId));
    expect(set?.sourceTemplateId).toBe('gc.trade.high_hazard');
    expect(set?.sourceTemplateVersion).toBe(1);
    expect(set?.version).toBe(1);

    const loaded = await loadRequirementSet(db.db, orgId, setId);
    expect(loaded?.requirements.length).toBeGreaterThan(10);
    const occurrence = loaded?.requirements.find((r) => r.limitLabel === 'each_occurrence');
    expect(occurrence?.minAmount).toBe(5_000_000);
    expect(occurrence?.combinable).toBe(true);
  });

  it('round-trips acceptsForms as a list', async () => {
    const setId = await applyTemplate(db.db, { orgId, templateId: 'pm.commercial.baseline', actor: actor() });
    const loaded = await loadRequirementSet(db.db, orgId, setId);
    const ai = loaded?.requirements.find((r) => r.endorsementKey === 'additional_insured_ongoing');
    expect(ai?.acceptsForms).toEqual(['CG 20 10']);
  });

  it('does not leak a requirement set across orgs', async () => {
    const setId = await applyTemplate(db.db, { orgId, templateId: 'pm.baseline', actor: actor() });
    const otherOrg = platformNewId('org');
    await db.db.insert(organisations).values({ id: otherOrg, name: 'Someone else', slug: `other-${otherOrg.slice(-6)}` });
    expect(await loadRequirementSet(db.db, otherOrg, setId)).toBeNull();
  });

  it('resolves the vendor type first and the org default second (specs/02 §8)', async () => {
    const defaultSet = await applyTemplate(db.db, { orgId, templateId: 'pm.baseline', actor: actor(), makeDefault: true });
    const structuralSet = await applyTemplate(db.db, { orgId, templateId: 'pm.structural', actor: actor() });
    const typeId = newId('vendorType');
    await db.db.insert(vendorTypes).values({ id: typeId, orgId, key: 'roofing', label: 'Roofing', requirementSetId: structuralSet });

    const typed = await createVendor(db.db, { orgId, actor: actor(), vendor: { name: 'Harbour Roofing', vendorTypeId: typeId } });
    const untyped = await createVendor(db.db, { orgId, actor: actor(), vendor: { name: 'Delta Pool Service' } });

    expect(await resolveRequirementSetId(db.db, orgId, typed)).toBe(structuralSet);
    expect(await resolveRequirementSetId(db.db, orgId, untyped)).toBe(defaultSet);
  });
});

describe('vendors and CSV import (M3)', () => {
  it('imports, updates on a repeat name, and counts tracked vendors', async () => {
    const rows = [
      { index: 0, name: 'Harbour Roofing', legalName: null, vendorType: null, contactEmail: 'office@harbour.test', contactLabel: null, externalRef: null },
      { index: 1, name: 'Delta Pool Service', legalName: null, vendorType: null, contactEmail: null, contactLabel: null, externalRef: 'V-1002' },
    ];
    const first = await importVendors(db.db, { orgId, actor: actor(), rows });
    expect(first).toMatchObject({ created: 2, updated: 0 });
    expect(await countTrackedVendors(db.db, orgId)).toBe(2);

    const second = await importVendors(db.db, {
      orgId,
      actor: actor(),
      rows: [{ ...rows[0]!, contactEmail: 'accounts@harbour.test' }],
    });
    expect(second).toMatchObject({ created: 0, updated: 1 });
    expect(await countTrackedVendors(db.db, orgId)).toBe(2);

    const [harbour] = await db.db.select().from(vendors).where(eq(vendors.name, 'Harbour Roofing'));
    expect(harbour?.contactEmail).toBe('accounts@harbour.test');
  });

  it('matches on externalRef when the vendor was renamed at the source system', async () => {
    await importVendors(db.db, {
      orgId,
      actor: actor(),
      rows: [{ index: 0, name: 'Delta Pool', legalName: null, vendorType: null, contactEmail: null, contactLabel: null, externalRef: 'V-1002' }],
    });
    const result = await importVendors(db.db, {
      orgId,
      actor: actor(),
      rows: [{ index: 0, name: 'Delta Pool Service LLC', legalName: null, vendorType: null, contactEmail: null, contactLabel: null, externalRef: 'V-1002' }],
    });
    expect(result).toMatchObject({ created: 0, updated: 1 });
    expect(await countTrackedVendors(db.db, orgId)).toBe(1);
  });

  it('fills to the entitlement limit and reports the remainder (specs/10 A10)', async () => {
    const rows = Array.from({ length: 5 }, (_, i) => ({
      index: i,
      name: `Vendor ${i}`,
      legalName: null,
      vendorType: null,
      contactEmail: null,
      contactLabel: null,
      externalRef: null,
    }));
    const result = await importVendors(db.db, { orgId, actor: actor(), rows, limit: 3 });
    expect(result).toMatchObject({ created: 3, skipped: 2 });
  });

  it('archives rather than deletes, and an archived vendor stops counting', async () => {
    const vendorId = await createVendor(db.db, { orgId, actor: actor(), vendor: { name: 'Northgate Landscaping' } });
    expect(await countTrackedVendors(db.db, orgId)).toBe(1);
    await archiveVendor(db.db, { orgId, vendorId, actor: actor() });
    expect(await countTrackedVendors(db.db, orgId)).toBe(0);
    expect(await listVendors(db.db, orgId)).toHaveLength(0);
    const [row] = await db.db.select().from(vendors).where(eq(vendors.id, vendorId));
    expect(row?.archivedAt).not.toBeNull();
    expect(row?.remindersPaused).toBe(true);
  });
});

describe('comparisons (M5) end to end on the database', () => {
  async function setup() {
    await applyTemplate(db.db, { orgId, templateId: 'pm.baseline', actor: actor(), makeDefault: true });
    await updateOrgSettings(db.db, {
      orgId,
      actor: actor(),
      patch: { entityBlock: 'Rivergate Property Management\n900 Bay Street\nAustin TX' },
    });
    return createVendor(db.db, {
      orgId,
      actor: actor(),
      vendor: { name: 'Harbour Roofing', legalName: 'Harbour Roofing Inc', contactEmail: 'office@harbour.test' },
    });
  }

  it('runs, persists, and refreshes the vendor’s cached status', async () => {
    const vendorId = await setup();
    const payload = extraction({
      insuredName: 'HARBOUR ROOFING, INC.',
      holder: 'Rivergate Property Management',
      coverages: [
        coverage('general_liability', {
          exp: '2027-06-30',
          addlInsd: 'Y',
          limits: [
            limit('each_occurrence', 1_000_000),
            limit('general_aggregate', 2_000_000),
            limit('products_comp_op_agg', 2_000_000),
          ],
        }),
        coverage('automobile_liability', { exp: '2027-06-30', limits: [limit('combined_single_limit', 1_000_000)] }),
        coverage('workers_compensation', { exp: '2027-06-30', limits: [limit('el_each_accident', 1_000_000)] }),
      ],
      forms: [mention('CG 20 10 04 13', 'attached_endorsement_page'), mention('CG 20 37', 'attached_endorsement_page')],
    });

    const run = await runComparison(db.db, {
      orgId,
      vendorId,
      extraction: payload,
      evaluationDate: '2026-06-01',
      actor: actor(),
    });
    expect(run).not.toBeNull();
    expect(run?.result.metCount).toBeGreaterThan(0);

    const [vendor] = await db.db.select().from(vendors).where(eq(vendors.id, vendorId));
    expect(vendor?.status).toBe(run?.result.status);
    expect(vendor?.earliestRequiredExpiry).toBe('2027-06-30');

    const latest = await latestComparison(db.db, orgId, vendorId);
    expect(latest?.comparison.engineVersion).toBe(run?.result.engineVersion);
    expect(latest?.results.length).toBe(run?.result.results.length);
    // Order is stable, so a report regenerated tomorrow reads the same way.
    expect(latest?.results.map((r) => r.requirementId)).toEqual(run?.result.results.map((r) => r.requirementId));
  });

  it('pins the requirement-set version, so an old comparison keeps the rules it ran under', async () => {
    const vendorId = await setup();
    const payload = extraction({
      insuredName: 'HARBOUR ROOFING, INC.',
      coverages: [coverage('general_liability', { exp: '2027-06-30', limits: [limit('each_occurrence', 1_000_000)] })],
    });
    const first = await runComparison(db.db, { orgId, vendorId, extraction: payload, evaluationDate: '2026-06-01', actor: actor() });
    expect(first?.result.requirementSetVersion).toBe(1);

    // The customer edits their requirements: the set's version moves on.
    await db.db.update(requirementSets).set({ version: 2 }).where(eq(requirementSets.orgId, orgId));
    const second = await runComparison(db.db, { orgId, vendorId, extraction: payload, evaluationDate: '2026-06-01', actor: actor() });
    expect(second?.result.requirementSetVersion).toBe(2);

    const rows = await db.client.query<{ requirement_set_version: number }>(
      'select requirement_set_version from comparisons order by evaluated_at',
    );
    expect(rows.rows.map((r) => Number(r.requirement_set_version))).toEqual([1, 2]);
  });

  it('refuses a comparison_results state outside the five', async () => {
    const vendorId = await setup();
    await runComparison(db.db, {
      orgId,
      vendorId,
      extraction: extraction({ coverages: [coverage('general_liability', { exp: '2027-06-30' })] }),
      evaluationDate: '2026-06-01',
      actor: actor(),
    });
    const [row] = await db.db.select().from(comparisonResults).limit(1);
    await expectRefusedBy(
      db.db.update(comparisonResults).set({ state: 'covered' }).where(eq(comparisonResults.id, row!.id)),
      /comparison_results_state/,
    );
  });

  it('counts the six vendor states and nothing else', async () => {
    const vendorId = await setup();
    await runComparison(db.db, {
      orgId,
      vendorId,
      extraction: extraction({ coverages: [coverage('general_liability', { exp: '2027-06-30' })] }),
      evaluationDate: '2026-06-01',
      actor: actor(),
    });
    const counts = await vendorStatusCounts(db.db, orgId);
    expect(Object.keys(counts).sort()).toEqual(
      ['asserted_only', 'expired', 'expiring', 'gap', 'meets', 'no_certificate'].sort(),
    );
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(1);
  });
});

describe('the audit trail (M9)', () => {
  it('writes a readable sentence for every event kind in the closed set', () => {
    for (const kind of AUDIT_KINDS) {
      const summary = renderSummary(kind, { kind: 'user', userId: 'u1' }, { actorEmail: 'ana@rivergate.test', vendorName: 'Harbour Roofing' });
      expect(summary.length, `${kind} has no sentence`).toBeGreaterThan(10);
      expect(summary, `${kind} rendered JSON`).not.toContain('{');
      expect(summary, `${kind} rendered a pointer`).not.toContain('/coverages/');
      expect(summary.endsWith('.'), `${kind} is not a sentence`).toBe(true);
    }
  });

  it('records the three ids that make a comparison reproducible (A3)', async () => {
    await applyTemplate(db.db, { orgId, templateId: 'pm.baseline', actor: actor(), makeDefault: true });
    const vendorId = await createVendor(db.db, { orgId, actor: actor(), vendor: { name: 'Harbour Roofing' } });
    await runComparison(db.db, {
      orgId,
      vendorId,
      extraction: extraction({ coverages: [coverage('general_liability', { exp: '2027-06-30' })] }),
      evaluationDate: '2026-06-01',
      actor: actor(),
    });
    const [event] = await db.db.select().from(auditEvents).where(eq(auditEvents.kind, 'comparison.run'));
    expect(event?.payload).toMatchObject({ requirementSetVersion: 1, engineVersion: expect.any(String) });
    expect(event?.summary).toContain('Harbour Roofing');
  });

  it('records the actor kind for a non-user actor (A1)', async () => {
    await writeAuditEvent(db.db, {
      orgId,
      actor: { kind: 'vendor_link' },
      kind: 'link.upload_received',
      subjectType: 'vendor',
      subjectId: 'ven_x',
      payload: { vendorName: 'Harbour Roofing' },
    });
    const [event] = await db.db.select().from(auditEvents).where(eq(auditEvents.kind, 'link.upload_received'));
    expect(event?.actorKind).toBe('vendor_link');
    expect(event?.actorLabel).toBe('vendor upload link');
    expect(event?.actorUserId).toBeNull();
  });

  it('REFUSES an UPDATE at the database level (A4)', async () => {
    await writeAuditEvent(db.db, { orgId, actor: actor(), kind: 'vendor.created', payload: { vendorName: 'X' } });
    await expectRefusedBy(
      db.db.update(auditEvents).set({ summary: 'rewritten history' }).where(eq(auditEvents.orgId, orgId)),
      /append-only/,
    );
  });

  it('REFUSES a DELETE outside an explicit retention deletion (§7)', async () => {
    await writeAuditEvent(db.db, { orgId, actor: actor(), kind: 'vendor.created', payload: { vendorName: 'X' } });
    await expectRefusedBy(db.db.delete(auditEvents).where(eq(auditEvents.orgId, orgId)), /append-only/);
  });

  it('rolls the parent change back when the audit write fails (A7)', async () => {
    // A summary longer than the CHECK allows is refused by the database. The
    // helper truncates, so this forces the failure at the constraint directly.
    const before = await countTrackedVendors(db.db, orgId);
    await expect(
      db.db.transaction(async (tx) => {
        await createVendor(tx as never, { orgId, actor: actor(), vendor: { name: 'Doomed Vendor' } });
        await tx.insert(auditEvents).values({
          id: newId('audit'),
          orgId,
          actorKind: 'user',
          kind: 'vendor.created',
          summary: 'x'.repeat(501),
        });
      }),
    ).rejects.toThrow();
    expect(await countTrackedVendors(db.db, orgId)).toBe(before);
  });

  it('pages vendor activity newest first, and scopes org activity to the org', async () => {
    const vendorId = await createVendor(db.db, { orgId, actor: actor(), vendor: { name: 'Harbour Roofing' } });
    await archiveVendor(db.db, { orgId, vendorId, actor: actor() });
    const activity = await getVendorActivity(db.db, { orgId, vendorId });
    expect(activity.map((row) => row.kind)).toEqual(['vendor.archived', 'vendor.created']);

    const otherOrg = platformNewId('org');
    await db.db.insert(organisations).values({ id: otherOrg, name: 'Elsewhere', slug: `elsewhere-${otherOrg.slice(-6)}` });
    expect(await getOrgActivity(db.db, { orgId: otherOrg })).toHaveLength(0);
  });
});

describe('org settings', () => {
  it('creates a row on demand and defaults the timezone', async () => {
    const settings = await ensureOrgSettings(db.db, orgId);
    expect(settings.timezone).toBe('America/New_York');
    expect(settings.alternateHolders).toEqual([]);
  });

  it('writes its own audit kind when the entity block changes', async () => {
    await updateOrgSettings(db.db, { orgId, actor: actor(), patch: { entityBlock: 'Rivergate Property Management' } });
    const [event] = await db.db.select().from(auditEvents).where(eq(auditEvents.kind, 'org.entity_block_changed'));
    expect(event).toBeDefined();
  });
});
