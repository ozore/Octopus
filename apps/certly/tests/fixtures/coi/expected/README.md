# Expected values — the golden set's labels

**This directory is empty on purpose, and it is the longest pole in wave 2.**

Nothing in M4 can be measured until it is full: not the ship gate, not
`THRESHOLDS.md` §4.1, not an accuracy claim, not a prompt change. Seventeen
documents × roughly forty fields is about **two days of work with one named
owner and a second reviewer per file** (`specs/03` §15, REVIEW.md MJ-01).
**Start it on day one, in parallel with everything else.**

---

## The format

**One file per real fixture**, named for the PDF it labels:

```
tests/fixtures/coi/expected/<fixture basename>.json
```

so `wisdot-insurance-cert-example-acord25-2016-03.pdf` is labelled by
`wisdot-insurance-cert-example-acord25-2016-03.json`.

Each file is:

```jsonc
{
  "fixture": "wisdot-insurance-cert-example-acord25-2016-03.pdf",
  "golden_id": "G1",
  "labelled_by": "agent-or-person-id",
  "labelled_on": "2026-09-04",
  "reviewed_by": "a DIFFERENT agent-or-person-id",
  "notes": "Anything the next reader needs. Optional, but it is where the awkward calls go.",

  "expected": {
    // A COMPLETE coi.v1 payload — exactly the shape of
    // specs/schema/coi.v1.schema.json, validating against it.
    "schema_version": "coi.v1",
    "document_kind": "acord_25",
    "form_edition": "2016/03",
    // …
  }
}
```

`expected` **validates against `specs/schema/coi.v1.schema.json`**, and
`npm run kb:check` runs that validation. That is not bureaucracy: a labeller who
can write an expected file the schema rejects has found either a schema bug or a
misreading, and both are worth catching on day one rather than on the day the
extractor is measured against it.

## The five rules the schema enforces, restated because they are where labelling goes wrong

1. **Every value object has all five keys** — `value`, `raw`, `page`,
   `source_text`, `confidence`. Optionality is a **null value**, never an absent
   key.
2. **`raw` is what the document PRINTS.** `$1,000,000`, `Excluded`,
   `STATUTORY`, `$100,000 SIR`, `N/A`, or the empty box. Do not tidy it.
3. **`value` is what can be safely made of `raw`, and `null` when nothing can.**
   Never coerce `Excluded` or `STATUTORY` to `0`. A limit box that is not a
   number has `amount.value === null` and the words in `amount.raw` — that pair
   is what makes the comparison engine answer `undetermined` instead of a
   confident, wrong `gap`.
4. **`page` is 1-indexed and absolute in the uploaded file.** In the NYC
   packages the certificate is page *n* of 17; the page number is 7, not 1.
5. **`source_text` is a short verbatim span from that page containing the
   value** — under 200 characters. The quote gate (`specs/03` §7) checks it by
   searching the page text, so a paraphrase fails the gate and a made-up span
   fails it loudly. That is the point.

## Confidence, when you are the labeller

An expected file is **ground truth**, so its `confidence` values are `1` for
every field you could read and `0` for a box you genuinely could not (a scan
too poor to resolve, a value cut off by the page edge). Do not guess a middle
number: `confidence` on an expected file is not a model score, it is a statement
about whether a human could read the box.

Where you could not read it, say so in `notes` and set `value` to `null`. A
field nobody can read is not a field the extractor should be scored on.

## Two things to produce alongside the files

1. **`redacted-names.json`** in this directory — every `producer.contact_name`
   value found across the corpus, as a flat array of strings. `specs/03` §15.3
   makes a test assert that none of them appears in eval output, in a prompt, in
   a UI string, in a help article or in any marketing copy. Write it as you go;
   it also settles the `UNVERIFIED` status of C2, C11 and C12 in
   `../MANIFEST.md`.

   ```json
   { "names": [], "checked_on": "2026-09-04", "checked_by": "…" }
   ```

2. **`D`, `N_ship` and `N_block`**, published into `specs/03` §15.1 and
   `THRESHOLDS.md` §4.1 on the day labelling finishes, with the date:

   ```
   D       = Σ over G1..G17 of the critical fields ACTUALLY PRINTED on that document
             (policy_exp, each_occurrence, general_aggregate, insured.name,
              addl_insd, subr_wvd)
   N_ship  = floor(D × 0.03)      # ≥97% exact
   N_block = floor(D × 0.05)      # <95% blocks the deploy
   ```

   **A critical value is in the denominator only if it is printed on the
   document.** Several certificates have no `ADDL INSD` or `SUBR WVD` tick at
   all, four fixtures are guidance PDFs with one embedded certificate, and G17
   is blank. `D` is **computed from these files, not estimated** — the earlier
   "16 × 6 ≈ 96" was an estimate presented as a fact and it was wrong in both
   directions (REVIEW.md MJ-02).

## The checks

```bash
npm run kb:check --workspace apps/certly
```

reports, and exits non-zero on a hard failure:

- every fixture named in `specs/03` §15 exists (**G17 is reported as pending**
  until `acord25-2025-12-blank.pdf` is fetched — see `../MANIFEST.md`);
- every fixture present has an expected-value file, **once any expected file
  exists**. While the directory is empty the check reports the backlog and does
  not fail, because failing a build for work that has not started yet teaches
  people to ignore the build. **The moment the first label lands, a fixture with
  no label is a failure** — that is the switch that keeps the set complete;
- every expected file validates against `coi.v1`;
- every expected file names a `labelled_by`, a `labelled_on` and a
  **different** `reviewed_by` (PLAN.md §A10's two-pass discipline);
- every template in `src/lib/templates/library/` validates and every source
  carries a URL and a `last_verified` date;
- every `form_edition` the knowledge base calls current exists in the committed
  schema (KB §E's re-opened gate).

## Two habits that will save the measurement

**Never average accuracy.** Report per field, with its own denominator. A 3%
average that is 20% wrong on `policy_exp` is a broken product wearing a good
number.

**Label from the image, not from the text layer.** Corpus C1's text extracts
*bottom-up*, C6's OCR layer reads `INSUARNCE` where the image plainly says
`INSURANCE`, and C7 prints a reviewer's annotations on top of the form. What the
extractor is scored against is what a person reading the page can see.
