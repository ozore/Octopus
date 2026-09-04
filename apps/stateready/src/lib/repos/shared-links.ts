/**
 * M17 — shared readiness links, and M4's technician licence card. `UX.md` S19
 * and S18; `PERSONA.md` J5 and J10.
 *
 * > *"Answer in five seconds with something I can forward."*
 *
 * This is the cheapest distribution mechanism in the product, because the
 * person a readiness link gets forwarded to is the economic buyer — a general
 * contractor's compliance clerk, a private-equity diligence analyst, the GM of
 * the company being acquired. Every one of them opens it without an account,
 * usually on a phone, often to print it.
 *
 * FOUR PROPERTIES, ALL STRUCTURAL:
 *
 *  1. **The token is a random 24-byte secret, not a ULID.** `newId` is
 *     time-ordered by design, which is exactly the property a bearer token must
 *     not have: two links minted in the same minute would share a prefix, and
 *     the id would leak when the organisation signed up. `randomBytes` it is.
 *  2. **Revocation answers, it does not 404.** A revoked link renders "this
 *     link has been turned off" — the holder is usually a GC who needs to know
 *     whether to ask for a new one, and a 404 tells them nothing.
 *  3. **A link carries no personal data beyond what its own surface shows.**
 *     The readiness link shows states, counts and dates; the technician card
 *     shows the credential its holder is already handing to a stranger in a
 *     truck. Neither carries an email, a phone number or an address, because
 *     the schema has none (`BACKLOG.md` NEVER list).
 *  4. **Everything a link renders is derived at READ time from the live
 *     tables.** Nothing is snapshotted into the row, so revoking a licence,
 *     renewing it or archiving a technician is reflected in the forwarded page
 *     immediately. A stale forwarded artefact is worse than no artefact.
 */

import { randomBytes } from 'node:crypto';

import { newId } from '@octopus/platform';
import { track } from '@octopus/platform/events';
import { and, desc, eq, isNull } from 'drizzle-orm';
import type { Db } from '@octopus/platform/db';

import { getKbRecord } from '../kb/accessors';
import { daysBetween } from '../rules/dates';
import { deadlines, licences, sharedLinks, technicians, type SharedLink } from '../schema';
import { buildDashboard, statusForDeadline, worseOf, type DashboardModel, type Status } from './dashboard';

export type SharedLinkKind = 'readiness' | 'technician_card';

/** 32 url-safe characters of randomness. Not sortable, not guessable. */
export function newShareToken(): string {
  return randomBytes(24).toString('base64url');
}

export async function createSharedLink(
  db: Db,
  input: {
    orgId: string;
    kind: SharedLinkKind;
    subjectId?: string | null;
    label?: string | null;
    createdByUserId?: string | null;
  },
): Promise<SharedLink> {
  if (input.kind === 'technician_card' && !input.subjectId) {
    throw new Error('A technician card needs a technician.');
  }
  const token = newShareToken();
  const id = newId('shl');
  await db.insert(sharedLinks).values({
    id,
    orgId: input.orgId,
    kind: input.kind,
    token,
    subjectId: input.subjectId ?? null,
    label: input.label ?? null,
    createdByUserId: input.createdByUserId ?? null,
  });
  await track(db, {
    name: 'shared_link_created',
    orgId: input.orgId,
    ...(input.createdByUserId ? { userId: input.createdByUserId } : {}),
    props: { kind: input.kind },
  });
  const rows = await db.select().from(sharedLinks).where(eq(sharedLinks.id, id)).limit(1);
  return rows[0]!;
}

export async function revokeSharedLink(
  db: Db,
  input: { orgId: string; linkId: string; actorUserId?: string | null },
): Promise<void> {
  await db
    .update(sharedLinks)
    .set({ revokedAt: new Date() })
    .where(and(eq(sharedLinks.id, input.linkId), eq(sharedLinks.orgId, input.orgId)));
  await track(db, { name: 'shared_link_revoked', orgId: input.orgId });
}

export async function listSharedLinks(db: Db, orgId: string, kind?: SharedLinkKind) {
  const where = kind
    ? and(eq(sharedLinks.orgId, orgId), eq(sharedLinks.kind, kind))
    : eq(sharedLinks.orgId, orgId);
  return db.select().from(sharedLinks).where(where).orderBy(desc(sharedLinks.createdAt));
}

