# StateReady — product backlog

**Owner:** Product Owner agent, phase-4 wave 1. **Date:** 2026-09-03.
**Binding upstream:** `../PLAN.md` (D1–D5, A1–A14), `../PIPELINE.md`, `KNOWLEDGE_BASE.md`.
**Reviewed by:** wave-1b reviewer, 2026-09-03 (`REVIEW.md`). **Revised against that review**, decision
log in `REVIEW_RESPONSE.md`.

---

## 0. The one sentence the backlog has to serve

> A stranger, who has never spoken to us, signs up on a Tuesday because a licence nearly lapsed last
> quarter, and by Friday they are paying us every month because the calendar in their head is now in
> our product and it is more correct than the spreadsheet was.

Everything in **Must** exists to make that sentence true. Everything not in Must is an idea about a
customer we do not have yet.

### The buyer, in one paragraph

An office manager or compliance lead at a **15–100-technician** HVAC / plumbing / electrical company, or
the single back-office person at a PE-backed platform that has bought four companies this year and
inherited four licence calendars. They are not a software buyer. They keep this in a spreadsheet
with conditional formatting, or in Outlook reminders, or in their head. Their fear is specific and
dated: a lapse stops a permit pull, which stops a job, which is a phone call from a general
contractor. They will pay to stop having that conversation. They will not pay for "compliance
visibility". (Persona detail is the Buyer & Identity agent's; this backlog only needs the fear.)

**15–100, not 5–100** — reconciled with `PERSONA.md` §1 and `OFFER.md` §1 (wave-1b **m1**). Below
roughly ten licensed people a spreadsheet genuinely works and we should say so; selling to them is how
we earn a refund request.

### The launch ICP, and the accounts it excludes (D4)

**The launch ICP is the 15–100-technician, 2–6-state contractor.** Twelve of the twenty highest-fit
accounts in `phase-3-acquisition/prospects/stateready/` operate in **more than 15 states on day one**
(Apex 46, Pye-Barker 47, BluSky 40+, Tecta 37, Authority Brands 31, ARS ~28, TurnPoint 28, ATI 25,
Vertex 22, Legacy 19, PremiStar 17, Service Logic 140+ locations). They exceed the Platform cap
immediately and land in Enterprise, which has **no price and no self-serve path** — so they are a
**wave-3 State Entry Pack motion, not a subscription motion**.

Three consequences the outbound fleet inherits, written here so it does not have to rediscover them:

1. `outbound/stateready/workbook.csv` carries a **`state_count` column and is sorted on it**.
2. The **first batches lead with accounts inside 15 states** (Sila 13, Any Hour 10, Heartland 9,
   Wrench ~15) — the ones who can actually buy what the pricing page sells.
3. Accounts above 15 route to the **`enterprise_quote` stage**: an Entry-Pack-first conversation
   against a published "contact us — a quote within two business days" row (`specs/09`, `OFFER.md` §7).
   No price is invented for them, and none is implied.

### What we are actually selling

Not a tracker. **A correct calendar, plus the answer to "what does it take to work in the next
state".** The tracker is the subscription; the answer is the $750–1,500 one-off. The knowledge base
is what makes both of them different from a spreadsheet, and it is the only part a competitor cannot
copy in a weekend. Every prioritisation call below resolves in favour of the knowledge base.

---

## 1. MUST — the MVP

Nothing here is negotiable. If one of these is missing, the customer either cannot start, cannot
trust the output, or cannot pay.

