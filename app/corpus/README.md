# Clausewright corpus

The knowledge base. Per `CORPUS_DESIGN.md` §0.1 this is not a supporting asset — everything
the model says that is *specific* comes from here, and everything else is prose style.

**Loaders and retrieval live in `../src/lib/corpus/`. This directory is data.**

```
corpus/
├── taxonomy.json                       # L1 — 33 reason codes + UNCLASSIFIED
├── ontology/                           # JSON Schemas + the identifier grammar
├── L2-policy-clauses/                  # one markdown file per policy document
├── L3-appeal-patterns/                 # 33 appeal patterns, 1:1 with L1
└── L4-outcomes/                        # schema + forum seeds. NO OUTCOME DATA. EVER.
```

## What is actually in here

| Layer | Count | Source |
|---|---:|---|
| L1 reason codes | **33** (+ `UNCLASSIFIED`) | `CORPUS_DESIGN.md` §3.2 |
| L2 policy sources, citable | **11** | fetched from Amazon's CDN and Walmart Marketplace Learn on 2026-08-12 |
| L2 policy clauses | **85** | authored from those documents |
| L2 sources recorded as stubs | **7 entries** | named, attempted, unobtained — see `_stubs.md` |
| L3 appeal patterns | **33** | authored; `supporting_n: 0` on every one |
| L4 outcome records | **0** | by definition at launch |
| L4 seed observations | **2** | public Amazon Seller Forums threads |

**32 of 33 codes are draftable for a US seller.** The exception is `AMZ.OPS.DROPSHIP` — its
only governing source is a CDN edition whose marketplace could not be confirmed, so gate G7
withholds it and retrieval escalates instead of drafting. That is a recorded gap in
`taxonomy.json`, not a bug.

## The five rules this corpus is built on

1. **Never fabricate policy text.** A source that could not be fetched or extracted is a
   `stub: true` record with its URL, the HTTP status, the failure mode, and which codes it
   would have governed. Seven such entries exist. Every one of them is a task; none of them
   is a gap in what a customer sees, because a stub carries zero clauses *by construction in
   the build*, not by an author remembering to leave the file empty.

2. **Our prose is the citation target, never the platform's text.** Each clause carries an
   `our_summary` we wrote and an optional `quoted_excerpt` capped at **25 words** and marked
   as an excerpt (gate G4). There is no `source_text` field in any schema and gate G5 asserts
   none appears in any file. This is simultaneously the lower-copyright-risk option and the
   better UX — a plain-English clause summary reads better to a panicking seller than
   platform boilerplate. One of the rare places where the legal mitigation improves the
   product.

3. **A non-US edition never reaches a US seller.** Three Amazon sources carry
   `jurisdiction_caveat: true`: the Prohibited Seller Activities policy (CDN path `G/31`,
   India), the restricted-products document (states on its face that it applies to
   Amazon.co.uk), and the drop-shipping policy (path segment `G/41`, edition unconfirmed).
   Gate G7 filters them out of US retrieval, and where that leaves a code with nothing, the
   honest result is an escalation rather than a thin draft.

4. **Nothing claims evidence it does not have.** Every `notice_trigger_phrase` is derived
   from published policy wording and carries `observed: false`, because no real deactivation
   notice was available when this corpus was built — `CORPUS_DESIGN.md` §3.3.1 assumes
   observed strings and we do not have them. Every L3 pattern is `provenance: authored` with
   `supporting_n: 0`. The two forum seeds contribute exactly zero to that count (gate G16).
   A test fails the moment someone flips `observed` without doing the labelling work.

5. **No customer data, ever.** Gate G6 scans every file for email addresses, order ids,
   merchant tokens, ASINs, phone numbers and case ids. Corpus B lives only in Postgres. The
   failure this prevents is unrecoverable once pushed, and it costs one CI check now.

## Format deviations from CORPUS_DESIGN §2.1, and why

The spec sketches one file per reason code and one file per clause. This corpus stores:

- **L1 as a single `taxonomy.json`** — directly requested, and it is the artifact the
  classifier's cached prefix is built from, so one deterministic document beats 33.
- **L2 as one markdown file per *policy document*** with front matter carrying the source
  URL, retrieval date, policy id and reason codes covered, and one `## clause:` section per
  clause. Per-document provenance is load-bearing (URL, hash, tier, robots status, licence
  posture, jurisdiction) and belongs in exactly one place per document; per-clause files
  would duplicate it 85 times and let it drift.
- **L3 as a single `appeal-patterns.json`** — L3 records contain no third-party text, have
  no citation surface, and are consumed whole as a rubric by stage 4. File-per-record would
  buy nothing a JSON key does not.

The dialect L2 uses is parsed by a hand-rolled parser in `../src/lib/corpus/parse.ts` rather
than a YAML dependency: the corpus build must be byte-deterministic for the prompt cache
(ADR-003), and a general YAML loader's coercion rules are a poor thing to have standing
between a policy document and a customer-facing citation.

## Robots and acquisition posture

Both robots files were re-fetched immediately before collection, per `CORPUS_DESIGN.md`
§3.6, and both confirmed the design's findings:

- `m.media-amazon.com/robots.txt` has **no `User-agent: *` block** — so no default disallow —
  but does carry `User-agent: GPTBot → Disallow: /` and `User-agent: CCBot → Disallow: /`.
  Neither names us, but the signal is unambiguous, so acquisition was a short list of named
  document URLs fetched once each with an identified user agent, for the express purpose of
  authoring our own summaries. No spider, no bulk corpus, no recurring AI ingestion.
- `sellercentral.amazon.com/robots.txt` carries a broad `Disallow: /` with an explicit
  allowlist that includes `/forums/` and `/seller-forums`, and explicit disallows on
  `/forums/search` and `/forums/search.jspa`. The forum seeds came only from allowlisted
  paths; search is hard-blocked in code, not by convention.
- `marketplacelearn.walmart.com/robots.txt` still resolves only its `Sitemap:` line through
  the proxy — the open question `CORPUS_DESIGN.md` §3.6-B records remains open. The full
  directive set must be parsed in the Day-1 pre-flight before any crawl. The Walmart pages
  here were individually named fetches, not a crawl.

Extracted source text is a build-time intermediate and is **not committed**. Only our
summaries and ≤25-word marked excerpts are.

## Known holes, in priority order

1. **US editions of the Amazon Tier-A PDFs.** Confirmed present are `G/28` (NA) for the code
   of conduct and account health. The Prohibited Seller Activities policy is only located at
   `G/31` (India). One `G/01` (US) document was found — the Communication Guidelines — and it
   did not extract.
2. **`amz.ip` and `amz.cond`** fetched with HTTP 200 and yielded zero readable characters
   (subset-font encodings). These govern the four refer-out IP/counterfeit codes and the
   condition codes.
3. **BSA Section 3.** Login-gated. `AMZ.COC.SECTION3` is drafted against clauses that state
   the same enforcement power but are *not* Section 3, and the taxonomy records that.
4. **No observed notice strings.** The single highest-value input for classifier calibration,
   and it is human work (`LLM_ENGINE.md` §8.1).
5. **Two seed observations, both on one code.** A thin, non-representative sample,
   deliberately not padded: a fabricated post-mortem would be worse than a small one.
