# WL-03 · Classification catalogue per determination

**Effort: M · Must (MVP) · Depends on: WL-13, WL-02**

## Story

As Rosa I can see every labor classification on my project's determination with its base rate
and fringe, search it the way I talk ("electrician", "backhoe", "drywall"), and open the
determination's own words when the list does not settle my question.

## Why this earns its place

Today she reads a 17,000-character wall of fixed-width text in a browser tab, with Ctrl-F, at
4pm. The determination for Harris County Building lists **57 classifications in 15 rate
groups**, alphabetised *within* each group but not across them — so "ELECTRICIAN" appears once
under `ELEC0716-005` at $38.50 and again under `SUTX2014-029` as "ELECTRICIAN (LOW VOLTAGE
WIRING ONLY)" at $18.00. A sorted, searchable table with rate and fringe in columns is not a
small improvement over that; it is the difference between finding the right row and picking the
first one.

## Flow

```
/projects/:id/classifications
   search box (autofocus)  ·  sort: A–Z | rate ↑↓  ·  filter: rate type
   ┌──────────────────────────────────────────────────────────────────────┐
   │ CLASSIFICATION                       RATE     FRINGE   TOTAL   GROUP │
   │ ELECTRICIAN (EXCLUDES LOW VOLTAGE …) $38.50   $10.71   $49.21  union │
   │ ELECTRICIAN (LOW VOLTAGE WIRING ONLY)$18.00    $1.68   $19.68  survey│
   │ …                                                                    │
   └──────────────────────────────────────────────────────────────────────┘
   ↳ row expand: full label, qualifier, footnotes, rate group + effective date,
                 WD number · modification · published · [official determination ↗]
   ↳ zero results ─▶ "Not finding it?" panel:
        · try a broader word            · read the determination in full ─▶ text view
        · what if nothing matches?      ─▶ WL-04 conformance guide
/projects/:id/determination/text        the verbatim document_text, monospaced, Ctrl-F-able
```

## Screens

| screen | contents | states |
|---|---|---|
| catalogue | table above, count in the header ("57 classifications on TX20260253 mod 1") | loading · list · searching · zero-results |
| row detail | verbatim label, `qualifier`, footnote text, rate group identifier + kind + effective date, the full provenance line | collapsed · expanded |
| text view | `document_text` in a monospace pane with the header, modification table and legend intact | — |
| provenance line (shared component) | "Rate from **TX20260253** mod **1**, published **2026-05-18**. [View on SAM.gov ↗] · verified {last_verified}" | — |

**The provenance line is the same React component everywhere a rate appears** — catalogue,
mapping, hours grid, PDF footer. Gate **G8** asserts that no rate renders outside it. That is
what makes "every rate carries its source" a property of the build rather than a promise.

## Data model

No new tables. Reads `kb_classifications`, `kb_rate_groups`, `kb_wage_determinations` (WL-13
§3.1) through `lib/kb/lookup.ts`.

One derived, cached column already defined in WL-13: `kb_classifications.search_label` —
lower-cased, punctuation stripped, whitespace collapsed. Search is
`search_label LIKE '%term%'` plus a `trade_family` match, ordered by (exact-prefix, then
alphabetical). **No vector search, no embeddings, no fuzzy matching** — 57 rows per
determination and a user who knows their trade. (CORPUS_DESIGN P4: add machinery only when a
measured threshold trips. The trigger here would be `classification_zero_results` exceeding 15%
of searches.)

`trade_family` is a coarse, hand-maintained bucket derived at ingest from the label's first
token: `electrician`, `plumber`, `pipefitter`, `carpenter`, `laborer`, `operator`, `truck_driver`,
`ironworker`, `cement_mason`, `roofer`, `painter`, `sheet_metal`, `sprinkler_fitter`, `insulator`,
`glazier`, `bricklayer`, `drywall`, `flooring`, `elevator`, `other`. It exists to make
"backhoe" find `OPERATOR: BACKHOE/EXCAVATOR/TRACKHOE` — nothing more ambitious.

## Server actions

| name | input | returns |
|---|---|---|
| `listClassifications` | `{ projectId, sort? }` | every classification on the project's pinned determination, with rate group and provenance |
| `searchClassifications` | `{ projectId, query }` | matches + `result_count`; emits `classification_searched` and, at zero, `classification_zero_results` |
| `getDeterminationText` | `{ projectId }` | `document_text` + header metadata |

All three read the pinned `(wd_number, wd_modification_number)` from `projects`. **There is no
code path that reads a classification from an unpinned determination** — gate G9.

## Validation rules

