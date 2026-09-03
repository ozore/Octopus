# M2 — Company profile: entities, branches, trades, states

**Status:** spec, wave 1. **Effort:** S (~1 dev-day). **Depends on:** M1. **Blocks:** M5, M7, M8, M9.

## Story

> As the compliance lead at a platform that has bought four HVAC companies in three states, I want
> to tell StateReady which legal entities we operate, in which states, in which trades — because
> every deadline it later shows me is only correct if it knows that.

This screen is short and it is load-bearing. `states × trades` is the key the rules engine matches
knowledge-base records on, and it is the axis billing tiers on (M9).

## Flow

```
first login → /onboarding
  step 1  Company name and legal entities        (at least one)
  step 2  Trades we perform                      (HVAC / plumbing / electrical, multi-select)
  step 3  States we work in                      (multi-select, launch 15 highlighted)
  step 4  → "Add your first licence" (M4) or "Import your roster" (M3)
later      /settings/company edits all of it
```

Onboarding is four steps because activation depends on reaching step 4 fast. Anything that can be
edited later is not in onboarding.

## Screens

| screen | contents |
|---|---|
| `/onboarding/company` | Company name; entity rows (name, type, home state). "Most companies have one — add more if you operate under separate licences." |
| `/onboarding/trades` | Three large toggles with the plain-English scope of each, taken from the KB (`licence_types[].scope_note`), so the customer picks correctly. |
| `/onboarding/states` | US map plus a searchable list. Launch-15 states are selectable and marked "covered"; the other 35 are selectable but marked **"not yet covered — we will track your licences but cannot derive deadlines or produce a playbook"**. Selecting one records demand (this is the L1 trigger in `BACKLOG.md`). |
| `/settings/company` | Same fields, plus entity archive. |

## Data model

```ts
export const companyProfiles = pgTable("company_profiles", {
  organisationId: uuid("organisation_id").primaryKey().references(() => organisations.id, { onDelete: "cascade" }),
  legalName:      text("legal_name").notNull(),
  technicianCountBand: text("technician_count_band", { enum: ["1-5","6-20","21-50","51-100","100+"] }),
  completedAt:    timestamp("completed_at", { withTimezone: true }),
});

export const entities = pgTable("entities", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  name:           text("name").notNull(),
  entityType:     text("entity_type", { enum: ["llc","corp","s_corp","partnership","sole_prop","other"] }),
  homeState:      char("home_state", { length: 2 }),
  archivedAt:     timestamp("archived_at", { withTimezone: true }),
});

export const operatingStates = pgTable("operating_states", {
  id:             uuid("id").primaryKey().defaultRandom(),
  organisationId: uuid("organisation_id").notNull().references(() => organisations.id, { onDelete: "cascade" }),
  entityId:       uuid("entity_id").references(() => entities.id, { onDelete: "cascade" }),  // null = whole org
  state:          char("state", { length: 2 }).notNull(),
  trade:          text("trade", { enum: ["hvac","plumbing","electrical"] }).notNull(),
  status:         text("status", { enum: ["operating","expanding","considering"] }).notNull().default("operating"),
  createdAt:      timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({ uniq: unique().on(t.organisationId, t.entityId, t.state, t.trade) }));
```

`status` is not decoration. `expanding` and `considering` are the buying signal for the $750–1,500
playbook (M8) and the trigger for the lifecycle email that offers it.

## Server actions

| action | notes |
|---|---|
| `saveCompanyProfile({ legalName, technicianCountBand })` | Upsert. |
| `addEntity` / `updateEntity` / `archiveEntity` | Archive, never delete: licences reference entities and history is the product. |
| `setOperatingStates({ rows })` | Diff-based: computes adds and removes, writes both, emits one event per change. Removing a state that still has active licences is refused (see Errors). |
| `getCoverage()` | Returns, per selected `(state, trade)`, whether a **publishable** KB record exists. Drives every "covered / not yet covered" badge in the UI. |

## Validation

- `legalName` 2–200 chars. Entity name 2–200.
- `state` must be a real 2-letter US state or DC. Territories are rejected with a clear message.
- Trade must be one of the three; the enum is shared with `ontology/schema.state_trade_record.json`
  and a CI test asserts the two lists are identical.
- At least one trade and one state before onboarding can complete.

## Acceptance criteria

1. Completing the four onboarding steps sets `completed_at` and lands on the "add first licence" CTA.
2. Selecting Texas + HVAC shows "covered"; selecting Ohio + HVAC shows "not yet covered" with the
   exact consequence spelled out, and records a `state_coverage_requested` event.
3. `/settings/company` round-trips every field.
4. Adding a second entity and assigning it a different state/trade set produces distinct rows and the
   dashboard groups by entity.
5. Deselecting a state that has active licence records is refused with the count of affected licences.

## Edge cases

- **One-entity company, which is most of them.** Entity step must be skippable in one click; we
  create a single entity named after the company.
- **A state selected with no trade, or a trade with no state.** The cross-product is what we store,
  so the UI must make the pairing explicit rather than storing two independent lists. This is the
  single most likely modelling mistake in the product: a company can be electrical in Texas and
  plumbing in Florida and neither of the other two combinations.
- **50-state selection.** Someone will select all. The UI must not then claim 50-state coverage; the
  "covered" count is computed from `getCoverage()`, never from the selection.
- **Territory or Canadian province typed into search.** Explicit "we cover US states only" message.

## Errors

| condition | user sees |
|---|---|
| Removing a state with active licences | "3 active licences are in Texas. Archive them first, or keep Texas selected." |
| Archiving an entity with active licences | Same shape, with a link to the licences |
| Coverage lookup fails (KB not loaded) | Badges render as "checking…", never as "covered" — fail closed |

## Analytics events

`onboarding_started`, `onboarding_step_completed` (with `step`), `onboarding_completed`,
`entity_added`, `operating_state_added` (with `state`, `trade`, `covered: boolean`),
`state_coverage_requested` (uncovered state selected — the demand signal for L1),
`expansion_intent_recorded` (a row saved with status `expanding`).

## Test plan

- **Unit:** the states/trades diff algorithm, including a change that both adds and removes.
- **Integration:** `getCoverage()` against a seeded KB with 9 publishable records — asserts TX/FL/NC
  × the three trades are covered and everything else is not.
- **Schema-parity test:** the TypeScript trade enum equals the JSON Schema trade enum.
- **E2E:** onboarding happy path in under 60 seconds of simulated interaction, asserted by step
  timestamps in the events table.
