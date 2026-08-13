/**
 * `npm run seed` — THE END-TO-END PATH, REPRODUCIBLE, OFFLINE, FROM ZERO.
 *
 * AUTHORITY: `USER_JOURNEY.md` J3 (sign in), J4 (project and pin), J5 (the import),
 * J6 (the ladder), J7 (review and generate), J8 (the artifact);
 * `ARCHITECTURE.md` §2.2 factor XII (an admin process run from an identical release
 * image), §3.8 (the free generator is the paid product's tested fallback);
 * `CORPUS_DESIGN.md` §9.2 (the ingest stages).
 *
 * It walks the whole product in one process, in order:
 *
 *   1. migrate            — `applyMigrations`, the same runner `db:migrate` uses
 *   2. ingest the mirror  — `runIngest` over the RECORDED sam.gov fixtures
 *   3. sign in            — `requestMagicLink` → `redeemMagicLink`, a real session
 *   4. create a project   — with a pin to a real determination and revision
 *   5. upload payroll     — a real CSV, parsed and mapped by component **M**'s own
 *                           `parseCsv` / `suggestMapping` / `mapRows`
 *   6. resolve            — `resolveWeek`, then `confirmClassification` per title
 *   7. generate           — `generateFiling`, and write the artifacts to disk
 *
 * Every step calls the function the running application calls. Nothing is inserted
 * behind the app's back except the three rows a Stripe webhook would have written
 * (§9), which are marked where they happen.
 *
 * ===========================================================================
 * WHAT THIS SEED IS NOT
 *
 * **It is not a demonstration that G1 has cleared.** The ingest's canary is a
 * FIXTURE canary that returns green so the recorded snapshot promotes and the mirror
 * has something in it. The real gate — `runGoldenSuite` in `@/engine/canary` — is
 * red, because the ≥500-line suite over ≥25 determinations does not exist yet, and
 * `npm run corpus:ingest` HELDs on it exactly as it should. Both are printed in the
 * report below so the difference cannot be read past.
 *
 * **It does not produce California eCPR XML, and the reason is the point.** The
 * recorded corpus holds three determinations — VA20260195, LA20260005, DC20260001 —
 * and none of them is Californian. `ecprChip` therefore blocks the XML with its
 * non-CA reason, and the report prints that refusal instead of an artifact. Seeding
 * a fabricated CA determination to make the demo complete would put rates nobody
 * fetched into the mirror, and the mirror is the one thing in this product that is
 * only worth anything if everything in it came from upstream.
 *
 * ===========================================================================
 * WHY IT READS THE FIXTURES OUT OF `tests/`
 *
 * `tests/corpus/fixtures/` holds the bytes sam.gov actually sent on 2026-08-13, and
 * `healthyRoutes()` is the route table the corpus suite exercises the client
 * against. Importing them is deliberate: a second copy of the route table under
 * `src/` would be a fixture harness that can drift from the one the tests use, and
 * then "seeded" and "tested" would quietly stop meaning the same corpus. This file
 * never enters the Next build graph — it is a `tsx` entry point, like every other
 * script here.
 */

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

import { sql } from 'drizzle-orm';

import { runIngest, SamClient, type CanaryRunner } from '@/corpus';
import { closeDb, getDb, rowsOf, type Db, type Tx } from '@/db';
import { withTenant } from '@/db/tenant';
import { getConfig } from '@/lib/config';
import { redeemMagicLink, requestMagicLink } from '@/platform/auth/magic-link';

import { mapRows, parseCsv, suggestMapping, type MapTarget } from '../app/(free)/_lib/csv';
import { corpusState } from '../app/(app)/_lib/mirror';
import { createProject, readProject, currentPin } from '../app/(app)/_lib/projects';
import { ingestPayroll, type PostedWorker, type StoredColumnMap } from '../app/(app)/_lib/imports';
import { confirmClassification, ordinalOf, resolveWeek } from '../app/(app)/_lib/resolve';
import { ecprChip, generateFiling, listArtifacts, releaseFiling } from '../app/(app)/_lib/filings';