| # | rule |
|---|---|
| V1 | The catalogue is always scoped to a project's pinned modification. No global "search all rates" screen exists in the MVP — it would produce a rate with no contract behind it. |
| V2 | `total = base_rate + fringe_rate` is computed for display only and is **never stored** — the form wants 6A and 6B separately, and conflating them is a classic WH-347 error. |
| V3 | Search terms are trimmed, lower-cased, and matched case-insensitively; a 1-character query returns the unfiltered list rather than nothing. |
| V4 | Every row renders through the provenance component (G8). |

## Acceptance criteria

- **Given** a project pinned to TX20260253 mod 1, **when** the catalogue opens, **then**
  **57** classifications render, grouped rate-type is shown per row, and the header reads
  "57 classifications on TX20260253 mod 1".
- **Given** the query `electrician`, **when** it is searched, **then** both `ELECTRICIAN
  (EXCLUDES LOW VOLTAGE WIRING AND INSTALLATION OF ALARMS)` at $38.50/$10.71 and
  `ELECTRICIAN (LOW VOLTAGE WIRING ONLY)` at $18.00/$1.68 appear, and neither is presented as
  the more likely answer.
- **Given** the query `backhoe`, **when** it is searched, **then**
  `OPERATOR: BACKHOE/EXCAVATOR/TRACKHOE` at $13.94 is returned.
- **Given** the query `xylophonist`, **when** it is searched, **then** zero results render the
  "Not finding it?" panel and `classification_zero_results {query}` is emitted.
- **Given** any rate on screen, **when** the DOM is inspected, **then** its WD number,
  modification number and SAM.gov link are present in the same component. *(G8)*
- **Given** a classification with a fringe of `0.00`, **when** it renders, **then** it shows
  `$0.00`, not blank — because the form needs the number.
- **Given** MN20260080, **when** the catalogue opens, **then** both project-value variants of
  the duplicated surveyor classification appear as separate rows with their qualifiers visible.
- **Given** the text view, **when** it opens, **then** it contains the modification table, the
  rate-identifier legend and `END OF GENERAL DECISION`, exactly as SAM.gov served it.

## Edge cases

| case | behaviour |
|---|---|
| Very long labels (TX20260253's `ELEVATOR MECHANIC` carries a 60-word footnote about 6%/8% and nine holidays) | The row shows the label; the footnote lives in the expanded detail and in the text view. Never truncated with an ellipsis and no way to see the rest — the footnote *is* part of the rate. |
| Same label under two rate groups | Both rows shown, rate-group column is the discriminator. No dedupe. |
| Same label twice in one rate group with a project-value qualifier (MN) | Both rows, `qualifier` column populated. |
| A determination with 300+ classifications (large Heavy determinations) | Virtualised list; search is server-side; the count is always shown. |
| Zero classifications parsed (a corrupt ingest) | Impossible past gate G3, but the screen still fails loudly: "We couldn't read this determination. Open it on SAM.gov" + link. Never an empty table presented as "no classifications". |
| `WELDERS` | The determination says welders take the rate of the craft they are welding for. Surfaced as a permanent note above the table, not as a classification row, because it is not one. |

## Errors

| condition | user sees | logged |
|---|---|---|
| Determination missing from corpus | "We can't load this project's determination." + SAM.gov link + support | `classification_catalogue_load_failed` |
| Corpus stale (G6) | banner: "Last verified {date}" | `corpus_stale_banner_shown` |

## Analytics events

`classification_catalogue_viewed {wd_number, classification_count}` ·
`classification_searched {query, result_count}` ·
`classification_zero_results {query, wd_number}` ← **the conformance demand signal; the single
most valuable event in the product** ·
`classification_row_expanded {classification_id}` ·
`determination_text_opened {wd_number}` ·
`official_determination_link_clicked {wd_number}`

`classification_zero_results` is logged with its query on the WL-12 admin page. It tells us, in
the customer's own words, which classifications are missing from determinations — which is both
the conformance product (Later, WL-32) and the honest measure of whether the catalogue works.

## Test plan

**Unit** — `search_label` normalisation; `backhoe` → the OPERATOR row; two-electrician case
returns both; 1-character query returns everything; `total` is display-only.
**Integration (PGlite, seeded from `kb-samples/sam-wd-detail-TX20260253-rev1.json`)** —
57 rows, 15 groups, correct rate/fringe pairs on three spot-checked rows
(`ELECTRICIAN … $38.50/$10.71`, `LABORER: COMMON OR GENERAL $11.76/$0.00`,
`ELEVATOR MECHANIC $53.59/$38.44`).
**Gate test (G8)** — render the catalogue, the mapping screen and the hours grid; assert every
element carrying a currency value has an ancestor carrying `data-wd-number` and
`data-modification`. Fails the build otherwise.
**E2E** — search, expand a row, follow the SAM.gov link (assert `href`, do not fetch), open the
text view.
