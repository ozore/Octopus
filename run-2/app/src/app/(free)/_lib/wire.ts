/**
 * THE WIRE SHAPES BETWEEN THE FREE SERVER ACTIONS AND THE FREE CLIENT.
 *
 * AUTHORITY: `USER_JOURNEY.md` §1 (J1), §6.3.1 (the permission table: what may fill
 * a radio), `ARCHITECTURE.md` §11.4 (untrusted input), `DESIGN_SYSTEM.md` §8.6.
 *
 * ===========================================================================
 * WHY THE CLIENT NEVER SEES A CLASSIFICATION ID
 *
 * Every candidate crosses this boundary as an ORDINAL into the determination's own
 * parsed rows, plus the text and rates needed to render it. The server re-derives
 * the branded `ClassificationId` from the mirror row at that ordinal, so a crafted
 * POST cannot name a classification that is not on the revision — it is
 * unrepresentable rather than validated. That is invariant I2 surviving a network
 * hop.
 *
 * ===========================================================================
 * `preSelectedOrdinal` IS NON-NULL AT EXACTLY ONE LADDER LEVEL
 *
 * L-C1: an exact normalized match against the determination's OWN verbatim label.
 * `blockedLine()` in `src/lib/result.ts` throws if a pre-selection arrives at any
 * other level, so the rule survives a refactor on the server side; this field
 * carries the same rule to the screen. A pre-selection is an endorsement, and the
 * only party entitled to make one here is the federal text — not a model's
 * ordering, and not another company's answer.
 */

import type { Refusal } from '@/lib/types';

export interface WireClassification {
  /** The row's ordinal on the pinned revision. The only handle the client holds. */
  readonly ordinal: number;
  readonly className: string;
  /** The determination's own lines, newlines preserved. Rendered verbatim. */
  readonly classNameVerbatim: string;
  readonly rateIdentifier: string;
  readonly identifierKind: string;
  readonly baseRateMilli: number;
  readonly fringeRateMilli: number;
  readonly sourceLineStart: number;
  readonly sourceLineEnd: number;
}

export interface WireDetermination {
  readonly wdNumber: string;
  readonly revision: number;
  readonly publishDate: string;
  readonly constructionType: string;
  readonly classifications: readonly WireClassification[];
}

export type WireLookup =
  | { readonly ok: true; readonly determination: WireDetermination }
  | { readonly ok: false; readonly refusal: Refusal };

/** One unresolved payroll line, with the closed set of real options beside it. */
export interface WirePicker {
  readonly workerIndex: number;
  readonly lineIndex: number;
  readonly rawTitle: string;
  readonly level: string;
  /** L-E's sentence, when the ordering was produced without ranking assistance —
   *  which on the free tier is always, and which the screen states in neutral ink
   *  with no hue, because it is a statement of limits and not an error. */
  readonly banner: string | null;
  /** The three the picker shows; the full list is `all`. */
  readonly candidates: readonly WireClassification[];
  readonly all: readonly WireClassification[];
  /** Non-null at L-C1 only. */
  readonly preSelectedOrdinal: number | null;
  readonly refusal: Refusal | null;
  readonly declined: Refusal | null;
}

export interface WireArtifact {
  readonly status: 'CERTIFIABLE' | 'CERTIFIABLE_DATED' | 'DRAFT_NOT_CERTIFIABLE';
  readonly signatureBlockWithheld: boolean;
  readonly blockReasons: readonly string[];
  readonly unresolvedLineCount: number;
  readonly pageCount: number;
  /** The rendered WH-347, base64. The preview IS the PDF: what she is about to hand
   *  a general contractor has to be what she is looking at. */
  readonly pdfBase64: string;
  readonly footer: readonly { readonly id: string; readonly text: string; readonly emphasis: string }[];
  readonly exceptions: readonly string[];
  readonly wdNumber: string;
  readonly revision: number;
  readonly publishDate: string;
  readonly generatedAtIso: string;
  /** `generatedAt + 24 h`, stated exactly, because §1.4 requires the expiry to be a
   *  timestamp rather than a promise. */
  readonly expiresAtIso: string;
  readonly totals: {
    readonly hoursWorked: string;
    readonly col7A: string;
    readonly col7B: string;
    readonly deductions: string;
    readonly cwhssaPremium: string;
  };
}

export type WireGenerate =
  | {
      readonly ok: true;
      readonly artifact: WireArtifact;
      readonly pickers: readonly WirePicker[];
      /** Every refusal the engine authored, in discovery order. */
      readonly refusals: readonly Refusal[];
    }
  | { readonly ok: false; readonly refusal: Refusal };

/** The stored preview, as the browser holds it. Nothing of this shape exists on any
 *  server: §1.5's "Ratepin kept nothing from this session", implemented as the
 *  absence of a table rather than as a retention job. */
export interface StoredPreview {
  readonly token: string;
  readonly artifact: WireArtifact;
}

export const PREVIEW_TTL_MS = 24 * 60 * 60 * 1000;
export const PREVIEW_KEY_PREFIX = 'ratepin.free.preview.';
export const DRAFT_KEY = 'ratepin.free.draft';
export const CSV_KEY = 'ratepin.free.csv';