| id | item | why a stranger pays for it | effort |
|---|---|---|---|
| **M1** | Magic-link auth + organisation | They must get in without an IT ticket. Password reset flows are the single largest support cost at this size of customer and A7 already rules OAuth out. | S |
| **M2** | Company profile: legal entities, branches, trades, states | The whole product is keyed on "which states, which trades". Without it the rules engine has nothing to match on and the dashboard has no shape. | S |
| **M3** | Technician roster + CSV import | The data already exists in their spreadsheet. If they have to retype 60 technicians they will close the tab. CSV import is not a convenience feature, it is the activation event. | M |
| **M4** | Licence records + document upload | The object the alerts hang off. Upload matters because the wallet card is the proof they are asked for; a tracker that cannot produce the certificate is half a tool. | M |
| **M5** | **Rules engine: derive renewal and CE deadlines from the knowledge base** | This is the product. Anyone can store an expiry date the customer typed. We *derive* it — anniversary vs fixed 31 December vs Florida's even/odd 31 August — and we derive the CE obligation that the customer did not know about. | L |
| **M6** | Alert schedule 90/60/30/7 by email | The reason they bought. An alert that arrives at 7 days is a fire; 90 days is when a CE course can still be booked. | M |
| **M7** | Dashboard: state map + status | The five-second answer to "are we clean?". This is the screen they will show their owner, which is how the second seat and the renewal get sold. | M |
| **M8** | Expansion playbook generator (paid one-off, cited, `needs_human_check` flags) | The high-ticket product and the strongest proof the knowledge base is real. It also converts the buyer who has no lapse problem yet but has an acquisition closing. | L |
| **M9** | Billing: tiers by states (technicians as guardrail), **14-day no-card trial for the first 100 signups (D1)**, Stripe Checkout + Portal + webhook, and the Enterprise enquiry route for accounts above the 15-state cap | No billing, no revenue. Tiered on **states**, with technicians as a fair-use guardrail — a state × trade is a rulebook we maintain, so states are the real cost driver and the buyer's own mental model. Aligned with `OFFER.md`. | M |
| **M10** | Settings: organisation, users, notification preferences, data export | Notification preferences are a retention feature: the fastest way to lose this customer is to become noise. Export because a compliance buyer will not enter data they cannot get back out. | S |
| **M11** | Help centre + support auto-responder | A6. One human at the edge, no human in the loop. | S |
| **M12** | Legal: terms, privacy, **the disclaimer**, refund policy | The disclaimer is not boilerplate here. We publish regulatory data; the refund policy on the $1,500 playbook is what makes the price credible. | S |
| **M13** | Admin metrics: signups, activation, conversion, MRR, churn, cohort | We cannot evaluate `THRESHOLDS.md` without it, and a threshold we cannot measure is a wish. | M |
| **M14** | Knowledge-base runtime + drift review queue | The KB has to load into the app, and a source page changing has to reach a human before it reaches a customer. Without the queue, the refresh cron is a liability. | M |
| **M15** | **Marketing route + the no-login State Rulebook demo** (`LANDING_SPEC.md`, esp. §12) | `PLAN.md` §4 lists the landing page as a deliverable and it had no id, no effort and no owner — it was not in the 34 days (wave-1b **M2**). And under **D2 the demo is the single free entry point**: server-rendered, reading the same KB the product reads, deep-linkable per state × trade, which also makes it the programmatic-SEO asset. A product whose entire argument is "check our data before you trust us" cannot ship without the thing you check. Depends on M14. | M (~3) |
| **M16** | **Qualifier watch** (`UX.md` S15) | `IDENTITY.md` §2 **UA3** — one of the three attributes the identity says no alternative has — and `PERSONA.md` J6. `specs/05` already models `qualifier_replacement` as a deadline kind and nothing rendered it: the differentiator was modelled in the engine and stranded in the UI (wave-1b **M1**). Small on top of M5 and M7: one screen, one clock, the 75/45/15/5 cadence, and the statutory consequence quoted on the row. | S–M (~2) |
| **M17** | **Shared readiness link** (`UX.md` S19, public, tokenised, revocable) | `PERSONA.md` J5 — *"answer in five seconds with something I can forward"* — and the cheapest distribution mechanism in the product, because the person it is forwarded to is the economic buyer. `IDENTITY.md` §11 already self-certifies this job as served; nothing served it. Small on top of M7, and it renders in the **paper theme**, which is what leaves the building. | S (~1) |

Effort key: **S** ≈ 1 dev-day, **M** ≈ 2–3, **L** ≈ 4–6. Total ≈ **40 dev-days** (34 at wave 1, plus
M15 ~3, M16 ~2, M17 ~1), one spec each in `specs/`. **M15–M17 have no spec file yet**: the first job
of wave 2's sub-wave C is to write them from `UX.md` S15/S19 and `LANDING_SPEC.md`, to the same shape
as `specs/01`–`14`.

### The two Musts most likely to be argued about

**"Do we really need the expansion playbook (M8) in the MVP?"** Yes, and not for revenue. It is the
only feature that *proves* the knowledge base exists. A tracker looks identical whether the data
behind it is 45 verified records or a spreadsheet someone typed. The playbook renders the citations,
the `last_verified` dates and the "we could not establish this" notes on the page. It is the demo.

**"Can M3 CSV import wait?"** No. Activation is defined in `THRESHOLDS.md` as *signup → first licence
with a derived deadline*. Manual entry of a 40-technician roster is a 90-minute job that nobody does
in a trial. Import is how the threshold gets met.

---

## 2. SHOULD — the next thing we build, once ≥ 1 customer has paid twice

Ordered. Each has a named trigger; none is started before its trigger fires.