import { fixtureFetcher, healthyRoutes, INDEX_BASE, WDOL_BASE } from '../../tests/corpus/fixtures';

// ===========================================================================
// The fixed inputs. Every one of them is a decision the product asks for.
// ===========================================================================

/** The night the fixtures were recorded. Fixed so two runs seed one database. */
const INGEST_AT = new Date('2026-08-13T06:00:00Z');

const SEED = {
  email: 'dee@riovista.test',
  accountName: 'Rio Vista Concrete',
  project: {
    name: 'Route 17 shoulder widening',
    stateCode: 'VA',
    countyName: 'Gloucester',
    constructionType: 'HIGHWAY',
    /** Federal-aid highway money. A state-only source ends the flow at S10 as P-D,
     *  which is a different seed and not this one. */
    fundingSource: 'FHWA',
    /** NO DEFAULT ANYWHERE, including here: the $100,000 line changes which
     *  obligations attach, so a fixture that omitted it would be asserting one. */
    contractValueBand: 'over_100k' as const,
    wdNumber: 'VA20260195',
    contractNumber: 'VDOT-2026-0417',
    awardDate: '2026-06-01',
  },
  /**
   * The classification each payroll title is answered with, BY NAME.
   *
   * On S15 the customer reads three candidates with the determination's verbatim
   * scope text beside each and picks one. A script cannot read, so it names the row
   * it means and fails if the ladder did not offer it. Taking whatever ranked first
   * would be worse than arbitrary: plain `Laborer` ranks `LABORER: PIPELAYER` above
   * `LABORER: COMMON OR GENERAL` on pure lexical distance, and a seed that shipped
   * that would be teaching the wrong lesson about what L-E is for.
   */
  classes: {
    Laborer: 'LABORER: COMMON OR GENERAL',
    Flagger: 'TRAFFIC CONTROL: FLAGGER',
    'Concrete Finisher': 'CEMENT MASON/CONCRETE FINISHER',
    'Excavator Operator': 'OPERATOR: BACKHOE/EXCAVATOR/TRACKHOE',
    Electrician: 'ELECTRICIAN, INCLUDES TRAFFIC SIGNALIZATION',
  } as Readonly<Record<string, string>>,
  weekEnding: '2026-08-14',
  /** Sunday. The WH-347's day columns are ordered from the workweek's first day. */
  workweekStartDay: 0,
  signatory: { name: 'Dolores Vasquez', title: 'Owner' },
  csv: resolve(process.cwd(), 'fixtures', 'seed', 'payroll-2026-08-14.csv'),
} as const;

/**
 * The four deduction columns, categorised under 29 CFR 3.5 by their paragraph.
 *
 * On the running screen this is a closed choice the customer makes per column, and
 * an uncategorised column BLOCKS rather than falling into an "Other" (§5.4). The
 * seed makes the same four choices a customer would; it does not get a shortcut,
 * and there is no `UNMAPPED` escape below because the product does not offer one.
 */
const DEDUCTIONS: readonly { readonly header: string; readonly category: string }[] = [
  { header: 'FICA', category: 'STATUTORY' },
  { header: 'Federal W/H', category: 'STATUTORY' },
  { header: 'State W/H', category: 'STATUTORY' },
  { header: 'Union Dues', category: 'UNION_DUES' },
];

/**
 * The ingest's canary, green, so the recorded snapshot promotes.
 *
 * NOT the G1 gate. See the header: the real runner is scored separately and its
 * verdict is printed beside this one so nobody can mistake a seeded mirror for a
 * cleared gate.
 */
const fixtureCanary: CanaryRunner = () =>
  Promise.resolve({
    pass: true,
    lines: 0,
    detail:
      'FIXTURE CANARY — `npm run seed` only. It exists so the recorded snapshot promotes and the ' +
      'mirror is readable offline. It scores nothing. G1 is scored by `runGoldenSuite` and is red.',
  });

