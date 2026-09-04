/**
 * The determination parser.
 *
 * A SAM.gov `document` is the complete Davis-Bacon general wage determination
 * as PLAIN TEXT — header, county list, modification table, rate groups,
 * classifications with base rate and fringe, the welders rule, the Executive
 * Order notes and the conformance sentence. Nothing is behind a PDF, and that
 * is the single fact the whole product rests on (KNOWLEDGE_BASE F1/KB-2).
 *
 * This is a direct port of the reference parser committed by the knowledge-base
 * fleet at `phase-4-revenue/wagelens/kb-samples/parse-wd-document.py`, which
 * measured **1,129 of 1,130 rate lines — 99.91% coverage** on a random
 * 40-determination national sample. The regexes are deliberately identical, so
 * the reference and the implementation can be diffed line for line; the
 * additions are the ones the schema needs and the reference did not produce:
 * `lineNo`, `searchLabel`, `tradeFamily`, `qualifier` and `coverage`.
 *
 * WHAT IT MUST NOT DO, and does not:
 *  - invent a rate, a fringe or a modification;
 *  - "fix" mojibake. SAM returns `�` where the source had typographic
 *    quotes; `documentText` keeps it verbatim because it is evidence, and only
 *    `searchLabel` is normalised;
 *  - drop a repeated classification label. MN20260080 lists the same surveyor
 *    twice at different project values, so identity is `(wdId, lineNo)`.
 */

/** Bump when the parse OUTPUT changes; `kb.reparse` re-derives rows offline. */
export const PARSER_VERSION = '2026-09-03.1';

