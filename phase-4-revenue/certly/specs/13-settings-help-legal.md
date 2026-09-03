# Spec M13 — Settings, help and legal

**Backlog item:** M13 (Must). **Effort:** M. **Depends on:** M1; `KNOWLEDGE_BASE.md` §F.

Grouped into one spec because they are one surface area with one shape. **One part of it is not
administrivia:** `organisations.entityBlock` is a *functional input* to M5's certificate-holder check.
A wrong entity block silently produces wrong verdicts, so it is treated here as a feature, not a
profile field.

## 1. Stories

> As an owner I set the exact entity name that must appear as certificate holder, choose who else can
> log in, control what email goes out under my name, and export or delete my data.
> As a user stuck at 9pm I find an answer in the help centre or send one email and get a reply.
> As a buyer I read what happens to my data before I put my vendors in it.

## 2. Settings

| section | route | fields |
|---|---|---|
| Organisation | `/settings/org` | name, timezone, **certificate-holder entity block** (+ alternate accepted holder strings), logo (used on the M8 upload page and M12 reports) |
| Team | `/settings/team` | members, roles (owner/editor/viewer), invite by email (magic link), remove |
| Reminders | `/settings/reminders` | ladder, sending name, reply-to, weekly digest day *(detail in M7)* |
| Notifications | `/settings/notifications` | per-user: weekly digest, review-queue alerts, bounce alerts |
| Billing | `/settings/billing` | *(M10)* |
| Activity | `/settings/activity` | *(M9)* |
| Data | `/settings/data` | export everything (ZIP: CSVs + original documents), delete organisation |

**Alternate holder strings** exist because C11-style reality: a certificate is often made out to the
managing agent rather than the owning entity, and both are correct. Without this field, M5 sends every
such certificate to review forever, and the customer concludes the product is broken.

## 3. Help

| item | route | notes |
|---|---|---|
| Help centre | `/help` | 12 articles at launch, in-repo MDX, searchable, no third-party widget |
| Contact | `/help/contact` | one form → the founder's mailbox; auto-responder with expected response time (PLAN §A6) |
| Status | `/help/status` | plain page; extraction queue health and any incident note |

**The 12 launch articles, chosen from the questions this product will actually get:**
1. What Certly does, and what it does not do
2. Reading an ACORD 25 certificate, box by box
3. "Additional insured" — why a tick on a certificate is not proof *(the D1 explainer; also the best
   organic-search asset we will have)*
4. Waiver of subrogation — GL and workers' comp are different things
5. Primary and non-contributory
6. Choosing and editing your requirements
7. Importing vendors from a spreadsheet
8. What "needs review" means and how to clear it
9. How renewal reminders work, and how to stop them
10. Sending your vendors an upload link
11. Exporting a gap report for an owner or auditor
12. Plans, limits and how "tracked certificates" is counted

## 4. Legal

| page | route | content |
|---|---|---|
| Terms | `/legal/terms` | "TheVillage" as the contracting entity, "Certly, a TheVillage company" (PLAN §D1); **an explicit no-insurance-advice clause**; limitation of liability; acceptable use |
| Privacy | `/legal/privacy` | what is collected, why, retention, sub-processors, deletion route, contact |
| Sub-processors | `/legal/subprocessors` | Vercel (hosting), Neon (database), Anthropic (extraction), Stripe (payments), Resend (email) — each with purpose and data category. A dated table, not prose |
| DPA (lite) | `/legal/dpa` | downloadable; customer is controller, TheVillage processor |
| Disclaimers | `/legal/disclaimers` | the three texts from KB §F, canonical, linked from every surface that renders them |

## 5. Data model

```ts
// organisations gains: timezone, logoKey, alternateHolders (jsonb string[])
invitations { id, orgId, email (citext), role, tokenHash, expiresAt, acceptedAt, invitedBy, createdAt }
userPreferences { id, userId, orgId, weeklyDigest bool, reviewAlerts bool, bounceAlerts bool }
deletionRequests { id, orgId, requestedBy, requestedAt, scheduledFor, completedAt, cancelledAt }
```

## 6. Server actions

