/**
 * PROJECTS AND PINS — J4's six required fields, and the pin that follows from them.
 *
 * AUTHORITY: `USER_JOURNEY.md` §4.1 (the six fields and the three refinements),
 * §4.2 (find-my-WD, and the L2 STALE branch that saves the project unpinned),
 * §4.3 (the union-group warning at pin time), §4.4 (the contract-value band, with
 * no default in either direction), §4.5 (the unhappy paths, including the funding
 * source that ends the flow honestly), §8.4 (the contract lock),
 * `ARCHITECTURE.md` §6.2 (the pin is immutable; a re-pin is a new row).
 *
 * ===========================================================================
 * THE THREE RULES ENCODED HERE
 *
 * 1. **The band has no default and never will.** `contract_value_band` is NOT NULL
 *    with no `.default()` in the schema, and this module has no code path that
 *    supplies one. `unknown` is a real answer — the customer was asked and declined
 *    — and it is the value that yields P-B.
 * 2. **A pin is never updated.** `repin` INSERTs. The old row stays, forever, which
 *    is what makes "what did we say in August" answerable in eighteen months.
 * 3. **At L2 STALE we do not create a pin.** The project saves in a pinless state
 *    with the exact last-successful-check timestamp shown (P-C). She is not blocked
 *    from using the product; she is blocked from us asserting a revision-of-record
 *    we have not verified — fail closed on the claim, not the artifact (ADR-006).
 */

import { sql } from 'drizzle-orm';

import { suppressesNewRateAssertions } from '@/corpus';
import { rowsOf, type Db, type Tx } from '@/db';
import { newId } from '@/platform/ids';
import { declinedConclusion, narrowedClaim, ok, refuse, type Result } from '@/lib/result';
import {
  isoDate,
  wdNumber as toWdNumber,
  type ContractValueBand,
  type FreshnessState,
  type IsoDate,
  type WdNumber,
} from '@/lib/types';

import { STATE_ONLY_REFUSAL } from './copy';
import { activeDetermination, corpusState, newerRevisionThan, promotedSnapshot } from './mirror';

// ===========================================================================
// Row shapes
// ===========================================================================

/** The two closed lists live in `copy.ts` because the setup form is a client
 *  component; re-exported here so a server caller has one import for the domain. */
export {
  CONSTRUCTION_TYPES,
  FUNDING_SOURCES,
  type ConstructionType,
  type FundingSource,
} from './copy';

export interface ProjectRecord {
  readonly id: string;
  readonly name: string;
  readonly stateCode: string;
  readonly countyName: string;
  readonly constructionType: string;
  readonly fundingSource: string;
  readonly contractValueBand: ContractValueBand;
  readonly bandAssertedAt: Date;
  readonly awardDate: IsoDate | null;
  readonly contractNumber: string | null;
  readonly primeName: string | null;
  readonly dirProjectId: string | null;
  readonly contractorPwcr: string | null;
  readonly wh347Layout: 'wh347_rev_2025_01' | 'wh347_legacy';
  readonly workweekStartDay: number;
  /** `null` is neither yes nor no — §8.4's "default unset". */
  readonly lockedAtAward: boolean | null;
  readonly lockAssertedAt: Date | null;
  readonly createdAt: Date;
}

export interface PinRecord {
  readonly id: string;
  readonly wdNumber: WdNumber;
  readonly revision: number;
  readonly wdPublishedDate: IsoDate;
  readonly snapshotId: number;
  readonly pinnedAt: Date;
  readonly freshnessCheckedAt: Date | null;
  readonly freshnessState: FreshnessState;
}

interface ProjectDbRow {
  readonly id: string;
  readonly name: string;
  readonly state_code: string;
  readonly county_name: string;
  readonly construction_type: string;
  readonly funding_source: string;
  readonly contract_value_band: ContractValueBand;
  readonly band_asserted_at: string | Date;
  readonly award_date: string | Date | null;
  readonly contract_number: string | null;
  readonly prime_name: string | null;
  readonly dir_project_id: string | null;
  readonly contractor_pwcr: string | null;
  readonly wh347_layout: 'wh347_rev_2025_01' | 'wh347_legacy';
  readonly workweek_start_day: number | string;
  readonly wd_revision_locked_at_award: boolean | null;
  readonly lock_asserted_at: string | Date | null;
  readonly created_at: string | Date;
}