const RATE_GROUP =
  /^\s{0,2}([A-Z]{2,6}[0-9]{3,4}-[0-9]{3}|SU[A-Z]{2}[0-9]{4}-[0-9]{3}|UAVG-[A-Z]{2}-[0-9]{4}|SA[A-Z]{2}[0-9]{4}-[0-9]{3}|SC[A-Z0-9-]+)\s+([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{4})\s*$/;
/**
 * ONE DELIBERATE DIVERGENCE FROM THE REFERENCE PARSER, and the reason is a
 * fixture the reviewer required. The reference regex ends the fringe at the end
 * of the line, so it misses a fringe carrying a FOOTNOTE MARKER:
 *
 *   ELEVATOR MECHANIC................$ 53.59       38.435+a+b
 *
 * That line is in `sam-wd-detail-TX20260253-rev0.json` — the superseded
 * revision B3/B4 are proved on. With the reference regex the rev-0 document
 * parses to 53 of 54 rate lines (0.9815) and gate G3 rolls the whole
 * determination back, so the differentiator's own test data could not be
 * ingested. The trailing group captures the marker into `footnoteText` and is
 * bounded to a short run of `[A-Za-z*+]` so it cannot swallow prose.
 */
const RATE_LINE =
  /^(.*?)\.{2,}\$\s*([0-9][0-9,]*\.?[0-9]*)(?:\s+([0-9][0-9,]*\.?[0-9]*)([A-Za-z*+]{1,12})?)?\s*$/;
const SEP = /^-{20,}$/;
const MODLINE = /^\s*([0-9]{1,3})\s+([0-9]{2}\/[0-9]{2}\/[0-9]{4})\s*$/;
/** Gate G3's denominator: the naive count of "something … $ number" lines. */
const NAIVE_RATE_LINE = /\.{2,}\$\s*[0-9]/;

export type ParsedRateGroup = {
  identifier: string;
  kind: 'union' | 'survey' | 'union_average' | 'state_adopted' | 'supplemental';
  effectiveDate: string;
};

export type ParsedClassification = {
  lineNo: number;
  rateGroupIdentifier: string;
  rateGroupEffectiveDate: string;
  classificationLabel: string;
  searchLabel: string;
  tradeFamily: string | null;
  qualifier: string | null;
  /** The footnote marker printed beside the fringe (`+a+b`, `**`), when the
   *  determination prints one. The FOOTNOTES block itself stays in
   *  `documentText`, which is the evidence. */
  footnoteText: string | null;
  baseRate: number;
  fringeRate: number;
};

export type ParsedModification = {
  modificationNumber: number;
  publicationDate: string;
};

export type ParsedDetermination = {
  wdNumber: string | null;
  publicationDate: string | null;
  state: string | null;
  constructionTypes: string[];
  counties: string[];
  modifications: ParsedModification[];
  rateGroups: ParsedRateGroup[];
  classifications: ParsedClassification[];
  notes: {
    welders: boolean;
    eo13706PaidSickLeave: boolean;
    conformanceRequiredForUnlisted: boolean;
  };
  /** parsed rows ÷ naive rate lines. Gate G3 requires ≥ 0.995. */
  coverage: number;
  naiveRateLines: number;
  parserVersion: string;
};

function rateGroupKind(identifier: string): ParsedRateGroup['kind'] {
  if (identifier.startsWith('SU')) return 'survey';
  if (identifier.startsWith('UAVG')) return 'union_average';
  if (identifier.startsWith('SA')) return 'state_adopted';
  if (identifier.startsWith('SC')) return 'supplemental';
  return 'union';
}

/** `MM/DD/YYYY` → `YYYY-MM-DD`. SAM prints the American order everywhere. */
export function toIsoDate(american: string): string {
  const parts = american.split('/');
  const [m, d, y] = parts;
  if (!m || !d || !y) return american;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

/** Collapsed whitespace, lowercase, no punctuation. Used for search only —
 *  never written back over `classificationLabel`. */
export function normaliseLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[‘’“”]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const TRADE_FAMILIES: Array<[string, RegExp]> = [
  ['electrician', /\bELECTRICIAN|LINE CONSTRUCTION|LOW VOLTAGE\b/],
  ['plumber', /\bPLUMBER|PIPEFITTER|STEAMFITTER\b/],
  ['carpenter', /\bCARPENTER|MILLWRIGHT|PILEDRIVER|FORM\b/],
  ['ironworker', /\bIRONWORKER|REINFORCING|STRUCTURAL STEEL\b/],
  ['operator', /\bOPERATOR|CRANE|BACKHOE|BULLDOZER|EXCAVATOR\b/],
  ['labourer', /\bLABORER|LABOURER\b/],
  ['truck_driver', /\bTRUCK DRIVER|DRIVER\b/],
  ['painter', /\bPAINTER|GLAZIER|DRYWALL FINISHER|TAPER\b/],
  ['mason', /\bBRICKLAYER|CEMENT MASON|PLASTERER|TILE|TERRAZZO|MARBLE\b/],
  ['roofer', /\bROOFER|WATERPROOF\b/],
  ['sheet_metal', /\bSHEET METAL|HVAC\b/],
  ['insulator', /\bINSULATOR|ASBESTOS\b/],
  ['sprinkler', /\bSPRINKLER\b/],
  ['elevator', /\bELEVATOR\b/],
  ['surveyor', /\bSURVEY\b/],
];

function tradeFamilyOf(label: string): string | null {
  for (const [family, pattern] of TRADE_FAMILIES) if (pattern.test(label)) return family;
  return null;
}

/**
 * Best-effort qualifier extraction. The label is ALWAYS kept verbatim; this is
 * an extra column for the picker, so a surveyor at `+$760,000` and the same
 * surveyor at `-$760,000` read as two different things to a human as well as to
 * the unique index. When nothing is recognisable it is null, never a guess.
 */
function qualifierOf(label: string): string | null {
  const projectValue = /([+-]\s*\$\s?[0-9][0-9,]*(?:\.[0-9]+)?)/.exec(label);
  if (projectValue?.[1]) return projectValue[1].replace(/\s+/g, '');
  const parenthetical = /\(([^)]{3,80})\)\s*$/.exec(label.trim());
  if (parenthetical?.[1]) return parenthetical[1].trim();
  return null;
}

export function parseDetermination(document: string): ParsedDetermination {
  let text = document;
  if (text.startsWith('"')) text = text.slice(1);
  if (text.endsWith('"')) text = text.slice(0, -1);
  const lines = text.split('\n');

  const out: ParsedDetermination = {
    wdNumber: null,
    publicationDate: null,
    state: null,
    constructionTypes: [],
    counties: [],
    modifications: [],
    rateGroups: [],
    classifications: [],
    notes: { welders: false, eo13706PaidSickLeave: false, conformanceRequiredForUnlisted: false },
    coverage: 0,
    naiveRateLines: 0,
    parserVersion: PARSER_VERSION,
  };

  const header = /General Decision Number:\s*([A-Z]{2}[0-9]{8})\s+([0-9]{2}\/[0-9]{2}\/[0-9]{4})/.exec(
    text,
  );
  if (header?.[1] && header[2]) {
    out.wdNumber = header[1];
    out.publicationDate = toIsoDate(header[2]);
  }

  const state = /^State:\s*(.+)$/m.exec(text);
  if (state?.[1]) out.state = state[1].trim();

  const types = /^Construction Types?:\s*(.+)$/m.exec(text);
  if (types?.[1]) {
    out.constructionTypes = types[1]
      .split(/[,&]| and /)
      .map((c) => c.trim())
      .filter(Boolean);
  }

  // The county block runs from "Counties:" (or "County:") to the modification
  // table. A determination that covers a whole state still enumerates them; an
  // empty list is treated as statewide by `lookup`.
  const countyBlock = /^(?:Counties|County):\s*([\s\S]*?)(?=\n\s*Modification Number)/m.exec(text);
  if (countyBlock?.[1]) {
    // FIRST PARAGRAPH ONLY. SAM prints two county headers in the wild:
    //   "Counties: Texas Counties of\nHarris"            (the common form)
    //   "County: Harris County in Texas.\n\nBUILDING …"   (TX20260253 mod 0)
    // The second is followed by a scope paragraph, and the reference parser
    // returned all three lines as "counties". These names are informational —
    // `kb_wd_counties` is written from the INDEX record, which carries SAM's
    // numeric county codes, and a name string queries SAM for nothing (KB-1) —
    // but a determination page that lists "homes or apartments up to and
    // including 4 stories)" as a county is not a page anyone would trust.
    const blob = (countyBlock[1].trim().split(/\n\s*\n/)[0] ?? '')
      .replace(/^[A-Za-z .]+Count(?:ies|y)\s+of\s*/, '')
      .replace(/\s*Count(?:ies|y)\s+in\s+[A-Za-z ]+\.?\s*$/, '');
    out.counties = blob
      .split(/\n|,/)
      .map((c) => c.trim().replace(/\.$/, ''))
      .filter((c) => c.length > 0 && !c.includes('Statewide'));
  }

  let inModTable = false;
  for (const line of lines) {
    if (line.includes('Modification Number') && line.includes('Publication Date')) {
      inModTable = true;
      continue;
    }
    if (!inModTable) continue;
    const mod = MODLINE.exec(line);
    if (mod?.[1] && mod[2]) {
      out.modifications.push({
        modificationNumber: Number(mod[1]),
        publicationDate: toIsoDate(mod[2]),
      });
    } else if (line.trim() && !line.trim().startsWith('-')) {
      inModTable = false;
    }
  }

  let group: ParsedRateGroup | null = null;
  let buffer: string[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i] ?? '';
    const line = raw.replace(/\s+$/, '');
    if (NAIVE_RATE_LINE.test(line)) out.naiveRateLines += 1;

    const groupMatch = RATE_GROUP.exec(line);
    if (groupMatch?.[1] && groupMatch[2]) {
      group = {
        identifier: groupMatch[1],
        kind: rateGroupKind(groupMatch[1]),
        effectiveDate: toIsoDate(groupMatch[2]),
      };
      out.rateGroups.push(group);
      buffer = [];
      continue;
    }

    if (SEP.test(line.trim()) || (line.includes('Rates') && line.includes('Fringes'))) {
      buffer = [];
      continue;
    }

    const rate = RATE_LINE.exec(line);
    if (rate && group) {
      const tail = rate[1] ?? '';
      const label = [...buffer, tail].join(' ').replace(/\s+/g, ' ').trim();
      out.classifications.push({
        lineNo: i,
        rateGroupIdentifier: group.identifier,
        rateGroupEffectiveDate: group.effectiveDate,
        classificationLabel: label,
        searchLabel: normaliseLabel(label),
        tradeFamily: tradeFamilyOf(label),
        qualifier: qualifierOf(label),
        footnoteText: rate[4] ? rate[4] : null,
        baseRate: Number((rate[2] ?? '0').replace(/,/g, '')),
        // A classification that prints no fringe is 0.00, never null: column 6B
        // of the form needs a number.
        fringeRate: Number((rate[3] ?? '0').replace(/,/g, '')),
      });
      buffer = [];
    } else if (line.trim() && group !== null) {
      buffer.push(line.trim());
      if (buffer.length > 12) buffer = buffer.slice(-12);
    }
  }

  out.notes.welders = /WELDERS\s*-\s*Receive rate prescribed/.test(text);
  out.notes.eo13706PaidSickLeave = text.includes('Executive Order (EO) 13706');
  out.notes.conformanceRequiredForUnlisted = text.includes('Unlisted classifications needed');

  out.coverage =
    out.naiveRateLines === 0 ? 1 : out.classifications.length / out.naiveRateLines;

  return out;
}

/** WL-13 V5: a document that does not carry this string is not a determination
 *  and is rejected rather than stored. */
export function looksLikeDetermination(document: string | null | undefined): boolean {
  return typeof document === 'string' && document.includes('General Decision Number:');
}
