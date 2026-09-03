# Certly — Product Owner memory

**Agent:** Product Owner, phase-4 wave 1. **Session:** 2026-09-03.
**Working directory:** `/home/user/Octopus/phase-4-revenue/certly/`. Nothing outside it was written.
Read `../PLAN.md` and `../PIPELINE.md` first; they win over anything here.

---

## 1. What was delivered

| file | what it is |
|---|---|
| `BACKLOG.md` | §0 positioning, **15 Must**, 10 Should, 9 Later, 12 Never (each with its reason) |
| `specs/01..15-*.md` | one spec per Must item: story, flow, screens, Drizzle-ready model, actions, validation, Given/When/Then, edge cases, errors, events, test plan |
| `specs/schema/coi.v1.schema.json` | the extraction schema as a **complete, valid JSON Schema**; structurally checked (see §5) |
| `KNOWLEDGE_BASE.md` | §A ACORD 25 form · §B requirement templates · §C endorsement glossary · §D prompt + evals · §E refresh policy · §F disclaimers |
| `THRESHOLDS.md` | numbers with persevere/iterate/stop bands, 10 labelled hypotheses, evaluation protocol |
| `kb-samples/` | 23 fetched PDFs — 15 certificates, 3 endorsement packs, 5 requirement exhibits — plus `MANIFEST.md` with every source URL, fetch date, licence note and personal-data note |

---

## 2. Rules confirmed (do not re-litigate)

- **Write only under `phase-4-revenue/certly/`.** No code in `apps/`. No commit, no push, no sign-up,
  nothing sent.
- **Sources are opened, not remembered.** Every number in `KNOWLEDGE_BASE.md` §B/§C carries a URL and a
  `last_verified` date. Anything not fetched in-session says `UNVERIFIED` **in place**, not in a
  footnote.
- **No private individuals.** Vendor contacts are business mailboxes the customer typed. The only other
  address the product may email is the producer email **printed on a certificate the customer was
  given**. No scraping, no enrichment, no inference. This is a schema-level rule in
  `specs/04-vendor-directory-and-import.md` §6, not a policy note.
- **Engine patterns reused from Clausewright, not copied:** structured requests, mock/live adapters,
  evals on recorded responses, model id stamped per run, no tools, control flow in code.

---

## 3. What worked

- **`curl -L` with a Chrome UA beats WebFetch for PDFs**, and by a wide margin. WebFetch converts to
  markdown and cannot save bytes; curl got 23 files. Several `.gov` hosts 403 both, and those went
  straight into the manifest's "attempted and not obtained" table.
- **`pypdf` for triage.** Page count, `ACORD 25 (rev)` from the footer, form numbers by regex, and the
  `/Creator`/`/Producer` metadata — enough to classify layout variants in one pass without opening a
  single file by eye.
- **Reading the text layer *as a failure mode* was the single most valuable half hour.** The WisDOT
  certificate's text extracts bottom-up; the Cornell scan's OCR layer reads `INSUARNCE` and `IOJ~-`.
  That is what settled the whole extraction design: send page **images**, use the text layer only as a
  *check* (the quote gate), never as the primary signal.
- **Searching for GCs' own published subcontract exhibits** produced better template data than any
  industry guide. Five real exhibits with named trades and real dollar figures beat ten blog posts.
- **Checking competitors' own pricing pages rather than comparison articles.** The comparison articles
  were roughly right; the vendors' own pages gave quotable figures with dates.

## 4. What failed, and what to do instead