| id | item | trigger |
|---|---|---|
| S1 | SMS alerts at 30 and 7 days | ≥ 3 customers ask, or a lapse happens to a customer who read the email |
| S2 | Board licence-number verification (scrape the public licence search, confirm the number and status the customer typed) | first support ticket caused by a typo'd licence number. **Shares its feasibility question with S10** — if the registers cannot be read, neither of these exists |
| S3 | Shared organisation calendar feed (ICS) — `UX.md` S14, the renewal calendar screen | any customer asks how to get this into Outlook. `PERSONA.md` §2.2 method 2 says they already live in Outlook and Google Calendar, so this is a bet on feeding the habit rather than replacing it — cheap to build, cheap to remove, instrument it |
| S4 | Second and third seat, with per-user notification scoping | first customer with 2 offices |
| S5 | Acquisition mode: import a whole acquired company's licences as a batch and diff against the parent | first PE-backed platform customer |
| S6 | Renewal task workflow (assignee, status, "renewed" with proof) | month-2 retention below band and exit interviews say "we still tracked it in the sheet" |
| S7 | CE course marketplace links (approved-provider list per state, deep-linked) | the KB already carries `approved_provider_rule`; ship when a customer asks *where* to get hours |
| S8 | Public "licence lapse-risk audit" lead magnet — `UX.md` S02, the pasted roster | when the outbound engine has a list to send it to (wave 3). **Stays a SHOULD under D2**: the demo (M15) is the single free entry point, and S02 accepts **technician names and licence numbers on a marketing surface with no account and no consent screen**, which is private-individual data arriving before a relationship exists (`PIPELINE.md` standing rule 1, wave-1b **M14**). If it is ever built: **parse in the browser, never persist**, privacy notice **above** the paste box, and the flow named explicitly in `/legal/privacy` |
| S9 | Expansion playbook self-serve checkout (today it is a Stripe payment link + generation) | ≥ 5 playbooks sold manually |
| **S10** | **Register-ingestion feasibility spike — 2 dev-days, 15 states, a written verdict per state** | **Nothing triggers it: it is scheduled in wave 2 because it gates the largest lever in the offer.** It is the gate on the deferred done-for-you roster build and the $149 First State Audit (D1, `OFFER.md` §8, wave-1b **B3**). **Acceptance criteria:** (a) a table of all fifteen launch states, each row recording — is there a public licence search? can it be queried by **company name** rather than only by licence number? is the response machine-readable, or HTML, or a bot-walled JS app? is there a rate limit or a CAPTCHA? does it return **entity** licences or only individuals? does it expose expiry dates and status, or only the number? (b) every row carries a fetched URL and a date, two attempts per source, `lib_kb`'s 1.5 s spacing, never parallel; (c) a **written go / no-go per state** and a count of how many of the fifteen are automatable end to end; (d) the terms-of-use position for each register recorded, not assumed; (e) a one-page recommendation. **Until this exists, no surface says "we build the roster"**, and a Must for the build only follows a majority-positive verdict |
| S11 | CE-provider directory as a shipped bonus (the offer promises it on all paid plans) | it is listed in `OFFER.md` §4 and has no Must; the KB already carries `approved_provider_rule`. Ship with S7 or drop the bonus from the offer — a bonus nobody receives is not a bonus |

---

## 3. LATER — real, but not until the shape of the business is known

| id | item | why later, precisely |
|---|---|---|
| L1 | Widen to 50 states | 15 states cover 63% of US electrical/plumbing/HVAC establishments (`kb-data/_launch_states.json`). The other 35 cost the same to verify and reach a third of the market. Widen when a *named prospect* is blocked by a missing state. |
| L2 | Widen trades: roofing, fire protection, low-voltage, restoration | The phase-3 file's highest-fit accounts (Vertex, Tecta, Pye-Barker, BluSky) live here. Held back only because roofing licensing is state **and county**, which is a different data model, not a bigger one. |
| L3 | County and municipal layer | The honest hard problem. Doing it badly is worse than not doing it: a customer who believes we cover their city and does not is our first refund and our first bad review. |
| L4 | API / webhooks for ServiceTitan, BuildOps, Procore | Waiting on a customer who names the system. Integration built on a guess is dead code. |
| L5 | Bond and insurance certificate tracking as first-class objects (not just fields) | The KB models bond and insurance as licence requirements. Tracking the *policies* is Certly's job; check for overlap before building it twice. |
| L6 | Multi-entity roll-up hierarchy (parent → operating companies → branches) | The data model already allows entities; the *UI* for 107 brands is a different product. Build it when a platform with >20 brands is paying. |
| L7 | Reciprocity path finder ("I hold X, where can I work?") | A great demo and a weak business: it is a lookup, not a subscription. It also needs outbound reciprocity direction for all 50 states, which we do not have. |

---

## 4. NEVER — with the reason, so nobody proposes them again

