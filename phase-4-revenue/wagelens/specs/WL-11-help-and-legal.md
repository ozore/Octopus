# WL-11 · Help, disclaimers and legal pages

**Effort: S · Must (MVP) · Depends on: nothing (written alongside everything else)**
Disclaimer texts, verbatim: [`../KNOWLEDGE_BASE.md`](../KNOWLEDGE_BASE.md) §9.

## Story

As Rosa, when I am stuck at 4pm on a Friday I find a plain-English answer inside the product,
and I can see exactly where every number came from — because I am about to sign a federal
statement that says willful falsification is a crime.

## Why this is a Must and not a Should

Two reasons, one for her and one for us.

**For her:** the WH-347 she signs carries, in capital letters at the bottom of page 2, the words
*"THE WILLFUL FALSIFICATION OF ANY OF THE ABOVE STATEMENTS MAY SUBJECT THE CONTRACTOR OR
SUBCONTRACTOR TO CIVIL OR CRIMINAL PROSECUTION."* She will not sign what she does not
understand, and there is no compliance department down the hall to ask. A product that cannot
answer "what is payroll number 8 and why does it matter" loses her at the certify button.

**For us:** PLAN A10 requires disclaimers on every screen and document, and gate **G8** makes it
structural rather than editorial — **the component that renders a rate is the component that
renders its provenance**, so no rate can appear anywhere without its WD number, modification
number and SAM.gov link.

## Flow / pages

```
/help                       index, six articles, searchable
  /help/what-is-certified-payroll
  /help/find-your-wage-determination-number
  /help/choosing-a-classification
  /help/nothing-matches-conformance
  /help/no-work-performed-weeks
  /help/what-wagelens-does-not-do
/legal/terms
/legal/privacy
/legal/disclaimer            the standing disclaimer, linked from every rate and every footer
in-product:  provenance line (every rate) · certify-screen disclaimer · PDF footer
             · onboarding acknowledgement (once, recorded)
```

### The six articles, and the question each one answers

| slug | the question it answers | the facts it must carry |
|---|---|---|
| `what-is-certified-payroll` | "What am I actually filing, and when?" | Weekly, every week covered work is performed (29 CFR 5.5(a)(3)(ii)(A)); WH-347 is **optional in form but the weekly submission is mandatory**; the Statement of Compliance must accompany it; the prime is responsible for submitting all subs' payrolls (5.5(a)(3)(ii)(A)); three-year retention (5.5(a)(3)(i)(A), (a)(3)(ii)(G)) |
| `find-your-wage-determination-number` | "Where do I get TX20260253?" | It is in your contract, incorporated by the contracting agency; ask the contracting officer or the prime; **the geography lookup narrows, the contract decides**; **12% of county/type combinations have more than one determination** (KNOWLEDGE_BASE F3); how to read the number |
| `choosing-a-classification` | "Is he an Electrician or a Low Voltage Technician?" | Classification follows **the work actually performed**, not the job title and not what you call him on private jobs; two workers on the same pour can lawfully earn different rates; the same determination can list the same trade twice at very different rates; **this is your decision and your legal responsibility** |
| `nothing-matches-conformance` | "What if none of them fit?" | Look again first; the three criteria; the request is filed by **your contracting agency** to **DBAConformance@dol.gov**; 30 days; 29 CFR 5.5(a)(1)(iii)(B) — it may not be used to split or subdivide a listed classification; what to pay in the meantime; an approved conformance applies from the first day the work was performed |
| `no-work-performed-weeks` | "We didn't work last week. Do I still file?" | Yes — a numbered payroll marked no work performed. A gap in numbers is the first thing an auditor looks for and the most common reason a GC withholds a progress payment |
| `what-wagelens-does-not-do` | "What am I still on the hook for?" | We do not run payroll, move money, file with anyone, choose classifications, or guarantee compliance. We show published determinations with their source, and we make the form. Links to the standing disclaimer |

## Data model

Articles are **content in the repository** — MDX files under `content/help/`, read at build
time, not rows in a table. Same principle as Clausewright's corpus-as-content: version
controlled, diffable, reviewable in a pull request, and impossible to edit accidentally in
production. One table, for the record we may later need:

```ts
disclaimer_acknowledgements
  id                uuid         primaryKey defaultRandom
  organisation_id   uuid         notNull references organisations(id)
  user_id           uuid         notNull references users(id)
  disclaimer_version text        notNull        // content hash of /legal/disclaimer at acknowledgement
  acknowledged_at   timestamptz  notNull default now()
  unique (user_id, disclaimer_version)
```

## Components (this is where the spec has teeth)

| component | where it renders | what it must contain |
|---|---|---|
| `<Rate>` | **every** place a currency figure derived from a determination appears | the value, and `data-wd-number`, `data-modification`, `data-published`, plus a hover/expand carrying the provenance line and the SAM.gov link |
| `<ProvenanceLine>` | inside `<Rate>`, and standalone on determination cards | "Rate from **{wd}** mod **{mod}**, published **{date}**. [View on SAM.gov ↗] · verified {last_verified}" |
| `<CertifyDisclaimer>` | the certify screen, above the button | the short form of §9.3 plus the 18 U.S.C. § 1001 / 31 U.S.C. § 3729 line |
| PDF footer | every generated document | KNOWLEDGE_BASE §9.2, verbatim |

