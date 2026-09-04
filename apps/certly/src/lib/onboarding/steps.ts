/**
 * The six-step path — `specs/11` §3, as a state machine with no I/O.
 *
 * Resumable, skippable, never modal-trapping. Two steps are enforced by the
 * DATA rather than by the UI: a certificate cannot be uploaded before a vendor
 * exists, and a comparison cannot run before a requirement set exists. The UI
 * EXPLAINS those rather than blocking silently, which is what `prerequisite`
 * below is for.
 *
 * Step 4's paste box comes before the CSV importer, deliberately: the fastest
 * path out of a spreadsheet is copy-a-column-and-paste, and making people find,
 * export and map a CSV first loses the people who would have pasted in ten
 * seconds.
 */

export const ONBOARDING_STEPS = [
  'who',
  'entity',
  'requirements',
  'vendors',
  'certificate',
  'finding',
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export type StepSpec = {
  key: OnboardingStep;
  n: number;
  title: string;
  /** One job per screen, said in one line. */
  lede: string;
  /** The step that must be complete first, enforced by the data (§7). */
  prerequisite: OnboardingStep | null;
  /** The sentence the UI shows instead of a silent block. */
  prerequisiteReason?: string;
};

export const STEP_SPECS: StepSpec[] = [
  {
    key: 'who',
    n: 1,
    title: 'Who are you?',
    lede: 'This picks the requirement templates you see first. Change it any time.',
    prerequisite: null,
  },
  {
    key: 'entity',
    n: 2,
    title: 'Your entity',
    lede: 'The exact name and address that should appear as certificate holder.',
    prerequisite: null,
  },
  {
    key: 'requirements',
    n: 3,
    title: 'What you require',
    lede: 'Start from a sourced template and change the numbers that are wrong.',
    prerequisite: null,
  },
  {
    key: 'vendors',
    n: 4,
    title: 'Your vendors',
    lede: 'Paste the list. One per line, or “Name, email”.',
    prerequisite: null,
  },
  {
    key: 'certificate',
    n: 5,
    title: 'One certificate',
    lede: 'Any vendor, any recent COI. This is the part that shows you what we do.',
    prerequisite: 'vendors',
    prerequisiteReason: 'A certificate belongs to a vendor, so add one vendor first.',
  },
  {
    key: 'finding',
    n: 6,
    title: 'The finding',
    lede: 'What the document evidences, what it only claims, and what is missing.',
    prerequisite: 'certificate',
    prerequisiteReason: 'The finding appears once a certificate has been read.',
  },
];

export function stepSpec(step: OnboardingStep): StepSpec {
  const found = STEP_SPECS.find((spec) => spec.key === step);
  if (!found) throw new Error(`unknown onboarding step ${step}`);
  return found;
}

export function isOnboardingStep(value: unknown): value is OnboardingStep {
  return typeof value === 'string' && (ONBOARDING_STEPS as readonly string[]).includes(value);
}

export type StepsCompleted = Partial<Record<OnboardingStep, boolean>>;

export function completedCount(steps: StepsCompleted): number {
  return ONBOARDING_STEPS.filter((step) => steps[step]).length;
}

/**
 * Where to resume. NOT "the next uncompleted step in order" — a customer who
 * completed 1, 2 and 4 and closed the tab should land on 3, and A7 asks for
 * exactly that: the first step that is still open.
 */
export function resumeStep(steps: StepsCompleted): OnboardingStep {
  return ONBOARDING_STEPS.find((step) => !steps[step]) ?? 'finding';
}

/** The step's prerequisite, when it is not yet satisfied. */
export function blockedBy(step: OnboardingStep, steps: StepsCompleted): StepSpec | null {
  const spec = stepSpec(step);
  if (!spec.prerequisite) return null;
  return steps[spec.prerequisite] ? null : stepSpec(spec.prerequisite);
}

export function nextStep(step: OnboardingStep): OnboardingStep | null {
  const index = ONBOARDING_STEPS.indexOf(step);
  return ONBOARDING_STEPS[index + 1] ?? null;
}

export const AUDIENCES = [
  { key: 'pm', label: 'Property manager', note: 'Rental properties and their vendors' },
  { key: 'hoa', label: 'HOA or community association', note: 'Associations and their contractors' },
  { key: 'gc', label: 'General contractor', note: 'Subcontractors on your projects' },
  { key: 'tenant', label: 'Commercial landlord', note: 'Tenants and their certificates' },
] as const;

export type Audience = (typeof AUDIENCES)[number]['key'];

export function isAudience(value: unknown): value is Audience {
  return typeof value === 'string' && AUDIENCES.some((entry) => entry.key === value);
}
