/**
 * The document reader — page count, per-page text layer, PDF metadata.
 *
 * WHY THIS EXISTS AT ALL. `specs/03` §7's quote gate needs `textLayerOf(document,
 * page)`; §10 needs a page count before the model call and an encrypted-PDF
 * refusal; `KNOWLEDGE_BASE.md` §A.4 wants `pdfProducer`/`pdfCreator` for the
 * AMS-variant experiment. All three are the same parse, so they are one module.
 *
 * WHY pdf.js AND NOT A HAND-ROLLED PARSER. `specs/03` §7 names "pdfjs / pypdf
 * equivalent" in as many words. Three of the corpus documents (C2, C10, C11)
 * put their filled values in form XObjects rather than the page content stream,
 * and a hand-rolled content-stream scanner reads them as blank — which would
 * make the quote gate fail on every value of a genuinely issued certificate.
 * The legacy ESM build is used because it runs in Node with no canvas and no
 * worker.
 *
 * WHAT THIS MODULE IS NOT. It does not rasterise pages. It does not need to:
 * `specs/03` §5 sends the PDF itself as a `document` block and the API renders
 * each page to an image AND extracts its text on the way in. Adding a rasteriser
 * here would duplicate that server-side work, add a native dependency, and put
 * a second, differently-rendered image in front of the model.
 */

const PDFJS_MODULE = 'pdfjs-dist/legacy/build/pdf.mjs';

export type PdfFacts = {
  pageCount: number;
  /** One entry per page, 1-indexed by position. `''` when a page has no text. */
  pageTexts: string[];
  producer: string | null;
  creator: string | null;
};

export class EncryptedPdfError extends Error {
  constructor() {
    super('This PDF is password-protected. Save an unprotected copy and upload that.');
    this.name = 'EncryptedPdfError';
  }
}

export class UnreadablePdfError extends Error {
  constructor(readonly cause_: unknown) {
    super('We could not open this file as a PDF.');
    this.name = 'UnreadablePdfError';
  }
}

type PdfJsModule = {
  getDocument(src: Record<string, unknown>): { promise: Promise<PdfJsDocument> };
  PasswordException?: new (...args: never[]) => Error;
};

type PdfJsDocument = {
  numPages: number;
  getMetadata(): Promise<{ info?: Record<string, unknown> }>;
  getPage(n: number): Promise<{
    getTextContent(opts?: Record<string, unknown>): Promise<{
      items: { str?: string; hasEOL?: boolean }[];
    }>;
  }>;
  destroy?(): Promise<void>;
};

let modulePromise: Promise<PdfJsModule> | null = null;

/**
 * Imported lazily and by a variable specifier. pdf.js is a devDependency used by
 * the extraction job and the evals; a static import would pull ~1 MB into every
 * Next.js server chunk that transitively touches this file.
 */
async function pdfjs(): Promise<PdfJsModule> {
  modulePromise ??= import(/* webpackIgnore: true */ PDFJS_MODULE) as Promise<PdfJsModule>;
  return modulePromise;
}

function isPasswordError(error: unknown): boolean {
  const name = (error as { name?: string } | null)?.name ?? '';
  const message = (error as { message?: string } | null)?.message ?? '';
  return name === 'PasswordException' || /password/i.test(message);
}

export async function readPdf(bytes: Uint8Array): Promise<PdfFacts> {
  const { getDocument } = await pdfjs();
  let doc: PdfJsDocument;
  try {
    doc = await getDocument({
      // A copy: pdf.js transfers the buffer it is handed, and the caller still
      // needs the bytes to base64-encode for the model call.
      data: new Uint8Array(bytes),
      isEvalSupported: false,
      disableFontFace: true,
      useSystemFonts: false,
    }).promise;
  } catch (error) {
    if (isPasswordError(error)) throw new EncryptedPdfError();
    throw new UnreadablePdfError(error);
  }

  const info: Record<string, unknown> =
    (await doc.getMetadata().catch(() => ({ info: {} as Record<string, unknown> }))).info ?? {};
  const pageTexts: string[] = [];
  for (let n = 1; n <= doc.numPages; n += 1) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent({ includeMarkedContent: false });
    pageTexts.push(
      content.items.map((item) => (item.str ?? '') + (item.hasEOL ? '\n' : '')).join(''),
    );
  }
  await doc.destroy?.();

  return {
    pageCount: doc.numPages,
    pageTexts,
    producer: typeof info['Producer'] === 'string' ? (info['Producer'] as string) : null,
    creator: typeof info['Creator'] === 'string' ? (info['Creator'] as string) : null,
  };
}

/** `%PDF` — checked before anything else so a 0-byte or renamed file fails fast. */
export function looksLikePdf(bytes: Uint8Array): boolean {
  return (
    bytes.length > 4 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  );
}

/**
 * An image upload has no text layer at all, so every field's gate is `skipped`
 * — which is exactly the corpus C6 behaviour `specs/03` A2 requires, reached by
 * the same code path rather than a special case.
 */
export function imageFacts(): PdfFacts {
  return { pageCount: 1, pageTexts: [''], producer: null, creator: null };
}
