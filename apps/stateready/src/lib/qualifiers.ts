/**
 * M16 — the qualifier watch. `UX.md` S15, `BACKLOG.md` M16, `PERSONA.md` J6,
 * `IDENTITY.md` §2 **UA3**.
 *
 * The screen no competitor has, and the one place in the product where a clock
 * starts from an **HR event** rather than from a date on a card. A resignation
 * email is not a licensing event to anyone's inbox; it is one to the board.
 *
 * THE ENGINE ALREADY DOES THE ARITHMETIC. `derive()` emits a
 * `qualifier_replacement` deadline from `business_entity.change_notification_deadline`
 * whenever `licences.qualifierDisassociatedOn` is set, in days or in **business
 * days** (Texas electrical's unit, and the one that catches people out: thirty
 * business days is six weeks, not a month). Nothing here re-derives anything —
 * this module reads the deadline rows the derivation service wrote and shapes
 * them for one screen and for the alert schedule.
 *
 * THREE HONESTY RULES, and they are why this file exists rather than a page:
 *
 *  1. **The 75/45/15/5 cadence is a DESIGN JUDGMENT, not a sourced convention**
 *     (`UX.md` §9.2, `identity/CLAUDE.md` A3). The standard 90/60/30/7 gates
 *     cannot fit inside a window that is itself 90 days long. The screen says
 *     so, in those words, beside the cadence. It is the only cadence in the
 *     product that is ours rather than a board's, and the customer is told.
 *  2. **A state whose board publishes no replacement deadline gets a REFUSAL,
 *     never a default.** There is no "assume 30 days": `qualifierClockFor`
 *     returns `published: false` and the screen renders `NotYetVerified` with
 *     the board's own link. Five of the nine committed records are in exactly
 *     that position.
 *  3. **California is the reason the screen exists and is NOT a state we
 *     cover.** `QUALIFIER_REFERENCE` carries CSLB's sentence with its URL and
 *     the date it was read, labelled as a reference we have read and not as
 *     coverage we hold — because the knowledge base holds no California record
 *     and this product does not derive a customer's date from a page that is
 *     not in it. When California lands, the clock starts working for a
 *     Californian licence with no change to this file.
 */

import { and, eq, isNull } from 'drizzle-orm';
import type { Db } from '@octopus/platform/db';

import { getKbRecord } from './kb/accessors';
import { assessValue } from './rules/assess';
import { daysBetween } from './rules/dates';
import { deadlines, licences, technicians, entities, type Licence } from './schema';
import { statusForDeadline, type Status } from './repos/dashboard';

/**
 * The qualifier cadence. **Ours, not a board's.**
 *
 * Deliberately NOT in `cron.ts`: `ALERT_OFFSETS` is the renewal schedule that
 * `specs/06` sources and that `AT_RISK_DAYS` is read from, and putting an
 * invented cadence beside a sourced one is how the invented one stops being
 * labelled. `selectDueOffsets` already takes the offsets as an argument, so the
 * drain passes this set for `kind = 'qualifier_replacement'` deadlines and the
 * standard set for everything else.
 */
export const QUALIFIER_ALERT_OFFSETS = [75, 45, 15, 5] as const;

/** Rendered verbatim beside the cadence, everywhere it appears. */
export const QUALIFIER_CADENCE_NOTE =
  'These four gates are our design judgment, not a rule any board publishes: the standard ' +
  '90/60/30/7 schedule does not fit inside a replacement window that is itself 90 days long. ' +
  'The deadline itself comes from the board and carries its own citation.';

/**
 * The rule that made this screen exist. A reference we have read, not coverage
 * we hold — `covered: false` says so and the screen renders it that way.
 */
export const QUALIFIER_REFERENCE = {
  state: 'CA',
  stateName: 'California',
  board: 'Contractors State License Board',
  quote:
    'The licensee must replace the qualifier within 90 days of the disassociation date. Failure to ' +
    'replace the qualifier within 90 days results in the automatic suspension of the license or ' +
    'removal of the classification.',
  statute: 'B&P §§ 7076, 7068.2, 7083',
  sourceUrl: 'https://www2.cslb.ca.gov/Resources/FormsAndApplications/DisassociationNotice.pdf',
  lastVerified: '2026-09-03',
  /** The knowledge base holds no California record. We do not start this clock. */
  covered: false,
} as const;

export type QualifierClock = {
  licence: Licence;
  holderName: string;
  stateName: string;
  /** The licence type's name, or the customer's own words for an uncovered type. */
  typeName: string;
  disassociatedOn: string | null;
  /** True when the board publishes a replacement deadline we could establish. */
  published: boolean;
  dueOn: string | null;
  daysRemaining: number | null;
  status: Status | null;
  /** The window and its unit, as the board states them. */
  window: { value: number; unit: string } | null;
  /** The board's own sentence — the statutory consequence, on the row. */
  evidence: string | null;
  citationUrl: string | null;
  citationLastVerified: string | null;
  confidence: 'high' | 'medium' | 'low' | null;
  needsHumanCheck: boolean;
  notes: string[];
  /** Where to ask, when we could not establish the deadline. */
  boardName: string | null;
  boardUrl: string | null;
  /** Why we could not put a date on it. Null when we could. */
  refusal: string | null;
};

