# L4 — the consented outcome corpus (Corpus B)

**There is no outcome data in this directory, and there never will be.**

Spec: `CORPUS_DESIGN.md` §2.1, §4. Corpus B lives **only** in Postgres. This directory holds
the schema (`schema.sql`), a pointer, and the forum seed observations (`seeds/`) — which are
*not* outcome records and are stored in their own table for exactly that reason.

## The rule, and why it is a rule rather than a note

> No PII, no customer text, and no verbatim customer notice ever enters the corpus directory.

Gate **G6** enforces it in CI (`src/lib/corpus/gates.ts`). The reason it is structural is that
the failure is silent: a customer notice pasted into a corpus file to "check something" would
be committed, pushed, and then present in every clone of the repository forever. Making the
repo safe to hand to a contractor — and partially open-sourceable later — costs one CI check
now and is unrecoverable later.

## What is here

| Path | What it is |
|---|---|
| `schema.sql` | The Corpus B tables, as specified in `CORPUS_DESIGN.md` §4.2. Applied through Drizzle migrations, not by hand. |
| `seeds/seed-observations.json` | Public forum post-mortems, `seed: true`, `citable: false`, contributing **0** to any pattern's `supporting_n`. |

## Why this is the moat, stated honestly

Corpus B is **0 records at launch** and no amount of design changes that. Per Helmer's
*7 Powers*, a Cornered Resource must be scarce *and* exclusively accessible, and on day one
ours is neither. What is available is **Process Power**: an outcome-feedback loop that returns
every Amazon and Walmart decision into the corpus within days.

That loop is why **B9 must ship day one or the data is lost forever**. Every case that
completes without a consent record is a permanent hole — you cannot retroactively consent a
customer from three months ago. Cheap now, impossible later, which is the whole argument for
D10 ranking this above everything else that could be cut.

## Four curation rules that are easy to lose

1. **Failures are worth more than successes.** A dataset of wins teaches a model to write
   confident prose; a dataset containing rejections teaches it which shapes fail. The
   one-click "Rejected" must be as prominent as "Reinstated" — that is a UI requirement
   derived from a data requirement.
2. **Deduplicate by structure, not by text.** `poa_structure_hash` exists so fifty
   near-identical drafts for one code count as evidence about one pattern.
3. **Quarantine on contradiction; do not average.** At n in the tens, averaging two
   disagreeing records produces confident nonsense. Flag both for a human.
4. **Corpus size is never a metric.** The reportable number is *verified records per reason
   code*, with the count of `rejected` outcomes shown alongside. A corpus with zero recorded
   failures is a broken corpus, not a good one.

## Seed observations are scaffolding, not evidence

The seeds in `seeds/` exist to give L3's `must_contain` and `anti_patterns` blocks a plausible
starting shape so the free readiness critique is useful on day one. They are:

- **never quoted** — forum text is authored by sellers, not by us and not by the platform;
- **never a policy fact** — a post is evidence of what a seller *says* happened;
- **never in a denominator** — they live in `seed_observation`, not `outcome_record`;
- **never counted** — `supporting_n` counts verified outcome records only (gate G16).

They get replaced, code by code, as real consented outcomes arrive.