/** The live readiness link for an organisation, minted on first ask. */
export async function ensureReadinessLink(
  db: Db,
  input: { orgId: string; createdByUserId?: string | null },
): Promise<SharedLink> {
  const existing = await db
    .select()
    .from(sharedLinks)
    .where(
      and(eq(sharedLinks.orgId, input.orgId), eq(sharedLinks.kind, 'readiness'), isNull(sharedLinks.revokedAt)),
    )
    .orderBy(desc(sharedLinks.createdAt))
    .limit(1);
  if (existing[0]) return existing[0];
  return createSharedLink(db, {
    orgId: input.orgId,
    kind: 'readiness',
    createdByUserId: input.createdByUserId ?? null,
  });
}

export type ResolvedLink =
  | { state: 'missing' }
  | { state: 'revoked'; link: SharedLink }
  | { state: 'ok'; link: SharedLink };

/**
 * Resolve a bearer token. A token that names nothing and a token that names a
 * revoked row are DIFFERENT answers, deliberately: the second one is a fact the
 * holder needs.
 */
export async function resolveSharedLink(db: Db, token: string): Promise<ResolvedLink> {
  if (!token) return { state: 'missing' };
  const rows = await db.select().from(sharedLinks).where(eq(sharedLinks.token, token)).limit(1);
  const link = rows[0];
  if (!link) return { state: 'missing' };
  if (link.revokedAt) return { state: 'revoked', link };
  return { state: 'ok', link };
}

export async function recordSharedLinkView(db: Db, link: SharedLink): Promise<void> {
  await db
    .update(sharedLinks)
    .set({ lastViewedAt: new Date(), viewCount: link.viewCount + 1 })
    .where(eq(sharedLinks.id, link.id));
  await track(db, { name: 'shared_link_viewed', orgId: link.orgId, props: { kind: link.kind } });
}

// ---------------------------------------------------------------------------
// The two surfaces
// ---------------------------------------------------------------------------

export type ReadinessRow = {
  state: string;
  stateName: string;
  status: Status;
  holder: string;
  what: string;
  dueOn: string | null;
  days: number | null;
  source: 'derived' | 'entered' | null;
  citationUrl: string | null;
  citationLastVerified: string | null;
  needsHumanCheck: boolean;
};

export type ReadinessView = {
  organisationName: string;
  model: DashboardModel;
  /**
   * The grouped status list the phone gets instead of 51 tiles, and the desktop
   * gets *as well as* them — the grid is never the only route to its data.
   * Ordered LAPSED → AT RISK → READY → NOT TRACKED (`UX.md` §7).
   */
  rows: ReadinessRow[];
  generatedOn: string;
};

const GROUP_ORDER: Record<Status, number> = { LAPSED: 0, 'AT RISK': 1, READY: 2, 'NOT TRACKED': 3 };

export async function buildReadinessView(
  db: Db,
  input: { orgId: string; organisationName: string },
  today: string,
): Promise<ReadinessView> {
  const [model, licenceRows, deadlineRows, technicianRows] = await Promise.all([
    buildDashboard(db, input.orgId, today),
    db.select().from(licences).where(and(eq(licences.orgId, input.orgId), eq(licences.status, 'active'))),
    db
      .select()
      .from(deadlines)
      .where(and(eq(deadlines.orgId, input.orgId), isNull(deadlines.supersededAt))),
    db.select().from(technicians).where(eq(technicians.orgId, input.orgId)),
  ]);

  const technicianById = new Map(technicianRows.map((t) => [t.id, t]));
  const byLicence = new Map<string, typeof deadlineRows>();
  for (const row of deadlineRows) {
    if (!row.licenceId) continue;
    byLicence.set(row.licenceId, [...(byLicence.get(row.licenceId) ?? []), row]);
  }

  const rows: ReadinessRow[] = [];
  for (const licence of licenceRows) {
    const record = getKbRecord(licence.state, licence.trade);
    const licenceType = record?.licence_types.find((lt) => lt.licence_type_id === licence.kbLicenceTypeId);
    const technician = licence.technicianId ? technicianById.get(licence.technicianId) : undefined;
    const holder = technician ? `${technician.firstName} ${technician.lastName}`.trim() : 'Company';
    const own = byLicence.get(licence.id) ?? [];

    if (own.length === 0) {
      rows.push({
        state: licence.state,
        stateName: record?.state_name ?? licence.state,
        status: 'NOT TRACKED',
        holder,
        what: licenceType?.name ?? licence.customTypeName ?? `${licence.trade} licence`,
        dueOn: null,
        days: null,
        source: null,
        citationUrl: null,
        citationLastVerified: null,
        needsHumanCheck: false,
      });
      continue;
    }

    for (const deadline of own) {
      rows.push({
        state: licence.state,
        stateName: record?.state_name ?? licence.state,
        status: statusForDeadline(deadline.dueOn, today),
        holder,
        what:
          (deadline.kind === 'ce'
            ? 'Continuing education'
            : deadline.kind === 'qualifier_replacement'
              ? 'Replacement qualifier'
              : 'Renewal') +
          ' — ' +
          (licenceType?.name ?? licence.customTypeName ?? `${licence.trade} licence`),
        dueOn: deadline.dueOn,
        days: daysBetween(today, deadline.dueOn),
        source: deadline.source as 'derived' | 'entered',
        citationUrl: deadline.citationUrl,
        citationLastVerified: deadline.citationLastVerified,
        needsHumanCheck: deadline.needsHumanCheck,
      });
    }
  }

  rows.sort(
    (a, b) =>
      GROUP_ORDER[a.status] - GROUP_ORDER[b.status] ||
      (a.dueOn ?? '9999-99-99').localeCompare(b.dueOn ?? '9999-99-99') ||
      a.state.localeCompare(b.state),
  );

  return { organisationName: input.organisationName, model, rows, generatedOn: today };
}