| attempt | outcome | next agent should |
|---|---|---|
| `davis-stirling.com` (California HOA contractor insurance) | Cloudflare 403 to WebFetch **and** curl, twice | ask the founder for a browser pull. It is the **only** gap that blocks a template (`OQ-3`) |
| `ogs.ny.gov`, `larimer.gov`, `hartfordct.gov` PDFs | 403 | not worth more effort; the content is covered by other corpus rows |
| ACORD's own blank ACORD 25 | not publicly distributed | do not chase it. A filled state-DOT 2016/03 example (C1) is a *better* fixture anyway |
| AMS-specific specimen output (Applied Epic, AMS360, HawkSoft, EZLynx) | does not exist publicly; vendor pages confirm only that all four emit ACORD 25s | **do not fake this.** It is `H-KB-1`, retired empirically by grouping accuracy on `documents.pdfProducer` |
| `smartcoi.io` (a named competitor) | 404 on two paths | its ~$79 price is third-party-sourced and marked `UNVERIFIED` in `BACKLOG.md` §0 |
| `pip install jsonschema` | network timeout | the schema is checked structurally instead (§5) — which is the check that actually matters for the API |

## 5. How to re-run the checks

```bash
# structural check on the extraction schema (the three rules the structured-outputs API enforces)
cd phase-4-revenue/certly/specs/schema && python3 - <<'EOF'
import json,sys
s=json.load(open("coi.v1.schema.json")); bad=[]
def w(n,p):
    if isinstance(n,dict):
        if n.get("type")=="object" and "properties" in n:
            if n.get("additionalProperties") is not False: bad.append(p+": additionalProperties")
            if set(n.get("required",[]))!=set(n["properties"]): bad.append(p+": required!=properties")
        [w(v,p+"/"+k) for k,v in n.items()]
    elif isinstance(n,list): [w(v,f"{p}[{i}]") for i,v in enumerate(n)]
w(s,"#"); print(bad or "OK"); sys.exit(1 if bad else 0)
EOF

# corpus triage
cd phase-4-revenue/certly/kb-samples && python3 - <<'EOF'
import glob,re
from pypdf import PdfReader
for f in sorted(glob.glob("*/*.pdf")):
    r=PdfReader(f); t="\n".join((p.extract_text() or "") for p in r.pages)
    print(f, len(r.pages), set(re.findall(r'ACORD 25 \(([0-9/]+)\)',t)) or "-")
EOF
```

---

## 6. Assumptions made (best defensible guess, no human asked)

