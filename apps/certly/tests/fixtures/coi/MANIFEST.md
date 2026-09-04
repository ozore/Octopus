# `tests/fixtures/coi/` — the golden set

Sixteen real documents, copied from `phase-4-revenue/certly/kb-samples/` on
2026-09-03. They are the extraction eval corpus for M4 (`specs/03` §15) and the
`recorded extractions` the comparison engine's golden comparisons run against
(`specs/05` §12).

**The canonical membership list is `specs/03` §15.** Read it before adding or
removing anything here. This file records what was copied, why, and the licence
terms that travel with the bytes.

---

## The licence and personal-data rules, carried forward verbatim in substance

These are `kb-samples/MANIFEST.md`'s rules, and they apply to this copy exactly
as they apply to the original. They are repeated here because the fixtures now
live next to code, and a rule that lives only in another directory is a rule
somebody will not read.

1. **Public documents only.** Every file was published on a `.gov`, `.edu` or
   company website with no login, no paywall and no click-through agreement.
   None was scraped from behind an authentication wall. Every source URL and
   fetch date is in `kb-samples/MANIFEST.md`.

2. **ACORD's marks.** The ACORD 25 form layout and the ACORD name and logo are
   ACORD's property; these forms carry `© 1988–2015 ACORD CORPORATION. All
   rights reserved.` They are stored **as fetched, unmodified, as private test
   fixtures**. We do not redistribute them, publish them, or reproduce the blank
   form in Certly's own UI, and **we never render an ACORD-branded form**.

3. **THE HARD LINE, and the one that matters most here (REVIEW.md B-13).**

   | may appear on a public Certly surface | may not |
   |---|---|
   | a **Certly-authored fixture** — a certificate-shaped sample we produced ourselves, in our own layout, with fictional vendors, insurers, policy numbers and dates | **any file in this directory**, whole, cropped, redacted or thumbnailed |
   | a short, **attributed verbatim quotation** of a printed notice on the form | a traced, redrawn or re-typeset reproduction of the ACORD 25 layout |
   | a document whose rights-holder has **given written permission**, on file, naming the product, the document and the use | anything sourced by inference about permission |

   Publicly reachable is a fact about a URL. Permission is a fact about a
   rights-holder. **This corpus is the first and not the second.** The landing
   page, the demo, the help centre and every marketing asset use Certly-authored
   fixtures instead. A test in `tests/vocabulary.test.ts` and the landing spec's
   own checks keep it that way.

4. **No private individuals — with three named exceptions and one open item.**
   The documented placeholders are `Joseph A. Sample` (WisDOT), `Jane Doe` (NYC)
   and `© Elizabeth Carmichael 2017` (a training document's author byline).

   **C2 (`story-county-ia-coi.pdf`), C11 (`riverside-ca-…`) and C12
   (`essex-county-ny-…`) are `UNVERIFIED`.** C2 is a genuinely issued
   certificate rather than a sample, and on an issued certificate the
   `CONTACT NAME`, the producer's direct e-mail and the authorised
   representative's signature are ordinarily a named person. The filled values
   sit in form XObjects and two attempts to read them from the text layer
   failed.

   **The owner is the golden-set labeller, at the moment of labelling** — the
   pages are open anyway. If a real individual is found: annotate the row here,
   add the name to `tests/fixtures/coi/expected/redacted-names.json`, and keep
   the fixture. It is a public document and a valuable layout; what changes is
   that the name is mechanically blocked from every output (`specs/03` §15.3).

---

## What was copied, and what was not

| copied | from | why |
|---|---|---|
| 15 certificates | `kb-samples/certificates/` | G1–G15 and G17's siblings — the extraction golden set |
| `nevada-risk-cert-and-endorsement-samples.pdf` | `kb-samples/endorsements/` | **G16**, which `specs/03` §15 notes lives in `endorsements/` rather than `certificates/`. It carries `STATUTORY` in a workers' compensation limit box and an endorsement page next to a certificate |

**Not copied, deliberately:**

- `kb-samples/endorsements/sierra-madre-…` (E2) and `ncrb-wc-00-03-13-instructions.pdf`
  (E3). They are **glossary sources**, not golden-set fixtures: they evidence
  `KNOWLEDGE_BASE.md` §C's "what this form proves" column, which is already
  transcribed into `src/lib/templates/endorsements.ts` with its URLs. Copying
  them here would imply an expected-value file that `specs/03` §15 does not ask
  for.
- `kb-samples/requirements/` (R1–R5). They are the evidential base for the
  **template library**, transcribed into `src/lib/templates/library/*.json` with
  their source URLs and dates. They are not certificates and nothing extracts
  them.

## G17 is a row without a file

`acord25-2025-12-blank.pdf` (C16) — the **current edition** of the form the
entire product reads — is **not here yet**. `kb-samples/MANIFEST.md` records it
as a deliberate exception: the manifest row was written first because the
edition is load-bearing now (the `form_edition` enum, `KNOWLEDGE_BASE.md` §A.2
and `specs/03` §15 all depend on it).

**The first agent to touch M4 fetches it.** The command is in
`kb-samples/MANIFEST.md`; the reviewer confirmed the bytes are reachable with a
Safari user agent when a Chrome one 403s:

```bash
curl -sSL --compressed \
  -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15" \
  -o apps/certly/tests/fixtures/coi/acord25-2025-12-blank.pdf \
  "<the NY DFS URL in kb-samples/MANIFEST.md row C16>"
# then verify the footer reads "ACORD 25 (2025/12)" and update this file
```

`npm run kb:check` reports it as **pending** and the golden-set eval must fail
until the bytes are here — so it cannot be quietly forgotten. **M4 cannot be
declared done while a golden-set fixture is a URL.**

## A correction to the membership header

`specs/03` §15's own header reads *"21 fixtures: 16 real documents + 5
synthetic"*, and its table is **17 real (G1–G17) + 4 synthetic (G18–G21)** —
which is what `KNOWLEDGE_BASE.md` §D.5 and `THRESHOLDS.md` §4.1 both say. This
is REVIEW.md's regression **R-1**, unfixed at the time of copying because
`phase-4-revenue/` is not ours to edit. **The table is right; the header is
wrong.** Sixteen of the seventeen real fixtures are in this directory; G17 is
the pending blank above.
