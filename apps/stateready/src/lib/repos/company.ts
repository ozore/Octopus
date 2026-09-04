/**
 * M2 — company profile: entities, branches, trades × states. `specs/02`.
 *
 * The most important thing in this file is `setOperatingStates`, and the most
 * important thing about it is that it writes the CROSS PRODUCT of states and
 * trades rather than two independent lists. A company can be electrical in
 * Texas and plumbing in Florida and neither of the other two combinations;
 * storing the two axes separately is the single most likely modelling mistake
 * in the product (`specs/02` §Edge cases) and it would put a Florida electrical
 * rulebook in front of a customer who does no electrical work in Florida.
 */

import { newId } from '@octopus/platform';
import { and, eq, inArray } from 'drizzle-orm';
import type { Db } from '@octopus/platform/db';

import { getCoverage, isTrade, type Coverage } from '../kb/accessors';
import type { Trade } from '../kb/types';
import { companyProfiles, entities, licences, operatingStates } from '../schema';
import { recordAudit } from './audit';

export type OperatingRow = { state: string; trade: Trade; entityId?: string | null; status?: string };

export async function getCompanyProfile(db: Db, orgId: string) {
  const rows = await db.select().from(companyProfiles).where(eq(companyProfiles.orgId, orgId)).limit(1);
  return rows[0] ?? null;
}

export async function saveCompanyProfile(
  db: Db,
  input: { orgId: string; legalName: string; technicianCountBand?: string | null; timezone?: string; actorUserId?: string },
) {
  const legalName = input.legalName.trim();
  if (legalName.length < 2 || legalName.length > 200) {
    throw new Error('Company name must be between 2 and 200 characters.');
  }
  const existing = await getCompanyProfile(db, input.orgId);
  const values = {
    legalName,
    technicianCountBand: input.technicianCountBand ?? null,
    timezone: input.timezone ?? existing?.timezone ?? 'America/Chicago',
    updatedAt: new Date(),
  };
  if (existing) await db.update(companyProfiles).set(values).where(eq(companyProfiles.orgId, input.orgId));
  else await db.insert(companyProfiles).values({ orgId: input.orgId, ...values });

  await recordAudit(db, {
    orgId: input.orgId,
    actorUserId: input.actorUserId ?? null,
    action: existing ? 'company_profile_updated' : 'company_profile_created',
    entityTable: 'company_profiles',
    entityId: input.orgId,
    before: existing ?? null,
    after: values,
  });
  return getCompanyProfile(db, input.orgId);
}

export async function completeOnboarding(db: Db, orgId: string, at = new Date()) {
  await db.update(companyProfiles).set({ completedAt: at }).where(eq(companyProfiles.orgId, orgId));
}

export async function addEntity(
  db: Db,
  input: { orgId: string; name: string; entityType?: string | null; homeState?: string | null; actorUserId?: string },
) {
  const name = input.name.trim();
  if (name.length < 2 || name.length > 200) throw new Error('Entity name must be between 2 and 200 characters.');
  const id = newId('ent');
  await db.insert(entities).values({
    id,
    orgId: input.orgId,
    name,
    entityType: input.entityType ?? null,
    homeState: input.homeState ?? null,
  });
  await recordAudit(db, {
    orgId: input.orgId,
    actorUserId: input.actorUserId ?? null,
    action: 'entity_added',
    entityTable: 'entities',
    entityId: id,
    after: { name },
  });
  return id;
}

export async function listEntities(db: Db, orgId: string) {
  return db.select().from(entities).where(eq(entities.orgId, orgId));
}

/** Archive, never delete: licences reference entities and history is the product. */
export async function archiveEntity(db: Db, input: { orgId: string; entityId: string }) {
  const held = await db
    .select({ id: licences.id })
    .from(licences)
    .where(and(eq(licences.orgId, input.orgId), eq(licences.entityId, input.entityId), eq(licences.status, 'active')));
  if (held.length > 0) {
    return { status: 'refused' as const, activeLicences: held.length };
  }
  await db
    .update(entities)
    .set({ archivedAt: new Date() })
    .where(and(eq(entities.orgId, input.orgId), eq(entities.id, input.entityId)));
  return { status: 'archived' as const, activeLicences: 0 };
}