`updateOrg`, `updateEntityBlock`, `addAlternateHolder`, `inviteMember`, `acceptInvitation`,
`changeRole`, `removeMember`, `updatePreferences`, `exportOrgData`, `requestOrgDeletion`,
`cancelOrgDeletion`.

## 7. Validation

- roles: **owner** (billing, deletion, members), **editor** (everything operational), **viewer**
  (read + export only, no uploads, no reminders). Every server action declares its minimum role and the
  check is server-side
- an org always has ≥ 1 owner; removing the last owner is refused
- `entityBlock`: 1–500 chars; **changing it enqueues re-evaluation of every vendor**, and the UI says so
  before saving — this is a change of meaning, not of text
- invitations: 7-day expiry, single use, email-bound
- deletion: **30-day scheduled delay**, cancellable, then hard-delete of documents and rows; audit rows
  are the last to go (M9 §7). Exports remain downloadable throughout the delay
- logo: ≤ 1 MB, PNG/SVG/JPEG, dimension-checked, stripped of EXIF

## 8. Acceptance criteria

**A1** Given I change the entity block, Then I am warned that every vendor will be re-evaluated, and on
confirming, comparisons re-run and M9 records `org.entity_block_changed`.
**A2** Given a certificate made out to "Acme Managing Agent LLC" and that string is an alternate
accepted holder, Then M5's holder check is `met`.
**A3** Given a viewer, When they attempt an upload, Then it is refused server-side, not merely hidden.
**A4** Given the last owner tries to leave, Then it is refused with an explanation.
**A5** Given I request deletion, Then `scheduledFor` is +30 days, a confirmation email is sent, the
banner shows the date, and I can cancel until then.
**A6** Given I export org data, Then the ZIP contains vendors, requirements, certificates, comparisons
and audit events as CSVs, plus every original uploaded document, and M9 records `data.exported`.
**A7** Given `/legal/subprocessors`, Then all five sub-processors are listed with purpose, data
category and a "last updated" date.
**A8** Given `/help`, Then all 12 articles are present and searchable, and article 3 explains the
additional-insured distinction with the ACORD 25 wording quoted.
**A9** Given the contact form, Then the sender gets an auto-response naming the expected response time,
and the message reaches the founder's mailbox.
**A10** Given any legal page, Then it names TheVillage as the contracting entity and Certly as the
product.

## 9. Edge cases

| case | behaviour |
|---|---|
| Invitee already a member of another org | joins this org too; the switcher appears |
| Invitee's email differs by case | citext match |
| Deletion requested while a subscription is active | subscription cancelled at Stripe first, then the clock starts |
| Logo is a huge PNG | rejected with size guidance, not silently resized to mush |
| Timezone changed | affects reminder send times and expiry evaluation from the next job onward; existing scheduled rungs are recomputed |
| Help article links to a competitor's public glossary | allowed and cited (Jones' endorsement library is genuinely good) — we do not pretend we invented the domain |

## 10. Errors

Field-level, inline. Destructive actions (delete org, remove member, change entity block) require typed
confirmation of the org or member name, never a bare "are you sure".

## 11. Analytics

`settings_viewed{section}`, `entity_block_changed{reevaluated_vendors}`, `alternate_holder_added`,
`member_invited{role}`, `member_joined`, `role_changed`, `member_removed`,
`help_search{query_length,results}`, `help_article_viewed{slug}`, `support_email_sent`,
`data_exported{bytes}`, `deletion_requested`, `deletion_cancelled`, `legal_page_viewed{page}`.

`help_article_viewed{slug}` is a **product signal, not a content metric**: the three most-read articles
name the three places the UI failed to explain itself, and they go to the top of the next iteration.

## 12. Test plan

Unit: role matrix — every server action × every role, asserting allow/deny; the entity-block
re-evaluation trigger.
Integration (PGlite): invitation single-use and expiry; last-owner protection; deletion scheduling and
cancellation; export ZIP contents.
Content: a test asserts all 12 help articles exist, are non-empty, and that every disclaimer string in
`src/lib/kb/disclaimers.ts` appears verbatim on its five required surfaces (KB §F.3) — the disclaimers
are load-bearing and must not be able to silently disappear in a refactor.
e2e: invite → accept → role change → viewer refused an upload; request deletion → banner → cancel.