function toProject(row: ProjectDbRow): ProjectRecord {
  return {
    id: row.id,
    name: row.name,
    stateCode: row.state_code,
    countyName: row.county_name,
    constructionType: row.construction_type,
    fundingSource: row.funding_source,
    contractValueBand: row.contract_value_band,
    bandAssertedAt: new Date(row.band_asserted_at),
    awardDate: row.award_date === null ? null : isoDate(String(row.award_date).slice(0, 10)),
    contractNumber: row.contract_number,
    primeName: row.prime_name,
    dirProjectId: row.dir_project_id,
    contractorPwcr: row.contractor_pwcr,
    wh347Layout: row.wh347_layout,
    workweekStartDay: Number(row.workweek_start_day),
    lockedAtAward: row.wd_revision_locked_at_award,
    lockAssertedAt: row.lock_asserted_at === null ? null : new Date(row.lock_asserted_at),
    createdAt: new Date(row.created_at),
  };
}

const PROJECT_COLUMNS = sql`
  id, name, state_code, county_name, construction_type, funding_source,
  contract_value_band, band_asserted_at, award_date, contract_number, prime_name,
  dir_project_id, contractor_pwcr, wh347_layout, workweek_start_day,
  wd_revision_locked_at_award, lock_asserted_at, created_at
`;

// ===========================================================================
// Reads
// ===========================================================================

export async function listProjects(tx: Tx): Promise<readonly ProjectRecord[]> {
  return rowsOf<ProjectDbRow>(
    await tx.execute(sql`SELECT ${PROJECT_COLUMNS} FROM projects WHERE archived_at IS NULL ORDER BY created_at DESC`),
  ).map(toProject);
}

export async function readProject(tx: Tx, projectId: string): Promise<ProjectRecord | null> {
  const row = rowsOf<ProjectDbRow>(
    await tx.execute(sql`SELECT ${PROJECT_COLUMNS} FROM projects WHERE id = ${projectId}::uuid`),
  )[0];
  return row ? toProject(row) : null;
}

interface PinDbRow {
  readonly id: string;
  readonly wd_number: string;
  readonly revision: number | string;
  readonly wd_published_date: string | Date;
  readonly snapshot_id: number | string;
  readonly pinned_at: string | Date;
  readonly freshness_checked_at: string | Date | null;
  readonly freshness_state: FreshnessState;
}

function toPin(row: PinDbRow): PinRecord {
  return {
    id: row.id,
    wdNumber: toWdNumber(row.wd_number),
    revision: Number(row.revision),
    wdPublishedDate: isoDate(String(row.wd_published_date).slice(0, 10)),
    snapshotId: Number(row.snapshot_id),
    pinnedAt: new Date(row.pinned_at),
    freshnessCheckedAt:
      row.freshness_checked_at === null ? null : new Date(row.freshness_checked_at),
    freshnessState: row.freshness_state,
  };
}

/** The pin in force: the newest row, because a re-pin is an INSERT. */
export async function currentPin(tx: Tx, projectId: string): Promise<PinRecord | null> {
  const row = rowsOf<PinDbRow>(
    await tx.execute(sql`
      SELECT id, wd_number, revision, wd_published_date, snapshot_id, pinned_at,
             freshness_checked_at, freshness_state
        FROM wd_pins WHERE project_id = ${projectId}::uuid
       ORDER BY pinned_at DESC, revision DESC LIMIT 1
    `),
  )[0];
  return row ? toPin(row) : null;
}

/** Every pin this project has ever carried, newest first. The old rows are the
 *  record: §8.1's "the old pin is retained forever". */
export async function pinHistory(tx: Tx, projectId: string): Promise<readonly PinRecord[]> {
  return rowsOf<PinDbRow>(
    await tx.execute(sql`
      SELECT id, wd_number, revision, wd_published_date, snapshot_id, pinned_at,
             freshness_checked_at, freshness_state
        FROM wd_pins WHERE project_id = ${projectId}::uuid
       ORDER BY pinned_at DESC, revision DESC
    `),
  ).map(toPin);
}

// ===========================================================================
// Creation
// ===========================================================================

export interface NewProjectInput {
  readonly name: string;
  readonly stateCode: string;
  readonly countyName: string;
  readonly constructionType: string;
  readonly fundingSource: string;
  /** No default anywhere in this module. The caller must have asked. */
  readonly contractValueBand: ContractValueBand;
  readonly wdNumber?: string | null;
  readonly awardDate?: string | null;
  readonly contractNumber?: string | null;
  readonly lockedAtAward?: boolean | null;
  readonly dirProjectId?: string | null;
  readonly contractorPwcr?: string | null;
}

