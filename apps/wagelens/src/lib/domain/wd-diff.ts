/**
 * WL-08 · The diff, as a pure function.
 *
 * **Scoped to what the project actually uses.** A determination can carry three
 * hundred classifications and a project can use four of them; diffing the whole
 * document would produce an email about work this contractor does not do, and
 * "a tool that emails about irrelevant changes is unsubscribed from before it
 * ever emails about a relevant one" (V2). So the changed/removed sets are
 * computed over the project's OPEN `worker_classifications` rows, and the added
 * set is informational only — it never causes an email on its own.
 *
 * **Matching is on `search_label` first, then on the verbatim label.** SAM
 * reissues a determination with a comma moved or two spaces collapsed more
 * often than it renames a craft, and a cosmetic edit read as a REMOVAL would
 * tell a contractor that the classification their crew is mapped to has
 * disappeared — the most alarming thing this product can say. Genuine ambiguity
 * still resolves to `removed`, because that is the direction that asks a human
 * rather than assuming.
 *
 * The function takes rows, not a database handle: a diff is arithmetic over two
 * lists and it is tested as arithmetic (`tests/wd-diff.test.ts`), against the
 * two committed determination fixtures.
 */

/** The shape both `kb_classifications` and a fixture row satisfy. */
export type DiffClassification = {
  classificationLabel: string;
  /** Normalised: collapsed whitespace, lowercase, no punctuation. */
  searchLabel?: string | null;
  baseRate: string;
  fringeRate: string;
};

export type MappedWorker = {
  /** `worker_classifications.classification_label`, as copied at mapping. */
  classificationLabel: string;
  /** Display name for the email. Never written to an event. */
  workerName: string;
  workerId: string;
};

export type ChangedEntry = {
  label: string;
  oldRate: string;
  newRate: string;
  oldFringe: string;
  newFringe: string;
  /** (new base + new fringe) − (old base + old fringe), two decimals, signed. */
  delta: string;
  workers: string[];
};

export type RemovedEntry = { label: string; workers: string[] };
export type AddedEntry = { label: string; rate: string; fringe: string };

export type WdDiff = {
  changed: ChangedEntry[];
  removed: RemovedEntry[];
  added: AddedEntry[];
  /** Distinct workers touched by `changed` or `removed`. */
  affectedWorkerCount: number;
  /** Distinct workers mapped on the project at all — the email's denominator. */
  mappedWorkerCount: number;
};