export type CardCredential = {
  state: string;
  stateName: string;
  trade: string;
  typeName: string;
  licenceNumber: string | null;
  status: Status;
  expiresOn: string | null;
  expirySource: string;
  boardName: string | null;
  boardUrl: string | null;
  /** Where a general contractor checks us: the board's own licence search. */
  verifyUrl: string | null;
};

export type TechnicianCardView = {
  organisationName: string;
  technicianName: string;
  worstStatus: Status;
  credentials: CardCredential[];
  generatedOn: string;
};

export async function buildTechnicianCard(
  db: Db,
  input: { orgId: string; technicianId: string; organisationName: string },
  today: string,
): Promise<TechnicianCardView | null> {
  const technicianRows = await db
    .select()
    .from(technicians)
    .where(and(eq(technicians.id, input.technicianId), eq(technicians.orgId, input.orgId)))
    .limit(1);
  const technician = technicianRows[0];
  if (!technician) return null;

  const [licenceRows, deadlineRows] = await Promise.all([
    db
      .select()
      .from(licences)
      .where(and(eq(licences.orgId, input.orgId), eq(licences.technicianId, input.technicianId))),
    db
      .select()
      .from(deadlines)
      .where(and(eq(deadlines.orgId, input.orgId), isNull(deadlines.supersededAt))),
  ]);

  const credentials: CardCredential[] = [];
  let worst: Status = 'READY';
  for (const licence of licenceRows) {
    if (licence.status === 'archived') continue;
    const record = getKbRecord(licence.state, licence.trade);
    const licenceType = record?.licence_types.find((lt) => lt.licence_type_id === licence.kbLicenceTypeId);
    const board =
      record?.boards.find((b) => b.board_id === licenceType?.board_id) ?? record?.boards[0] ?? null;
    const own = deadlineRows.filter((d) => d.licenceId === licence.id);
    let status: Status = own.length === 0 ? 'NOT TRACKED' : 'READY';
    for (const deadline of own) status = worseOf(status, statusForDeadline(deadline.dueOn, today));
    worst = worseOf(worst, status);

    credentials.push({
      state: licence.state,
      stateName: record?.state_name ?? licence.state,
      trade: licence.trade,
      typeName: licenceType?.name ?? licence.customTypeName ?? `${licence.trade} licence`,
      licenceNumber: licence.licenceNumber,
      status,
      expiresOn: licence.expiresOn,
      expirySource: licence.expirySource,
      boardName: board?.name ?? null,
      boardUrl: board?.url ?? null,
      verifyUrl: board?.licence_search_url ?? board?.url ?? null,
    });
  }

  return {
    organisationName: input.organisationName,
    technicianName: `${technician.firstName} ${technician.lastName}`.trim(),
    worstStatus: worst,
    credentials,
    generatedOn: today,
  };
}