export interface CreatedProject {
  readonly projectId: string;
  readonly pin: PinRecord | null;
  /** P-C when the corpus is at L2/L3 and we declined to assert a revision-of-record.
   *  The project exists; the pin does not, and the customer is told exactly why and
   *  as of when. */
  readonly pinDeferred: ReturnType<typeof narrowedClaim> | null;
  /** §4.3 — the CBA groups on the pinned determination, named at setup. */
  readonly unionGroups: readonly string[];
}

/**
 * Create a project, and pin the determination when we are entitled to assert one.
 *
 * The funding-source refusal happens before anything is written: refusing an
 * unqualified buyer at setup is A6 in practice, because an unqualified customer is a
 * support load this company has no way to serve.
 */
export async function createProject(
  db: Db,
  tx: Tx,
  input: NewProjectInput & { readonly accountId: string; readonly userId: string; readonly now: Date },
): Promise<Result<CreatedProject>> {
  /**
   * ONE HANDLE, ONE TRANSACTION.
   *
   * Every read below — including the GLOBAL mirror reads, which are not
   * tenant-scoped — goes through `tx` rather than through the pool handle. On a
   * pooled driver a second handle is merely a second connection; on a
   * single-connection driver it is a query waiting for a transaction that is waiting
   * for it, which is a deadlock with no error message. `Tx` is a `PgDatabase`, so
   * the mirror read model takes it unchanged — and reading the rates inside the same
   * transaction that writes the row is the correct semantics anyway.
   */
  const ex: Db = tx;

  if (input.fundingSource === 'state_only') {
    return refuse(
      declinedConclusion({
        headline: 'This is not a Davis-Bacon project',
        rule:
          'The Davis-Bacon Act applies to contracts in excess of $2,000 to which the Federal ' +
          'Government or the District of Columbia is a party, for construction, alteration, or ' +
          'repair of public buildings or public works.',
        citation: '40 U.S.C. 3142(a)',
        observableFacts: [
          { label: 'Funding source you recorded', value: 'State or local money only' },
          { label: 'What Ratepin covers', value: 'The federal determination plus the DIR XML format' },
        ],
        declined: STATE_ONLY_REFUSAL,
      }),
    );
  }

  const projectId = newId();
  await tx.execute(sql`
    INSERT INTO projects
      (id, account_id, name, state_code, county_name, county_name_norm, construction_type,
       funding_source, award_date, contract_number, contract_value_band, band_asserted_at,
       band_asserted_by, wd_revision_locked_at_award, lock_asserted_at, dir_project_id,
       contractor_pwcr, created_at)
    VALUES
      (${projectId}::uuid, ${input.accountId}::uuid, ${input.name}, ${input.stateCode.toUpperCase()},
       ${input.countyName}, ${normaliseCounty(input.countyName)}, ${input.constructionType},
       ${input.fundingSource}, ${input.awardDate ?? null}::date, ${input.contractNumber ?? null},
       ${input.contractValueBand}, ${input.now.toISOString()}::timestamptz, ${input.userId}::uuid,
       ${input.lockedAtAward ?? null}, ${input.lockedAtAward == null ? null : input.now.toISOString()}::timestamptz,
       ${input.dirProjectId ?? null}, ${input.contractorPwcr ?? null},
       ${input.now.toISOString()}::timestamptz)
  `);

  await tx.execute(sql`
    INSERT INTO project_band_events (account_id, project_id, from_band, to_band, asserted_by, asserted_at)
    VALUES (${input.accountId}::uuid, ${projectId}::uuid, NULL, ${input.contractValueBand},
            ${input.userId}::uuid, ${input.now.toISOString()}::timestamptz)
  `);

  if (!input.wdNumber) {
    return ok({ projectId, pin: null, pinDeferred: null, unionGroups: [] });
  }

  const pinned = await pinDetermination(ex, tx, {
    accountId: input.accountId,
    userId: input.userId,
    projectId,
    wdNumber: input.wdNumber,
    now: input.now,
  });

  return ok({
    projectId,
    pin: pinned.pin,
    pinDeferred: pinned.deferred,
    unionGroups: pinned.unionGroups,
  });
}

export interface PinAttempt {
  readonly pin: PinRecord | null;
  readonly deferred: ReturnType<typeof narrowedClaim> | null;
  readonly unionGroups: readonly string[];
}