| # | assumption | basis | how it dies |
|---|---|---|---|
| A1 | **"Tracked certificate" = one non-archived vendor.** | Counting documents would punish uploading renewals, which is the behaviour we want | a customer disputes the meter; it is stated on the billing screen |
| A2 | ~~Plan ladder at 50/150/**500**, 14-day **no-card** trial~~ → **superseded by `OFFER.md` §8/§9**: $99/$199/$299 at 50/150/**400** active certificates, **+$39 per 50** Certificate Pack, **card-required** 14-day trial, published $0.55/cert/mo above ~700 | pricing is the Offer agent's deliverable, not this one's; spec 10 was rewritten to follow it | `THRESHOLDS.md` §3's pre-committed $49 test |
| A3 | **Reminder ladder T−60/30/14/7/1 then T+1 and weekly to T+28.** | T−30/14/7 is conventional; **T−60 and T+1 are derived** from a real GC exhibit requiring the replacement certificate 10 days before expiry | `renewal_received_after_reminder{rung}` shows which rungs earn their place |
| A4 | **τ = 0.85, confident-wrong target ≤ 2%.** | An opening value with a stated *method* (bound confident-wrong, accept the review rate that implies) | re-derived from the first 200 labelled documents (`H-EX-2`) |
| A5 | **`claude-opus-5` for extraction, Sonnet 5 as the standing nightly challenger.** | The one call whose error costs a customer a claim; ADR-101's promotion discipline reused | the nightly comparison |
| A6 | **Trial/lapse = read-only, never lock-out.** | Holding a customer's compliance record hostage produces chargebacks, not revenue | support volume and refund rate |
| A7 | **Forward-by-email is Should, not Must.** | Resend Inbound makes *receiving* trivial; **routing** an agent's email to the right org+vendor is the real cost, and mis-filing is worse than not filing. M8's link covers 80% of the job | `inbound_unmatched` rate if SH-1 ships |
| A8 | **`pm.snow` limits and `tenant.retail_food` are our inference**, shipped flagged in the UI | no published source found | a customer edits them |
| A9 | **No A.M. Best lookup at launch** — the requirement renders as `not_checked` | ratings are licensed data | `OQ-4` |
| A10 | **The Free Gap Report is a product surface (M15), not a landing page.** | `OFFER.md` makes it the offer's front end and `LANDING_SPEC.md` makes it the hero CTA; without a spec the page ships a CTA with nothing behind it | it is M4+M5+M12 with no account — if wave 2 finds it is more, re-scope it, do not silently drop it |
| A11 | **M15 needs a daily inference spend cap.** `OFFER.md` §4 budgets ~$0.50/report; spec 03's own per-document figure implies $2.50–5.00 | anonymous traffic spending real model money is the easiest way to lose money on this product | `gap_report_ready.cost_cents`, week one |

---

## 7. Open questions for the founder

| # | question | why it matters now |
|---|---|---|
| **OQ-1** | **The self-serve wedge is already occupied.** TrackMyVendor is $39/mo (free ≤25) and bcs is $0.95/vendor/mo (free ≤25), both feature-comparable and both live. Do we still price at $99, or launch at $49 and use the pre-committed test in reverse? | It changes the offer, the landing page and every outbound sequence. It does **not** change the backlog |
| **OQ-2** | Is the **three-state truth** (`asserted_only`) a marketing wedge we are willing to lead with? It means telling a prospect that their current tool's green ticks are not proof | It is the one thing we can say that is both true and uncomfortable, and it shapes the landing page's headline |
| **OQ-3** | Can someone open `davis-stirling.com/HOME/C/Contractor-Insurance` from a normal browser? | The only source gap blocking a template (California HOA) |
| **OQ-4** | Is there budget for **A.M. Best** ratings data? Four of five GC exhibits in our corpus demand A-/VIII | Without it, a real requirement stays `not_checked` in every report |
| **OQ-5** | Do we need an **ACORD licence**? We only *read* their forms and never render one, so we believe not — but the founder should decide, not an agent | `kb-samples/MANIFEST.md` §Licence |
| **OQ-6** | Which **document storage** — Vercel Blob, S3, or Neon large objects? Certificates are customer documents with a deletion obligation | Affects `documents.storageKey`, the export ZIP and the deletion job |
| **OQ-7** | Sending domain and physical address for the **CAN-SPAM footer** on vendor-facing email | M7 cannot ship without a physical address |

---

## 8. Advice to the next agent

- **Read `BACKLOG.md` §0 before anything else.** The competitive scan is the most consequential thing
  found this session and it re-frames every other document. Do not re-derive the MVP from the original
  dossier as if the $99 wedge were still open.
- **The reviewer (wave 1b) should attack three things**, in this order: (1) is $99 defensible against a
  live $39 competitor, or is `BACKLOG.md` §0 rationalising? (2) does `asserted_only` help a customer or
  just make the dashboard yellow? (3) are the PM/HOA templates (one `medium`-confidence source each)
  strong enough to ship, or should the product *require* the customer to paste their own clause (`SH-4`)
  before it will compare anything?
- **For the wave-2 engineer:** build `specs/05-comparison-engine.md` **first**, before extraction. It is
  pure, it is testable against recorded fixtures, and it defines exactly which fields extraction has to
  get right. Building the model call first tends to produce a schema shaped by what is easy to extract
  rather than by what the comparison needs.
- **Do not average extraction accuracy into one number**, anywhere — not in CI, not in `/admin`, not in
  marketing. Per field, with denominators. A 3% average that is 20% on `policy_exp` is a broken product
  wearing a good number.
- **Every threshold in `THRESHOLDS.md` names the event or table that renders it.** If you add a metric,
  add its instrument in the same change, or it is an opinion.
- **The corpus is an asset that outlives this idea.** 15 real-layout certificates with sources and
  licence notes took a session to assemble and would take another to rebuild. If Certly stops, the
  corpus and `KNOWLEDGE_BASE.md` §A/§C go to whatever reads insurance documents next.

---

## 9. Findings log (append-only)

### 2026-09-03 — R1: the "no self-serve competitor" premise in `shortlist.json` is FALSE
Fetched from the vendors' own pricing pages on 2026-09-03: **TrackMyVendor** free ≤25 subs / **$39**/mo
unlimited / **$59**/mo unlimited+users, 30-day trial, self-serve, with AI COI parsing, 90/60/30/7
alerts, per-project templates, CSV import, compliance reports and audit trail — near-identical to the
brief's MVP. **bcs** free ≤25 vendors, then **$0.95/vendor/mo** self-service with AI extraction,
deficiency notices and Yardi/Procore/MRI integrations. Jones, TrustLayer and myCOI remain demo-gated
and unpriced. Consequence: parity is table stakes; see `BACKLOG.md` §0 for the three differentiators
that replace the price wedge.

