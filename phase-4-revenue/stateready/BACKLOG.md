# StateReady — product backlog

**Owner:** Product Owner agent, phase-4 wave 1. **Date:** 2026-09-03.
**Binding upstream:** `../PLAN.md` (D1–D5, A1–A14), `../PIPELINE.md`, `KNOWLEDGE_BASE.md`.
**Reviewed by:** wave-1b reviewer (pending).

---

## 0. The one sentence the backlog has to serve

> A stranger, who has never spoken to us, signs up on a Tuesday because a licence nearly lapsed last
> quarter, and by Friday they are paying us every month because the calendar in their head is now in
> our product and it is more correct than the spreadsheet was.

Everything in **Must** exists to make that sentence true. Everything not in Must is an idea about a
customer we do not have yet.

### The buyer, in one paragraph

An office manager or compliance lead at a 5–100-technician HVAC / plumbing / electrical company, or
the single back-office person at a PE-backed platform that has bought four companies this year and
inherited four licence calendars. They are not a software buyer. They keep this in a spreadsheet
with conditional formatting, or in Outlook reminders, or in their head. Their fear is specific and
dated: a lapse stops a permit pull, which stops a job, which is a phone call from a general
contractor. They will pay to stop having that conversation. They will not pay for "compliance
visibility". (Persona detail is the Buyer & Identity agent's; this backlog only needs the fear.)

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
| **M9** | Billing: tiers by states (technicians as guardrail), trial or paid tripwire, Stripe Checkout + Portal + webhook | No billing, no revenue. Tiered on **states**, with technicians as a fair-use guardrail — a state × trade is a rulebook we maintain, so states are the real cost driver and the buyer's own mental model. Aligned with `OFFER.md`. | M |
| **M10** | Settings: organisation, users, notification preferences, data export | Notification preferences are a retention feature: the fastest way to lose this customer is to become noise. Export because a compliance buyer will not enter data they cannot get back out. | S |
| **M11** | Help centre + support auto-responder | A6. One human at the edge, no human in the loop. | S |
| **M12** | Legal: terms, privacy, **the disclaimer**, refund policy | The disclaimer is not boilerplate here. We publish regulatory data; the refund policy on the $1,500 playbook is what makes the price credible. | S |
| **M13** | Admin metrics: signups, activation, conversion, MRR, churn, cohort | We cannot evaluate `THRESHOLDS.md` without it, and a threshold we cannot measure is a wish. | M |
| **M14** | Knowledge-base runtime + drift review queue | The KB has to load into the app, and a source page changing has to reach a human before it reaches a customer. Without the queue, the refresh cron is a liability. | M |

Effort key: **S** ≈ 1 dev-day, **M** ≈ 2–3, **L** ≈ 4–6. Total ≈ **34 dev-days**, one spec each in
`specs/`.

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
| S2 | Board licence-number verification (scrape the public licence search, confirm the number and status the customer typed) | first support ticket caused by a typo'd licence number |
| S3 | Shared organisation calendar feed (ICS) | any customer asks how to get this into Outlook |
| S4 | Second and third seat, with per-user notification scoping | first customer with 2 offices |
| S5 | Acquisition mode: import a whole acquired company's licences as a batch and diff against the parent | first PE-backed platform customer |
| S6 | Renewal task workflow (assignee, status, "renewed" with proof) | month-2 retention below band and exit interviews say "we still tracked it in the sheet" |
| S7 | CE course marketplace links (approved-provider list per state, deep-linked) | the KB already carries `approved_provider_rule`; ship when a customer asks *where* to get hours |
| S8 | Public "licence lapse risk audit" lead magnet (the free tier in the shortlist's offer ladder) | when the outbound engine has a list to send it to (wave 3) |
| S9 | Expansion playbook self-serve checkout (today it is a Stripe payment link + generation) | ≥ 5 playbooks sold manually |

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
sub-wave B   M14 KB runtime → M5 rules engine → M3 roster/CSV · M4 licences (the core, partly serial)
sub-wave C   M6 alerts · M7 dashboard · M8 playbook · M9 billing · M10 settings · M13 admin
```

The critical path is **M14 → M5 → M6**. If wave 2 slips, it slips there, and the mitigation is to
cut the *number of states loaded*, never the derivation logic: nine correct records beat forty-five
guessed ones, and the product's whole claim is on the correctness side.

---

## 6. Explicit non-goals for the MVP, so scope creep has to argue

- No county or city rules. The disclaimer and every playbook say so in the first screen.
- No trades beyond HVAC, plumbing, electrical.
- No states beyond the launch 15, and only 9 records populated at ship (see `KNOWLEDGE_BASE.md` §8).
- No document parsing (reading an expiry date off an uploaded licence PDF). Certly does extraction;
  duplicating it here before either product has revenue is how both ship late.
- No in-app payments beyond Stripe Checkout and the Customer Portal.
