# CERTLY — IDENTITY (v1)

**Product (working name):** Certly — *reads every vendor's certificate of insurance, checks it against
your requirements, and chases the renewal before it lapses.*
**Author:** Buyer & Identity agent, wave 1. **Date:** 2026-09-03.
**Implements:** `PERSONA.md` (binding). **Implemented by:** `design-system.css`, `identity/samples.html`.
**Consumed by:** `UX.md`, `LANDING_SPEC.md`, and every screen built in wave 2.
**Contrast:** every ratio in §6 is produced by `identity/contrast.py`. **No ratio in this document was
typed by hand.** Re-run `python3 identity/contrast.py --md` to regenerate the tables; the script exits
non-zero if any declared pair fails, so CI can gate on it.
**Amendment rule:** an amendment needs a fetched source and a note of what it supersedes. A preference is
not a source.

---

## Arbitration 2026-09-03

`../IDENTITY_ARBITRATION.md` (Brand Director, 2026-09-03) is binding on the visual layer of all three
phase-4 apps and takes precedence over this document where the two disagree. **This document has been
brought into line with it** — `certly/REVIEW.md` B-15 required exactly that, because `design-system.css`
is the build reference and §6 was documenting a palette the CSS no longer had.

**What changed, and where to read the reasoning**

| | was | is | why (arbitration §) |
|---|---|---|---|
| UI typeface | Public Sans | **Source Sans 3** | all three sibling apps had independently chosen Public Sans; WageLens keeps it because its output is a US federal form. Source Sans 3 is the humanist, single-storey-`g` register of the buyer's actual stack — Buildium ships Open Sans, Rent Manager Lato, CINC Inter. §3.1 |
| mono | IBM Plex Mono | **Source Code Pro** | the designed superfamily partner of the UI face, so a limit aligns in a mono cut from the same skeleton as its label. §3.1 |
| ground | warm `#F3F3EE` | **cool office white `#E8EEF6`** | the warm ground was borrowed from Procore — the *general contractor's* world, our **second** buyer. The recommended first buyer sits in AppFolio, Buildium, Yardi, Rent Manager or CINC, and those are cool, white and navy-chromed. §2.4, §3.2 |
| primary button | ink `#0F1A2B` | **the interaction blue `#14458C`** | ink collided with a sibling's ink button. Blue was already this system's single declared non-status hue; it now does links, focus **and** the primary action. **No status colour appears on a control** — P2's actual rule is untouched. §3.3 |
| status hues | 147 / 35.5 / 4.7° | **164.2 teal / 47.3 olive-gold / 344.8 crimson** | siblings' greens, ambers and reds were within a few degrees of ours. Minimum separation across the fleet's nine chromatic statuses is now 8.1°. §3.4 |
| status states | four | **seven** | `REVIEW.md` B-03: the comparison engine emits seven and the identity carried four. §6.4, arbitration §4.2 |
| the green state's name | "Covered" | **"Meets requirements"**, pill `MEETS` | `REVIEW.md` §2.1. Token names (`--c-ok-*`) are vocabulary-neutral and did not change; the noun *coverage* survives in its form-derived sense, so the **coverage bar** keeps its name. |

**What did not change:** the coverage bar and the gap-as-a-hole, per-field confidence, the as-of stamp,
the document being present, no `backdrop-filter`, the seven design principles, the tone rules, the
component inventory, and every word of §3's positioning.

Enforced by `../scripts/identity-distinctness.py`, which parses the three `design-system.css` files and
fails if two apps share a font family or two grounds are too close. It must exit 0 in CI alongside
`identity/contrast.py`.

---

## 0. The one idea this identity is built on

> **The buyer's job is one question asked over and over — *is this vendor covered right now?* — and every
> tool they own can only answer with a date somebody typed. Certly's identity exists to make the answer
> visible before the sentence is finished.**

That is not a slogan; it is the finding in `PERSONA.md §2.3` restated as a design brief. The dread is not
"I do not have the document". It is *"I have a document and I do not know whether it is the right one any
more."* Procore stores **Insurance Type, Effective Date, Expiration Date, Limit, Name, Policy Number**
`[D1]`; Buildium's own advice is *"set reminders to check for renewals"* `[D2]`. Both hold a date. Neither
reads the certificate. **The identity's job is to look like the thing that reads it.**

Two consequences run through everything below, and they are the two rules a reviewer should test against:

1. **Colour means status and nothing else.** There is no decorative hue anywhere in this system. If
   something is green it is covered; if it is amber it is expiring; if it is red there is a gap. A brand
   colour splashed on a header would make every screen look like a status it is not.
2. **A status is never asserted without a date and a source.** Every status carries an "as of", and every
   extracted field can be traced to the place on the document it came from. A product that says "covered"
   and is wrong is worse than a spreadsheet, because the spreadsheet never claimed to know.

---

## 1. Ideation — three identity directions, from the buyer's chair

Per `PIPELINE.md` stage 1, options with the reasoning, not one answer. Each is written from the buyer's
point of view: what they would think in the first two seconds.

### Direction A — "The Clipboard"

*The buyer thinks: finally, something made for people like me, not for a risk department.*

Field-ops utility. Safety-adjacent chroma, condensed uppercase labels, heavy rules, dense tables, a
jobsite grammar. It would sit comfortably beside Procore, whose served design tokens are literally named
`gray-asphalt`, `gray-concrete`, `gray-rebar`, `yellow-crane`, `blue-tarp`, on a warm stone-grey ramp,
under a `theme-color` of `#FF5200` `[G5]`.

**Why it is tempting.** It signals belonging to the GC instantly and it is the least likely direction to
be mistaken for enterprise software.

**Why it loses.** Three reasons, in order. (a) The recommended first buyer is not on a roof — she is at a
desk in a property management office `PERSONA.md §1`, and this dialect is the GC's, not hers. (b) A
safety-yellow or orange brand colour is *one hue away from the amber that has to mean "expiring"*; the
whole semantic system would have to shout over the brand. (c) It borrows Procore's costume while we are
selling against Procore's behaviour — Procore emails *you* daily for up to 74 days `[D1]` — and dressing
like the thing you are criticising is a weak position.

### Direction B — "The Underwriter"

*The buyer thinks: this looks like a document I could put in front of my carrier.*

Insurance-grade instrument. Deep ink, ivory paper, a text serif for headings and figures, ruled
certificate-like framing, seals and stamps. The artefact really is a certificate, and the buyer really
is judged on paperwork.

**Why it is tempting.** Gravitas, and total separation from a category of interchangeable SaaS blues.
It also flatters the one moment that matters most — handing a dated file to an owner, a board or an
auditor `[E4][E2]`.

**Why it loses.** It looks like the enterprise/legal product this ICP has already decided it is too small
for, and it is tonally wrong for a five-minute self-serve onboarding sold at $99. It also crowds
Clausewright, which already owns document-serif gravitas in this repo (`phase-2-build/identity/
DESIGN_SYSTEM.md §5.1`, a serif reserved for quoted policy text). Two sibling brands should not share a
costume.

### Direction C — "The Status Board" ← **chosen**

*The buyer thinks: I can see who is fine and who is not, without reading anything.*

Coverage is treated as a **state over time**, not a document in a folder. A calm paper ground and a single
dark ink carry the whole interface; the only chroma on screen is the three-state semantic system —
**Covered / Expiring / Gap** — plus a fourth honest state, **Needs review**. The signature device is the
**coverage bar**: a horizontal band per party showing each policy's period against today and against the
requirement window, so a gap is literally a hole you can see. Numbers are set in a monospace with tabular
figures because the buyer compares limits and dates all day.

**Why it wins.**

- It is the product's core idea made visible. The domain model *is* the design system: party →
  requirement → document → extraction → status → reminder.
- It is the only direction that serves both buyers without a costume change, which `PERSONA.md §7.3`
  requires (one product, two dialects).
- It answers the incumbent's weakness structurally rather than rhetorically: where they publish counts
  behind a demo `[A2][A3][A4][A5]`, we publish *spans* and a price.
- It leaves room for the thing that will actually decide whether this product is trusted — **per-field
  confidence** — because the interface has spare chroma budget for exactly one more meaning.

**The risk it carries, and the mitigation.** Green/amber/red is a traffic light, and a traffic light is a
cliché that also fails colour-blind users. Mitigation, enforced in §6.4 and proved by `contrast.py`: each
status owns a **word**, a **glyph** and a **fill pattern** in addition to a hue, and the three hues are
near-isoluminant by construction, so **colour is provably not the carrier**. It is the accelerator.

**What we take from the losers.** From B: the seriousness of the artefact — the certificate is shown, not
summarised away, and the export is a document not a screenshot. From A: nothing visual, but its instinct
is right that this buyer despises anything that smells of a risk department; that shows up in the tone
rules in §5, not in the pixels.

---

## 2. Naming — "Certly" is taken, three alternatives, one recommendation

The founder decides (`PLAN.md` A3, `PREREQUISITES.md` P11). This section gives the checks, not a verdict
dressed as one.

### 2.1 What is actually true about "Certly"

Checked on 2026-09-03. DNS through Google's DNS-over-HTTPS JSON resolver, because `dig` is not installed
in this environment and the system resolver answers `127.0.0.1` for every name — a trap worth writing
down for the next agent.

| check | result |
|---|---|
| `certly.com` A record | **`127.0.0.1`**, NS `ns1/ns2.ns-serve.net` — registered and pointed at loopback, i.e. held but not in service `[F1]` |
| `curl -sI https://certly.com` | **`HTTP/1.1 502 Bad Gateway`** `[F1]` |
| `certly.io` | resolves behind Cloudflare, HTTP 200 `[F2]` |
| `certly.ai` | resolves, connection fails `[F3]` |
| `certly.app` | HTTP 200, `<title>Create Next App` — a parked Next.js placeholder `[F4]` |
| `certly.co` | 301s to `haleyreedofficial.com`, a gambling page — an actively abused domain `[F5]` |
| `certly.net` | "Parked Domain name on Hostinger DNS system" `[F6]` |
| existing users of the name | **Certly** — Netherlands, ed-tech / professional-certification SaaS, founded 2022; **CERTLY LTD** — UK company number **14873119**, incorporated 16 May 2023; **certly.io** — Michigan trust-and-safety company, listed permanently closed `[F7]` |

**The verdict on the name, stated plainly.** Two live organisations already trade as Certly, one of them
in software; the `.com` is held by an unrelated party and dead; the `.co` is being used for gambling
spam. And distinctiveness is low even before that: the category is already **CertFocus, Certificial,
CertVault, myCOI** — "Certly" is the fourth car in a five-car pile-up of `Cert-` names. A weak mark is a
weak SEO position and a weak trademark. **Recommend renaming.**

### 2.2 The three alternatives, with the same checks

Every candidate was tested for: an existing company or product, a `.com`, working alternates, collision
with insurance terms of art, and whether it survives being said down a phone line to an insurance agent —
which is a real requirement, because the agent is the person our emails are addressed to `PERSONA.md §2.2`.

| | **Coverfile** | **Certbinder** | **Greenfile** |
|---|---|---|---|
| **the idea** | the file of coverage you keep on each party — and the state you want it in | the thing it replaces: the binder of certificates | the state you want every party in: green |
| **existing company/product** | **none found** `[F10]` | **none found** `[F12]` | **greenfile.work** — a Japanese construction document-management SaaS `[F14]`. Adjacent category, same word |
| **.com** | registered, parked at a resale registrar (`namebrightdns`) `[F8]` | SERVFAIL — registered with broken delegation `[F11]` | registered, GoDaddy DNS `[F13]` |
| **free alternates today** | `coverfile.io`, `coverfile.app`, `getcoverfile.com`, `usecoverfile.com`, `coverfileapp.com` — **all NXDOMAIN** `[F9]` | `certbinder.io`, `thecertbinder.com` — free `[F11]` | `greenfile.io`, `greenfile.app` — free `[F13]` |
| **collision with a term of art** | none | **yes, and it is serious**: a *binder* is temporary proof of coverage issued before the policy `[F12]`. An insurance agent will hear a product that issues binders | **yes, and it is serious**: in construction "green" means LEED and sustainability. A GC hears an environmental product |
| **in the `Cert-` pile-up?** | no | yes | no |
| **said to an agent** | "I'm sending you a request from Coverfile" — unambiguous, spells itself | "…from Certbinder" — the agent asks "a binder or a certificate?" | "…from Greenfile" — the agent asks what it is |

### 2.3 Recommendation

> **Rename to *Coverfile*. Ship on `getcoverfile.com` or the app's `*.vercel.app` URL now; buy
> `coverfile.com` from the resale market when there is revenue to justify it.**

The reasoning, in the order it should be weighed:

1. **It is the only one of the four with no found collision at all** — no company, no product, no
   insurance term of art `[F10]`.
2. **It steps out of the `Cert-` pile-up**, which is worth more than it sounds in a category where the
   buyer's search results are already four near-identical names.
