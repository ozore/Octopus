/**
 * The L2 markdown dialect parser — pure, no I/O, no dependencies.
 *
 * Spec: CORPUS_DESIGN.md §3.3.2. An L2 file is:
 *
 *   ---
 *   key: value            <- policy source front matter
 *   ---
 *
 *   ## clause: amz.psaa#divert-transactions
 *   heading: ...          <- contiguous clause metadata lines
 *   excerpt: "..."
 *
 *   Our prose paragraph.  <- everything after the metadata block, split on
 *                            blank lines, is `ourSummary` — one paragraph per
 *                            citation content block (§5.2).
 *
 * Why a hand-rolled parser rather than a YAML dependency: the dialect is
 * deliberately tiny, the corpus build must be byte-deterministic for the prompt
 * cache (ADR-003), and a general YAML loader's coercion rules are a poor thing
 * to have between a policy document and a customer-facing citation. Anything
 * this parser cannot represent is a signal that the record wants to be simpler,
 * not that the parser wants to be bigger.
 *
 * Nested YAML structures (the `stub_entries` block in `_stubs.md`) are captured
 * verbatim as an unparsed string rather than interpreted. They are documentation
 * for humans; the loader never reads them.
 */

export type Scalar = string | number | boolean | null;
export type FrontMatterValue = Scalar | Scalar[];
export type FrontMatter = Record<string, FrontMatterValue>;

export type ParsedClauseSection = {
  clauseId: string;
  meta: FrontMatter;
  paragraphs: string[];
};

export type ParsedPolicyFile = {
  frontMatter: FrontMatter;
  clauses: ParsedClauseSection[];
};

const FRONT_MATTER_DELIM = '---';
const CLAUSE_HEADER = /^## clause:\s*(\S+)\s*$/;
const META_LINE = /^([a-z][a-z0-9_]*):\s?([\s\S]*)$/;

export function parseScalar(raw: string): Scalar {
  const v = raw.trim();
  if (v === '' || v === 'null' || v === '~') return null;
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

export function parseValue(raw: string): FrontMatterValue {
  const v = raw.trim();
  if (v.startsWith('[') && v.endsWith(']')) {
    const inner = v.slice(1, -1).trim();
    if (inner === '') return [];
    return inner.split(',').map((entry) => parseScalar(entry));
  }
  return parseScalar(v);
}

/**
 * Parse `key: value` lines at indentation zero. A key whose value is empty, or
 * is a YAML block scalar marker (`>`, `>-`, `|`, `|-`), consumes the following
 * more-indented lines: folded markers join them with single spaces, everything
 * else is kept as an unparsed blob.
 */
export function parseKeyedBlock(lines: string[]): FrontMatter {
  const out: FrontMatter = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i]!;
    if (line.trim() === '' || /^\s/.test(line)) {
      i += 1;
      continue;
    }
    const m = META_LINE.exec(line);
    if (!m) {
      i += 1;
      continue;
    }
    const key = m[1]!;
    const rawValue = (m[2] ?? '').trim();
    const isFolded = rawValue === '>' || rawValue === '>-';
    const isBlock = isFolded || rawValue === '|' || rawValue === '|-';

    if (rawValue !== '' && !isBlock) {
      out[key] = parseValue(rawValue);
      i += 1;
      continue;
    }

    // Consume the indented continuation.
    const continuation: string[] = [];
    i += 1;
    while (i < lines.length && (lines[i]!.trim() === '' || /^\s/.test(lines[i]!))) {
      continuation.push(lines[i]!.replace(/^\s+/, ''));
      i += 1;
    }
    while (continuation.length > 0 && continuation[continuation.length - 1] === '') {
      continuation.pop();
    }
    out[key] = isFolded || rawValue === ''
      ? continuation.filter((l) => l !== '').join(' ').trim()
      : continuation.join('\n');
  }
  return out;
}

export function splitFrontMatter(text: string): { frontMatter: string[]; body: string[] } {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  if (lines[0]?.trim() !== FRONT_MATTER_DELIM) {
    throw new Error('corpus file is missing its front matter delimiter');
  }
  const end = lines.findIndex((l, idx) => idx > 0 && l.trim() === FRONT_MATTER_DELIM);
  if (end === -1) throw new Error('corpus file front matter is unterminated');
  return { frontMatter: lines.slice(1, end), body: lines.slice(end + 1) };
}

export function parsePolicyFile(text: string): ParsedPolicyFile {
  const { frontMatter, body } = splitFrontMatter(text);
  const fm = parseKeyedBlock(frontMatter);

  const clauses: ParsedClauseSection[] = [];
  let current: { clauseId: string; lines: string[] } | null = null;

  const flush = () => {
    if (!current) return;
    // Contiguous leading metadata lines, then prose.
    const metaLines: string[] = [];
    let idx = 0;
    while (idx < current.lines.length) {
      const line = current.lines[idx]!;
      if (line.trim() === '') {
        if (metaLines.length === 0) {
          idx += 1;
          continue;
        }
        break;
      }
      if (!META_LINE.test(line)) break;
      metaLines.push(line);
      idx += 1;
    }
    const meta = parseKeyedBlock(metaLines);
    const prose = current.lines.slice(idx).join('\n');
    const paragraphs = prose
      .split(/\n\s*\n/)
      .map((p) => p.trim().replace(/\s*\n\s*/g, ' '))
      .filter((p) => p !== '');
    clauses.push({ clauseId: current.clauseId, meta, paragraphs });
    current = null;
  };

  for (const line of body) {
    const header = CLAUSE_HEADER.exec(line);
    if (header) {
      flush();
      current = { clauseId: header[1]!, lines: [] };
      continue;
    }
    if (current) current.lines.push(line);
  }
  flush();

  return { frontMatter: fm, clauses };
}

export function wordCount(text: string): number {
  return text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
}