| item | why never |
|---|---|
| **Filing licence applications on the customer's behalf** | It is the concierge business (Harbor Compliance, API Processing) we are priced *against*. It puts a human in the loop, which PLAN.md's whole thesis forbids, and it makes us liable for the filing. We tell them exactly what to do; they do it. |
| **Storing SSNs, dates of birth, or fingerprint records** | Several boards require them on the application. Holding them turns a licence tracker into a breach target and drags us into background-check law for zero added revenue. The playbook says "you will need to supply X"; we never hold X. |
| **A "compliance guarantee" or any promise the customer will not be fined** | We publish data with `last_verified` dates and honest gaps. A guarantee converts a data-quality miss into a contractual liability. Hormozi-style risk reversal here has to be a money-back guarantee on the *playbook*, never a legal indemnity. |
| **"We pay your reinstatement fee"** | Six reasons in `OFFER.md` §5.4, and any one of them is enough: uncapped against flat revenue, it concedes the larger consequential claim, causation is unprovable, adverse selection, it is insurance in substance, and it implies an agency we do not have. Not a wording problem. |
| **Any guarantee that can trigger on behaviour the product itself designs** | The Alert Guarantee as first drafted paid out when a customer added a licence 20 days before expiry, muted a state, paused notifications, bounced an address, or let a card fail — all of them things `specs/06` and `specs/09` do **correctly** (wave-1b **B4**). The rule that replaces it: **guarantee only what our own send log or a board's published page can adjudicate, and cap it.** |
| **Any surface saying "we build the roster from the public registers"** | Until the S10 spike returns a majority-positive verdict. It is deferred, not cancelled — but a promise whose feasibility nobody has established is exactly the promise that ends up being kept by hand. |
| **Free-text AI Q&A over the licensing data** | Tempting and cheap to build. It is also the single fastest way to ship an unsourced regulatory statement to a customer, which is the risk PLAN.md §6 names first. Every regulatory string we render comes out of a record with a URL, or it does not render. |
| **Per-seat pricing** | The buyer is one person doing this job for the whole company. Per-seat pricing punishes them for inviting the second office, which is exactly the expansion we want. Tier on technicians and states — the axes the value actually scales on. |
| **Nominative technician data beyond what the licence requires** | Standing rule from phase 3, and the roster is full of private individuals. Name, licence number, licence type, dates. Not phone, not address, not personal email, not emergency contact. |
| **Selling or publishing the aggregated customer roster data** | It is the one asset that would be worth money and would end the company. Not a "later", a never. |
| **A mobile app at launch** | The buyer does this at a desk, on a Tuesday morning, with a spreadsheet open. Responsive web is the right shape. Revisit only if technicians (not the office) become users. |

---

## 5. Sequencing for wave 2

Three sub-waves, because M5 blocks M6/M7/M8 and M14 blocks M5.

```
sub-wave A   M1 auth+org · M2 company profile · M12 legal · M11 help        (foundation, parallel)
sub-wave B   M5 rules engine (pure fn + golden tests, NO DB) ─┐
             M14 KB runtime ────────────────────────────────── ┴→ M3 roster/CSV · M4 licences
sub-wave C   M6 alerts · M7 dashboard · M8 playbook · M9 billing · M10 settings · M13 admin
             M15 landing + demo · M16 qualifier watch · M17 shared readiness link
```

The critical path is **M14 → M5 → M6**. If wave 2 slips, it slips there, and the mitigation is to
cut the *number of states loaded*, never the derivation logic: nine correct records beat forty-five
guessed ones, and the product's whole claim is on the correctness side.

**Start M5 first, and start it without a database (D6).** Wave 1's spec headers had `specs/04`
blocking M5 and `specs/05` blocking M4 — a circular dependency that would have stalled the critical
path on its first morning. `specs/05` is explicitly a **pure, synchronous function**: it takes a
licence, a KB record and a date, and returns deadlines. So it is the one module that can be built and
**proved against the committed `kb-data/` with golden tests before any schema exists** — roughly 60
cases across 9 records × ~2 licence types × 3 issue dates. M4 then calls it and the `deadlines` table
lands with M5. Both spec headers are corrected.

---

## 6. Explicit non-goals for the MVP, so scope creep has to argue

- No county or city rules. The disclaimer and every playbook say so in the first screen.
- No trades beyond HVAC, plumbing, electrical.
- No states beyond the launch 15, and only 9 records populated at ship (see `KNOWLEDGE_BASE.md` §8).
- No document parsing (reading an expiry date off an uploaded licence PDF). Certly does extraction;
  duplicating it here before either product has revenue is how both ship late.
- No in-app payments beyond Stripe Checkout and the Customer Portal.
