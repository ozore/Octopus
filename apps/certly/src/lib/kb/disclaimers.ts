/**
 * THE ONLY PLACE A CERTLY DISCLAIMER TEXT IS WRITTEN IN CODE.
 *
 * Transcribed verbatim from `phase-4-revenue/certly/KNOWLEDGE_BASE.md` §F.1,
 * §F.2 and §F.3, which is itself the only place they are written in prose
 * (REVIEW.md B-12). Every surface renders these strings through
 * `<Disclaimer />`; no other module, component, email template, help article,
 * marketing string or test fixture may restate, paraphrase or shorten one.
 *
 * `specs/13` §12 enforces both halves and `tests/disclaimers.test.ts`
 * implements them:
 *   1. the string appears verbatim on each of its eleven required surfaces;
 *   2. a near-duplicate string ANYWHERE else in the repo fails the build.
 *
 * If you are here because you want a shorter version for a small space: the
 * answer is a link to /legal/disclaimer, not a second text. The reason the
 * grep guard exists is that the identity document and the specs once carried
 * two different disclaimers and only one of them could pass the test.
 */

export type DisclaimerKey = 'primary' | 'templates' | 'extracted_fields';

export type Disclaimer = {
  key: DisclaimerKey;
  /** The bolded lead line. Rendered as the first line, never on its own. */
  heading: string;
  /** The body, one paragraph, verbatim from KNOWLEDGE_BASE.md §F. */
  body: string;
  /** Where KNOWLEDGE_BASE.md defines it, printed in the legal pages. */
  source: string;
};

/** §F.1 — on every certificate result, every gap report, every export. */
const PRIMARY: Disclaimer = {
  key: 'primary',
  heading: 'Certly reads documents. It does not verify coverage.',
  body:
    'A certificate of insurance is issued as a matter of information only and confers no rights on ' +
    'the certificate holder. Certly extracts what a document says and compares it to the requirements ' +
    'you entered. It does not confirm that a policy is in force, that an endorsement exists, or that ' +
    'coverage would respond to a claim. Only the insurer can confirm coverage, and only your own ' +
    'counsel or broker can tell you whether your requirements are the right ones.',
  source: 'KNOWLEDGE_BASE.md §F.1',
};

/** §F.2 — on requirement templates and the template picker. */
const TEMPLATES: Disclaimer = {
  key: 'templates',
  heading: 'Templates are starting points, not advice.',
  body:
    'These suggested limits come from published industry sources and real contract exhibits, each ' +
    'dated and linked. They are not legal or insurance advice and they are not a substitute for your ' +
    'contract, your lease or your subcontract. Your own agreement always governs. Edit these before ' +
    'you rely on them.',
  source: 'KNOWLEDGE_BASE.md §F.2',
};

/** §F.3 — on extracted fields shown for review. */
const EXTRACTED_FIELDS: Disclaimer = {
  key: 'extracted_fields',
  heading: 'Read from the document, not verified.',
  body:
    'This value was read from the uploaded document by an automated system and may be wrong. Fields ' +
    'below our confidence threshold are marked for review. You are responsible for the values you accept.',
  source: 'KNOWLEDGE_BASE.md §F.3',
};

export const disclaimers: Record<DisclaimerKey, Disclaimer> = {
  primary: PRIMARY,
  templates: TEMPLATES,
  extracted_fields: EXTRACTED_FIELDS,
};

export const disclaimerList: Disclaimer[] = [PRIMARY, TEMPLATES, EXTRACTED_FIELDS];

/**
 * The eleven surfaces, KNOWLEDGE_BASE.md §F.4. Each row is an acceptance
 * criterion in its own spec; the `route` column is what the coverage test in
 * `tests/disclaimers.test.ts` walks, and what sub-wave B fills in as it builds
 * each surface. A surface that renders a status and is missing from this table
 * is a bug in the table, not an exemption.
 */
export type DisclaimerSurface = {
  n: number;
  surface: string;
  keys: DisclaimerKey[];
  /** The route, or null while the surface is still unbuilt (sub-wave B). */
  route: string | null;
  spec: string;
  /** The sub-wave A module that owns it, or the sub-wave B spec that will. */
  owner: string;
};

export const DISCLAIMER_SURFACES: DisclaimerSurface[] = [
  { n: 1, surface: 'Certificate detail / review screen', keys: ['primary', 'extracted_fields'], route: null, spec: 'specs/03 A10', owner: 'M4' },
  { n: 2, surface: 'Vendor status dashboard', keys: ['primary'], route: '/dashboard', spec: 'specs/06 A9', owner: 'M6' },
  { n: 3, surface: 'Vendor / party detail', keys: ['primary'], route: null, spec: 'specs/04 A7', owner: 'M3 (UI in sub-wave B)' },
  { n: 4, surface: 'Expiry timeline', keys: ['primary'], route: null, spec: 'specs/06 A9', owner: 'M6' },
  { n: 5, surface: 'Global search result row rendering a pill', keys: ['primary'], route: null, spec: 'specs/06 A9', owner: 'M6' },
  { n: 6, surface: 'Mobile card list', keys: ['primary'], route: null, spec: 'specs/06 A9', owner: 'M6' },
  { n: 7, surface: 'Every PDF and CSV export', keys: ['primary'], route: null, spec: 'specs/12 A4', owner: 'M12' },
  { n: 8, surface: 'The shared report link /r/[token]', keys: ['primary'], route: null, spec: 'specs/12 A12', owner: 'M12' },
  { n: 9, surface: 'Requirement-template picker and editor', keys: ['templates'], route: '/requirements/library', spec: 'specs/02 A8', owner: 'M2' },
  { n: 10, surface: 'Vendor/agent email and the no-login upload page', keys: ['primary'], route: null, spec: 'specs/07 A9, specs/08 A9', owner: 'M7, M8' },
  { n: 11, surface: 'The Free Gap Report — on-screen and PDF', keys: ['primary', 'templates'], route: null, spec: 'specs/15 A4', owner: 'M15' },
];
