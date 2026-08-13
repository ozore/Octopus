'use server';

/**
 * THE FREE GENERATOR'S TWO SERVER ACTIONS — and there are only two.
 *
 * AUTHORITY: `USER_JOURNEY.md` §1 (J1), `ARCHITECTURE.md` §3.1 (`/wh347` may touch
 * "the free-generator engine; no tenant tables"), §3.8, §11.4 (untrusted input).
 *
 * Both are thin. Everything they do lives in `../_lib/*`, which is what makes the
 * offline suite able to exercise the whole journey without a request: the tests
 * call `generateFreeWh347` directly against a PGlite mirror, and these two
 * functions add only Zod validation, base64 and the wire projection.
 *
 * NOTHING HERE WRITES. No account, no session cookie, no row. The only state that
 * survives the response is in the visitor's browser, and it expires in 24 hours
 * because the browser deletes it, not because a job sweeps it.
 */

import { getConfig } from '@/lib/config';
import { getDb } from '@/db';

import { activeDetermination, classificationsOf, determinationsForCounty } from '../_data/mirror';
import { generateFreeWh347 } from '../_lib/generate';
import { parseFreeSession, WdChoice } from '../_lib/session';
import {
  PREVIEW_TTL_MS,
  type WireClassification,
  type WireGenerate,
  type WireLookup,
  type WirePicker,
} from '../_lib/wire';
import type { Classification, Refusal } from '@/lib/types';
import { wdNumber as toWdNumber } from '@/lib/types';

function toWire(row: Classification): WireClassification {
  return {
    ordinal: row.ordinal,
    className: row.className,
    classNameVerbatim: row.classNameVerbatim,
    rateIdentifier: row.rateIdentifier,
    identifierKind: row.identifierKind,
    baseRateMilli: Number(row.baseRate),
    fringeRateMilli: Number(row.fringeRate),
    sourceLineStart: row.sourceLineStart,
    sourceLineEnd: row.sourceLineEnd,
  };
}

/**
 * Resolve the determination the visitor named, before any payroll is typed.
 *
 * Resolved BEFORE the crew, deliberately: S06's rule is that we never take an input
 * we cannot resolve, and the free tier's version of that is that we never let
 * someone type twenty-six workers against a determination we do not hold.
 */
export async function lookupDeterminationAction(input: unknown): Promise<WireLookup> {
  const parsed = WdChoice.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      refusal: {
        primitive: 'P-D',
        headline: 'That determination could not be read',
        rule:
          'A determination is named either by its number — two letters, four digits of fiscal year, ' +
          'four digits of sequence — or by state, county and construction type.',
        citation: 'SAM.gov WDOL determination numbering',
        observableFacts: [{ label: 'Fields received', value: 'incomplete' }],
        declined: 'Ratepin does not guess which determination you meant.',
      },
    };
  }

  const db = await getDb();
  const choice = parsed.data;

  if (choice.mode === 'number') {
    const raw = choice.wdNumber.trim().toUpperCase();
    if (!/^[A-Z]{2}\d{8}$/.test(raw)) {
      return { ok: false, refusal: shapeRefusal(raw) };
    }
    const held = await activeDetermination(db, toWdNumber(raw));
    if (held === null) return { ok: false, refusal: notHeldRefusal(raw) };
    const classifications = await classificationsOf(db, held.wdNumber, held.revision);
    return {
      ok: true,
      determination: {
        wdNumber: String(held.wdNumber),
        revision: held.revision,
        publishDate: String(held.publishDate),
        constructionType: held.constructionTypes.join(' · '),
        classifications: classifications.map(toWire),
      },
    };
  }

  const rows = await determinationsForCounty(db, {
    stateCode: choice.stateCode,
    countyName: choice.countyName,
  });
  const match = rows.find((row) => row.constructionType === choice.constructionType);
  if (!match) {
    return {
      ok: false,
      refusal: {
        primitive: 'P-D',
        headline: `No active determination in this snapshot covers ${choice.countyName}, ${choice.stateCode.toUpperCase()} under ${choice.constructionType}`,
        rule:
          'Wage determinations are published per county and per construction type. A county may be ' +
          'covered under one type and not another, and a contract may carry a project wage ' +
          'determination issued to the contracting agency and never published.',
        citation: '29 CFR 1.5',
        observableFacts:
          rows.length === 0
            ? [{ label: 'Types covered for this county', value: 'none in this snapshot' }]
            : rows.map((row) => ({
                label: `Also covers — ${row.constructionType}`,
                value: `${row.wdNumber} rev ${row.revision}`,
              })),
        declined:
          'Ratepin does not interpolate a rate from a neighbouring county. Read the determination ' +
          'number off your contract and type it in.',
      },
    };
  }
  const classifications = await classificationsOf(db, match.wdNumber, match.revision);
  return {
    ok: true,
    determination: {
      wdNumber: String(match.wdNumber),
      revision: match.revision,
      publishDate: String(match.publishDate),
      constructionType: match.constructionType,
      classifications: classifications.map(toWire),
    },
  };
}