export interface SeedReport {
  readonly migrations: { readonly applied: number; readonly skipped: number };
  readonly corpus: {
    readonly state: string;
    readonly snapshotRef: string | null;
    readonly revisions: number;
    readonly verifiedAt: string | null;
  };
  readonly goldenSuite: { readonly pass: boolean; readonly lines: number; readonly detail: string };
  readonly signIn: { readonly email: string; readonly accountId: string; readonly createdAccount: boolean };
  readonly project: {
    readonly id: string;
    readonly wdNumber: string | null;
    readonly revision: number | null;
    readonly publishDate: string | null;
    readonly deferred: string | null;
  };
  readonly upload: {
    readonly file: string;
    readonly sha256: string;
    readonly workers: number;
    readonly lines: number;
    readonly unreadableCells: readonly string[];
  };
  readonly resolution: {
    readonly autoApplied: readonly string[];
    readonly confirmed: readonly { readonly rawTitle: string; readonly chosen: string }[];
  };
  readonly filing: {
    readonly id: string;
    readonly status: string;
    readonly signatureBlock: boolean;
    readonly billable: boolean;
    readonly refusals: readonly string[];
    readonly artifacts: readonly { readonly kind: string; readonly bytes: number; readonly path: string }[];
  };
  readonly ecpr: { readonly kind: string; readonly detail: string };
}

// ===========================================================================
// The walk
// ===========================================================================