/**
 * Write a pin — or decline to, with a date.
 *
 * §4.2's `alt` block, implemented: at L2 STALE the project is created and the pin is
 * not, because a pin IS the assertion. The refusal names the exact last-successful
 * check, says the pin will be written automatically, and offers nobody to ask.
 */
export async function pinDetermination(
  db: Db,
  tx: Tx,
  input: {
    readonly accountId: string;
    readonly userId: string;
    readonly projectId: string;
    readonly wdNumber: string;
    readonly revision?: number;
    readonly now: Date;
  },
): Promise<PinAttempt> {
  /**
   * ONE HANDLE, ONE TRANSACTION.
   *
   * Every read below — including the GLOBAL mirror reads, which are not
   * tenant-scoped — goes through `tx` rather than through the pool handle. On a
   * pooled driver a second handle is merely a second connection; on a
   * single-connection driver it is a query waiting for a transaction that is waiting
   * for it, which is a deadlock with no error message. `Tx` is a `PgDatabase`, so
   * the mirror read model takes it unchanged — and reading the rates inside the same
   * transaction that writes the row is the correct semantics anyway.
   */
  const ex: Db = tx;

  const corpus = await corpusState(ex, input.now);

  if (suppressesNewRateAssertions(corpus.levels)) {
    return {
      pin: null,
      unionGroups: [],
      deferred: narrowedClaim({
        headline: 'Ratepin has not pinned a determination to this project yet',
        narrowedClaim:
          (corpus.verifiedAt === null
            ? 'No corpus snapshot has been promoted yet, so no newer-revision check stands behind ' +
              'this determination. '
            : `Our newer-revision check last completed ${stampUtc(corpus.verifiedAt)} and has not ` +
              're-run since. ') +
          'A pin is an assertion that this revision is the one of record, so we are not writing ' +
          'one until the next snapshot is promoted. The project is saved, and the pin is written ' +
          'automatically when the check clears.',
        asOf: input.now,
        ladderLevel: corpus.levels.includes('L3_QUARANTINE') ? 'L3_QUARANTINE' : 'L2_STALE',
        credit: {
          reason: 'corpus_staleness',
          accruingSince: corpus.verifiedAt ?? input.now,
          cents: null,
        },
      }),
    };
  }

  const held = await activeDetermination(ex, toWdNumber(input.wdNumber.trim().toUpperCase()));
  if (held === null) return { pin: null, deferred: null, unionGroups: [] };

  const snapshot = await promotedSnapshot(ex);
  if (snapshot === null) return { pin: null, deferred: null, unionGroups: [] };

  const revision = input.revision ?? held.revision;
  const pinId = newId();
  await tx.execute(sql`
    INSERT INTO wd_pins
      (id, account_id, project_id, wd_number, revision, wd_published_date, snapshot_id,
       pinned_at, pinned_by, freshness_checked_at, freshness_state)
    VALUES
      (${pinId}::uuid, ${input.accountId}::uuid, ${input.projectId}::uuid,
       ${String(held.wdNumber)}, ${revision}, ${String(held.publishDate)}::date,
       ${snapshot.snapshotId}, ${input.now.toISOString()}::timestamptz, ${input.userId}::uuid,
       ${corpus.verifiedAt === null ? null : corpus.verifiedAt.toISOString()}::timestamptz,
       ${corpus.freshness.state})
  `);

  const unionGroups = rowsOf<{ rate_identifier: string }>(
    await tx.execute(sql`
      SELECT DISTINCT rate_identifier
        FROM wd_classification_current
       WHERE wd_number = ${String(held.wdNumber)} AND revision = ${revision}
         AND identifier_kind IN ('union', 'union_average')
       ORDER BY rate_identifier
    `),
  ).map((row) => row.rate_identifier);

  const pin = await currentPin(tx, input.projectId);
  return { pin, deferred: null, unionGroups };
}

// ===========================================================================
// Edits — each one is an assertion the customer made, dated
// ===========================================================================

/** §4.4.5. The event row is what makes the artifact's "you recorded on {date}"
 *  sentence reproducible eighteen months later. */