**Gate G8 is a CI test that renders the catalogue, the crew page, the hours grid and the
determination card, then asserts that every element containing a currency-formatted value has an
ancestor carrying `data-wd-number` and `data-modification`.** A rate that escapes the component
fails the build.

## Validation rules

| # | rule |
|---|---|
| V1 | No rate renders outside `<Rate>`. *(G8)* |
| V2 | Every generated PDF carries the §9.2 footer. *(G8, asserted on extracted text)* |
| V3 | The standing disclaimer is acknowledged once at onboarding and recorded with its content hash; a material change re-prompts. |
| V4 | **No surface anywhere states a penalty amount, a success rate, or a compliance guarantee.** There is deliberately no component, field or content convention that would make one easy to add. |
| V5 | The figure `13,508` appears in no **user-facing string** — application source, help content, email templates, landing copy. *(a CI grep, scoped to `apps/wagelens/src`, `content/`, `emails/`; the figure does not survive verification against DOL's own penalty table, see `../identity/CLAUDE.md` V1.* **The grep must not scan `phase-4-revenue/`**, where the planning documents state the prohibition and would trip it.*)* |
| V6 | Help articles carry a `last_reviewed` date and a source list; every regulatory assertion cites its CFR section. |
| V7 | Terms and Privacy name TheVillage as the legal entity and WageLens as the product (PLAN D1). |

## Acceptance criteria

- **Given** any screen showing a rate, **when** the DOM is inspected, **then** the rate's
  ancestor carries `data-wd-number` and `data-modification`. *(G8)*
- **Given** a generated WH-347, **when** its text is extracted, **then** it contains the WD
  number, the modification number, the publication date and the "reproduction, not an official
  DOL document" sentence.
- **Given** a first login, **when** onboarding completes, **then** a
  `disclaimer_acknowledgements` row exists carrying the content hash of the disclaimer shown.
- **Given** the user-facing source tree, **when** CI runs, **then** a grep for `13,508` and for
  `guarantee compliance` returns nothing, **and** the same grep over `phase-4-revenue/` is not
  run — the planning documents state the prohibitions. *(V4, V5)*
- **Given** `/help/nothing-matches-conformance`, **when** it renders, **then** it contains the
  three criteria, `DBAConformance@dol.gov`, "30 days", and the 5.5(a)(1)(iii)(B) sentence about
  not splitting or subdividing.
- **Given** `/help/find-your-wage-determination-number`, **when** it renders, **then** it states
  that a county and construction type can map to more than one determination and that the
  contract is the authority.
- **Given** the certify screen, **when** it renders, **then** `<CertifyDisclaimer>` appears
  above the button and the three certifications are shown in full, not summarised.
- **Given** a help article, **when** it renders, **then** its `last_reviewed` date and its
  sources are visible.

## Edge cases

| case | behaviour |
|---|---|
| A user asks a question no article covers | Every article ends with a support mailto that pre-fills the page they were on. PLAN A6: auto-responder first, founder escalation second. |
| The disclaimer text changes materially | Content hash changes; the next login re-prompts once. Cosmetic edits do not (a `material` flag in the MDX frontmatter decides). |
| A rate is shown for a **superseded** modification (a project deliberately pinned to an older one) | The provenance line says so explicitly: "modification 1 — a newer modification (2) was published on {date}." Never presented as current. |
| Corpus stale past 35 days (gate G6) | `<ProvenanceLine>` shows the age in amber; the certify screen adds "verify against SAM.gov before filing". |
| Someone asks us to confirm a classification is correct | The support macro declines and points at `choosing-a-classification` and at the contracting officer. This is a policy, and it is written down in the support playbook (wave 3), not improvised. |

## Errors

| condition | user sees |
|---|---|
| Help article missing | Index with search, not a 404 dead end |
| Provenance data missing for a rate | The rate is **not rendered**; the row shows "source unavailable — open the determination" + link. Failing closed is the whole point of G8 |

## Analytics events

`help_article_viewed {slug, from}` · `help_searched {query, result_count}` ·
`disclaimer_acknowledged {version}` · `disclaimer_expanded {surface}` ·
`provenance_line_expanded {wd_number}` · `official_determination_link_clicked {wd_number, surface}` ·
`support_email_started {from_page}` · `legal_page_viewed {page}`

`official_determination_link_clicked` is the trust metric: people who open the source and come
back are people who believe the number. It should be **high early and fall over time** for a
given organisation. If it stays flat, the provenance is not landing.

## Test plan

**Gate G8 test** — render four screens and every PDF fixture; assert provenance on every rate.
**CI greps**, scoped to user-facing source only (`apps/wagelens/src`, `content/`, `emails/`) and
explicitly **excluding the planning directory**, which documents the prohibitions and would
otherwise fail its own rule: `13,508`, `guarantee compliance`, `guaranteed compliance`,
`success rate`, `we file for you`, `we file it for you`.
**Content tests** — every help article has `last_reviewed`, at least one source URL, and every
CFR citation matches `29 CFR 5\.\d+`; the conformance article contains the four required strings.
**Integration** — acknowledgement written on onboarding; a material change re-prompts once and
only once.
**E2E** — from the certify screen, follow the disclaimer link, read the article, return, certify.