3. **It says both halves of the promise in one word.** The *file* is the artefact the buyer keeps per
   vendor; *covered* is the state they are trying to hold. It works as a noun in product copy ("open the
   roofer's coverfile") and as a status sentence ("41 of 47 coverfiles are current").
4. **`PLAN.md` D3 removes the domain from the critical path**: no custom domains before launch, so the
   `.com` is a later purchase, not a blocker `[F17]`.

**What is missing and cannot be produced here.** A real trademark clearance. `trademarks.justia.com`
returns 403 and USPTO exposes no usable public JSON endpoint at the paths tried `[F15][F16]`. **Do not
spend money on a mark, a logo or a domain until a proper USPTO search has been run in class 9/42.** This
is written in `PREREQUISITES.md` terms: a founder task, not an agent task.

**If the founder keeps "Certly"** — a defensible choice, since the phase-3 lists, the repo slugs and the
Vercel project names all use it — then the mitigations are: never use `certly.co`; expect to lose the
`.com`; and accept that organic search will be shared with a Dutch ed-tech company. Nothing in this
document depends on the name. Every token is prefixed `--c-`, every class `.c-`, and the wordmark rules in
§5.6 are written to fit either word.

---

## 3. Positioning — Dunford's process, run in order

April Dunford's argument in *Obviously Awesome* (2019) is that positioning is a sequence of decisions
about context, not a tagline exercise. Each step below ends in a decision.

### Step 1 — The customers who would love it

We have none, so per Fitzpatrick's hierarchy we substitute the nearest admissible evidence: **who already
pays, and what their spending reveals.** Property managers pay Buildium **$62-$400/month** and start with
a **14-day trial, no credit card, 30 seconds** `[D3]` — they buy software by trying it. Their *vendors*
are already paying **$110/year** to Yardi VendorShield `[C1]` and **$99/$80** to RealPage Compliance Depot
`[C2]` for exactly this workflow, which proves the money exists and is simply pointed at the wrong party.
GCs pay Procore an unpublished annual fee scaled to construction volume `[D4]`.

**Decision.** The lovable customer is the person in a small firm who *is* the compliance function without
the title — and who will happily pay for certainty but will not sit through a demo to find out the price.

### Step 2 — Competitive alternatives (what they do if we do not exist)

| tier | alternative | what it costs | why it is real |
|---|---|---|---|
| **A. The default** | a spreadsheet plus calendar reminders | $0 | Buildium tells its own customers to *"set reminders to check for renewals"* `[D2]`; bcs describes the historical baseline as filing certificates alphabetically and setting calendar reminders `[E5]`. **This is the true benchmark.** |
| **A** | the PMS/PM tool's own expiry field | bundled | Procore's field list is a date and a limit somebody typed `[D1]` |
| **B. Priced, reachable** | **bcs free tier** — 25 vendors, self-serve, no card, no commitment | **$0** | `[A1]`. The most dangerous alternative in the file |
| **B** | bcs Self-Service | $0.95/vendor/month | `[A1]` |
| **C. Demo-gated software** | myCOI/illumend, TrustLayer, Jones, Certificial, SmartCompliance, CertFocus | unpublished | `[A2][A3][A4][A5][A8][A9]` |
| **C** | Evident | $15/vendor/yr — **but from 200 third parties**, ≈$3,000/yr floor | `[A10]` |
| **D. Managed service** | bcs Full-Service; CertFocus full-service | **$10,000 annual minimum**, 6-8 week implementation | `[A1][A7]` |
| **E. Make the vendor pay** | VendorShield, Compliance Depot, CertFocus vendor-pay | $80-$150 per vendor per year, **paid by the vendor** | `[C1][C2][A7]` |

**Decision.** We are positioned against **three** reference points and must never collapse them. Against
**A** we sell *interpretation* (a date is not a check). Against **B** we sell *the requirement template and
the confidence-visible extraction* (and we say the free tier exists). Against **C/D** we sell *the price on
the page and the five-minute start*. Against **E** we sell *we will never charge your vendors*.

### Step 3 — Unique attributes (nothing else in Step 2 has them)

- **UA1 — A published price, at this size.** Of the seven platforms in the brief, five publish nothing
  `[A2][A3][A4][A5][A8][A9]`; Evident publishes but starts at 200 third parties `[A10]`; bcs publishes and
  is therefore the one real competitor `[A1]`. *This is a positioning attribute, not a feature, and it is
  free.*
- **UA2 — Per-field confidence, shown next to the document it came from.** `PLAN.md §6` names extraction
  accuracy as the risk that can sink the product and prescribes *"confidence score per field, 'needs
  review' state"*. No competitor surfaces this; the category's answer to a hard certificate is a human
  queue — a rival reports CertFocus routes non-compliant certificates *"to a human for review"* `[A9]` and
  a myCOI customer complains *"Sometimes it takes longer for a COI to be reviewed once a revision has been
  uploaded"* `[B2]`. **We are faster and we show our uncertainty; they are slower and hide theirs behind a
  person.** That is a real trade and it should be stated as one.
- **UA3 — A requirement template built from the customer's own clause, in minutes.** The category's
  documented weakness: *"The customization of insurance requirements is a bit lacking"* `[B2]`, *"Getting
  myCOI up and running with all the little nuances of our company was definitely difficult"* `[B1]`, and a
  **6-8 week** full-service implementation `[A1]`.
- **UA4 — Nobody on the vendor's side pays or signs up.** Vendor-paid credentialing is documented at
  $80-$150/vendor/yr `[C1][C2][A7]`, and no-login upload is a *paid-tier* feature at one rival `[A9]`.

### Step 4 — Value themes

| theme | from | the value in their words | the word we own |
|---|---|---|---|
| **VT1 — You can see the answer.** | Direction C, UA2 | *"I can tell you who's covered without opening anything."* | **Covered** |
| **VT2 — It reads, it does not remind.** | UA2, UA3 | *"It knows the limit is $500k when the subcontract says $1M. A reminder never knew that."* | **Reads** |
| **VT3 — Nothing is hidden — not the price, not the uncertainty, not your vendors' wallets.** | UA1, UA2, UA4 | *"I know what it costs, I know what it isn't sure about, and my vendors aren't billed."* | **Plain** |

**Hormozi/Dunford tension, resolved the same way Clausewright resolved it and for the same reason:** lead
with the outcome to earn attention, differentiate immediately after to earn the premium. The outcome
("every vendor current") is category-level; every alternative promises it. The premium is bought by VT1-3.

### Step 5 — Who cares a lot

> **The operations or compliance coordinator at a 50-500 unit property management firm or a 5-60
> association HOA management firm, who holds a spreadsheet of vendor and tenant certificates, has no risk
> department, and buys software with a card after trying it.**

Beachhead discipline, one persona (`PERSONA.md §1`). The GC office manager is the **second** audience and
the **first** outbound target, because the premium audit is a dated, dollar-denominated trigger `[E2][E3]`.

### Step 6 — Market category

**"Vendor insurance compliance, self-serve."** Not "risk management" — that is Evident's frame and it
comes with 200-third-party minimums and enterprise logos `[A10][A11]`. Not "document management" — that is
what the buyer already has and it is what failed them. The category label must contain the word
**insurance** (so search finds us) and the word **self-serve** or its behaviour (so the buyer knows they
will not be handed to a salesperson).

### Step 7 — Relevant trends

Only one is used, and only because it is first-party: the incumbent has itself declared that reading
certificates with a model is the new baseline — myCOI rebuilt around an engine that reads *"additional
insureds, waivers of subrogation, primary and non-contributory clauses, per-project aggregates"* and
claims **45M+ documents** and *"87% faster reviews vs manual"* `[A4]`. **Consequence for our copy: "AI
reads your COIs" is table stakes, not a differentiator, and leading with it makes us the fourth
identical claim on the page.** We lead with the price and the visible confidence.

### Step 8 — The positioning statement

> **For the operations and compliance coordinator at a small property management, association management
> or contracting firm — who tracks certificates of insurance in a spreadsheet and finds out about a lapse
> when something has already gone wrong — Certly is vendor insurance compliance you can buy today.
> It reads each ACORD 25, checks it against the requirement you wrote once, shows you exactly what it
> read and how sure it is, and chases the renewal with the vendor's agent before the policy lapses.
> Unlike myCOI, TrustLayer, Jones, Certificial and CertFocus, the price is on the page and there is no
> demo; unlike VendorShield and Compliance Depot, your vendors are never charged.**

### Step 9 — Proof, and what we are forbidden to claim

**Permitted on day one** — each is verifiable by the reader:

- the price, on the page;
- the competitors' own gating, cited and linked, stated as fact and not as an insult;
- the extraction shown against the document with per-field confidence;
- what we do **not** read, **quoted from the form itself**. Every ACORD 25 carries, in capitals across its
  head, *"THIS CERTIFICATE IS ISSUED AS A MATTER OF INFORMATION ONLY AND CONFERS NO RIGHTS UPON THE
  CERTIFICATE HOLDER"*, and, below it, *"If the certificate holder is an ADDITIONAL INSURED, the
  policy(ies) must have ADDITIONAL INSURED provisions or be endorsed… A statement on this certificate does
  not confer rights to the certificate holder in lieu of such endorsement(s)"* `[E7]`. Our buyer has read
  that a thousand times and stopped seeing it. **Quoting the form back to them is the cheapest and
  strongest credibility move available to us**, and it is the reason we can never say "verified coverage".
  The same form footnotes that *"LIMITS SHOWN MAY HAVE BEEN REDUCED BY PAID CLAIMS"* `[E7]` — so even a
  perfectly read $2,000,000 aggregate is not a promise of $2,000,000.

**Forbidden until earned** — the same discipline `phase-2-build/identity/BRAND.md` applies to Clausewright:

- **No accuracy percentage** until we have measured one on a stated corpus with a stated method. The
  category is full of unaudited numbers `[A4]`; we do not add one.
- **No customer count, no logo wall, no "trusted by"** until they are true.
- **No claim that we verify coverage.** We verify what the certificate *says*. Only the carrier knows what
  the policy does. The product says "as of this document, dated X".

### Step 10 — Capture it

This document plus `design-system.css` plus `UX.md`. `LANDING_SPEC.md` inherits §3 and §5 unchanged.

---

## 4. Tone of voice

### 4.1 The voice in one line

**A competent colleague who has read the certificate, tells you what it says, and does not pretend to
know what it does not.**

Three properties, each with a test a reviewer can apply:

| property | means | test |
|---|---|---|
| **Plain** | Short sentences. The buyer's nouns, ordinary verbs. No abstraction where a number will do. | Would this sentence survive being read aloud to an insurance agent on the phone? |
| **Dated** | Every claim about a state carries a date or a document. | Can the reader tell *when* this was true and *from what*? |
| **Bounded** | We say what we did not check as readily as what we did. | Does the sentence claim knowledge of the policy, rather than of the certificate? If so, it is wrong. |

The voice is **not** reassuring, not enthusiastic, and never congratulatory. This buyer's failure mode is
a claim denial `[E4]` or a five-figure audit adjustment `[E3]`; a product that says "Nice work! 🎉" when a
certificate arrives has misread the room.

### 4.2 The word list — the vocabulary decisions, and why

Sourced from `PERSONA.md §2.5` and `§3.5`.

| we say | not | because |
|---|---|---|
| **Meets requirements** (pill: `MEETS`) | Covered, Compliant | *Compliant* is the vendor's word for itself and the incumbent's word for its product. **"Covered" is retired too** (`REVIEW.md §2.1`): the engine has no state that means "covered", and a wrong "covered" is `PERSONA.md` O-A6 — *"the failure that ends the company"*. "Meets requirements" says exactly what we checked: this certificate against the requirement you wrote. |
| **Claimed, not evidenced** | Asserted, Unverified endorsement | The `ADDL INSD` or `SUBR WVD` box is ticked and no endorsement page is attached. The form's own words are the argument: *"A statement on this certificate does not confer rights to the certificate holder in lieu of such endorsement(s)"* `[E7]`. This is the state `BACKLOG.md §0 D1` calls the one thing in the category that is both true and uncomfortable, so it gets plain words, not a euphemism. |
| **Not checked** / **No certificate** | Unknown, Missing, N/A | Two different facts. *Not checked* means the requirement does not apply to this party or has not been run; *no certificate* means nothing has arrived. Neither is a judgement about the party, which is why neither carries chroma (§6.4). |
| **Gap** | Non-compliant, Failed, Violation | A gap is a factual description of a hole in coverage. "Violation" makes the vendor an offender and the buyer an enforcer, which is not the relationship a 12-unit landscaper has with a 60-association manager. |
| **Expiring** | Expiring soon, At risk, Warning | Add the number of days; do not add an adjective. |
| **Needs review** | Error, Unknown, Failed to parse | The honest state when confidence is low. It is a first-class outcome of a working system, not a malfunction, and it must never look like one. |
| **Vendor** (PM) / **Sub** (GC) | Third party, Supplier, Trade partner | The dialect switch from `PERSONA.md §7.3`. "Third party" is Evident's enterprise word `[A11]`. |
| **Requirement** | Policy, Rule, Profile | *Requirement* is what the lease or subcontract imposes. "Policy" is already taken by the insurance policy and using it twice is a real ambiguity. |
| **Certificate**, **ACORD 25**, **additional insured**, **waiver of subrogation**, **endorsement**, **certificate holder**, **each occurrence**, **general aggregate** | any paraphrase | These are terms of art `[E1][A4]`. Paraphrasing them is the fastest way to sound like an outsider. |
| **Current** | Up to date, Valid, Active | The buyer's own word — a property manager's vendor packet says the fee is *"required to keep your compliance and registration current"* `[C1]`. **Use it about a document, never about a party:** *"this certificate is current as of 3 Sep 2026"* is a statement about a date on a piece of paper and is always either true or false. `REVIEW.md §2.1.4`. |
| **We asked their agent** | We notified the vendor | The agent issues the certificate. Naming the agent proves we know how the workflow actually runs. |
| **As of 3 Sep 2026** | Live, Real-time, Always up to date | A certificate is a snapshot `[E1]`. Claiming real-time knowledge of a policy is a lie we would eventually be caught in. |

### 4.3 Do and don't

**Hero.**
- ✅ *"Know which vendors are covered — today, and on the day it matters."*
- ✅ *"Every certificate read, every gap named, every renewal chased. $99/month, no demo."*
- ❌ *"AI-powered insurance compliance for the modern enterprise."* — the fourth identical claim on the
  search page `[A4]`, and "enterprise" is the wrong buyer `[A11]`.
- ❌ *"Never worry about insurance compliance again."* — a promise we cannot keep, about an outcome we do
  not control.

**A status.**
- ✅ *"Gap — general liability aggregate is $1,000,000. Your requirement is $2,000,000."*
- ✅ *"Expiring in 9 days — auto liability, policy 4-CA-119302, expires 12 Sep 2026."*
- ❌ *"⚠️ Compliance issue detected!"* — a label with no content, and an alarm where a fact belongs.
- ❌ *"All good! ✅"* — no date, no scope, no evidence.

**Low confidence.**
- ✅ *"We read the general aggregate as $2,000,000 but we are not confident — the figure sits on a fold in
  the scan. Check it against the highlighted box."*
- ❌ *"Extraction failed."* — it did not fail; it produced a value with a confidence.
- ❌ Silently hiding the field. **The worst option in the system.** A hidden uncertain field is how a
  product tells a customer something is fine when it does not know.

**Chasing a vendor's agent.**
- ✅ *"Hello — we handle insurance requirements for Ridgeline Property Management. Northgate Landscaping's
  general liability certificate expires on 12 September. Could you send an updated ACORD 25 naming
  Ridgeline Property Management as certificate holder and additional insured? You can reply to this email
  with the PDF attached, or use this link — no account needed."*
- ❌ Anything with a login wall, a fee, or a deadline written in capitals. Vendor-side fees are the
  category's documented sin `[C1][C2][A7]` and our answer is to have none.

**Price.**
- ✅ *"$99 a month up to 50 certificates. $199 to 150. $299 to 500. Cancel from the settings page."*
- ❌ *"Contact us for pricing."* — this is the sentence the entire positioning is built against
  `[A2][A3][A4][A5]`.

**Errors and empty states.**
- ✅ *"We could not read this file. It looks like a photo of a screen — if you can, ask the agent to send
  the original PDF."* (says what is wrong, says what to do, blames nobody)
- ❌ *"Oops! Something went wrong."*

**Talking about competitors.** Name them, link them, quote them accurately, never sneer. *"myCOI,
TrustLayer, Jones, Certificial and CertFocus do not publish a price"* is checkable and therefore powerful.
*"The old guard is broken"* is neither.

### 4.4 Microcopy invariants (binding on every screen)

1. Every status is accompanied by a date.
2. Every extracted value is one interaction away from the place on the document it came from.
3. Every low-confidence value says so in words, not only in colour.
4. Every gap report and every export carries: *"Certly reports what a certificate says against the
   requirement you set. It is not insurance advice and it does not verify the underlying policy."*
5. No exclamation marks in product copy. None. They are for good news, and this product's good news is
   silence.

---

## 5. Design principles

Seven, each with a source, a consequence and a falsifiable review test.

### P1 — Status is the highest-contrast thing on any screen

**Source.** `PERSONA.md §2.6` JTBD-A1: answer "is this vendor covered?" in one sentence, without opening
anything.
**Consequence.** On the vendor table, the coverage bar and the status word out-rank the vendor's name in
visual weight. On a vendor page, the status band sits above the fold, above the documents.
**Test.** Squint at any screen until text is unreadable. The status pattern must still be legible. If the
first thing that resolves is chrome, a logo, or a chart, the screen fails.

### P2 — Chroma carries status; the one non-status hue carries interaction

**Source.** §0 rule 1; WCAG 1.4.1. **Amended by `../IDENTITY_ARBITRATION.md §3.3`,** which moved the
primary button from ink to the interaction hue so that no two sibling apps ship the same ink button.

**Consequence.** There is still **no brand hue** in the interface. There is exactly one non-status hue —
the interaction blue at 215.5°, chosen at a hue angle far from every status hue — and it does exactly one
job: **interaction**. Links, the focus ring, the selected-tab rule and the primary button. Everything
else with chroma in it is a state.

**Test.** `grep` the codebase for `--c-ok`, `--c-warn`, `--c-gap`, `--c-ast`. Every use must be a status.
A status colour on a header, a chart series, a marketing panel, a decorative accent **or a control** is a
review failure. And the converse: `--c-action` must never appear on something that is not interactive.

### P3 — Nothing is asserted without a date and a source

**Source.** `[E1]` — a certificate *"is a starting point, not a guarantee"*, reflecting coverage *"at the
moment it was issued"*.
**Consequence.** The `as-of` stamp is a component (§12.3), not a habit. The extraction panel is built as
document-plus-reading, never as reading-alone.
**Test.** Find any status on any screen with no date within its own component. That is a failure.

### P4 — Uncertainty is designed, not hidden

**Source.** `PLAN.md §6`: *"confidence score per field, 'needs review' state"* is the named mitigation for
the risk that can sink this product.
**Consequence.** Confidence has its own visual language (§9.4): a three-step meter, a word, and a distinct
field treatment. "Needs review" is a normal state with normal styling — bordered, not alarmed.
**Test.** Screenshot the review panel with every field at low confidence. It must look like work to do,
not like a broken product.

### P5 — Time is drawn, not described

**Source.** `PERSONA.md §2.3` — the buyer's problem is a state over time, and the failures are all
temporal: expired six months ago `[E4]`, dropped mid-project `[E6]`, valid at issue only `[E1]`.
**Consequence.** The coverage bar (§9.2) is the system's signature. Anywhere a date range exists, it is
drawn against today before it is written out.
**Test.** Cover every number on the vendor page. The reader must still be able to say which policy ends
first.

### P6 — The document is present

**Source.** `PERSONA.md §2.9` trust signal 2: this buyer has read a thousand ACORD 25s.
**Consequence.** The certificate is rendered, not iconified. The extraction panel is side-by-side by
default on desktop; the highlight on the page is part of the reading, not a hover extra.
**Test.** Can a user check our reading of "general aggregate" against the form without leaving the screen?

### P7 — Quiet by default, loud only for a gap

**Source.** `PERSONA.md §2.1` — this person is doing fifteen other jobs. Contrast with Procore, which
*"sends daily reminders starting two weeks before the expiration date and continues for up to 60 days
after"* `[D1]`: up to 74 consecutive emails about one policy, to the person who cannot fix it.
**Consequence.** No badges on counts that are fine. No red for "expiring". No notification for a status
that has not changed. Reminders go to the party who can act — the agent — on a schedule the user set, and
stop the instant the document arrives.
**Test.** A vendor whose certificate is fine generates **zero** pixels of alarm and **zero** emails.

---

## 6. Colour

### 6.1 The rationale, in one paragraph

The palette has **one ink, one paper, one interaction blue, and four status hues carrying seven states** —
and that is the whole list. There is no brand colour, because a brand colour on a status board is a lie:
the eye reads saturated hue as meaning, and any hue that does not mean a state steals attention from the
ones that do (**P2**).

The ink is a deep blue-black rather than a neutral black so that the interface reads as *document* rather
than *console*. **The paper is a cool office white `#E8EEF6`** — hue 214°, Lab L\* 93.87 — because that is
the ground the buyer's own stack sits on: AppFolio, Buildium and Rent Manager are all white or near-white
with navy chrome (`../IDENTITY_ARBITRATION.md §2.4`). The earlier warm-neutral ground was borrowed from
Procore, which is the *general contractor's* tool and therefore our second buyer's, not our first's.

The interaction blue sits at **hue 215.5°**, far from meets (**164.2°**), expiring and claimed
(**47.3°** and **45.2°**) and gap (**344.8°**) — measured with `colorsys` on the exact token values — so
under the common colour-vision deficiencies it can never be mistaken for a status. The ink is deliberately
in the same hue family as the interaction blue (**216.4°**, 48% saturation, 11% lightness): the chrome is
one cool family, and the only thing that breaks out of it is a state.

**A note on the three chromatic statuses.** Green/amber/red is the buyer's existing mental model — every
incumbent uses it and *"Approved Vendor"* status is the state the buyer is already trying to hold `[C1]`.
Fighting it would be design vanity. What we do instead is refuse to let colour be the *carrier* (§6.4).
Our particular green, amber and red are pushed to **teal 164°, olive-gold 47° and crimson 345°** so that
no sibling app in the fleet lands within 8° of them (`../IDENTITY_ARBITRATION.md §3.4`) — a constraint
that costs nothing here, because the buyer reads the word and the glyph before the hue.

### 6.2 Tokens — light

| token | hex | role |
|---|---|---|
| `--c-paper` | `#E8EEF6` | the application ground. **Cool office white**, the temperature of the buyer's own stack, so a white card reads as paper on a desk |
| `--c-surface` | `#FFFFFF` | cards, tables, panels, the document viewer's page |
| `--c-sunken` | `#DEE7F1` | inset wells: the document viewport behind a PDF page, a code/clause block |
| `--c-line` | `#C7D3E0` | table rules, card edges, dividers |
| `--c-line-strong` | `#718094` | **input and control borders** — the value is set by WCAG 1.4.11, not by taste. It has to clear 3:1 against the sunken well as well as against white, which is what fixes it here |
| `--c-ink` | `#0F1A2B` | primary text; the primary button's fill |
| `--c-ink-strong` | `#1B2941` | headings |
| `--c-ink-muted` | `#495A73` | secondary text, labels, table meta |
| `--c-ink-faint` | `#6E7C91` | large-text meta only — **never** body copy |
| `--c-ink-disabled` | `#828E9E` | disabled control ink |
| `--c-link` / `--c-focus` | `#14458C` | links, focus ring, selected row edge — the only non-status hue |
| `--c-link-hover` | `#0E3266` | link hover/active |
| `--c-action` / `--c-action-hover` / `--c-on-action` | `#14458C` / `#0E3266` / `#FFFFFF` | **the primary button.** The same hue as the link, because the interaction hue does interaction (**P2**) |
| `--c-select-bg` | `#DCE7FA` | the selected table row and text selection — a tint of the interaction hue, never of a status |
| `--c-ok-fg` / `--c-ok-bg` / `--c-ok-line` / `--c-ok-solid` | `#0C5F4A` / `#DCEDE8` / `#7FBBAB` / `#0F6E55` | **Meets requirements** — teal, hue 164° |
| `--c-warn-fg` / `--c-warn-bg` / `--c-warn-line` / `--c-warn-solid` | `#6B5507` / `#F2EBCE` / `#C6B370` / `#7A6209` | **Expiring** — olive-gold, hue 47° |
| `--c-ast-fg` / `--c-ast-bg` / `--c-ast-line` / `--c-ast-solid` | `#4F3D06` / `#EDE3C0` / `#B7A25E` / `#5E4907` | **Claimed, not evidenced** — the Expiring hue, one step deeper (45°). No fifth hue: see §6.4 |
| `--c-gap-fg` / `--c-gap-bg` / `--c-gap-line` / `--c-gap-solid` | `#A01739` / `#F8E1E7` / `#DFA0B2` / `#B01A40` | **Gap** — crimson, hue 345° |
| `--c-rev-fg` / `--c-rev-bg` / `--c-rev-line` | `#3D4F66` / `#E3E9F1` / `#A6B5C7` | **Needs review** |
| `--c-nc-fg` / `--c-nc-line` | `var(--c-ink-muted)` / `var(--c-line-strong)` | **Not checked** — achromatic on purpose |
| `--c-none-fg` / `--c-none-line` | `var(--c-ink-muted)` / `var(--c-line-strong)`, dashed | **No certificate** — achromatic on purpose |
| `--c-on-ink` / `--c-on-solid` | `#FFFFFF` | text on an ink fill and on a solid status fill |

### 6.3 Tokens — dark

Authored independently rather than derived by inversion, because an inverted amber goes muddy and an
inverted red goes pink. Same names, same meanings.

| token | hex | note |
|---|---|---|
| `--c-paper` | `#0B1220` | never pure black — pure black plus a bright status is a halation problem |
| `--c-surface` | `#141D2C` | |
| `--c-sunken` | `#0F1725` | |
| `--c-line` / `--c-line-strong` | `#2A3547` / `#5E7090` | `line-strong` is again set by 1.4.11 |
| `--c-ink` / `--c-ink-strong` | `#E9ECF2` / `#F4F6F9` | never `#FFFFFF` on a dark ground |
| `--c-ink-muted` / `--c-ink-faint` / `--c-ink-disabled` | `#A7B3C4` / `#8B98AB` / `#67748A` | |
| `--c-link` / `--c-focus` / `--c-link-hover` | `#8FB4F5` / `#8FB4F5` / `#B3CCFA` | |
| `--c-action` / `--c-action-hover` / `--c-on-action` | `#8FB4F5` / `#B3CCFA` / `#0B1220` | the primary button inverts its label, like every fill in dark |
| `--c-select-bg` | `#1B2740` | selected row |
| Meets requirements | `#5FD3B0` / `#0F3A30` / `#2A6B5B` / `#5FD3B0` | fg / bg / line / solid |
| Expiring | `#E5C267` / `#332B10` / `#665521` / `#E5C267` | |
| Claimed, not evidenced | `#CBA855` / `#322813` / `#60501E` / `#CBA855` | the Expiring hue, one step deeper, exactly as in light |
| Gap | `#FF97AE` / `#40202A` / `#78323F` / `#FF97AE` | |
| Needs review | `#AEBACB` / `#243044` / `#3A4759` | |
| Not checked / No certificate | `#A7B3C4` / `#5E7090` | fg / edge, achromatic, no tint |
| `--c-on-ink` / `--c-on-solid` | `#0B1220` | on a light status fill in dark mode, ink is the *dark* value |

### 6.4 Colour-independence — the rule that makes the traffic light defensible

**Seven states, because the engine emits seven.** `REVIEW.md` B-03 found the identity carrying four while
the comparison engine emitted `met`, `gap`, `asserted_only`, `not_checked` and `needs_review` at
requirement level and added `expiring` and `no_certificate` at vendor level. The canonical lists are
`REVIEW.md §2.2`; the identity now covers all of them.

Because the chromatic status foregrounds must clear 4.5:1 against the *same* white, their luminances are
forced together: the tables in §6.5 show the four chromatic fills sitting within **1.47:1 of each other in
greyscale** in light and **1.32:1** in dark.
That is not a flaw to fix; it is arithmetic. It means **colour cannot be the carrier of meaning in this
system**, and the design is built accordingly. Every status carries four independent signals:

| state | word | glyph | fill pattern | hue |
|---|---|---|---|---|
| `met` | **"Meets"** / "Meets requirements" | check inside a **filled disc** | **solid** | teal 164° |
| `expiring` | "Expiring in N days" | clock inside a **ring** | **45° hatch** | olive-gold 47° |
| `asserted_only` | **"Claimed, not evidenced"** | **half-filled disc** | **vertical hatch** | the Expiring hue, one step deeper (45°) |
| `gap` | "Gap" | slash inside a **hollow disc** | **open, dashed edge** | crimson 345° |
| `needs_review` | "Needs review" | question mark in a **square** | **dot grid** | slate |
| `not_checked` | "Not checked" | **em dash, no container** | **open, hairline edge** | none — achromatic |
| `no_certificate` | "No certificate" | **empty document outline** | **open, single diagonal rule** | none — achromatic |

**Three deliberate decisions in that table.**

1. **`asserted_only` shares the Expiring hue.** A ticked `ADDL INSD` box with no endorsement page
   attached is a *kind of caution*, not a new meaning, and §6.1 allows no fifth hue. It is separated by
   the **half-filled disc** that `LANDING_SPEC.md §5 V1` calls the product's logo-equivalent, by a
   **vertical** hatch — the one pattern whose rules run with gravity, so it can never be read as
   Expiring's 45° hatch — and by its word. This is the reviewer's own proposal, adopted.
2. **`not_checked` and `no_certificate` carry no chroma at all.** Neither is a judgement about a party:
   one means the requirement has not been run, the other means nothing has arrived. Giving them a hue
   would make the interface accuse somebody of something it has not checked.
3. **`not_checked` is the only glyph with no container**, so the seven silhouettes stay separable at
   12px: three discs, one ring, one square, one document, one bare rule.

`contrast.py` hard-fails if the glyph, the pattern or the word is ever duplicated across two states, so
the guarantee extends automatically to any state added later. A greyscale print of the gap report — which
is what a board packet or an audit file actually is — remains readable, because the pattern and the word
survive the photocopier.

**The separator rule.** In the coverage bar, adjacent segments are separated by a 1px line in
`--c-surface`. Each segment therefore contrasts against the *surface* (5.5:1 to 6.7:1, see the tables)
rather than against its neighbour (about 1.1:1, which would fail WCAG 1.4.11). The separator is what makes
the bar conformant; it is structural, not decorative, and must not be removed for visual density.

### 6.5 Contrast certification

Produced by `identity/contrast.py`. Ratios are **truncated**, never rounded up, so a printed value never
overstates the measured contrast. Levels: **AA** = 4.5 (body text), **AA-lg** = 3.0 (large text),
**UI** = 3.0 (WCAG 1.4.11 non-text), **HOUSE** = 1.15 (an in-house perceptibility floor for tints and
hairlines that carry no meaning on their own — declared as a house rule, not as a WCAG level).

Regenerate with `python3 identity/contrast.py --md`. The script exits non-zero on any failure — and on a
duplicated status glyph, pattern or word. **Everything below this line is script output, pasted
verbatim; `REVIEW.md` B-15 exists because it once was not.**

**Light theme**

| foreground | bg | ratio | required | verdict | what it is |
|---|---|---:|---:|---|---|
| `--c-ink` `#0F1A2B` | `--c-paper` `#E8EEF6` | **14.95:1** | 4.5 (AA) | PASS | body text on the app ground |
| `--c-ink` `#0F1A2B` | `--c-surface` `#FFFFFF` | **17.45:1** | 4.5 (AA) | PASS | body text on a card |
| `--c-ink-strong` `#1B2941` | `--c-surface` `#FFFFFF` | **14.58:1** | 4.5 (AA) | PASS | headings on a card |
| `--c-ink-muted` `#495A73` | `--c-paper` `#E8EEF6` | **6.01:1** | 4.5 (AA) | PASS | secondary text on the ground |
| `--c-ink-muted` `#495A73` | `--c-surface` `#FFFFFF` | **7.01:1** | 4.5 (AA) | PASS | secondary text on a card |
| `--c-ink-faint` `#6E7C91` | `--c-surface` `#FFFFFF` | **4.23:1** | 3.0 (AA-lg) | PASS | table meta / timestamps (large text only) |
| `--c-link` `#14458C` | `--c-surface` `#FFFFFF` | **9.29:1** | 4.5 (AA) | PASS | link text on a card |
| `--c-link` `#14458C` | `--c-paper` `#E8EEF6` | **7.96:1** | 4.5 (AA) | PASS | link text on the ground |
| `--c-on-action` `#FFFFFF` | `--c-action` `#14458C` | **9.29:1** | 4.5 (AA) | PASS | label on the primary button |
| `--c-on-action` `#FFFFFF` | `--c-action-hover` `#0E3266` | **12.59:1** | 4.5 (AA) | PASS | label on the primary button, hover |
| `--c-on-ink` `#FFFFFF` | `--c-ink` `#0F1A2B` | **17.45:1** | 4.5 (AA) | PASS | label on an ink fill (report rule, badge) |
| `--c-ink` `#0F1A2B` | `--c-sunken` `#DEE7F1` | **13.97:1** | 4.5 (AA) | PASS | text in a sunken well (document viewport, note) |
| `--c-ink-muted` `#495A73` | `--c-sunken` `#DEE7F1` | **5.61:1** | 4.5 (AA) | PASS | the note block's secondary text |
| `--c-ink` `#0F1A2B` | `--c-select-bg` `#DCE7FA` | **14.01:1** | 4.5 (AA) | PASS | text in a selected table row |
| `--c-action` `#14458C` | `--c-surface` `#FFFFFF` | **9.29:1** | 3.0 (UI) | PASS | primary button edge against a card |
| `--c-action` `#14458C` | `--c-paper` `#E8EEF6` | **7.96:1** | 3.0 (UI) | PASS | primary button edge against the ground |
| `--c-focus` `#14458C` | `--c-surface` `#FFFFFF` | **9.29:1** | 3.0 (UI) | PASS | focus ring against a card |
| `--c-focus` `#14458C` | `--c-paper` `#E8EEF6` | **7.96:1** | 3.0 (UI) | PASS | focus ring against the ground |
| `--c-line-strong` `#718094` | `--c-surface` `#FFFFFF` | **4.02:1** | 3.0 (UI) | PASS | input border on a card |
| `--c-line-strong` `#718094` | `--c-paper` `#E8EEF6` | **3.44:1** | 3.0 (UI) | PASS | input border on the ground |
| `--c-line-strong` `#718094` | `--c-sunken` `#DEE7F1` | **3.22:1** | 3.0 (UI) | PASS | the upload drop-zone border on its well |
| `--c-ink-disabled` `#828E9E` | `--c-surface` `#FFFFFF` | **3.32:1** | 3.0 (UI) | PASS | disabled control ink (1.4.11-exempt; held anyway) |
| `--c-ok-fg` `#0C5F4A` | `--c-ok-bg` `#DCEDE8` | **6.29:1** | 4.5 (AA) | PASS | COVERED pill text |
| `--c-warn-fg` `#6B5507` | `--c-warn-bg` `#F2EBCE` | **5.99:1** | 4.5 (AA) | PASS | EXPIRING pill text |
| `--c-gap-fg` `#A01739` | `--c-gap-bg` `#F8E1E7` | **6.32:1** | 4.5 (AA) | PASS | GAP pill text |
| `--c-rev-fg` `#3D4F66` | `--c-rev-bg` `#E3E9F1` | **6.85:1** | 4.5 (AA) | PASS | NEEDS REVIEW pill text |
| `--c-ast-fg` `#4F3D06` | `--c-ast-bg` `#EDE3C0` | **8.16:1** | 4.5 (AA) | PASS | CLAIMED, NOT EVIDENCED pill text |
| `--c-nc-fg` `#495A73` | `--c-surface` `#FFFFFF` | **7.01:1** | 4.5 (AA) | PASS | NOT CHECKED / NO CERTIFICATE pill text on a card |
| `--c-nc-fg` `#495A73` | `--c-paper` `#E8EEF6` | **6.01:1** | 4.5 (AA) | PASS | NOT CHECKED / NO CERTIFICATE pill text on the ground |
| `--c-ok-fg` `#0C5F4A` | `--c-surface` `#FFFFFF` | **7.63:1** | 4.5 (AA) | PASS | COVERED text in a table cell |
| `--c-warn-fg` `#6B5507` | `--c-surface` `#FFFFFF` | **7.17:1** | 4.5 (AA) | PASS | EXPIRING text in a table cell |
| `--c-gap-fg` `#A01739` | `--c-surface` `#FFFFFF` | **7.84:1** | 4.5 (AA) | PASS | GAP text in a table cell |
| `--c-ok-fg` `#0C5F4A` | `--c-paper` `#E8EEF6` | **6.53:1** | 4.5 (AA) | PASS | COVERED text on the ground |
| `--c-warn-fg` `#6B5507` | `--c-paper` `#E8EEF6` | **6.14:1** | 4.5 (AA) | PASS | EXPIRING text on the ground |
| `--c-gap-fg` `#A01739` | `--c-paper` `#E8EEF6` | **6.72:1** | 4.5 (AA) | PASS | GAP text on the ground |
| `--c-ast-fg` `#4F3D06` | `--c-surface` `#FFFFFF` | **10.48:1** | 4.5 (AA) | PASS | CLAIMED, NOT EVIDENCED text in a table cell |
| `--c-ast-fg` `#4F3D06` | `--c-paper` `#E8EEF6` | **8.98:1** | 4.5 (AA) | PASS | CLAIMED, NOT EVIDENCED text on the ground |
| `--c-ok-solid` `#0F6E55` | `--c-surface` `#FFFFFF` | **6.20:1** | 3.0 (UI) | PASS | COVERED dot / coverage-bar segment on a card |
| `--c-warn-solid` `#7A6209` | `--c-surface` `#FFFFFF` | **5.86:1** | 3.0 (UI) | PASS | EXPIRING dot / coverage-bar segment on a card |
| `--c-gap-solid` `#B01A40` | `--c-surface` `#FFFFFF` | **6.84:1** | 3.0 (UI) | PASS | GAP dot / coverage-bar segment on a card |
| `--c-ok-solid` `#0F6E55` | `--c-paper` `#E8EEF6` | **5.32:1** | 3.0 (UI) | PASS | COVERED segment on the ground |
| `--c-warn-solid` `#7A6209` | `--c-paper` `#E8EEF6` | **5.02:1** | 3.0 (UI) | PASS | EXPIRING segment on the ground |
| `--c-gap-solid` `#B01A40` | `--c-paper` `#E8EEF6` | **5.86:1** | 3.0 (UI) | PASS | GAP segment on the ground |
| `--c-on-solid` `#FFFFFF` | `--c-ok-solid` `#0F6E55` | **6.20:1** | 4.5 (AA) | PASS | text on a solid COVERED fill |
| `--c-on-solid` `#FFFFFF` | `--c-gap-solid` `#B01A40` | **6.84:1** | 4.5 (AA) | PASS | text on a solid GAP fill |
| `--c-ast-solid` `#5E4907` | `--c-surface` `#FFFFFF` | **8.63:1** | 3.0 (UI) | PASS | CLAIMED half-disc / bar segment on a card |
| `--c-ast-solid` `#5E4907` | `--c-paper` `#E8EEF6` | **7.39:1** | 3.0 (UI) | PASS | CLAIMED half-disc / bar segment on the ground |
| `--c-on-solid` `#FFFFFF` | `--c-ast-solid` `#5E4907` | **8.63:1** | 4.5 (AA) | PASS | text on a solid CLAIMED fill |
| `--c-nc-line` `#718094` | `--c-surface` `#FFFFFF` | **4.02:1** | 3.0 (UI) | PASS | NOT CHECKED hairline edge on a card |
| `--c-nc-line` `#718094` | `--c-paper` `#E8EEF6` | **3.44:1** | 3.0 (UI) | PASS | NO CERTIFICATE dashed edge on the ground |
| `--c-ok-bg` `#DCEDE8` | `--c-surface` `#FFFFFF` | **1.21:1** | 1.1 (HOUSE) | PASS | COVERED tint against the card |
| `--c-warn-bg` `#F2EBCE` | `--c-surface` `#FFFFFF` | **1.19:1** | 1.1 (HOUSE) | PASS | EXPIRING tint against the card |
| `--c-gap-bg` `#F8E1E7` | `--c-surface` `#FFFFFF` | **1.24:1** | 1.1 (HOUSE) | PASS | GAP tint against the card |
| `--c-rev-bg` `#E3E9F1` | `--c-surface` `#FFFFFF` | **1.22:1** | 1.1 (HOUSE) | PASS | NEEDS REVIEW tint against the card |
| `--c-ok-line` `#7FBBAB` | `--c-surface` `#FFFFFF` | **2.18:1** | 1.1 (HOUSE) | PASS | COVERED pill hairline against the card |
| `--c-warn-line` `#C6B370` | `--c-surface` `#FFFFFF` | **2.08:1** | 1.1 (HOUSE) | PASS | EXPIRING pill hairline against the card |
| `--c-gap-line` `#DFA0B2` | `--c-surface` `#FFFFFF` | **2.14:1** | 1.1 (HOUSE) | PASS | GAP pill hairline against the card |
| `--c-rev-line` `#A6B5C7` | `--c-surface` `#FFFFFF` | **2.08:1** | 1.1 (HOUSE) | PASS | NEEDS REVIEW pill hairline against the card |
| `--c-ast-bg` `#EDE3C0` | `--c-surface` `#FFFFFF` | **1.28:1** | 1.1 (HOUSE) | PASS | CLAIMED tint against the card |
| `--c-ast-line` `#B7A25E` | `--c-surface` `#FFFFFF` | **2.51:1** | 1.1 (HOUSE) | PASS | CLAIMED pill hairline against the card |
| `--c-line` `#C7D3E0` | `--c-surface` `#FFFFFF` | **1.51:1** | 1.1 (HOUSE) | PASS | table rule against the card |
| `--c-line` `#C7D3E0` | `--c-paper` `#E8EEF6` | **1.30:1** | 1.1 (HOUSE) | PASS | table rule against the ground |

**Dark theme**

| foreground | bg | ratio | required | verdict | what it is |
|---|---|---:|---:|---|---|
| `--c-ink` `#E9ECF2` | `--c-paper` `#0B1220` | **15.82:1** | 4.5 (AA) | PASS | body text on the app ground |
| `--c-ink` `#E9ECF2` | `--c-surface` `#141D2C` | **14.28:1** | 4.5 (AA) | PASS | body text on a card |
| `--c-ink-strong` `#F4F6F9` | `--c-surface` `#141D2C` | **15.61:1** | 4.5 (AA) | PASS | headings on a card |
| `--c-ink-muted` `#A7B3C4` | `--c-paper` `#0B1220` | **8.81:1** | 4.5 (AA) | PASS | secondary text on the ground |
| `--c-ink-muted` `#A7B3C4` | `--c-surface` `#141D2C` | **7.96:1** | 4.5 (AA) | PASS | secondary text on a card |
| `--c-ink-faint` `#8B98AB` | `--c-surface` `#141D2C` | **5.77:1** | 3.0 (AA-lg) | PASS | table meta / timestamps (large text only) |
| `--c-link` `#8FB4F5` | `--c-surface` `#141D2C` | **8.06:1** | 4.5 (AA) | PASS | link text on a card |
| `--c-link` `#8FB4F5` | `--c-paper` `#0B1220` | **8.92:1** | 4.5 (AA) | PASS | link text on the ground |
| `--c-on-action` `#0B1220` | `--c-action` `#8FB4F5` | **8.92:1** | 4.5 (AA) | PASS | label on the primary button |
| `--c-on-action` `#0B1220` | `--c-action-hover` `#B3CCFA` | **11.53:1** | 4.5 (AA) | PASS | label on the primary button, hover |
| `--c-on-ink` `#0B1220` | `--c-ink` `#E9ECF2` | **15.82:1** | 4.5 (AA) | PASS | label on an ink fill (report rule, badge) |
| `--c-ink` `#E9ECF2` | `--c-sunken` `#0F1725` | **15.17:1** | 4.5 (AA) | PASS | text in a sunken well (document viewport, note) |
| `--c-ink-muted` `#A7B3C4` | `--c-sunken` `#0F1725` | **8.45:1** | 4.5 (AA) | PASS | the note block's secondary text |
| `--c-ink` `#E9ECF2` | `--c-select-bg` `#1B2740` | **12.57:1** | 4.5 (AA) | PASS | text in a selected table row |
| `--c-action` `#8FB4F5` | `--c-surface` `#141D2C` | **8.06:1** | 3.0 (UI) | PASS | primary button edge against a card |
| `--c-action` `#8FB4F5` | `--c-paper` `#0B1220` | **8.92:1** | 3.0 (UI) | PASS | primary button edge against the ground |
| `--c-focus` `#8FB4F5` | `--c-surface` `#141D2C` | **8.06:1** | 3.0 (UI) | PASS | focus ring against a card |
| `--c-focus` `#8FB4F5` | `--c-paper` `#0B1220` | **8.92:1** | 3.0 (UI) | PASS | focus ring against the ground |
| `--c-line-strong` `#5E7090` | `--c-surface` `#141D2C` | **3.37:1** | 3.0 (UI) | PASS | input border on a card |
| `--c-line-strong` `#5E7090` | `--c-paper` `#0B1220` | **3.74:1** | 3.0 (UI) | PASS | input border on the ground |
| `--c-line-strong` `#5E7090` | `--c-sunken` `#0F1725` | **3.58:1** | 3.0 (UI) | PASS | the upload drop-zone border on its well |
| `--c-ink-disabled` `#67748A` | `--c-surface` `#141D2C` | **3.57:1** | 3.0 (UI) | PASS | disabled control ink (1.4.11-exempt; held anyway) |
| `--c-ok-fg` `#5FD3B0` | `--c-ok-bg` `#0F3A30` | **6.85:1** | 4.5 (AA) | PASS | COVERED pill text |
| `--c-warn-fg` `#E5C267` | `--c-warn-bg` `#332B10` | **8.19:1** | 4.5 (AA) | PASS | EXPIRING pill text |
| `--c-gap-fg` `#FF97AE` | `--c-gap-bg` `#40202A` | **7.05:1** | 4.5 (AA) | PASS | GAP pill text |
| `--c-rev-fg` `#AEBACB` | `--c-rev-bg` `#243044` | **6.75:1** | 4.5 (AA) | PASS | NEEDS REVIEW pill text |
| `--c-ast-fg` `#CBA855` | `--c-ast-bg` `#322813` | **6.40:1** | 4.5 (AA) | PASS | CLAIMED, NOT EVIDENCED pill text |
| `--c-nc-fg` `#A7B3C4` | `--c-surface` `#141D2C` | **7.96:1** | 4.5 (AA) | PASS | NOT CHECKED / NO CERTIFICATE pill text on a card |
| `--c-nc-fg` `#A7B3C4` | `--c-paper` `#0B1220` | **8.81:1** | 4.5 (AA) | PASS | NOT CHECKED / NO CERTIFICATE pill text on the ground |
| `--c-ok-fg` `#5FD3B0` | `--c-surface` `#141D2C` | **9.20:1** | 4.5 (AA) | PASS | COVERED text in a table cell |
| `--c-warn-fg` `#E5C267` | `--c-surface` `#141D2C` | **9.85:1** | 4.5 (AA) | PASS | EXPIRING text in a table cell |
| `--c-gap-fg` `#FF97AE` | `--c-surface` `#141D2C` | **8.28:1** | 4.5 (AA) | PASS | GAP text in a table cell |
| `--c-ok-fg` `#5FD3B0` | `--c-paper` `#0B1220` | **10.19:1** | 4.5 (AA) | PASS | COVERED text on the ground |
| `--c-warn-fg` `#E5C267` | `--c-paper` `#0B1220` | **10.91:1** | 4.5 (AA) | PASS | EXPIRING text on the ground |
| `--c-gap-fg` `#FF97AE` | `--c-paper` `#0B1220` | **9.17:1** | 4.5 (AA) | PASS | GAP text on the ground |
| `--c-ast-fg` `#CBA855` | `--c-surface` `#141D2C` | **7.46:1** | 4.5 (AA) | PASS | CLAIMED, NOT EVIDENCED text in a table cell |
| `--c-ast-fg` `#CBA855` | `--c-paper` `#0B1220` | **8.26:1** | 4.5 (AA) | PASS | CLAIMED, NOT EVIDENCED text on the ground |
| `--c-ok-solid` `#5FD3B0` | `--c-surface` `#141D2C` | **9.20:1** | 3.0 (UI) | PASS | COVERED dot / coverage-bar segment on a card |
| `--c-warn-solid` `#E5C267` | `--c-surface` `#141D2C` | **9.85:1** | 3.0 (UI) | PASS | EXPIRING dot / coverage-bar segment on a card |
| `--c-gap-solid` `#FF97AE` | `--c-surface` `#141D2C` | **8.28:1** | 3.0 (UI) | PASS | GAP dot / coverage-bar segment on a card |
| `--c-ok-solid` `#5FD3B0` | `--c-paper` `#0B1220` | **10.19:1** | 3.0 (UI) | PASS | COVERED segment on the ground |
| `--c-warn-solid` `#E5C267` | `--c-paper` `#0B1220` | **10.91:1** | 3.0 (UI) | PASS | EXPIRING segment on the ground |
| `--c-gap-solid` `#FF97AE` | `--c-paper` `#0B1220` | **9.17:1** | 3.0 (UI) | PASS | GAP segment on the ground |
| `--c-on-solid` `#0B1220` | `--c-ok-solid` `#5FD3B0` | **10.19:1** | 4.5 (AA) | PASS | text on a solid COVERED fill |
| `--c-on-solid` `#0B1220` | `--c-gap-solid` `#FF97AE` | **9.17:1** | 4.5 (AA) | PASS | text on a solid GAP fill |
| `--c-ast-solid` `#CBA855` | `--c-surface` `#141D2C` | **7.46:1** | 3.0 (UI) | PASS | CLAIMED half-disc / bar segment on a card |
| `--c-ast-solid` `#CBA855` | `--c-paper` `#0B1220` | **8.26:1** | 3.0 (UI) | PASS | CLAIMED half-disc / bar segment on the ground |
| `--c-on-solid` `#0B1220` | `--c-ast-solid` `#CBA855` | **8.26:1** | 4.5 (AA) | PASS | text on a solid CLAIMED fill |
| `--c-nc-line` `#5E7090` | `--c-surface` `#141D2C` | **3.37:1** | 3.0 (UI) | PASS | NOT CHECKED hairline edge on a card |
| `--c-nc-line` `#5E7090` | `--c-paper` `#0B1220` | **3.74:1** | 3.0 (UI) | PASS | NO CERTIFICATE dashed edge on the ground |
| `--c-ok-bg` `#0F3A30` | `--c-surface` `#141D2C` | **1.34:1** | 1.1 (HOUSE) | PASS | COVERED tint against the card |
| `--c-warn-bg` `#332B10` | `--c-surface` `#141D2C` | **1.20:1** | 1.1 (HOUSE) | PASS | EXPIRING tint against the card |
| `--c-gap-bg` `#40202A` | `--c-surface` `#141D2C` | **1.17:1** | 1.1 (HOUSE) | PASS | GAP tint against the card |
| `--c-rev-bg` `#243044` | `--c-surface` `#141D2C` | **1.27:1** | 1.1 (HOUSE) | PASS | NEEDS REVIEW tint against the card |
| `--c-ok-line` `#2A6B5B` | `--c-surface` `#141D2C` | **2.69:1** | 1.1 (HOUSE) | PASS | COVERED pill hairline against the card |
| `--c-warn-line` `#665521` | `--c-surface` `#141D2C` | **2.32:1** | 1.1 (HOUSE) | PASS | EXPIRING pill hairline against the card |
| `--c-gap-line` `#78323F` | `--c-surface` `#141D2C` | **1.87:1** | 1.1 (HOUSE) | PASS | GAP pill hairline against the card |
| `--c-rev-line` `#3A4759` | `--c-surface` `#141D2C` | **1.79:1** | 1.1 (HOUSE) | PASS | NEEDS REVIEW pill hairline against the card |
| `--c-ast-bg` `#322813` | `--c-surface` `#141D2C` | **1.16:1** | 1.1 (HOUSE) | PASS | CLAIMED tint against the card |
| `--c-ast-line` `#60501E` | `--c-surface` `#141D2C` | **2.14:1** | 1.1 (HOUSE) | PASS | CLAIMED pill hairline against the card |
| `--c-line` `#2A3547` | `--c-surface` `#141D2C` | **1.36:1** | 1.1 (HOUSE) | PASS | table rule against the card |
| `--c-line` `#2A3547` | `--c-paper` `#0B1220` | **1.51:1** | 1.1 (HOUSE) | PASS | table rule against the ground |

**Light theme — colour-independence (WCAG 1.4.1)**

| status | fill | relative luminance | glyph | fill pattern | word |
|---|---|---:|---|---|---|
| meets | `#0F6E55` | 0.1191 | check in a filled disc | solid | Meets |
| expiring | `#7A6209` | 0.1289 | clock in a ring | 45-degree hatch | Expiring |
| asserted-only | `#5E4907` | 0.0716 | half-filled disc | vertical hatch | Claimed, not evidenced |
| gap | `#B01A40` | 0.1034 | slash in a hollow disc | open, dashed edge | Gap |
| needs-review | `#3D4F66` | 0.0754 | question in a square | dot grid | Needs review |
| not-checked | `#495A73` | 0.0997 | em dash, no container | open, hairline edge | Not checked |
| no-certificate | `#718094` | 0.2109 | empty document outline | open, single diagonal rule | No certificate |

| pair | greyscale ratio | note |
|---|---:|---|
| meets vs expiring | 1.05:1 | near-isoluminant — colour cannot be the carrier |
| meets vs asserted-only | 1.39:1 | near-isoluminant — colour cannot be the carrier |
| meets vs gap | 1.10:1 | near-isoluminant — colour cannot be the carrier |
| meets vs needs-review | 1.34:1 | near-isoluminant — colour cannot be the carrier |
| meets vs not-checked | 1.12:1 | near-isoluminant — colour cannot be the carrier |
| meets vs no-certificate | 1.54:1 | near-isoluminant — colour cannot be the carrier |
| expiring vs asserted-only | 1.47:1 | near-isoluminant — colour cannot be the carrier |
| expiring vs gap | 1.16:1 | near-isoluminant — colour cannot be the carrier |
| expiring vs needs-review | 1.42:1 | near-isoluminant — colour cannot be the carrier |
| expiring vs not-checked | 1.19:1 | near-isoluminant — colour cannot be the carrier |
| expiring vs no-certificate | 1.45:1 | near-isoluminant — colour cannot be the carrier |
| asserted-only vs gap | 1.26:1 | near-isoluminant — colour cannot be the carrier |
| asserted-only vs needs-review | 1.03:1 | near-isoluminant — colour cannot be the carrier |
| asserted-only vs not-checked | 1.23:1 | near-isoluminant — colour cannot be the carrier |
| asserted-only vs no-certificate | 2.14:1 | near-isoluminant — colour cannot be the carrier |
| gap vs needs-review | 1.22:1 | near-isoluminant — colour cannot be the carrier |
| gap vs not-checked | 1.02:1 | near-isoluminant — colour cannot be the carrier |
| gap vs no-certificate | 1.70:1 | near-isoluminant — colour cannot be the carrier |
| needs-review vs not-checked | 1.19:1 | near-isoluminant — colour cannot be the carrier |
| needs-review vs no-certificate | 2.07:1 | near-isoluminant — colour cannot be the carrier |
| not-checked vs no-certificate | 1.74:1 | near-isoluminant — colour cannot be the carrier |

**Dark theme — colour-independence (WCAG 1.4.1)**

| status | fill | relative luminance | glyph | fill pattern | word |
|---|---|---:|---|---|---|
| meets | `#5FD3B0` | 0.5216 | check in a filled disc | solid | Meets |
| expiring | `#E5C267` | 0.5622 | clock in a ring | 45-degree hatch | Expiring |
| asserted-only | `#CBA855` | 0.4136 | half-filled disc | vertical hatch | Claimed, not evidenced |
| gap | `#FF97AE` | 0.4645 | slash in a hollow disc | open, dashed edge | Gap |
| needs-review | `#AEBACB` | 0.4843 | question in a square | dot grid | Needs review |
| not-checked | `#A7B3C4` | 0.4444 | em dash, no container | open, hairline edge | Not checked |
| no-certificate | `#5E7090` | 0.1598 | empty document outline | open, single diagonal rule | No certificate |

| pair | greyscale ratio | note |
|---|---:|---|
| meets vs expiring | 1.07:1 | near-isoluminant — colour cannot be the carrier |
| meets vs asserted-only | 1.23:1 | near-isoluminant — colour cannot be the carrier |
| meets vs gap | 1.11:1 | near-isoluminant — colour cannot be the carrier |
| meets vs needs-review | 1.06:1 | near-isoluminant — colour cannot be the carrier |
| meets vs not-checked | 1.15:1 | near-isoluminant — colour cannot be the carrier |
| meets vs no-certificate | 2.72:1 | near-isoluminant — colour cannot be the carrier |
| expiring vs asserted-only | 1.32:1 | near-isoluminant — colour cannot be the carrier |
| expiring vs gap | 1.18:1 | near-isoluminant — colour cannot be the carrier |
| expiring vs needs-review | 1.14:1 | near-isoluminant — colour cannot be the carrier |
| expiring vs not-checked | 1.23:1 | near-isoluminant — colour cannot be the carrier |
| expiring vs no-certificate | 2.91:1 | near-isoluminant — colour cannot be the carrier |
| asserted-only vs gap | 1.10:1 | near-isoluminant — colour cannot be the carrier |
| asserted-only vs needs-review | 1.15:1 | near-isoluminant — colour cannot be the carrier |
| asserted-only vs not-checked | 1.06:1 | near-isoluminant — colour cannot be the carrier |
| asserted-only vs no-certificate | 2.20:1 | near-isoluminant — colour cannot be the carrier |
| gap vs needs-review | 1.03:1 | near-isoluminant — colour cannot be the carrier |
| gap vs not-checked | 1.04:1 | near-isoluminant — colour cannot be the carrier |
| gap vs no-certificate | 2.45:1 | near-isoluminant — colour cannot be the carrier |
| needs-review vs not-checked | 1.08:1 | near-isoluminant — colour cannot be the carrier |
| needs-review vs no-certificate | 2.54:1 | near-isoluminant — colour cannot be the carrier |
| not-checked vs no-certificate | 2.35:1 | near-isoluminant — colour cannot be the carrier |

---


## 7. Typography

### 7.1 Families

Two families, from Google Fonts, self-describing about what they are for, and **allocated to Certly
exclusively by `../IDENTITY_ARBITRATION.md §3.1`** — no sibling app may use either. Note that this is a
deliberate divergence from Clausewright, which loads **no** web fonts at all: Clausewright optimises for a
panicking seller on mobile data at 2am, while Certly is a desk tool opened for a working session, so the
one-time font cost buys a typographic identity that a system stack cannot.

| token | stack | used for |
|---|---|---|
| `--c-font-ui` | `"Source Sans 3", "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | all interface text, headings, buttons, labels, body |
| `--c-font-num` | `"Source Code Pro", ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace` | **every figure the buyer compares**: limits, dates, policy numbers, confidence values, the coverage-bar axis |

**Why Source Sans 3.** Three reasons, in the order they should be weighed.

1. **It is the register of the buyer's own stack without being any single tool in it.** Read out of their
   served markup on 2026-09-03: Buildium ships **Open Sans**, Rent Manager ships **Lato**, CINC Systems
   ships **Inter** (`../IDENTITY_ARBITRATION.md §2.4`). Those are humanist, open-aperture, small-size UI
   faces, and Source Sans 3 is the same family of thing — drawn by Adobe for its own interfaces, which is
   the right lineage for a screen this buyer reads between two phone calls (`PERSONA.md §2.10`).
2. **It separates from its sibling at a glance.** Source Sans has a **single-storey `g`** and humanist,
   angled terminals; Public Sans is a Franklin-derived grotesque with a double-storey `g`. That is a
   skeletal difference a reader registers without being able to name it, which is what the founder's
   requirement actually asks for.
3. **It is not Inter.** The previous version of this section made that point about Public Sans and it
   still holds: Inter is the default of the category we are differentiating from, and CINC ships it.

**What was given up, and why that is acceptable.** Public Sans's USWDS lineage was a real argument and it
now belongs to WageLens, whose output artefact is an actual US federal form (WH-347, OMB 1235-0008). Ours
is the **ACORD 25**, published by ACORD — a private standards body, not a government — so the lineage
argument was always weaker here than it looked. See `../IDENTITY_ARBITRATION.md §2` Option B, where
rotating the government face to Certly was considered and rejected for exactly this reason.

**Why a mono for figures.** The buyer's core act is comparison: *is `$1,000,000` the same as
`$2,000,000`?*, *is `09/12/2026` before or after `09/30/2026`?* Proportional digits make columns of
currency and dates ragged. **Source Code Pro** is monospaced by construction, so limits align without a
table hack — and it is the designed superfamily partner of Source Sans 3, so a figure and the label beside
it are cut from the same skeleton. That coherence is worth more here than IBM Plex Mono's slab detailing,
which now belongs to WageLens's rendering of the WH-347.

**Loading.** Exactly one stylesheet link, `fonts.googleapis.com`, weights `400;500;600;700` for Source
Sans 3 and `400;500;600` for Source Code Pro, `display=swap`. Every declaration carries the full fallback
stack so a blocked CDN degrades to a system sans and a system mono, not to Times.

**Numerals.** `font-variant-numeric: tabular-nums lining-nums` on every figure, including inside the UI
font, so a count that changes does not shift the layout.

### 7.2 The scale

Base **16px**, a 1.20 (minor third) progression rounded to whole pixels, expressed in `rem` so the user's
browser setting scales it.

| token | rem | px @16 | line-height | tracking | use |
|---|---|---|---|---|---|
| `--c-text-2xs` | 0.6875 | 11 | 1.45 | +0.04em | the status word inside a pill (uppercase), column heads |
| `--c-text-xs` | 0.75 | 12 | 1.5 | +0.01em | table meta, timestamps, the "as of" stamp |
| `--c-text-sm` | 0.875 | 14 | 1.5 | 0 | table cells, helper text, secondary UI |
| `--c-text-base` | 1 | 16 | **1.55** | 0 | **body. the default** |
| `--c-text-lg` | 1.125 | 18 | 1.5 | −0.005em | lead paragraph, the requirement clause |
| `--c-text-xl` | 1.375 | 22 | 1.35 | −0.01em | card titles |
| `--c-text-2xl` | 1.75 | 28 | 1.25 | −0.015em | screen headings |
| `--c-text-3xl` | 2.25 | 36 | 1.15 | −0.02em | page titles |
| `--c-text-4xl` | 3 | 48 | 1.1 | −0.025em | landing hero only |

**Weights.** 400 body, 500 labels and table heads, 600 headings and buttons, 700 the wordmark and the
single hero number. No 800/900.

**Measure.** `--c-measure: 68ch` for prose; `--c-measure-doc: 74ch` for a quoted lease or subcontract
clause, which is longer-lined by nature.

### 7.3 The wordmark

Set in `--c-font-ui` at 700, tracking −0.02em, in `--c-ink`, lowercase. The only permitted decoration is
the **status dot**: a 0.5em disc in `--c-ok-solid` set on the baseline after the word. It is the one place
in the system where a status colour appears without a status behind it, and it is permitted because it *is*
the promise. It is dropped below 20px and in any monochrome context.

No lockup with a tagline in the app header. The tagline is copy.

---

## 8. Space, radius, elevation

### 8.1 Spacing — a 4px grid

`--c-space-1` 4px · `-2` 8px · `-3` 12px · `-4` 16px · `-5` 24px · `-6` 32px · `-7` 48px · `-8` 64px ·
`-9` 96px. Nothing between; a value that is not on the grid is a review failure.

**Density.** The vendor table is the screen the buyer lives in and it must show ~15 rows without
scrolling on a 900px-tall viewport: row height 44px, cell padding `var(--c-space-3)` vertical and
`var(--c-space-4)` horizontal. A `.c-table--comfortable` modifier (56px rows) exists for the tenant/agent
views where rows are read rather than scanned.

### 8.2 Layout grid

- **App shell:** a fixed 240px left navigation (collapsing to a 56px icon rail below 1200px and to a
  sheet below 900px), then a fluid content column with `max-width: 1440px` and `--c-space-6` gutters.
- **Content grid:** 12 columns, 24px gutter, at ≥1200px. 8 columns / 20px at 900-1199px. 4 columns /
  16px below 900px.
- **The split view** (document + extraction) is the one exception: a 2-pane grid at `minmax(420px, 1fr)
  minmax(380px, 480px)`, collapsing to stacked tabs below 1024px. The document pane is never narrower than
  420px, because an ACORD 25 below that width is unreadable and the honest response is to stack.
- **Breakpoints:** 600 / 900 / 1200 / 1440.

### 8.3 Radius

`--c-radius-sm` 4px (pills, chips, inputs) · `--c-radius-md` 8px (cards, panels) · `--c-radius-lg` 12px
(sheets, dialogs) · `--c-radius-full` 999px (the status dot only). Nothing rounder: this is paperwork, and
a 20px radius reads as a consumer app.

### 8.4 Elevation

Two levels and no more.

- `--c-shadow-1`: `0 1px 2px rgba(15,26,43,.06), 0 1px 1px rgba(15,26,43,.04)` — a card resting on paper.
- `--c-shadow-2`: `0 8px 24px rgba(15,26,43,.12), 0 2px 6px rgba(15,26,43,.08)` — something that has taken
  modal precedence.

In dark mode, shadows do almost nothing, so separation is carried by `--c-line` and by a 1px top highlight
of `rgba(255,255,255,.04)`. **There is no `backdrop-filter` anywhere in this system** — that is
Clausewright's material language, and a translucent panel over a dense table is illegible besides.

---

## 9. Iconography and infographic language

This is where the identity is actually made. Everything here exists to make **covered / expiring / gap**
felt before it is read.

### 9.1 Icon style

Line icons, 1.5px stroke on a 20px grid, square cap, round join, no fill except in the status glyphs.
Drawn inline as SVG with `currentColor` — **no icon font, no icon library, no external request**.
The set is small on purpose: document, upload, mail, calendar, clock, check, slash, question, chevron,
search, filter, download, link, plus, trash, building, hard-hat, shield-off. Anything not on that list
needs a reason.

**The seven status glyphs are not ordinary icons.** They are the redundant encoding required by §6.4 and
they are drawn to be distinguishable at 12px and in monochrome. Seven silhouettes: three discs, one ring,
one square, one document, one bare rule.

- **Meets requirements** — a check inside a **filled** disc. Solid mass = the state is complete.
- **Expiring** — a clock inside a **ring**. The only glyph with an internal hand; the hand's angle is
  fixed, never animated (a moving clock is manufactured urgency).
- **Claimed, not evidenced** — a **half-filled** disc: the box is ticked, the endorsement is not attached,
  and the glyph says exactly that. `LANDING_SPEC.md §5 V1` calls it the product's logo-equivalent.
- **Gap** — a diagonal slash inside a **hollow** disc with a dashed edge. The hole is the point.
- **Needs review** — a question mark inside a **square**. Square, so it is separable from the disc states
  by silhouette alone.
- **Not checked** — an **em dash with no container at all**, the only glyph in the set that is not
  enclosed. Nothing has been asserted, so nothing is drawn around it.
- **No certificate** — an **empty document outline** with a folded corner. The artefact, absent.

### 9.2 The coverage bar — the signature device

A horizontal band, 8px tall (12px on a vendor detail page), representing a window of time — by default
`today − 30 days` to `today + 180 days`.

- Each **policy period** is a segment positioned by its effective and expiry dates.
- Segments are separated from each other by a **1px `--c-surface` line** (§6.4, the separator rule).
- **Today** is a 2px vertical rule in `--c-ink` running the full height of the bar plus 4px of overshoot,
  labelled once per screen, never per row.
- A **gap** is not drawn as a red block by default — it is drawn as the *absence* of a segment, on the
  `--c-sunken` track, with a dashed `--c-gap-line` outline. The hole reads as a hole. A solid red block is
  used only in the aggregate portfolio bar (§9.3) where the unit is a count, not a timeline.
- The bar carries `role="img"` and an `aria-label` that states the same thing in words:
  *"General liability: covered 1 Jan 2026 to 12 Sep 2026, then no coverage on record."*

**Why this and not a donut.** The buyer's question is temporal and the failures are temporal `[E4][E6]`.
A donut of "78% compliant" answers a question nobody in this ICP asks; it is the shape of a report to a
board, not of a decision about a roofer.

### 9.3 The portfolio strip

The one aggregate visual: a single stacked bar of counts across the portfolio, in the same seven states
(§6.4), with the same patterns, and the count printed inside each segment in `--c-font-num`. The two
achromatic states carry an inset hairline instead of a fill, so an unchecked party never reads as a
judged one. Segments below 6% of
the width drop their inline number and take a leader line. It sits at the top of the dashboard and it is
the only chart in the product.

**Forbidden charts:** pie, donut, gauge, speedometer, sparkline of "compliance score", trend line of
"risk". Certly does not have a score. A score is a number a vendor invents to make a dashboard look
analytic; this buyer needs a list of who to chase.

### 9.4 Confidence

Confidence is the fourth meaning in a system that has spent its colour budget, so it is deliberately
**achromatic**: a three-segment meter in `--c-ink-muted`, filled 1, 2 or 3 segments, plus a word.

| band | meter | word | field treatment |
|---|---|---|---|
| high | ▮▮▮ | "read clearly" | normal |
| medium | ▮▮▯ | "check this" | 2px left border in `--c-line-strong`, value in `--c-ink` |
| low | ▮▯▯ | "we're not sure" | the field renders in the **Needs review** treatment and the record cannot go green until a human confirms it |

**The hard rule:** a low-confidence field can never contribute to a **Covered** status. The record sits in
**Needs review** until confirmed. This is the design expression of `PLAN.md §6`'s extraction risk, and it
is the difference between a product that is wrong and a product that is honest.

### 9.5 Infographic and diagram style (landing page, docs, emails)

- Flat, 1.5px stroke, `--c-ink` on `--c-paper`, status hues only where a status is meant.
- **The one diagram that must exist on the landing page** is the before/after of a single vendor's
  timeline: a spreadsheet row with a typed date, versus a coverage bar with a visible gap and a dated
  chase. It makes the argument in §3 Step 3 (UA2/UA3) without a word of copy.
- **No stock photography of hard hats, handshakes, or people pointing at laptops.** Ever. See §10.
- Diagrams are inline SVG in the page, never images, so they inherit the theme and stay legible in dark
  mode and in print.

---

## 10. Imagery

1. **The only photographic content permitted is a real certificate** — an ACORD 25, redacted, shown as
   the artefact it is. Everything else is drawn.
2. **No stock photography.** The category is saturated with it and it is the visual equivalent of "contact
   us for pricing": it says nothing checkable.
3. **No people.** Not because people are bad, but because any person we show is either a stock model
   (dishonest) or a customer we do not have (forbidden by §3 Step 9).
4. **Screenshots are the imagery.** Real product screens, at real density, with plausible data and no
   invented customer names. Sample data uses obviously-fictional but realistic vendor names and never a
   real company from the phase-3 prospect lists.
5. **Redaction is a designed treatment**, not a black rectangle: the field is replaced with a
   `--c-sunken` block of the same metrics and a `--c-ink-faint` label saying what was removed.

---

## 11. Motion

Motion in this product exists for exactly three jobs: to show that a thing moved, to show that a thing is
working, and to show where something came from.

| token | value | use |
|---|---|---|
| `--c-motion-fast` | 120ms `cubic-bezier(.2,0,.38,.9)` | hover, focus, pill state change |
| `--c-motion-base` | 200ms `cubic-bezier(.2,0,.38,.9)` | panel open, row expand, tab change |
| `--c-motion-slow` | 320ms `cubic-bezier(.2,0,.38,.9)` | sheet and dialog entry |

**Rules.**
- **A status never animates its colour.** When a vendor goes from Gap to Covered, the row changes on the
  next render. An animated transition to green invites the eye to enjoy it, and this is not a game.
- **The extraction is the one place motion earns its keep:** as each field resolves, its highlight box
  appears on the document with a 120ms fade, in reading order. That motion *is* the explanation.
- **No skeleton shimmer.** A shimmer is a lie about progress. Loading states use a static `--c-sunken`
  block plus a determinate progress bar where a real percentage exists, and plain text where it does not.
- **No confetti, no toast animation with a bounce, no number count-up.**
- `@media (prefers-reduced-motion: reduce)` sets every duration to 1ms and disables the extraction
  reveal — the highlights simply appear. Nothing in the product depends on motion to be understood.

---

## 12. Component inventory

The wave-2 build target. Every component is implemented in `design-system.css` and demonstrated in
`identity/samples.html`.

### 12.1 Document upload — `.c-drop`
Dashed `--c-line-strong` border on `--c-sunken`, 2px on drag-over in `--c-focus`. Accepts drag-drop, a
file picker, **and a paste** (agents paste screenshots). States: idle / drag-over / uploading (determinate)
/ reading (indeterminate, with the page count) / done / rejected. The rejected state names the reason in
words (§4.3). It always shows the forward-to address (`vendor-name@in.certly.app`) beside it, because
forwarding is the path most vendors' agents will use.

### 12.2 Document preview — `.c-doc`
The certificate rendered as a page on `--c-surface` inside a `--c-sunken` viewport, with page controls,
zoom, and **highlight boxes** keyed to extracted fields. A highlight is a 2px `--c-focus` outline at 40%
opacity; the *active* highlight is solid and carries a 3px left tab. Hovering a field in the review panel
raises its box; clicking scrolls to it. Keyboard: the boxes are a roving-tabindex list.

### 12.3 As-of stamp — `.c-asof`
`--c-text-xs`, `--c-ink-muted`, `--c-font-num` for the date, preceded by a 1px rule. Renders as
*"as of 3 Sep 2026, 09:41"*. Mandatory on every status surface (**P3**).

### 12.4 Extraction review panel — `.c-review`
A list of fields, each row: label · extracted value in `--c-font-num` · confidence meter · state.
**Two of the most valuable fields on the form are checkboxes, not text** — `ADDL INSD` and `SUBR WVD` are
tick columns on the coverage grid `[E7]` — so the panel must render a tick as a first-class value with its
own confidence, not coerce it into a string. A tick misread is the failure mode with the largest
consequence in this product.
Per-field actions: **confirm**, **edit**, **not on this document**. The panel header carries the overall
confidence and a single primary action (**Accept reading**). A field in the low band renders in the Needs
review treatment and blocks a green status (§9.4). Every value links to its highlight (§12.2).

### 12.5 Requirement template editor — `.c-req`
The most important screen in the product (`PERSONA.md §4.1`, complaint 2). Three regions:
1. **Paste area** for the lease, management agreement or subcontract clause, in `--c-font-ui` at
   `--c-text-lg`, `--c-measure-doc`.
2. **Parsed requirements** as editable rows: coverage line · limit (`--c-font-num`) · basis (each
   occurrence / general aggregate / per project) · endorsements required (additional insured · waiver of
   subrogation · primary and non-contributory) · notes. Each parsed row shows **which words in the pasted
   clause produced it**, highlighted in the paste area — the same document-plus-reading pattern as §12.2.
3. **Applies to**: a chip list of vendor types / trades / properties / projects.
   States: empty · parsing · parsed-with-confidence · edited · saved · in-use-by-N-vendors (which makes
   editing a template a deliberate act with a stated blast radius).

### 12.6 Party table — `.c-table` + `.c-row-status`
Columns: status (pill + coverage bar) · party · type · requirement applied · next expiry
(`--c-font-num`) · last document · action. Sort defaults to *soonest problem first*: Gap, then Expiring
ascending by days, then Needs review, then Covered. Row states: default · hover · selected · muted (a
party marked inactive). Bulk selection enables one action only: **Chase selected**.

### 12.7 Status pill — `.c-pill`
`--c-text-2xs` uppercase, +0.04em, the glyph, the word, and for Expiring the day count. 1px
`--c-*-line` border, `--c-*-bg` fill, `--c-*-fg` text. Never used without a date nearby.

**Seven modifiers, one per state (§6.4):** `--ok` (MEETS), `--warn` (EXPIRING), `--ast` (CLAIMED, NOT
EVIDENCED), `--gap` (GAP), `--rev` (NEEDS REVIEW), `--nc` (NOT CHECKED) and `--none` (NO CERTIFICATE).
The last two carry **no fill** — a hairline edge and a dashed edge respectively — because neither is a
judgement about a party. The matching `.c-dot--*` and `.c-bar__seg--*` modifiers exist for every state,
so a status can never be rendered outside the encoding.

### 12.8 Coverage bar — `.c-bar`
Per §9.2. Two sizes (`--sm` 8px in a table row, default 12px on a detail page). Always
`role="img"` with a sentence-form `aria-label`.

### 12.9 Expiry timeline — `.c-timeline`
The portfolio-level view of the coverage bar: one row per party, a shared date axis in `--c-font-num`,
today as a full-height rule, and a month grid in `--c-line`. Sticky first column (party name), horizontal
scroll inside its own container. Filter chips above it for status, type and property/project.

### 12.10 Reminder composer — `.c-remind`
Recipient (defaults to **the agent on the certificate**, with the vendor cc'd — §4.2), schedule (a set of
offsets: −30, −14, −3, +1 days, editable), the message with merge fields shown inline as chips, and a
live preview of the email in the recipient's frame. A visible **stop condition**: *"Stops as soon as a
current certificate arrives."* The composer states how many emails this schedule will send in total —
directly answering the Procore behaviour of daily mail for up to 74 days `[D1]`.

### 12.11 Gap report — `.c-report`
A printable document, not a screen: portfolio header, as-of stamp, the portfolio strip, then one block per
party with the requirement, what was found, and what is missing, in plain sentences. Fixed to a print
stylesheet at A4/Letter with the disclaimer (§4.4 rule 4) in the footer of every page.

### 12.12 Supporting components
`.c-btn` (primary = `--c-action`, the interaction hue, white label at 9.29:1; secondary = `--c-line-strong` outline; quiet = text) · `.c-field` (label
above, 44px control, error below in `--c-gap-fg` **with an icon and words**) · `.c-card` · `.c-sheet` ·
`.c-tabs` · `.c-empty` (always states the next action) · `.c-toast` (status changes only, never success
noise) · `.c-note` (the disclaimer block) · `.c-kbd`.

### 12.13 Focus
Every interactive element: `outline: 2px solid var(--c-focus); outline-offset: 2px`. No `outline: none`
anywhere in the codebase — that is a review failure with no exceptions.

---

## 13. Dark mode policy

**Supported, opt-in-by-system, with an explicit override, and never the default in marketing.**

1. Tokens are defined on bare `:root` (light), redefined under
   `@media (prefers-color-scheme: dark)` guarded as `:root:not([data-theme="light"])`, and redefined again
   under `:root[data-theme="dark"]`, so a user's explicit choice wins in both directions.
2. Dark values are **authored, not inverted** (§6.3), and every dark pair is certified by the same script.
3. **Status meaning does not change between themes.** Green is covered in both. The hues shift in
   lightness; they never swap roles.
4. `--c-paper` in dark is `#0B1220`, not black, to avoid halation around a bright status pill.
5. Shadows are near-useless on dark; separation moves to `--c-line` plus a 1px top highlight.
6. **The printed and PDF outputs are always light.** A gap report goes to a board packet or an auditor;
   it prints on paper.
7. The landing page and every screenshot in marketing are light. A dark screenshot of a status board looks
   like a monitoring console, which is the wrong category (§3 Step 6).

---

## 14. Distinctness

### 14.1 Against the two sibling apps and Clausewright

Filled in from real artefacts, not from reservations. The allocation is
`../IDENTITY_ARBITRATION.md §6`; the machine check is `../scripts/identity-distinctness.py`.

| | Clausewright | WageLens (construction payroll) | StateReady (multi-state trades) | **Certly** |
|---|---|---|---|---|
| material | translucency, layered glass, `backdrop-filter` | opaque; borders, not shadows | opaque; no shadow on any resting surface | **flat paper and ink; no `backdrop-filter` anywhere; two elevations** |
| type | **no web fonts**; system UI sans + system serif for quoted policy | Public Sans + IBM Plex Mono | Barlow + Barlow Condensed + Overpass Mono | **Source Sans 3 + Source Code Pro**; no serif at all |
| base size | 17px (a panicking reader) | 15px (a payroll week must fit) | 16px, with a condensed signage cut for labels | 16px (a working session) |
| ground | blue-slate canvas `#F4F7FB` under glass | warm bone `#FBF9F5`, hue 40° | deep graphite-green board `#181D1A` | **cool office white `#E8EEF6`, hue 214°** — ΔE76 7.87 from WageLens, 83.94 from StateReady |
| colour idea | two hues carry the system: slate + recovery green, with azure reserved for citations | one brand hue (brick), never a status; four status families | no brand hue; the readiness ramp *is* the palette | **no brand hue; chroma is status, and one non-status hue does interaction** |
| green | `#16704D` "recovery" | `#116634` "filed", 144.7° | `#52D09C` "ready", 155.2°, luminous on a deep fill | `#0F6E55` **"meets requirements"**, 164.2° teal — a different hue, a different value and a different meaning |
| primary action | recovery green | brick `#8A3115` | bone on a dark board | **interaction blue `#14458C`** |
| signature device | the citation chip | the ruled ledger + the provenance card | the readiness tile grid + the runway | **the coverage bar, with the gap drawn as a hole** |
| emotional register | calm intervention for someone in a crisis | a serious record of what was paid | a board of states and a clock | quiet instrument for someone doing a job |
| the thing shown | a quoted policy clause | a payroll week | a map and a time axis | a certificate, with our reading pinned to it |

What guarantees separation from Clausewright: no translucency, no serif, no citation-azure, a different
green, web fonts instead of system fonts, and — the structural one — **Clausewright spends its colour on a
recovery narrative, Certly spends all of it on a state machine.**

What guarantees separation from the two siblings is now measured rather than asserted: no shared font
family, and no two grounds within the gate in `../scripts/identity-distinctness.py`. That script must exit
0 in CI. **§17.3's collision is closed.**

### 14.2 Against the incumbents

They are demo-gated, so their interiors are not public and **no claim is made here about how they look**.
What is public and sourced is their *behaviour*, and that is what we differentiate against: unpublished
prices `[A2][A3][A4][A5]`, vendor-side fees `[C1][C2][A7]`, human review queues `[A9][B2]`, 6-8 week
implementations `[A1]`, and a 200-third-party floor `[A10]`.

### 14.3 Sitting next to the buyer's own tools

**This section was rewritten on 2026-09-03 after the Brand Director re-fetched the buyer's actual stack.**
The first pass had only Procore's served tokens `[G5]`, so it reasoned from the one tool it could read —
and Procore is the **general contractor's** tool, which makes it evidence about Buyer B, not Buyer A. The
arbitration opened the property-management stack instead (`../IDENTITY_ARBITRATION.md §2.4`, fetched
2026-09-03, two attempts per URL):

| tool | what its served markup contains |
|---|---|
| **AppFolio** | deep navy `#05094F` / `#04065B`, pale blue `#D3EDFF`, action blue `#007BC7`, mint `#22D195` |
| **Buildium** | white and `#F8F8F8` grounds, navy `#153D58` / `#143C57`, green `#73B680`, greys `#2F2F31` / `#959597`; **Open Sans** via Google Fonts |
| **Rent Manager** | white ground, orange `#F58220`, blue `#3777BC`; **Lato** via Google Fonts |
| **CINC Systems** | **Inter + Playfair Display** via Google Fonts |
| **Yardi** | **HTTP 403 on two attempts — no claim made** |

That is a cool, white, navy-chromed category, and it is the ground this product now sits on.

**What to borrow.**

- **The property-management stack's ground temperature.** White and near-white with navy chrome, in three
  of the four tools we could read. `--c-paper #E8EEF6` is that ground. **The previous version of this
  bullet argued the opposite** — that a cold blue-grey app "looks like it came from a different industry"
  next to Procore — and it was right about the GC and wrong about the coordinator this product is sold to
  first (`PERSONA.md §1`). Superseded by `../IDENTITY_ARBITRATION.md §3.2`.
- **Nobody's typeface.** Open Sans, Lato and Inter are three different faces across four tools, so there
  is no incumbent face to be familiar with — which is what made a distinct UI face free to choose (§7.1).
- **Procore's naming discipline.** Its tokens are named for the jobsite — `gray-rebar`, `gray-concrete`,
  `blue-tarp`, `yellow-crane` `[G5]`. The lesson is not the words; it is that **the token layer speaks the
  customer's language**. Ours does the same in our domain: `--c-ok`, `--c-warn`, `--c-ast`, `--c-gap`,
  `--c-rev`, `--c-nc`, `--c-none`.
- **Buildium's commercial transparency.** Prices, tiers, a 14-day trial, no credit card, "30 seconds"
  `[D3]`. That is the *behaviour* our pricing page copies, and it is the strongest single signal in §3.
- **Procore's "we'll never charge you for adding more users"** `[D4]`. The equivalent commitment in our
  world is *we will never charge your vendors* `[A5][C1][C2]`. Same generosity, different axis.
- **Density.** Both buyers live in tables with many rows. 44px rows and tabular figures are what their
  tools already do.

**What to avoid.**

- **Procore's `#FF5200` safety orange as a brand colour** `[G5]`, and equally FieldEdge's `#EA6211` and
  Housecall Pro's `#FFB706`, which belong to the sibling app's buyers. In our system that hue band is one
  step from the olive-gold that must mean *expiring* and *claimed, not evidenced*. A construction-orange
  header would poison the semantic layer.
- **AppFolio's and Buildium's navy as a *brand* colour.** We use their temperature, not their identity:
  our blue is a working hue with one job (interaction), not a logo colour splashed across a header.
- **The jobsite costume in general** (Direction A, §1). Our first buyer is at a desk in a property
  management office.
- **Enterprise risk furniture** — Evident's *"Stop reacting to risk"* with 7-Eleven, Coca-Cola and Amazon
  logos `[A11]`. That is precisely the buyer we are not for, and looking like it makes the ICP assume the
  price is hidden.
- **The WordPress-default look** that Buildium and Jones ship on their marketing sites `[G6]` — generic
  section-and-card rhythm with stock imagery. Cheap to build, indistinguishable, and §10 forbids the
  photography that holds it together.
- **A compliance score.** Nobody in this ICP is graded on a number; they are asked about a vendor.

---

## 15. What this system deliberately does not ship

Each omission is an enforcement mechanism: a component that does not exist cannot be misused.

1. **No brand accent colour.** (**P2**) There is one non-status hue, the interaction blue, and it does
   interaction only — links, focus, the selected-tab rule and the primary button. A component that is not
   interactive may not use it, and no control may ever carry a status colour.
2. **No `backdrop-filter`, no glass, no gradient fills.** A *fill* that fades from one colour to another
   is forbidden everywhere — it is decoration, and decoration in this system competes with status. The one
   permitted use of the `*-gradient()` functions is to draw the **hard-stop fill patterns** of §6.4 (the
   45° hatch for Expiring, the dot grid for Needs review): those have no colour ramp, they are patterns
   expressed in the only CSS primitive available, and they exist to make the status readable without
   colour. If a `linear-gradient` in this codebase has a soft stop, it is decoration and it is a review
   failure.
3. **No pie, donut, gauge or score.** (§9.3)
4. **No countdown timers, no urgency banners, no "N people viewing".** The only clock in the product is a
   policy's real expiry date.
5. **No skeleton shimmer, no confetti, no count-up numbers.** (§11)
6. **No icon font and no external icon library.** (§9.1)
7. **No stock photography and no people.** (§10)
8. **No dark-mode marketing.** (§13.7)
9. **No success toasts.** A certificate arriving is not an achievement; it is Tuesday.
10. **No component capable of rendering an accuracy percentage.** Until one is measured, the system cannot
    display one. (§3 Step 9)

---

## 16. Implementation contract

1. `design-system.css` is the only place colour, type, spacing, radius, shadow and motion values are
   written. A hex code, a px font-size or a bare `ms` duration anywhere else in the app is a review failure.
2. Components consume **semantic** tokens (`--c-ok-fg`), never raw values.
3. `identity/contrast.py` runs in CI. It exits non-zero on a failing pair or on duplicated status
   encodings, so the palette cannot drift silently.
4. `identity/samples.html` is the visual regression target: it imports `design-system.css` with no build
   step and loads nothing but Google Fonts. If it renders correctly, the system is intact.
5. The CSS is framework-free and importable by the Next.js app with `import "…/design-system.css"` in the
   root layout. No Tailwind, no CSS-in-JS, no preprocessor.
6. Every status rendered in the product must pass through the pill or bar component, so the four-signal
   encoding (§6.4) cannot be bypassed by a `<span style="color:green">`.

---

## 17. Hypotheses and open questions

1. **Source Sans 3 + Source Code Pro is a judgment, not a finding.** No study says a humanist UI sans
   improves trust in a compliance product. What *is* sourced is that the buyer's own stack runs faces of
   that family — Buildium on Open Sans, Rent Manager on Lato, CINC on Inter, all read from their served
   markup on 2026-09-03. The step from "same family of face" to "feels familiar" is **hypothesis**, and
   cheap to A/B on the landing page.
2. **The coverage bar is unvalidated with real users.** It is derived from the buyer's temporal failures
   `[E4][E6]` and it is the single riskiest design bet in this document. If wave-2 usability shows people
   reading the pill and ignoring the bar, the bar becomes secondary and the timeline screen carries it.
3. **Sibling collision — CLOSED, 2026-09-03.** All three apps had independently chosen Public Sans +
   IBM Plex Mono on a paper ground; the three grounds measured ΔE76 0.35 to 2.42 apart. This section had
   named the negotiable parts correctly — *"the ink and the paper are the negotiable parts; the
   no-brand-hue rule is not"* — and that is exactly what `../IDENTITY_ARBITRATION.md` moved. Certly's
   claim is now: **Source Sans 3 + Source Code Pro, no brand hue, cool office white `#E8EEF6`, ink
   `#0F1A2B`, interaction blue on the primary button.** It is enforced by
   `../scripts/identity-distinctness.py`, which parses all three stylesheets and fails on a shared family
   or a ground collision. Do not change a font token or the ground without re-running it.
4. **Trademark clearance is not done** `[F15][F16]`. No money on a mark until it is.
5. **Whether the founder wants a free tier** changes the pricing block on the landing page and possibly
   the shape of the empty state. `PERSONA.md §7.4`.
6. **Dark mode may be unnecessary.** It is built because it is cheap at token level, but if wave-3
   analytics show near-zero dark usage among these buyers, it should be frozen rather than maintained.
7. **The requirement-level rename `needs_review` → `undetermined`** (`REVIEW.md §2.2`, MN-04) is a
   product decision and is **not** applied here: the identity still calls the state "Needs review". If the
   rename is upheld it is one word in `contrast.py`'s `STATUS_MARKS` and one in `samples.html`.
8. **"Covered" is retired in the identity files only.** The same ruling (`REVIEW.md §2.1`) still has to
   reach `PERSONA.md §2.5`/`§2.9`, `UX.md §2`/`§3.1`, `specs/05`, `specs/06`, `specs/12` and
   `LANDING_SPEC.md`. Somebody must own that sweep or the dashboard counters and the report will drift.
