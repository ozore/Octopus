# Identifier grammar

Spec: `CORPUS_DESIGN.md` §2.3. Stable identifiers are load-bearing: a citation rendered
to a customer in month 1 must still resolve in month 12, and Corpus B rows reference
clause ids for years.

| Entity | Grammar | Example | Rule |
|---|---|---|---|
| Reason code | `{PLATFORM}.{FAMILY}.{SPECIFIC}` | `AMZ.AUTH.INAUTHENTIC` | Uppercase, dot-separated, **append-only**. Never renamed, never reused; retired codes keep their record and name a successor. |
| Policy source | `{platform}.{shortname}` | `amz.psaa` | Lowercase. One per *document*, not per URL — a document that moves URLs keeps its `source_id`. |
| Policy clause | `{source_id}#{slug}` | `amz.psaa#divert-transactions` | Slug derived from the clause heading and hand-stabilised. **Never** derived from a character offset: source text shifts, ids must not. |
| Appeal pattern | Same string as its reason code | `AMZ.AUTH.INAUTHENTIC` | Exactly one per code (gate G3). |
| Evidence item | `EV.{GROUP}.{SPECIFIC}` | `EV.INVOICE.SUPPLIER` | Shared across codes on purpose — the Evidence Kit dedupes by id. |
| Anti-pattern | `AP.{NAME}` | `AP.BLAME_PLATFORM` | Shared across codes; the critique rubric is keyed on it. |
| Seed observation | `SEED.{PLATFORM}.{TOPIC}.{N}` | `SEED.AMZ.VERIFICATION.1` | Never derived from a forum user handle. |
| Case | `case_{ulid}` | `case_01J9…` | Opaque. Not derived from email, merchant token or Stripe id. |

## Versioning

Policy clauses are **immutable once published to a customer**. A changed source produces a
*new* clause record with `supersedes` pointing at the old one; the old record flips to
`status: superseded` and is retained forever.

This is what makes a citation shown in March still explainable in December — a property we
will want the first time a seller says "you told me X."

## Why block indices, not character offsets

Each clause's `our_summary` is an **ordered array of paragraphs**, and each paragraph becomes
one content block in the custom-content document handed to the model
(`CORPUS_DESIGN.md` §5.2, `LLM_ENGINE.md` §4.2). A citation therefore resolves as

```
slice.documents[document_index].clauses[start_block_index].clause_id
```

— a total function over known ids, with no fuzzy character matching and no chunk-boundary
artifacts. **Re-ordering or re-splitting a clause's paragraphs is a breaking change to that
mapping**, so it is a new clause record with `supersedes`, not an edit in place.
