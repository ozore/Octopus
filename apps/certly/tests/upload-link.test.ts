/**
 * M8 — the branded, no-account upload link. `specs/08` §7, §11.
 *
 * The two tests that matter most are the ones a reviewer cannot do by eye:
 *
 *  - **the data projection** (A9, §6). The page may render the customer's org
 *    name, the vendor name, the requirement summary and what expired, and
 *    NOTHING else. The test serialises the props and asserts the key set,
 *    because the failure mode is somebody passing a whole row into a component
 *    "just for now".
 *  - **invalid and never-issued are byte-identical** (A5b, MJ-14), while
 *    expired and revoked deliberately differ and name the org — a bare 404 on a
 *    real link an agent holds reads as broken and generates a support email.
 */
import { eq } from 'drizzle-orm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { newId as platformNewId } from '@octopus/platform';
import { hashToken } from '@octopus/platform/auth';
import { organisations, users } from '@octopus/platform/db';
import { createTestDb } from '@octopus/platform/testing';

import { appMigrationsDir } from '../src/lib/db';
import { newId } from '../src/lib/ids';
import { requirementSummary } from '../src/lib/reminders';
import { applyTemplate, loadRequirementSet, resolveRequirementSetId } from '../src/lib/repos';
import {
  LINK_MIN_DAYS,
  LINK_PAGE_KEYS,
  createUploadLink,
  linkExpiry,
  projectLink,
  recordLinkOpen,
  resolveUploadLink,
  revokeUploadLink,
} from '../src/lib/repos/upload-links';
import { uploadLinks, vendors } from '../src/lib/schema';

let db: Awaited<ReturnType<typeof createTestDb>>;
let orgId: string;
let userId: string;
let vendorId: string;

const ORG_NAME = 'Rivergate Property Management';

beforeEach(async () => {
  db = await createTestDb([appMigrationsDir()]);
  orgId = platformNewId('org');
  userId = platformNewId('usr');
  await db.db.insert(organisations).values({ id: orgId, name: ORG_NAME, slug: `rivergate-${orgId.slice(-6)}` });
  await db.db.insert(users).values({ id: userId, email: `ana+${orgId.slice(-6)}@rivergate.test` });
  vendorId = newId('vendor');
  await db.db.insert(vendors).values({ id: vendorId, orgId, name: 'Harbour Roofing' });
});

afterEach(async () => {
  await db.close();
});

describe('specs/08 §4 — the token', () => {
  it('stores only a hash; the raw token is returned once', async () => {
    const link = await createUploadLink(db.db, { orgId, vendorId, createdFor: 'manual' });
    expect(link.token.length).toBeGreaterThanOrEqual(40);
    const [row] = await db.db.select().from(uploadLinks).where(eq(uploadLinks.id, link.id));
    expect(row?.tokenHash).toBe(hashToken(link.token));
    // The raw token appears nowhere in the row.
    expect(JSON.stringify(row)).not.toContain(link.token);
  });

  it('expires at the certificate expiry + 45 days, never sooner than 30 days out', () => {
    const now = new Date('2026-06-01T00:00:00Z');
    expect(linkExpiry('2026-12-01', now).toISOString().slice(0, 10)).toBe('2027-01-15');
    // A certificate that expired yesterday is still inside expiry + 45, so it
    // gets 15 July, not the floor.
    expect(linkExpiry('2026-05-31', now).toISOString().slice(0, 10)).toBe('2026-07-15');
    // The floor bites only once expiry + 45 has itself gone by: a certificate
    // that lapsed in January still gets thirty days, because the agent needs
    // time to act and the link is the only way they can.
    const floor = linkExpiry('2026-01-01', now);
    expect(floor.getTime()).toBe(now.getTime() + LINK_MIN_DAYS * 86_400_000);
  });

  it('A5b: a never-issued token and a malformed one produce the SAME answer', async () => {
    const neverIssued = await resolveUploadLink(db.db, 'a'.repeat(43));
    const malformed = await resolveUploadLink(db.db, 'short');
    expect(neverIssued).toEqual(malformed);
    expect(neverIssued.state).toBe('invalid');
    expect(neverIssued.orgName).toBeNull();
  });

  it('A4 / A5: expired and revoked NAME the org; precedence is revoked over expired', async () => {
    const link = await createUploadLink(db.db, { orgId, vendorId, createdFor: 'manual' });
    await db.db
      .update(uploadLinks)
      .set({ expiresAt: new Date('2020-01-01T00:00:00Z') })
      .where(eq(uploadLinks.id, link.id));
    const expired = await resolveUploadLink(db.db, link.token);
    expect(expired.state).toBe('expired');
    expect(expired.orgName).toBe(ORG_NAME);

    await revokeUploadLink(db.db, { orgId, linkId: link.id, actor: { kind: 'user', userId } });
    const revoked = await resolveUploadLink(db.db, link.token);
    expect(revoked.state).toBe('revoked');
    expect(revoked.orgName).toBe(ORG_NAME);
  });

  it('A6: an archived vendor makes the request no longer active', async () => {
    const link = await createUploadLink(db.db, { orgId, vendorId, createdFor: 'manual' });
    await db.db.update(vendors).set({ archivedAt: new Date() }).where(eq(vendors.id, vendorId));
    expect((await resolveUploadLink(db.db, link.token)).state).toBe('archived');
  });

  it('A7: three people open one link, all three can upload, and useCount is 3', async () => {
    const link = await createUploadLink(db.db, { orgId, vendorId, createdFor: 'manual' });
    for (let open = 0; open < 3; open += 1) {
      const resolved = await resolveUploadLink(db.db, link.token);
      expect(resolved.state).toBe('valid');
      await recordLinkOpen(db.db, link.id);
    }
    const [row] = await db.db.select().from(uploadLinks).where(eq(uploadLinks.id, link.id));
    expect(row?.useCount).toBe(3);
    expect(row?.firstOpenedAt).toBeTruthy();
    expect(row?.lastOpenedAt).toBeTruthy();
  });

  it('security: a token belonging to one org cannot address another org’s vendor', async () => {
    const other = platformNewId('org');
    await db.db.insert(organisations).values({ id: other, name: 'Somebody Else', slug: `other-${other.slice(-6)}` });
    const link = await createUploadLink(db.db, { orgId, vendorId, createdFor: 'manual' });
    const resolved = await resolveUploadLink(db.db, link.token);
    // The link resolves to ITS OWN org and vendor and to nothing else; there is
    // no parameter on the page that could point it elsewhere.
    expect(resolved.orgId).toBe(orgId);
    expect(resolved.vendorId).toBe(vendorId);
    expect(resolved.orgId).not.toBe(other);
  });

  it('a revoke from another org does nothing', async () => {
    const other = platformNewId('org');
    await db.db.insert(organisations).values({ id: other, name: 'Somebody Else', slug: `other2-${other.slice(-6)}` });
    const link = await createUploadLink(db.db, { orgId, vendorId, createdFor: 'manual' });
    const revoked = await revokeUploadLink(db.db, { orgId: other, linkId: link.id, actor: { kind: 'system' } });
    expect(revoked).toBe(false);
    expect((await resolveUploadLink(db.db, link.token)).state).toBe('valid');
  });
});