/**
 * What the board publishes about replacing a qualifier in this state and trade,
 * whether or not a clock is running. Pure: no database, no clock.
 */
export function qualifierRuleFor(state: string, trade: string, today: string) {
  const record = getKbRecord(state, trade);
  if (!record) {
    return {
      covered: false,
      published: false,
      window: null,
      assessment: null,
      boardName: null,
      boardUrl: null,
      refusal: `We do not hold ${trade} rules for ${state} yet, so we cannot start a replacement clock from a board's own page.`,
    };
  }
  const value = record.business_entity.change_notification_deadline;
  const assessment = assessValue(value, today);
  const board = record.boards[0] ?? null;
  const published = assessment.usable && typeof value?.value === 'number';
  return {
    covered: true,
    published,
    window: published ? { value: value!.value as number, unit: value!.unit ?? 'days' } : null,
    assessment,
    boardName: board?.name ?? null,
    boardUrl: board?.url ?? null,
    refusal: published
      ? null
      : `${record.state_name}'s board does not publish a deadline for naming a replacement qualifier on any page we have read.`,
  };
}

/**
 * Every licence with a qualifier flag raised, with its clock or its refusal.
 *
 * Rows come back worst-first: a clock that has run out sorts above one that is
 * still running, and a licence we cannot put a date on sorts last, because it
 * is the one the customer has to act on by ringing the board.
 */
export async function buildQualifierWatch(db: Db, orgId: string, today: string): Promise<QualifierClock[]> {
  const [licenceRows, deadlineRows, technicianRows, entityRows] = await Promise.all([
    db.select().from(licences).where(and(eq(licences.orgId, orgId), eq(licences.status, 'active'))),
    db
      .select()
      .from(deadlines)
      .where(and(eq(deadlines.orgId, orgId), isNull(deadlines.supersededAt))),
    db.select().from(technicians).where(eq(technicians.orgId, orgId)),
    db.select().from(entities).where(eq(entities.orgId, orgId)),
  ]);

  const technicianById = new Map(technicianRows.map((t) => [t.id, t]));
  const entityById = new Map(entityRows.map((e) => [e.id, e]));
  const clockByLicence = new Map(
    deadlineRows.filter((d) => d.kind === 'qualifier_replacement' && d.licenceId).map((d) => [d.licenceId!, d]),
  );

  const rows: QualifierClock[] = [];
  for (const licence of licenceRows) {
    if (!licence.qualifierDisassociatedOn) continue;
    const rule = qualifierRuleFor(licence.state, licence.trade, today);
    const record = getKbRecord(licence.state, licence.trade);
    const licenceType = record?.licence_types.find((lt) => lt.licence_type_id === licence.kbLicenceTypeId);
    const clock = clockByLicence.get(licence.id) ?? null;

    const technician = licence.technicianId ? technicianById.get(licence.technicianId) : undefined;
    const entity = licence.entityId ? entityById.get(licence.entityId) : undefined;

    rows.push({
      licence,
      holderName: technician
        ? `${technician.firstName} ${technician.lastName}`.trim()
        : (entity?.name ?? 'the company'),
      stateName: record?.state_name ?? licence.state,
      typeName: licenceType?.name ?? licence.customTypeName ?? `${licence.trade} licence`,
      disassociatedOn: licence.qualifierDisassociatedOn,
      published: clock !== null,
      dueOn: clock?.dueOn ?? null,
      daysRemaining: clock ? daysBetween(today, clock.dueOn) : null,
      status: clock ? statusForDeadline(clock.dueOn, today) : null,
      window: rule.window,
      evidence: clock?.citationText ?? rule.assessment?.citation.text ?? null,
      citationUrl: clock?.citationUrl ?? null,
      citationLastVerified: clock?.citationLastVerified ?? null,
      confidence: (clock?.confidence as 'high' | 'medium' | 'low' | undefined) ?? null,
      needsHumanCheck: clock?.needsHumanCheck ?? false,
      notes: (clock?.notes as string[] | undefined) ?? [],
      boardName: rule.boardName,
      boardUrl: rule.boardUrl,
      refusal: clock ? null : rule.refusal,
    });
  }

  const rank = (r: QualifierClock) =>
    r.dueOn === null ? 3 : r.status === 'LAPSED' ? 0 : r.status === 'AT RISK' ? 1 : 2;
  return rows.sort((a, b) => rank(a) - rank(b) || (a.dueOn ?? '9999').localeCompare(b.dueOn ?? '9999'));
}