export async function setBand(
  tx: Tx,
  input: {
    readonly accountId: string;
    readonly userId: string;
    readonly projectId: string;
    readonly band: ContractValueBand;
    readonly now: Date;
  },
): Promise<void> {
  const previous = rowsOf<{ contract_value_band: ContractValueBand }>(
    await tx.execute(
      sql`SELECT contract_value_band FROM projects WHERE id = ${input.projectId}::uuid`,
    ),
  )[0];

  await tx.execute(sql`
    UPDATE projects
       SET contract_value_band = ${input.band},
           band_asserted_at = ${input.now.toISOString()}::timestamptz,
           band_asserted_by = ${input.userId}::uuid
     WHERE id = ${input.projectId}::uuid
  `);
  await tx.execute(sql`
    INSERT INTO project_band_events (account_id, project_id, from_band, to_band, asserted_by, asserted_at)
    VALUES (${input.accountId}::uuid, ${input.projectId}::uuid, ${previous?.contract_value_band ?? null},
            ${input.band}, ${input.userId}::uuid, ${input.now.toISOString()}::timestamptz)
  `);
}

/**
 * §8.4 — the contract lock, set or cleared.
 *
 * Both directions are dated in the same column pair, because "she cleared it on the
 * 14th" is exactly as much a part of the record as "she set it on the 2nd". Nothing
 * here concludes anything: the flag governs our UI and prints as her sentence.
 */
export async function setContractLock(
  tx: Tx,
  input: { readonly projectId: string; readonly locked: boolean | null; readonly now: Date },
): Promise<void> {
  await tx.execute(sql`
    UPDATE projects
       SET wd_revision_locked_at_award = ${input.locked},
           lock_asserted_at = ${input.locked === null ? null : input.now.toISOString()}::timestamptz
     WHERE id = ${input.projectId}::uuid
  `);
}

export async function setCaliforniaIdentifiers(
  tx: Tx,
  input: {
    readonly projectId: string;
    readonly dirProjectId: string | null;
    readonly contractorPwcr: string | null;
  },
): Promise<void> {
  await tx.execute(sql`
    UPDATE projects
       SET dir_project_id = ${input.dirProjectId}, contractor_pwcr = ${input.contractorPwcr}
     WHERE id = ${input.projectId}::uuid
  `);
}

export async function setLayout(
  tx: Tx,
  input: { readonly projectId: string; readonly layout: 'wh347_rev_2025_01' | 'wh347_legacy' },
): Promise<void> {
  await tx.execute(sql`
    UPDATE projects SET wh347_layout = ${input.layout} WHERE id = ${input.projectId}::uuid
  `);
}

// ===========================================================================
// Supersession, per project
// ===========================================================================

export interface ProjectStanding {
  readonly project: ProjectRecord;
  readonly pin: PinRecord | null;
  readonly newer: { readonly revision: number; readonly publishDate: IsoDate } | null;
  /** `CORPUS_DESIGN.md` §5.5's three-member type. There is deliberately no
   *  `is_effective` member anywhere in this product. */
  readonly standing: 'unpinned' | 'current' | 'superseded_open' | 'superseded_contract_locked';
}

export async function standingOf(db: Db, tx: Tx, projectId: string): Promise<ProjectStanding | null> {
  /**
   * ONE HANDLE, ONE TRANSACTION.
   *
   * Every read below — including the GLOBAL mirror reads, which are not
   * tenant-scoped — goes through `tx` rather than through the pool handle. On a
   * pooled driver a second handle is merely a second connection; on a
   * single-connection driver it is a query waiting for a transaction that is waiting
   * for it, which is a deadlock with no error message. `Tx` is a `PgDatabase`, so
   * the mirror read model takes it unchanged — and reading the rates inside the same
   * transaction that writes the row is the correct semantics anyway.
   */
  const ex: Db = tx;

  const project = await readProject(tx, projectId);
  if (!project) return null;
  const pin = await currentPin(tx, projectId);
  if (!pin) return { project, pin: null, newer: null, standing: 'unpinned' };

  const newer = await newerRevisionThan(ex, pin.wdNumber, pin.revision);
  const standing =
    newer === null
      ? 'current'
      : project.lockedAtAward === true
        ? 'superseded_contract_locked'
        : 'superseded_open';
  return { project, pin, newer, standing };
}

// ===========================================================================
// Small helpers
// ===========================================================================

/** The same normalisation the mirror's county index uses, kept local so this module
 *  does not depend on the corpus's internals for one string operation. */
function normaliseCounty(value: string): string {
  return value
    .toUpperCase()
    .replace(/\b(COUNTY|PARISH|BOROUGH|CENSUS AREA|CITY AND BOROUGH|MUNICIPALITY)\b/g, '')
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

export function stampUtc(at: Date): string {
  return `${at.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}