### 2026-09-03 — R2: engine facts verified live (platform.claude.com)
PDF `document` blocks; **32 MB / 600 pages** (100 under a 1M context); every page rendered to an image
*and* text-extracted; ~1,500–3,000 text tokens/page plus image tokens; prompt caching works on document
blocks. **`citations:{enabled:true}` + `output_config.format` → HTTP 400**, so extraction cannot use the
Citations API; provenance is built instead as the **quote gate** (spec 03 §7). Pricing: opus-5 $5/$25,
sonnet-5 $2/$10, haiku-4.5 $1/$5 per MTok; Batch = 50%.

### 2026-09-03 — R3: the sentence that defines the product
Printed on every ACORD 25: *"A statement on this certificate does not confer rights to the certificate
holder in lieu of such endorsement(s)."* A `Y` in `ADDL INSD` is a producer's claim, not proof. Corpus
document C2 — a genuinely issued certificate — is exactly that case: `Y` in both columns, forms named
only in free text, no endorsement pages. Hence the third comparison state, hence the review UI, hence
the report's "not checked" section. Everything downstream of that sentence.

### 2026-09-03 — R5: reconciled with `OFFER.md` and `LANDING_SPEC.md` (published mid-session)
The Offer & Landing agent reached the same competitive conclusion independently and added a fifth
priced competitor (**COI Tracker**, $29/$59/$129 with a free 10-vendor tier — reminders and storage but
**no extraction, no requirement matching, no endorsement checking**), which strengthens rather than
weakens `BACKLOG.md` §0: the cheap tier of this market tracks *dates*; nobody at that price reads the
document. Three changes were made here as a result, and no sibling file was edited:
1. **spec 10 rewritten** to `OFFER.md`'s ladder (50/150/**400** + a $39/50 Pack) and its
   **card-required** 14-day trial. The earlier no-card, 500-certificate draft is gone.
2. **M15 added to the Must list** with `specs/15-free-gap-report.md`. The offer's front end is a
   product surface, not a page.
3. **`THRESHOLDS.md` §3 re-defined** on `trial_converted` (first `invoice.paid`), not
   `checkout_completed` — with a card-required trial those are different events, and measuring the
   card would flatter us.
One disagreement is left open rather than papered over: `OFFER.md` §4 budgets ~$0.02 per certificate of
inference, spec 03 models $0.10–0.20 per document. That is a 5–10× gap. It does not change any
decision, it is logged as `H-EC-1`, and M15 §11 holds the downside with a spend cap until real
`cost_cents` settles it.

### 2026-09-03 — R4: the text layer is a trap
`wisdot-…-2016-03.pdf` extracts bottom-up (cancellation clause first, producer name last).
`Sample-COI-Vendors-08-03-2020.pdf` is a Fujitsu scan whose Acrobat OCR layer reads `INSUARNCE`,
`IOJ~-`, `rt~ Nol` while the page image is perfectly legible. Never parse the text layer as the primary
signal. Use it only to *check* what the model reported.