/**
 * Generate.
 *
 * There is no status gate on the free path and no decision to make: the artifact is
 * DRAFT — NOT CERTIFIABLE before the first number is typed, because the free path
 * creates no pin by construction. Unresolved lines add REASONS, not a status.
 */
export async function generateAction(input: unknown): Promise<WireGenerate> {
  const parsed = parseFreeSession(input);
  if (!parsed.success) {
    return {
      ok: false,
      refusal: {
        primitive: 'P-D',
        headline: 'That payroll could not be read',
        rule:
          'Every field on the WH-347 is either a number of hours, a rate, a whole-cent amount or a ' +
          'name. Ratepin does not coerce a value it cannot read into one it can.',
        citation: 'WH-347, OMB No. 1235-0008',
        observableFacts: parsed.error.issues.slice(0, 8).map((issue: { path: PropertyKey[]; message: string }) => ({
          label: issue.path.map(String).join('.') || 'payroll',
          value: issue.message,
        })),
        declined:
          'Ratepin does not guess at a value it could not read, because the guess would be printed ' +
          'on a document carrying a federal certification.',
      },
    };
  }

  const config = getConfig();
  const db = await getDb();
  const result = await generateFreeWh347(
    {
      db,
      now: new Date(),
      buildSha: config.BUILD_SHA,
      engineVersion: config.ENGINE_VERSION,
    },
    parsed.data,
  );

  if (!result.ok) return { ok: false, refusal: result.refusal };

  const generation = result.value;
  const byOrdinal = new Map(generation.wd.classifications.map((row) => [row.ordinal, row]));

  const pickers: WirePicker[] = generation.resolutions
    .filter((resolution) => resolution.chosen === null)
    .map((resolution) => ({
      workerIndex: resolution.workerIndex,
      lineIndex: resolution.lineIndex,
      rawTitle: resolution.rawTitle,
      level: resolution.outcome.level,
      banner: resolution.outcome.banner,
      candidates: resolution.outcome.picker.map((candidate) => toWire(candidate.classification)),
      all: resolution.outcome.candidates.map((candidate) => toWire(candidate.classification)),
      preSelectedOrdinal:
        resolution.outcome.preSelected === null
          ? null
          : ([...byOrdinal.values()].find((row) => row.id === resolution.outcome.preSelected)
              ?.ordinal ?? null),
      refusal: resolution.outcome.refusal,
      declined: resolution.outcome.declined,
    }));

  const generatedAt = generation.generatedAt;
  const artifactStatus = generation.verdict.status;

  return {
    ok: true,
    pickers,
    refusals: generation.refusals,
    artifact: {
      status: artifactStatus,
      signatureBlockWithheld: artifactStatus === 'DRAFT_NOT_CERTIFIABLE',
      blockReasons:
        generation.verdict.status === 'DRAFT_NOT_CERTIFIABLE' ? [...generation.verdict.blocks] : [],
      unresolvedLineCount: pickers.length,
      pageCount: generation.pageCount,
      pdfBase64: Buffer.from(generation.pdf).toString('base64'),
      footer: generation.artifact.footer.map((line) => ({
        id: line.id,
        text: line.text,
        emphasis: line.emphasis,
      })),
      exceptions: generation.exceptions,
      wdNumber: String(generation.wd.wdNumber),
      revision: generation.wd.revision,
      publishDate: String(generation.wd.publishDate),
      generatedAtIso: generatedAt.toISOString(),
      expiresAtIso: new Date(generatedAt.getTime() + PREVIEW_TTL_MS).toISOString(),
      // Formatted by the projection, never by this file. Printing a total the
      // renderer did not print is how a screen and a PDF disagree about a federal
      // form.
      totals: generation.artifact.totals,
    },
  };
}

function shapeRefusal(raw: string): Refusal {
  return {
    primitive: 'P-D',
    headline: `"${raw}" is not shaped like a wage determination number`,
    rule:
      'A general wage determination number is two letters for the state, four digits for the fiscal ' +
      'year, and four digits of sequence — for example VA20260195.',
    citation: 'SAM.gov WDOL determination numbering',
    observableFacts: [{ label: 'What you typed', value: raw }],
    declined:
      'Ratepin does not guess which determination you meant. Type it as it appears on your ' +
      'contract, or look it up by state, county and construction type.',
  };
}

function notHeldRefusal(raw: string): Refusal {
  return {
    primitive: 'P-D',
    headline: `${raw} is not in the active published record Ratepin holds`,
    rule:
      'Ratepin generates from a mirror of the published general wage determinations. A determination ' +
      'issued directly to a contracting agency and never published is not in that record.',
    citation: '29 CFR 1.5(b)',
    observableFacts: [{ label: 'Determination number', value: raw }],
    declined:
      'Ratepin does not conclude that this determination does not exist — only that it is not in the ' +
      'published record we mirror, so we will not put a rate from it on a form.',
  };
}
