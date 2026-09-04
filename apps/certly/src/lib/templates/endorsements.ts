/**
 * The endorsement-form glossary — `KNOWLEDGE_BASE.md` §C as data.
 *
 * Per form: what it is, WHAT IT PROVES, WHAT IT DOES NOT PROVE, and where that
 * was verified. The "does not prove" column is the one that earns its place:
 * `CG 20 10` is additional insured for ONGOING operations and is not evidence
 * of completed operations, of primary-and-non-contributory, or of a waiver —
 * and three requirement rows exist precisely because a certificate showing one
 * is not evidence of another.
 *
 * Editions are data, not decoration. "A 1985 and a 2013 edition of the same
 * number are materially different contracts" (§C.1), and from the 04 13 edition
 * onward additional-insured cover is the LESSER of the contractually required
 * limit and the policy limit — which Certly notes and does not adjudicate,
 * because that is a coverage opinion and coverage opinions are not ours to give
 * (KB §F).
 */

import type { EndorsementKey } from '../engine';

export type GlossaryEntry = {
  /** The base form number, normalised: `CG 20 10`. */
  form: string;
  /** A specific edition when the edition IS the requirement, e.g. `11 85`. */
  edition: string | null;
  title: string;
  family: 'additional_insured_gl' | 'primary_non_contributory' | 'waiver' | 'automobile' | 'federal';
  /** The requirement keys this form can evidence. */
  evidences: EndorsementKey[];
  proves: string;
  doesNotProve: string;
  /** Fetched and dated, per PLAN.md §A10. */
  source: { url: string; last_verified: string };
  /** Where the form itself appears in `kb-samples/`, when it does. */
  corpus: string[];
  note?: string;
};

