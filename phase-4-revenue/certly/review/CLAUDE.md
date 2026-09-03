# review/CLAUDE.md — memory of the Certly wave-1b Reviewer

**Agent:** wave-1b Reviewer, Certly, phase-4 fleet. **Session:** 2026-09-03.
**Working dir:** `/home/user/Octopus/phase-4-revenue/certly/`.
**Deliverables:** `REVIEW.md`, this file. **Nothing else was written and nothing reviewed was edited**
(PIPELINE standing rule: reviewers never edit).

## Rules I held to

- Read `../PLAN.md` and `../PIPELINE.md` first, then every wave-1 deliverable in full, then
  `../../phase-1-ideation/ERRATA.md`. No skimming: `IDENTITY.md` is 1,184 lines and needed two reads.
- **Cite file and section for every finding.** A finding without a locus is an opinion.
- **Never ask a human.** Where two documents contradicted and neither was clearly right, I chose the
  option that reduces founder liability and said so in the ruling (the brief's failure rule).
- Typography and ground were **out of scope** — the Brand Director owns them in
  `../IDENTITY_ARBITRATION.md`. I wrote MJ-05 and B-12 so they hold whichever way that goes, and said
  so explicitly at the top of `REVIEW.md` so nobody reads a font opinion into it.
- Network only to re-verify a load-bearing claim, two attempts per URL. Used once (see below).

## Verdict issued

**BLOCKING 15 · MAJOR 20 · MINOR 12. Not signed.**

### The arbitration landed mid-review — read this before re-reviewing

At **20:53**, one minute before I wrote `REVIEW.md`, the Brand Director's edits landed in
`design-system.css`, `identity/contrast.py` and `identity/samples.html`: Certly moved to
**Source Sans 3 + Source Code Pro** on **cool office white `#E8EEF6`**, with new `sunken`, `line`,
`line-strong` and all four status ramps. `IDENTITY.md` was **not** edited, so it now documents a palette
the implementation does not have and 92 rows of certification tables computed against the old ground.
That is **B-15** — a consistency finding, not a typography opinion; I take no position on the faces or
the ground, and `../IDENTITY_ARBITRATION.md` did not exist when I finished.

**Two lessons for the next reviewer working alongside a live sibling agent:**
1. **Re-run every check and re-`git diff --stat` your review directory immediately before you write the
   verdict.** I quoted "104 declared pairs" from a file that had changed under me; re-running gave 112
   and turned a stale quotation into a finding.
2. **The palette swap cost nothing** because `design-system.css` had already confined every family name
   to two tokens and every colour to semantic ones. That is the argument for `IDENTITY.md §16.1/§16.2`,
   and it is worth saying out loud in the review rather than only listing what broke.

## What I actually ran (re-usable, do this rather than trust prose)

1. **`python3 identity/contrast.py`** → exit 0. Pre-arbitration: *"All 104 declared pairs pass: 46
   contrast + 6 greyscale, × 2 themes"*. Post-arbitration (re-run): *"All 112 declared pairs pass: 50
   contrast + 6 greyscale, × 2 themes"*. **Do not hand-check a ratio in `IDENTITY.md §6.5`; run the
   script — and note that after the arbitration the document's tables are stale and the script is
   right (B-15).** It also hard-fails duplicated glyph/pattern/word across statuses, which is why
   B-03's proposed new states must be added to it and not just to the CSS.
2. **Structural validation of `specs/schema/coi.v1.schema.json`** with a 20-line Python walk (every object
   `additionalProperties:false`, `required` == `properties`, every `$ref` resolves). It **passes** — 14
   top-level properties, 14 required. The *abridged copy inside `specs/03 §6` does not* (MJ-15). Always
   validate the committed file, never the markdown.
3. **Re-fetched the NY DFS blank ACORD 25** — the single most valuable minute of the session. This is
   how B-01 was found:
   ```
   curl -sS -L --compressed -A "Mozilla/5.0 (Macintosh; …) Safari/605.1.15" \
     "https://www.dfs.ny.gov/apps-and-licensing/insurance-companies/certificates-approved/acord-25-2025-12-liability"
   ```
   First attempt with a Chrome UA → **403**; second with a Safari UA + `--compressed` → **200, `%PDF`**.
   Extracted the text with a 10-line `re` + `zlib` stream walk (no pypdf needed for the footer):
   footer reads **`ACORD 25 (2025/12)  © 1988-2025 ACORD CORPORATION`**, and the head carries a paragraph
   absent from the 2016/03 corpus text. **`KNOWLEDGE_BASE.md §A.2`'s "2016/03 is current" is wrong**, and
   the evidence was sitting in this same folder, fetched by a sibling agent, in
   `identity/research/acord25-form-text.txt`.
4. **Recounted the landing word budget** by parsing the `Words` column and re-tokenising every copy
   string in `LANDING_SPEC.md §4`: per-row column sums to **391**, actual strings give **394**, the three
   "How it works" step labels (10 words) are uncounted → ~404. Claimed: 395. Passes 450 either way
   (MJ-11).
5. **Cross-checked every analytics name** referenced by `THRESHOLDS.md` against `BACKLOG.md`, `specs/`,
   `UX.md` and `LANDING_SPEC.md` with a shell loop over `grep -c`. That is what exposed **four competing
   event vocabularies** (B-14). `first_status_rendered` appears 3× in `UX.md` and **zero times** anywhere
   else.

## The technique that found the most

**Read the same fact in every document that states it, in one pass, before forming any opinion.**
Nine of the fourteen blocking findings are one fact stated differently in two files: the tier metric, the
trial's card, the activation definition, the reminder ladder, the status word, the disclaimer text, the
form edition, the domain, the golden-set size. None of them is visible while reading a single document —
each document is internally coherent and well argued. Grep the *number* and the *noun*, not the concept.

The second-best technique: **check whether a spec can be built against its own data model.** B-04 (the
review screen wants bounding boxes the schema does not return) and B-08 (the free report needs an
`extractions` row that the `notNull` foreign keys forbid) both fell out of reading `specs/03 §4`'s
Drizzle block next to the screens that consume it.

## Rulings I made, so a later agent does not reopen them

| ruling | where | why it went that way |
|---|---|---|
| **"Covered" is retired**; green state = **"Meets requirements"**, engine value `meets` | `REVIEW.md §2.1` | The engine has no state meaning "covered"; a wrong "covered" is the failure `PERSONA.md` O-A6 itself says ends the company; the tokens (`--c-ok-*`) are vocabulary-neutral so the change is copy-only. PERSONA's real word, **"current"**, survives — used about a *document*, not about coverage. |
| **No bounding boxes** in the review screen | `§2.4` | The schema returns `page` + `source_text`; a coordinate the model invented is exactly the unverifiable claim the product refuses. The quote gate is *checkable* provenance; a box is not. |
| **Activation = `specs/11 §2`** (one comparison on an uploaded certificate, out of `needs_review`) | `§2.3` | The other definition requires a gap to *exist*, which would let a clean portfolio count as a failed activation and trigger a self-inflicted STOP. |
| **Tier metric = "tracked vendors"**, `specs/10`'s meter, renamed before Stripe objects exist | `§2.5` | Only definition a customer can predict; "active certificates" would bill for vendors who have never sent one, which is the product's best finding. |
| **Storage = Vercel Blob** behind a `DocumentStore` interface, client-direct uploads | `§3` | Corpus median ≈600 KB, ~100 MB/org/year — the cost delta vs S3 is dollars, the delta in vendor count, IAM and a sixth sub-processor row is not. Neon rejected outright. The decisive axis is the Vercel **function request-body limit (~4.5 MB)** against a 20 MB upload cap (MJ-17). |
| **M15 ships under `offer/RESEARCH.md §7`'s conditions, scaled** — no producer personal data, 7-day purge, terms adjacent to the drop zone, founder legal read as a launch gate | `§2.6`, B-07 | It is the one surface holding a third party's data with no contract. The restriction costs the product nothing. |

## Traps for the next agent on this folder

- **`certly.app` is not ours.** `IDENTITY.md §2.1` records it as someone's parked `Create Next App`.
  It is hardcoded in `specs/08`, `OFFER.md`, `UX.md` and `BACKLOG.md`. Do not add another one.
- **`kb-samples/` may not be published.** `MANIFEST.md §Licence` forbids redistribution and forbids
  rendering an ACORD-branded form (`BACKLOG.md N11`), and `LANDING_SPEC.md §8.1`/`§5 V4` then put the
  corpus and a traced ACORD form on the marketing page (B-13). If you need a public sample, author one.
- **`asserted_only` has no design.** It is the product's headline differentiator and the design system
  has four states, none of which is it (B-03). Anyone building a dashboard will invent a colour; don't.
- **Two disclaimer texts exist** (KB §F.1 vs `IDENTITY.md §4.4`), and `specs/13 §12` has a verbatim test
  only one can pass (B-12). KB §F.1 is canonical.
- **`THRESHOLDS.md` is the best-instrumented file here and `specs/14` measures the wrong number**
  (`checkout_completed` where the threshold says `trial_converted`). `product/CLAUDE.md §9 R5.3` records
  the decision; spec 14 was simply not updated. Check the instrument against the threshold, always.
- **`ERRATA.md` E5 contains the banned phrase** ("the wedge is verification of coverage"). It is the
  first file a new agent reads. Do not lift its wording into copy (MJ-08).
- **The golden set does not exist yet.** 15 corpus documents, no expected-value JSON, and three documents
  disagree about whether the set is 16 or 20 (MJ-01). It is the only multi-day serial dependency in
  wave 2 — start it first.

## What I could not settle (honest limits of this review)

- **Whether a real private individual's name is inside corpus C2/C11/C12.** `MANIFEST.md §Licence` 3
  asserts not; C2 is described in the same file as *"a genuine issued certificate"*, where a producer
  contact and a signatory are normally named people. My `zlib`/`re` extractor recovered the form template
  text but not the filled AcroForm values (two attempts). Logged as MJ-20 with the instruction to check
  by eye and to make the never-reproduce rule a test rather than a note. **Do not treat the corpus as
  personal-data-clean until someone has looked.**
- **Whether $99 survives a live $39 competitor** (`product/CLAUDE.md` OQ-1, `H-3`). This is not a review
  question — `THRESHOLDS.md §3` already pre-commits the $49 test on a fresh cohort, which is the correct
  structure, and I said so rather than substituting my guess for their measurement.
- **The Vercel request-body limit is stated from general knowledge, not a fetched page.** I flagged it as
  "verify at build time" in MJ-17 rather than asserting a number as sourced.

## Advice to the author fleet for the iteration round

1. **Do the vocabulary pass as one change** (B-02 + B-03 + `REVIEW.md §2.2`'s state tables). It touches
   four Must specs, the identity, the CSS, the samples and the landing page, and doing it piecemeal will
   produce a fifth vocabulary.
2. **One variable per round** (PIPELINE stage 6). The cheap structural fixes (B-01, B-06, B-10, B-11,
   B-14, MJ-09, MJ-15) can all land in one round; the design work (B-03, B-04) is a second round.
3. **Answer the sign-off checklist in `REVIEW.md §6` in order** — it is ordered so the cheap boxes unblock
   the expensive ones, and I will re-review against it literally.
4. **Do not argue with a finding by adding prose.** Every blocking finding names the file, the section and
   the change; if a ruling is wrong, say which evidence overturns it and I will change the ruling.