/** The same normalisation `kb_classifications.search_label` is written with. */
export function normaliseForMatch(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function keyOf(row: DiffClassification): string {
  return row.searchLabel && row.searchLabel.length > 0
    ? row.searchLabel
    : normaliseForMatch(row.classificationLabel);
}

function money(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function signed(delta: number): string {
  const rounded = Math.round(delta * 100) / 100;
  return `${rounded >= 0 ? '+' : '−'}${Math.abs(rounded).toFixed(2)}`;
}

function sameMoney(a: string, b: string): boolean {
  return money(a).toFixed(2) === money(b).toFixed(2);
}

/**
 * Diff two modifications of one determination, scoped to a project's crew.
 *
 * `fromRows` and `toRows` are the classification lists of the OLD and the NEW
 * modification. `mapped` is the project's open worker→classification rows.
 */
export function diffDetermination(input: {
  fromRows: DiffClassification[];
  toRows: DiffClassification[];
  mapped: MappedWorker[];
}): WdDiff {
  const toByKey = new Map<string, DiffClassification>();
  const toByVerbatim = new Map<string, DiffClassification>();
  for (const row of input.toRows) {
    // First writer wins: a determination that lists the same label twice
    // (MN20260080 does) is matched on its first occurrence, deterministically.
    if (!toByKey.has(keyOf(row))) toByKey.set(keyOf(row), row);
    if (!toByVerbatim.has(row.classificationLabel)) toByVerbatim.set(row.classificationLabel, row);
  }
  const fromByKey = new Map<string, DiffClassification>();
  for (const row of input.fromRows) {
    if (!fromByKey.has(keyOf(row))) fromByKey.set(keyOf(row), row);
  }

  // The project's crew, grouped by the label the mapping copied.
  const workersByLabel = new Map<string, { label: string; names: string[]; ids: Set<string> }>();
  for (const worker of input.mapped) {
    const key = normaliseForMatch(worker.classificationLabel);
    const entry = workersByLabel.get(key) ?? {
      label: worker.classificationLabel,
      names: [],
      ids: new Set<string>(),
    };
    if (!entry.ids.has(worker.workerId)) {
      entry.ids.add(worker.workerId);
      entry.names.push(worker.workerName);
    }
    workersByLabel.set(key, entry);
  }

  const changed: ChangedEntry[] = [];
  const removed: RemovedEntry[] = [];
  const affected = new Set<string>();
  const allMapped = new Set(input.mapped.map((m) => m.workerId));

  for (const [key, entry] of workersByLabel) {
    const before = fromByKey.get(key);
    const after = toByKey.get(key) ?? toByVerbatim.get(entry.label);

    if (!after) {
      removed.push({ label: entry.label, workers: entry.names });
      for (const id of entry.ids) affected.add(id);
      continue;
    }
    // No `before` row means the mapping was made against a modification we no
    // longer hold; compare against the mapping's own copied rates instead of
    // guessing, which the caller supplies as the `from` list.
    if (!before) continue;

    if (sameMoney(before.baseRate, after.baseRate) && sameMoney(before.fringeRate, after.fringeRate)) {
      continue;
    }
    changed.push({
      label: entry.label,
      oldRate: money(before.baseRate).toFixed(2),
      newRate: money(after.baseRate).toFixed(2),
      oldFringe: money(before.fringeRate).toFixed(2),
      newFringe: money(after.fringeRate).toFixed(2),
      delta: signed(
        money(after.baseRate) + money(after.fringeRate) - money(before.baseRate) - money(before.fringeRate),
      ),
      workers: entry.names,
    });
    for (const id of entry.ids) affected.add(id);
  }

  // Informational: classifications that appear in the new modification and not
  // in the old one. Never a reason to email on its own (V2).
  const added: AddedEntry[] = [];
  for (const row of input.toRows) {
    if (fromByKey.has(keyOf(row))) continue;
    if (added.some((a) => normaliseForMatch(a.label) === keyOf(row))) continue;
    added.push({
      label: row.classificationLabel,
      rate: money(row.baseRate).toFixed(2),
      fringe: money(row.fringeRate).toFixed(2),
    });
  }

  changed.sort((a, b) => a.label.localeCompare(b.label));
  removed.sort((a, b) => a.label.localeCompare(b.label));
  added.sort((a, b) => a.label.localeCompare(b.label));

  return {
    changed,
    removed,
    added,
    affectedWorkerCount: affected.size,
    mappedWorkerCount: allMapped.size,
  };
}

/** V2's test, in one place: an email is sent only when the project's own work
 *  moved. An addition is an in-app notice and nothing more. */
export function diffWarrantsEmail(diff: WdDiff): boolean {
  return diff.changed.length > 0 || diff.removed.length > 0;
}

/** V5 — a removal is a re-mapping decision, not a rate change, and it blocks
 *  acceptance until those workers are re-mapped. */
export function acceptanceIsBlocked(diff: WdDiff): boolean {
  return diff.removed.length > 0;
}

/**
 * The UNSCOPED diff — every classification in the document, not a project's
 * four. WL-14's public watch is keyed to a determination and not to a project,
 * so it has no crew to scope by; it is the same arithmetic with the whole `from`
 * list standing in for the mapping.
 *
 * The synthetic worker names are stripped: nobody is mapped to anything here,
 * and an empty name in an email is worse than no column.
 */
export function diffWholeDetermination(
  fromRows: DiffClassification[],
  toRows: DiffClassification[],
): WdDiff {
  const mapped: MappedWorker[] = fromRows.map((row, index) => ({
    classificationLabel: row.classificationLabel,
    workerName: '',
    workerId: `row_${index}`,
  }));
  const diff = diffDetermination({ fromRows, toRows, mapped });
  return {
    ...diff,
    changed: diff.changed.map((entry) => ({ ...entry, workers: [] })),
    removed: diff.removed.map((entry) => ({ ...entry, workers: [] })),
    affectedWorkerCount: 0,
    mappedWorkerCount: 0,
  };
}