describe('specs/08 §6 and A9 — what the page is allowed to know', () => {
  it('the serialised props carry the allowlist and nothing else', async () => {
    await applyTemplate(db.db, {
      orgId,
      templateId: 'pm.baseline',
      actor: { kind: 'user', userId },
      makeDefault: true,
    });
    const setId = await resolveRequirementSetId(db.db, orgId, vendorId);
    const set = setId ? await loadRequirementSet(db.db, orgId, setId) : null;
    const link = await createUploadLink(db.db, { orgId, vendorId, createdFor: 'reminder:T-30' });
    const resolved = await resolveUploadLink(db.db, link.token);

    const props = projectLink({
      resolved,
      requirements: set ? requirementSummary(set, ORG_NAME) : [],
      expiryDate: '2026-12-01',
      expiredCoverages: ['General liability'],
    });

    expect(Object.keys(props).sort()).toEqual([...LINK_PAGE_KEYS].sort());
    const serialised = JSON.stringify(props);
    // Nothing about the customer's people, plan, other vendors or documents.
    for (const forbidden of [orgId, vendorId, userId, 'rivergate.test', 'tokenHash', 'plan', 'price']) {
      expect(serialised, `the link page leaked ${forbidden}`).not.toContain(forbidden);
    }
    expect(props.orgName).toBe(ORG_NAME);
    expect(props.vendorName).toBe('Harbour Roofing');
    expect(props.requirements.length).toBeGreaterThan(0);
    expect(props.canUpload).toBe(true);
  });

  it('an invalid token’s props name nobody and offer no upload', async () => {
    const resolved = await resolveUploadLink(db.db, 'nonsense');
    const props = projectLink({ resolved, requirements: [], expiryDate: null, expiredCoverages: [] });
    expect(props.orgName).toBeNull();
    expect(props.vendorName).toBeNull();
    expect(props.canUpload).toBe(false);
    expect(props.requirements).toEqual([]);
  });

  it('the requirement summary is plain language, not a dump of form numbers', async () => {
    await applyTemplate(db.db, {
      orgId,
      templateId: 'pm.baseline',
      actor: { kind: 'user', userId },
      makeDefault: true,
    });
    const setId = await resolveRequirementSetId(db.db, orgId, vendorId);
    const set = await loadRequirementSet(db.db, orgId, setId as string);
    const lines = requirementSummary(set!, ORG_NAME);
    const text = lines.map((line) => line.text).join('\n');

    expect(text).toContain('General liability, at least $1,000,000 each occurrence');
    expect(text).toContain(`${ORG_NAME} named as additional insured`);
    // One form number named per row — an agent reading six reads none.
    expect(text).toMatch(/CG 20 \d\d or equivalent/);
    expect(text).not.toContain('endorsement_key');
    expect(text).not.toContain('undefined');
  });
});