export const endorsementGlossary: GlossaryEntry[] = [
  {
    form: 'CG 20 10',
    edition: null,
    title: 'Additional Insured — Owners, Lessees or Contractors — Scheduled Person Or Organization',
    family: 'additional_insured_gl',
    evidences: ['additional_insured_ongoing'],
    proves:
      "additional-insured status for liability arising from the named insured's ONGOING operations for the scheduled party",
    doesNotProve: 'completed operations; primary and non-contributory; waiver of subrogation',
    source: { url: 'https://getjones.com/endorsements/general-liability/CG20101219', last_verified: '2026-09-03' },
    corpus: ['C8', 'C10', 'C12'],
  },
  {
    form: 'CG 20 10',
    edition: '11 85',
    title: 'Additional Insured — Owners, Lessees or Contractors (1985 edition)',
    family: 'additional_insured_gl',
    evidences: ['additional_insured_ongoing', 'additional_insured_completed'],
    proves:
      'the broad "arising out of your work" wording that many courts read to include completed operations',
    doesNotProve:
      'anything at all, if the carrier issued a later edition — the edition is the contract, and W. L. Butler asks for this one by name',
    source: {
      url: 'https://www.irmi.com/articles/expert-commentary/2013-iso-additional-insured-endorsements-putting-the-changes-into-context-for-the-construction-industry',
      last_verified: '2026-09-03',
    },
    corpus: ['R1', 'R2'],
  },
  {
    form: 'CG 20 37',
    edition: null,
    title: 'Additional Insured — Owners, Lessees or Contractors — Completed Operations',
    family: 'additional_insured_gl',
    evidences: ['additional_insured_completed'],
    proves: 'additional-insured status for the products–completed operations hazard',
    doesNotProve: 'ongoing operations — it is the COMPANION to CG 20 10, not a replacement',
    source: { url: 'https://www.smartinsured.com/blog/iso-additional-insured-forms-cg-20-10-cg-20-37', last_verified: '2026-09-03' },
    corpus: ['R1', 'R2', 'C3'],
  },
  {
    form: 'CG 20 26',
    edition: null,
    title: 'Additional Insured — Designated Person Or Organization',
    family: 'additional_insured_gl',
    evidences: ['additional_insured_ongoing', 'additional_insured_completed'],
    proves: 'additional-insured status for a designated party, not tied to a construction relationship',
    doesNotProve: 'anything beyond what its schedule names',
    source: { url: 'https://www.smartinsured.com/blog/iso-additional-insured-forms-cg-20-10-cg-20-37', last_verified: '2026-09-03' },
    corpus: ['C8', 'C9', 'C11'],
  },
  {
    form: 'CG 20 33',
    edition: null,
    title:
      'Additional Insured — Owners, Lessees Or Contractors — Automatic Status When Required In Construction Agreement With You',
    family: 'additional_insured_gl',
    evidences: ['additional_insured_ongoing'],
    proves: 'blanket additional-insured status where a DIRECT written contract with the named insured requires it — ongoing operations only',
    doesNotProve: 'completed operations; upstream parties with no direct contract',
    source: { url: 'https://www.insurancexdate.com/insurance-forms/CG/CG-20-33/', last_verified: '2026-09-03' },
    corpus: [],
  },
  {
    form: 'CG 20 38',
    edition: null,
    title:
      'Additional Insured — Owners, Lessees Or Contractors — Automatic Status For Other Parties When Required In Written Construction Agreement',
    family: 'additional_insured_gl',
    evidences: ['additional_insured_ongoing'],
    proves: 'blanket additional-insured status extending to UPSTREAM parties the contract requires',
    doesNotProve: 'completed operations',
    source: {
      url: 'https://www.constructionrisk.com/2017/06/additional-insured-owners-lessees-contractors-automatic-status-parties-required-written-construction-agreement-cg-20-38-04-13/',
      last_verified: '2026-09-03',
    },
    corpus: [],
  },
  {
    form: 'CG 20 01',
    edition: null,
    title: 'Primary And Noncontributory — Other Insurance Condition',
    family: 'primary_non_contributory',
    evidences: ['primary_non_contributory'],
    proves:
      "the named insured's general liability responds FIRST and will not seek contribution from the additional insured's own policy, where a written contract requires it",
    doesNotProve: 'additional-insured status — these are two separate requirements and the engine keeps them as two rows',
    source: { url: 'https://getjones.com/endorsements/general-liability/CG20011219', last_verified: '2026-09-03' },
    corpus: ['C11', 'C2'],
  },
  {
    form: 'CG 24 04',
    edition: null,
    title: 'Waiver Of Transfer Of Rights Of Recovery Against Others To Us',
    family: 'waiver',
    evidences: ['waiver_of_subrogation_gl'],
    proves:
      "the general liability insurer waives recovery against the scheduled party for injury or damage from ongoing operations or 'your work' in the products–completed operations hazard",
    doesNotProve: "anything about workers' compensation — that is a different policy and a different form",
    source: { url: 'https://www.insurancexdate.com/insurance-forms/CG/CG-24-04/', last_verified: '2026-09-03' },
    corpus: ['E2', 'C11'],
  },
  {
    form: 'CG 24 53',
    edition: null,
    title: 'Waiver Of Transfer Of Rights Of Recovery Against Others To Us (blanket)',
    family: 'waiver',
    evidences: ['waiver_of_subrogation_gl'],
    proves: 'the same waiver, blanket, wherever a written contract requires it',
    doesNotProve: "anything about workers' compensation",
    source: { url: 'https://www.insurancexdate.com/insurance-forms/CG/CG-24-04/', last_verified: '2026-09-03' },
    corpus: [],
  },
  {
    form: 'WC 00 03 13',
    edition: null,
    title: 'Waiver Of Our Right To Recover From Others Endorsement (NCCI)',
    family: 'waiver',
    evidences: ['waiver_of_subrogation_wc'],
    proves: "the WORKERS' COMPENSATION insurer will not enforce recovery against the scheduled party",
    doesNotProve: 'anything about the general liability policy',
    source: {
      url: 'https://www.ncrb.org/Portals/0/ncrb/workers%20comp%20services/WC%20Endorsements/WC_00_03_13%20Instructions.pdf',
      last_verified: '2026-09-03',
    },
    corpus: ['E2', 'E3', 'C11'],
    note: 'A premium charge may apply, and residual-market policies take only blanket waivers (North Carolina Rate Bureau).',
  },
  {
    form: 'WC 04 03 06',
    edition: null,
    title: "Waiver Of Our Right To Recover From Others (California workers' compensation variant)",
    family: 'waiver',
    evidences: ['waiver_of_subrogation_wc'],
    proves: "the same workers' compensation waiver, California",
    doesNotProve: 'anything about the general liability policy',
    source: { url: 'https://www.sierramadreca.gov/media/fg4hgcis/acceptable-waiver-of-subrogation-endorsements.pdf', last_verified: '2026-09-03' },
    corpus: ['E2', 'C10'],
  },
  {
    form: 'WC 99 04 10',
    edition: null,
    title: "Waiver of subrogation — carrier or state variant",
    family: 'waiver',
    evidences: ['waiver_of_subrogation_wc'],
    proves: "the same workers' compensation waiver, on a carrier or state variant form",
    doesNotProve: 'anything about the general liability policy',
    source: { url: 'https://temeculaca.gov/DocumentCenter/View/14593/Sample-Insurance-Certificate', last_verified: '2026-09-03' },
    corpus: ['C3'],
    note: 'Proof that "equivalent form" matching is a real requirement rather than an edge case: a city sample uses this rather than WC 00 03 13.',
  },
  {
    form: 'CA 20 48',
    edition: null,
    title: 'Designated Insured For Covered Autos Liability Coverage',
    family: 'automobile',
    evidences: ['auto_additional_insured'],
    proves: 'additional-insured status under the BUSINESS AUTO policy for the designated party',
    doesNotProve: 'anything about the general liability policy',
    source: { url: 'https://getjones.com/endorsements/automobile-liability/CA20481013', last_verified: '2026-09-03' },
    corpus: ['C10'],
  },
  {
    form: 'CA 04 44',
    edition: null,
    title: 'Waiver Of Transfer Of Rights Of Recovery Against Others To Us (automobile)',
    family: 'automobile',
    evidences: ['auto_waiver_of_subrogation'],
    proves: 'the automobile waiver of subrogation',
    doesNotProve: 'anything about the general liability or workers’ compensation policies',
    source: { url: 'https://www.insurancexdate.com/insurance-forms/CA/CA-20-48/', last_verified: '2026-09-03' },
    corpus: ['C10', 'C11'],
  },
  {
    form: 'CA 99 48',
    edition: null,
    title: 'Pollution Liability — Broadened Coverage For Covered Autos',
    family: 'automobile',
    evidences: [],
    proves: 'broadened pollution cover for hazardous-materials hauling',
    doesNotProve: 'additional-insured status or a waiver',
    source: { url: 'https://www.accoes.com/wp-content/uploads/2019/08/Exhibit-D-Subcontractor-Insurance-ACCO.pdf', last_verified: '2026-09-03' },
    corpus: ['R2'],
    note: 'Required alongside the MCS-90 by ACCO (R2). Certly does not read it from an ACORD 25 and says so.',
  },
  {
    form: 'MCS-90',
    edition: null,
    title: 'FMCSA endorsement — motor carrier financial responsibility',
    family: 'federal',
    evidences: [],
    proves: 'federally-mandated financial responsibility for hazmat and for-hire motor carriers',
    doesNotProve:
      'a grant of insurance to the certificate holder — it is a public-protection endorsement, not additional-insured cover',
    source: { url: 'https://www.accoes.com/wp-content/uploads/2019/08/Exhibit-D-Subcontractor-Insurance-ACCO.pdf', last_verified: '2026-09-03' },
    corpus: ['R2'],
  },
];

/**
 * The 04 13-and-later note. `KNOWLEDGE_BASE.md` §C.1: from the 2013 editions
 * onward the additional-insured limit is the LESSER of the contractually
 * required limit and the policy limit — so a $5M policy under a $1M contract
 * gives the holder $1M. Certly shows this as information wherever it detects an
 * 04 13-or-later additional-insured form; it does not model it, because that is
 * a coverage opinion.
 */
export const AI_2013_EDITION_NOTE =
  'From the 04 13 edition onward, additional-insured cover applies only as permitted by law and is not broader than the contract requires — the limit afforded is the lesser of the contractually required limit and the policy limit. Certly reports the edition it read; what that means for your contract is a question for your broker.';

export const glossaryByForm: Record<string, GlossaryEntry[]> = endorsementGlossary.reduce<Record<string, GlossaryEntry[]>>(
  (acc, entry) => {
    (acc[entry.form] ??= []).push(entry);
    return acc;
  },
  {},
);
