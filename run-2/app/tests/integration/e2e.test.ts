/**
 * THE END-TO-END PATH, ASSERTED.
 *
 * AUTHORITY: `USER_JOURNEY.md` J3–J8; `ARCHITECTURE.md` §2.2 factor X (tests run
 * against recorded responses, deterministic and free), §6.3 (`deriveStatus` is the
 * only status path), ADR-013 (artifacts are immutable and identified by digest).
 *
 * This runs `seedRatepin` — the SAME function `npm run seed` runs, not a copy of it
 * — against an in-memory PGlite, and asserts on what came out. Two things follow
 * from that arrangement and neither is incidental:
 *
 * 1. **The seed cannot rot.** A seed script that only executes when a developer
 *    remembers it is a script that is broken most of the time. This one runs on
 *    every commit, so the walk from an empty database to a signed WH-347 is a
 *    property of the build rather than a claim in a README.
 * 2. **The assertions are about the WHOLE path.** Every unit under here is already
 *    tested by the module suites. What was untested until now is that the modules
 *    compose — and composition is exactly where the three defects this file was
 *    written to catch were living: a platform schema no web process applied, a
 *    golden-suite module the ingest imported by a name that did not exist, and an
 *    apprentice field that four layers each knew about and none of them passed on.
 */

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { ensurePlatformSchema } from '@/platform/schema';
import { runGoldenSuite } from '@/engine/canary';

import { createTestDb, type TestDb } from '../helpers/pglite';
import { seedRatepin, type SeedReport } from '../../src/scripts/seed-lib';

let tdb: TestDb;
let report: SeedReport;
let outDir: string;

beforeAll(async () => {
  tdb = await createTestDb();
  // `createTestDb` applies `drizzle/*.sql`. The platform DDL is the other half of
  // the schema and lives outside it; the web process gets it from `createPglite`
  // and a deploy from `db:migrate`. Here it is applied explicitly so the test says
  // out loud which two things have to happen for a database to be usable.
  await ensurePlatformSchema(tdb.db);

  outDir = mkdtempSync(join(tmpdir(), 'ratepin-e2e-'));
  report = await seedRatepin(tdb.db, { outDir });
}, 180_000);

afterAll(async () => {
  await tdb.close();
  rmSync(outDir, { recursive: true, force: true });
});

describe('the mirror, seeded from the recorded sam.gov bytes', () => {
  it('promotes a snapshot and holds the three recorded determinations', () => {
    expect(report.corpus.state).toBe('promoted');
    expect(report.corpus.snapshotRef).toBe('cs_2026-08-13T06:00Z');
    expect(report.corpus.revisions).toBe(3);
    expect(report.corpus.verifiedAt).not.toBeNull();
  });

  it('does not mistake a seeded mirror for a cleared G1 gate', () => {
    /**
     * The ingest ran under a FIXTURE canary so the recorded snapshot would promote.
     * The real gate is scored separately and is red — on coverage, which is the true
     * reason: the suite passes every case it has and does not have enough of them.
     *
     * Before `src/engine/canary/index.ts` existed, `corpus-ingest.ts` could not
     * resolve the runner at all and reported *"no golden payroll suite is
     * registered"* — the right outcome for a false reason. This asserts the reason.
     */
    expect(report.goldenSuite.pass).toBe(false);
    expect(report.goldenSuite.detail).toContain('COVERAGE_SHORTFALL');
    expect(report.goldenSuite.detail).toContain('G1 remains locked');
    expect(runGoldenSuite().pass).toBe(false);
  });
});

describe('J3 → J4 — sign in, then a project pinned to a real revision', () => {
  it('provisions the account through the magic link rather than by insert', () => {
    expect(report.signIn.createdAccount).toBe(true);
    expect(report.signIn.email).toBe('dee@riovista.test');
  });

  it('pins the determination the project names, at the revision the mirror holds', () => {
    expect(report.project.wdNumber).toBe('VA20260195');
    expect(report.project.revision).toBe(2);
    // Printed on the artifact. It is the determination's OWN publication date, not
    // the date we fetched it.
    expect(report.project.publishDate).toBe('2026-08-06');
    // A pin was written, so nothing was narrowed at setup.
    expect(report.project.deferred).toBeNull();
  });
});