export async function seedRatepin(
  db: Db,
  options: { readonly outDir: string; readonly migrations?: { applied: number; skipped: number } },
): Promise<SeedReport> {
  const config = getConfig();

  // --- 2. The mirror ------------------------------------------------------
  /**
   * IDEMPOTENT ON THE MIRROR, BECAUSE `INGEST_AT` IS FIXED.
   *
   * `snapshotRefFor(now)` derives the snapshot ref from the clock, and the clock is
   * pinned to the night the fixtures were recorded so two runs describe one corpus.
   * The consequence is that a second `runIngest` collides on `snapshot_ref` — which
   * is the unique constraint doing its job, not a problem to route around. A mirror
   * that is already promoted is already seeded, so the ingest is skipped and the
   * rest of the walk runs against it.
   */
  const existing = await corpusState(db, INGEST_AT);
  const ingest =
    existing.verifiedAt !== null
      ? { state: 'already promoted', snapshotRef: existing.snapshotRef, holdReason: null }
      : await runIngest({
          db,
          client: new SamClient({
            indexBase: INDEX_BASE,
            wdolBase: WDOL_BASE,
            fetcher: fixtureFetcher(healthyRoutes()),
            now: () => INGEST_AT,
          }),
          canary: fixtureCanary,
          now: () => INGEST_AT,
        });

  const corpus = await corpusState(db, INGEST_AT);
  if (corpus.verifiedAt === null) {
    throw new Error(
      `the recorded snapshot did not promote (${ingest.state}: ${ingest.holdReason ?? 'no reason given'}). ` +
        'Nothing downstream can be seeded against an empty mirror.',
    );
  }
  /** One hour after promotion, so the freshness ladder is at L0 FRESH and the
   *  artifact's status is about the payroll rather than about the clock. */
  const NOW = new Date(corpus.verifiedAt.getTime() + 3_600_000);

  // The real gate, scored and reported beside the fixture one.
  const { runGoldenSuite } = await import('@/engine/canary');
  const golden = runGoldenSuite();

  // --- 3. Sign in ---------------------------------------------------------
  // The real magic-link path: a link is minted, the token is redeemed once, and an
  // account, a user, a membership and a session come out of `redeemMagicLink`.
  // Nothing is inserted by hand.
  const link = await requestMagicLink(
    db,
    { email: SEED.email },
    { baseUrl: config.APP_BASE_URL, clock: { now: () => NOW } },
  );
  const redeemed = await redeemMagicLink(db, link.token, {
    clock: { now: () => NOW },
    accountName: SEED.accountName,
  });
  if (!redeemed.ok) throw new Error(`sign-in failed: ${redeemed.reason}`);
  const accountId = redeemed.issued.session.accountId;
  const userId = redeemed.issued.session.userId;

  /**
   * THE ONE THING WRITTEN BEHIND THE APP'S BACK, AND IT IS MONEY.
   *
   * `billing_account_index` is written by the Stripe webhook (ADR-007: webhooks are
   * the source of truth for money), and there is no Stripe here. The row is seeded
   * in the state a brand-new account is genuinely in — `none` — rather than in a
   * paid state, so the seeded account is not quietly given an entitlement it never
   * bought. A filing still generates; §9 bills it or does not on its own terms.
   */
  await db.execute(sql`
    INSERT INTO billing_account_index (account_id, entitlement_state, state_since, updated_at)
    VALUES (${accountId}::uuid, 'none', ${NOW.toISOString()}::timestamptz, ${NOW.toISOString()}::timestamptz)
    ON CONFLICT (account_id) DO NOTHING
  `);

  const asTenant = async <T>(fn: (tx: Tx) => Promise<T>): Promise<T> =>
    withTenant(db, { accountId, userId }, fn);

  // --- 4. The project and the pin ----------------------------------------
  const created = await asTenant(async (tx) =>
    createProject(db, tx, {
      accountId,
      userId,
      now: NOW,
      name: SEED.project.name,
      stateCode: SEED.project.stateCode,
      countyName: SEED.project.countyName,
      constructionType: SEED.project.constructionType,
      fundingSource: SEED.project.fundingSource,
      contractValueBand: SEED.project.contractValueBand,
      wdNumber: SEED.project.wdNumber,
      contractNumber: SEED.project.contractNumber,
      awardDate: SEED.project.awardDate,
      lockedAtAward: false,
    }),
  );
  if (!created.ok) throw new Error(`createProject refused: ${JSON.stringify(created)}`);
  const projectId = created.value.projectId;
  const pin = created.value.pin;

  // --- 5. The upload ------------------------------------------------------
  // Parsed and mapped by component M's own functions — the same `parseCsv`,
  // `suggestMapping` and `mapRows` the browser runs on both tiers.
  const csvText = readFileSync(SEED.csv, 'utf8');
  const table = parseCsv(csvText);
  const targets: Partial<Record<MapTarget, number>> = {};
  for (const suggestion of suggestMapping(table.header)) {
    targets[suggestion.target] = suggestion.columnIndex;
  }

  const deductionColumns = DEDUCTIONS.map((entry) => {
    const columnIndex = table.header.findIndex((h) => h.trim() === entry.header);
    if (columnIndex < 0) throw new Error(`the seed CSV has no ${entry.header} column`);
    return { rawLabel: entry.header, category: entry.category, columnIndex };
  });

  const mapped = mapRows({ table, mapping: targets, deductions: deductionColumns });
  if (mapped.unreadableCells.length > 0) {
    // The product blocks here rather than coercing a cell to zero, and so does the
    // seed: a fixture that shipped past its own refusal would be testing nothing.
    throw new Error(`the seed CSV has unreadable cells:\n  ${mapped.unreadableCells.join('\n  ')}`);
  }

  const sourceSha256 = createHash('sha256').update(csvText, 'utf8').digest('hex');
  const storedMap: StoredColumnMap = {
    targets,
    deductions: deductionColumns.map((column) => ({
      columnIndex: column.columnIndex,
      rawLabel: column.rawLabel,
      category: column.category as StoredColumnMap['deductions'][number]['category'],
    })),
    header: table.header,
  };
  const workers = mapped.workers.map(
    (worker): PostedWorker => ({
      ...worker,
      externalRef: null,
      middleInitial: worker.middleInitial === '' ? null : worker.middleInitial,
      apprenticeProgram: worker.apprenticeProgram === '' ? null : worker.apprenticeProgram,
      apprenticeRegistrar:
        worker.apprenticeRegistrar === 'OA' || worker.apprenticeRegistrar === 'SAA'
          ? worker.apprenticeRegistrar
          : null,
      apprenticeLevel: worker.apprenticeLevel === '' ? null : worker.apprenticeLevel,
      deductions: worker.deductions.map((deduction) => ({
        rawLabel: deduction.rawLabel,
        category: deduction.category as PostedWorker['deductions'][number]['category'],
        amountCents: deduction.amountCents,
      })),
    }),
  );

  const ingested = await asTenant(async (tx) =>
    ingestPayroll(tx, {
      accountId,
      userId,
      now: NOW,
      projectId,
      weekEnding: SEED.weekEnding,
      workweekStartDay: SEED.workweekStartDay,
      contractValueBand: SEED.project.contractValueBand,
      map: storedMap,
      sourceSha256,
      byteSize: Buffer.byteLength(csvText, 'utf8'),
      workers,
    }),
  );
  if (ingested.duplicate) {
    throw new Error(
      `this week is already imported as ${ingested.importId}. The seed is idempotent on the ` +
        'mirror and the account, and deliberately NOT on payroll: re-importing a week silently ' +
        'is the behaviour §5.4 refuses. Delete the data directory to start over.',
    );
  }
  const weekId = ingested.weekId;

  // --- 6. The ladder ------------------------------------------------------
  const project = await asTenant(async (tx) => readProject(tx, projectId));
  const livePin = await asTenant(async (tx) => currentPin(tx, projectId));
  if (project === null || livePin === null) throw new Error('the project or its pin vanished');

  const resolution = await asTenant(async (tx) =>
    resolveWeek(db, tx, { accountId, weekId, project, pin: livePin }),
  );

  /**
   * EVERY BLOCKED TITLE IS ANSWERED BY A CHOICE, AND THE CHOICE IS NAMED.
   *
   * On S15 the customer reads three candidates with the determination's verbatim
   * scope text beside each and picks one. A script cannot read, so it names the row
   * it means and stops if the ladder did not offer that row.
   *
   * Taking whatever ranked first would be worse than arbitrary. `SEED.classes`
   * exists because the plain title `Laborer` ranks `LABORER: PIPELAYER` above
   * `LABORER: COMMON OR GENERAL` on lexical distance alone — L-E is a RETRIEVER, not
   * a decider, and a seed that rubber-stamped its first row would be demonstrating
   * the opposite of what the ladder is for. Choosing a classification is the one
   * decision this product never makes on anybody's behalf, and the seed does not get
   * an exemption from that.
   */
  const confirmed: { rawTitle: string; chosen: string }[] = [];
  for (const blocked of resolution.blocked) {
    const wanted = SEED.classes[blocked.rawTitle];
    if (wanted === undefined) {
      throw new Error(`the seed names no classification for “${blocked.rawTitle}”`);
    }
    const candidate = blocked.outcome.candidates.find(
      (offered) => offered.classification.className === wanted,
    );
    if (candidate === undefined) {
      throw new Error(
        `${livePin.wdNumber} rev ${String(livePin.revision)} did not offer “${wanted}” for ` +
          `“${blocked.rawTitle}”. The line stays blocked and the filing would be ` +
          'DRAFT — NOT CERTIFIABLE with the signature block withheld.',
      );
    }
    const result = await asTenant(async (tx) =>
      confirmClassification(db, tx, {
        accountId,
        userId,
        project,
        pin: livePin,
        weekId,
        rawTitle: blocked.rawTitle,
        // The ORDINAL, which is what `confirmChoice` checks against the pinned
        // revision's own rows — a crafted value can name a real classification
        // badly and nothing else.
        chosenOrdinal: ordinalOf(candidate.classificationId),
      }),
    );
    if (result === null) {
      throw new Error(`the chosen ordinal for \u201c${blocked.rawTitle}\u201d is not on the pinned revision`);
    }
    confirmed.push({ rawTitle: blocked.rawTitle, chosen: result.chosen.className });
  }

  // --- 7. Generate, release, write ---------------------------------------
  const filing = await asTenant(async (tx) =>
    generateFiling(db, tx, {
      accountId,
      userId,
      weekId,
      now: NOW,
      signatory: SEED.signatory,
    }),
  );
  if (filing === null) throw new Error('generateFiling returned null — no pin, or no week');

  await asTenant(async (tx) => releaseFiling(tx, { accountId, filingId: filing.filingId, now: NOW }));
  const artifacts = await asTenant(async (tx) => listArtifacts(tx, filing.filingId));

  mkdirSync(options.outDir, { recursive: true });
  const written: { kind: string; bytes: number; path: string }[] = [];

  /**
   * THE BYTES WRITTEN ARE THE BYTES THAT WERE HASHED.
   *
   * `artifacts.sha256` is the artifact's IDENTITY (I6), and the download route
   * regenerates rather than stores, so a file on disk that differs from the digest
   * by so much as a trailing newline is a different document from the one the row
   * attests to. The assertions below are the seed earning the right to call these
   * files the filing's artifacts.
   */
  const pdfRow = artifacts.find((a) => a.kind === 'wh347_pdf');
  if (pdfRow === undefined || pdfRow.sha256 !== filing.pdfSha256) {
    throw new Error(`the WH-347 row does not carry the digest of the bytes generated`);
  }
  const pdfPath = resolve(options.outDir, `wh347-${SEED.weekEnding}.pdf`);
  writeFileSync(pdfPath, filing.pdf);
  written.push({ kind: 'wh347_pdf', bytes: filing.pdf.byteLength, path: pdfPath });

  const exceptionRow = artifacts.find((a) => a.kind === 'exception_report');
  if (exceptionRow !== undefined) {
    const body = filing.exceptions.join('\n');
    if (createHash('sha256').update(body, 'utf8').digest('hex') !== exceptionRow.sha256) {
      throw new Error('the exception-report row does not carry the digest of the text generated');
    }
    const reportPath = resolve(options.outDir, `exceptions-${SEED.weekEnding}.txt`);
    writeFileSync(reportPath, body);
    written.push({ kind: 'exception_report', bytes: exceptionRow.byteSize, path: reportPath });
  }

  const chip = ecprChip({
    project,
    workersMissingSsn: [],
    workerCount: workers.length,
    // The worker verifies the live XSD and records what it saw. Nothing has run
    // here, so the observation is absent — which the chip treats as an absence and
    // not as a match.
    xsdObservedSha256: null,
    xsdObservedAt: null,
  });

  const revisionRow = rowsOf<{ n: string | number }>(
    await db.execute(sql`SELECT count(*)::int AS n FROM wd_revision`),
  )[0];

  return {
    migrations: options.migrations ?? { applied: 0, skipped: 0 },
    corpus: {
      state: ingest.state,
      snapshotRef: ingest.snapshotRef,
      revisions: Number(revisionRow?.n ?? 0),
      verifiedAt: corpus.verifiedAt.toISOString(),
    },
    goldenSuite: golden,
    signIn: { email: link.email, accountId, createdAccount: redeemed.createdAccount },
    project: {
      id: projectId,
      wdNumber: pin?.wdNumber ?? null,
      revision: pin?.revision ?? null,
      publishDate: pin?.wdPublishedDate ?? null,
      deferred: created.value.pinDeferred?.headline ?? null,
    },
    upload: {
      file: SEED.csv,
      sha256: sourceSha256,
      workers: workers.length,
      lines: ingested.lineCount,
      unreadableCells: mapped.unreadableCells,
    },
    resolution: {
      autoApplied: resolution.resolved.map((entry) => entry.rawTitle),
      confirmed,
    },
    filing: {
      id: filing.filingId,
      status: filing.verdict.status,
      // STRUCTURAL: `true` here means the signature block was RENDERED. When the
      // status is not certifiable the block is REPLACED by the withheld box, and
      // `rendersSignatureBlock` is the one function entitled to say which.
      signatureBlock: !filing.artifact.signatureBlockWithheld,
      billable: filing.billable,
      refusals: filing.refusals.map((refusal) => refusal.headline),
      artifacts: written,
    },
    ecpr: {
      kind: chip.kind,
      detail: chip.kind === 'blocked' ? `${chip.headline} — ${chip.detail}` : chip.label,
    },
  };
}
