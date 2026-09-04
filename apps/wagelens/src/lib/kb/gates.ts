/**
 * The ingestion gates (KNOWLEDGE_BASE §7).
 *
 * G1–G6 run INSIDE the job and fail the run; G7 and G8 run in CI and fail the
 * build (see `tests/gates.test.ts`). Each one is a named function with a named
 * test, because — as the knowledge-base document puts it — *a green aggregate
 * is not evidence that a specific gate ran*.
 *
 * The failure mode every gate is written against is the same one: a corpus that
 * is WRONG BUT PLAUSIBLE. A determination that half-parsed, an index that
 * shrank by 90% because GSA renamed a path, a rate of $0.00 — each of those
 * looks like data and reads like an answer. Rolling back is cheap; a customer
 * filing a federal form at a rate we invented is not.
 */

export const PARSE_COVERAGE_FLOOR = 0.995;
export const CORPUS_STALE_DAYS = 35;
export const PREFLIGHT_BAND = 0.2;

export class GateFailure extends Error {
  constructor(
    readonly gate: 'G1' | 'G2' | 'G3' | 'G4' | 'G6' | 'G10',
    message: string,
    readonly context: Record<string, unknown> = {},
  ) {
    super(`[${gate}] ${message}`);
    this.name = 'GateFailure';
  }
}

/** G3 — the parser silently dropping rates. Measured 0.9991 on a 40-WD sample. */
export function assertParseCoverage(wdNumber: string, coverage: number, parsed: number, naive: number): void {
  if (coverage < PARSE_COVERAGE_FLOOR) {
    throw new GateFailure(
      'G3',
      `${wdNumber} parsed ${parsed} of ${naive} rate lines (${(coverage * 100).toFixed(2)}%), below ${(PARSE_COVERAGE_FLOOR * 100).toFixed(1)}%`,
      { wdNumber, coverage, parsed, naive },
    );
  }
}

/** G4 — a rate of zero or a negative fringe is a parser fault. The database
 *  carries the same rule as a CHECK constraint; this is the legible half. */
export function assertRatesSane(
  wdNumber: string,
  rows: Array<{ baseRate: number; fringeRate: number; classificationLabel: string }>,
): void {
  for (const row of rows) {
    if (!(row.baseRate > 0)) {
      throw new GateFailure('G4', `${wdNumber}: base rate ${row.baseRate} for "${row.classificationLabel}"`, {
        wdNumber,
      });
    }
    if (!(row.fringeRate >= 0)) {
      throw new GateFailure('G4', `${wdNumber}: fringe ${row.fringeRate} for "${row.classificationLabel}"`, {
        wdNumber,
      });
    }
  }
}

/** V6 — SAM served a different record than the one we asked for. Fails the run:
 *  it means the identity of a row cannot be trusted. */
export function assertIdentityMatches(requested: string, parsed: string | null): void {
  if (parsed !== requested) {
    throw new GateFailure('G1', `requested ${requested} but the document says ${parsed ?? 'nothing'}`, {
      requested,
      parsed,
    });
  }
}

/**
 * G10 — pre-flight. A renamed path must look like an outage, not like 3,835
 * withdrawn determinations. `previous` is the last successful run's count;
 * with no previous run, any non-zero count is accepted (cold start).
 */
export function assertIndexPlausible(seen: number, previous: number | null): void {
  if (seen <= 0) {
    throw new GateFailure('G10', 'the index returned no records', { seen, previous });
  }
  if (previous === null || previous === 0) return;
  const low = previous * (1 - PREFLIGHT_BAND);
  const high = previous * (1 + PREFLIGHT_BAND);
  if (seen < low || seen > high) {
    throw new GateFailure(
      'G10',
      `the index returned ${seen} records where the last successful run saw ${previous} (±${PREFLIGHT_BAND * 100}% band)`,
      { seen, previous },
    );
  }
}

/** G6 — a stale corpus that still looks green. Reports, never aborts. */
export function corpusIsStale(oldestLastVerified: Date | null, now = new Date()): boolean {
  if (!oldestLastVerified) return true;
  const days = (now.getTime() - oldestLastVerified.getTime()) / 86_400_000;
  return days > CORPUS_STALE_DAYS;
}