describe('J5 → J6 — the CSV, and the ladder over it', () => {
  it('reads every cell it was given, and coerces none of them', () => {
    expect(report.upload.unreadableCells).toEqual([]);
    expect(report.upload.workers).toBe(6);
    expect(report.upload.lines).toBe(6);
  });

  it('offers the right classification for every payroll title on the crew', () => {
    /**
     * The seed names the row it means and fails if the ladder did not offer it, so
     * this asserts RETRIEVAL: that the pinned revision's own rows reach the picker
     * for five ordinary trade titles. It asserts nothing about ranking, and it must
     * not: `LABORER: PIPELAYER` outranks `LABORER: COMMON OR GENERAL` for the bare
     * title `Laborer`, which is why a human picks and L-E only offers.
     */
    expect(report.resolution.confirmed.map((entry) => entry.chosen)).toEqual([
      'LABORER: COMMON OR GENERAL',
      'TRAFFIC CONTROL: FLAGGER',
      'CEMENT MASON/CONCRETE FINISHER',
      'OPERATOR: BACKHOE/EXCAVATOR/TRACKHOE',
      'ELECTRICIAN, INCLUDES TRAFFIC SIGNALIZATION',
    ]);
  });

  it('carries the apprentice programme all the way from the CSV to the engine', () => {
    /**
     * THE REGRESSION THIS FILE EXISTS FOR.
     *
     * `week.ts` blocks an `RA` worker with no level of progression. The schema had
     * `apprentice_program`, `apprentice_registrar` and `apprentice_level` from the
     * first migration; the mapper had no targets for them, `PostedWorker` had no
     * fields, `ingestPayroll` inserted none and `loadWeek` hardcoded `null`. So a
     * worker whose status column said `RA` blocked the filing with
     * MISSING_REQUIRED_FIELD and NOTHING IN THE PRODUCT COULD CLEAR IT — a refusal
     * with no in-product resolution, which is the one thing A3 does not permit.
     *
     * The crew's fifth row is a registered apprentice. If any layer drops the
     * programme again, the status below is DRAFT_NOT_CERTIFIABLE and this fails.
     */
    expect(report.filing.status).toBe('CERTIFIABLE');
  });
});

describe('J7 → J8 — the filing and its artifacts', () => {
  it('renders the signature block, because the status permits it', () => {
    // Structural, not decorative: on any other status the block is REPLACED by the
    // withheld box rather than hidden.
    expect(report.filing.signatureBlock).toBe(true);
    expect(report.filing.billable).toBe(true);
  });

  it('states its narrowings on the artifact instead of dropping them', () => {
    /**
     * A CERTIFIABLE filing is not a silent one. Four things are true of this week
     * that Ratepin does not compute, and each is printed rather than implied: CWHSSA
     * liquidated damages (assessed by the agency), cash paid in lieu of fringes,
     * a registered apprentice's ratio, and gross earned outside this project.
     */
    expect(report.filing.refusals.length).toBeGreaterThanOrEqual(4);
    expect(report.filing.refusals.join(' ')).toContain('Contract Work Hours and Safety Standards Act');
    expect(report.filing.refusals.join(' ')).toContain('registered apprentices');
  });

  it('writes a two-page WH-347 PDF and an exception report to disk', () => {
    const pdf = report.filing.artifacts.find((a) => a.kind === 'wh347_pdf');
    expect(pdf).toBeDefined();
    if (pdf === undefined) return;
    expect(existsSync(pdf.path)).toBe(true);
    expect(statSync(pdf.path).size).toBe(pdf.bytes);

    const bytes = readFileSync(pdf.path);
    // The form and the statement of compliance, which is the second page and not a
    // separate document.
    expect(bytes.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(bytes.toString('latin1').match(/\/Type\s*\/Page[^s]/g)?.length).toBe(2);

    const report_ = report.filing.artifacts.find((a) => a.kind === 'exception_report');
    expect(report_).toBeDefined();
    if (report_ === undefined) return;
    expect(statSync(report_.path).size).toBe(report_.bytes);
  });

  it('blocks the California XML for a Virginia project, and says so about the XML only', () => {
    /**
     * §10.2: the same filing can be CERTIFIABLE as a PDF and BLOCKED as XML, and the
     * screen shows two chips rather than one blended status that would have to lie
     * about one of them. The PDF above is certifiable; this is blocked; neither
     * sentence touches the other.
     */
    expect(report.ecpr.kind).toBe('blocked');
    expect(report.ecpr.detail).toContain('not in California');
  });
});