export async function listOperatingStates(db: Db, orgId: string) {
  return db.select().from(operatingStates).where(eq(operatingStates.orgId, orgId));
}

/**
 * Diff-based: computes adds and removes, writes both, and REFUSES to remove a
 * state that still has active licences — with the count, so the message is an
 * instruction rather than a complaint (`specs/02` §Errors).
 */
export async function setOperatingStates(
  db: Db,
  input: { orgId: string; rows: OperatingRow[]; actorUserId?: string },
): Promise<{ added: number; removed: number; refused: { state: string; trade: string; licences: number }[] }> {
  const current = await listOperatingStates(db, input.orgId);
  const key = (state: string, trade: string, entityId: string | null) => `${entityId ?? ''}|${state}|${trade}`;

  const wanted = new Map<string, OperatingRow>();
  for (const row of input.rows) {
    const state = row.state.toUpperCase();
    if (!isTrade(row.trade)) throw new Error(`Unknown trade ${row.trade}`);
    wanted.set(key(state, row.trade, row.entityId ?? null), { ...row, state });
  }

  const existing = new Map(current.map((r) => [key(r.state, r.trade, r.entityId), r]));

  const refused: { state: string; trade: string; licences: number }[] = [];
  let removed = 0;
  for (const [k, row] of existing) {
    if (wanted.has(k)) continue;
    const held = await db
      .select({ id: licences.id })
      .from(licences)
      .where(
        and(
          eq(licences.orgId, input.orgId),
          eq(licences.state, row.state),
          eq(licences.trade, row.trade),
          eq(licences.status, 'active'),
        ),
      );
    if (held.length > 0) {
      refused.push({ state: row.state, trade: row.trade, licences: held.length });
      continue;
    }
    await db.delete(operatingStates).where(eq(operatingStates.id, row.id));
    removed += 1;
  }

  let added = 0;
  for (const [k, row] of wanted) {
    if (existing.has(k)) continue;
    await db.insert(operatingStates).values({
      id: newId('ops'),
      orgId: input.orgId,
      entityId: row.entityId ?? null,
      state: row.state,
      trade: row.trade,
      status: row.status ?? 'operating',
    });
    added += 1;
  }

  if (added > 0 || removed > 0) {
    await recordAudit(db, {
      orgId: input.orgId,
      actorUserId: input.actorUserId ?? null,
      action: 'operating_states_changed',
      entityTable: 'operating_states',
      after: { added, removed, refused },
    });
  }
  return { added, removed, refused };
}

/**
 * `getCoverage()` — drives every "covered / not yet covered" badge.
 *
 * The covered COUNT is computed from the knowledge base, never from the
 * selection: someone will select all fifty states and the UI must not then
 * claim fifty-state coverage (`specs/02` §Edge cases).
 */
export async function organisationCoverage(db: Db, orgId: string, today: string): Promise<Coverage[]> {
  const rows = await listOperatingStates(db, orgId);
  return rows.map((row) => getCoverage(row.state, row.trade as Trade, today));
}

export async function statesWithLicencesOutsideProfile(db: Db, orgId: string): Promise<string[]> {
  const profile = await listOperatingStates(db, orgId);
  const inProfile = new Set(profile.map((r) => r.state));
  const held = await db
    .select({ state: licences.state })
    .from(licences)
    .where(and(eq(licences.orgId, orgId), eq(licences.status, 'active')));
  return [...new Set(held.map((r) => r.state).filter((s) => !inProfile.has(s)))];
}

export async function entitiesByIds(db: Db, orgId: string, ids: string[]) {
  if (ids.length === 0) return [];
  return db
    .select()
    .from(entities)
    .where(and(eq(entities.orgId, orgId), inArray(entities.id, ids)));
}
