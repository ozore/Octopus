# Agentic pipeline standard (applies to every fleet in phase 4)

Every deliverable goes through the same six stages. A fleet is the set of agents assigned to the stages; the orchestrator owns the gates between stages.

| stage | who | output | gate to next stage |
|---|---|---|---|
| 1. Ideation | one agent, wide | options with the reasoning, not one answer | at least three options, each with the buyer's point of view |
| 2. Research | one to three agents in parallel | evidence with sources opened, not remembered | every claim that matters has a URL that was fetched |
| 3. Verification | a different agent than the researcher | each key claim re-checked at the source; contradictions listed | no unresolved contradiction on a load-bearing claim |
| 4. Implementation / writing | one to five agents | the artefact (document, code, page, data) | self-check passes (tests, validator, spec acceptance criteria) |
| 5. Review | a different agent than the author, adversarial | `REVIEW.md` or PR-style findings ranked by severity | no blocking finding open |
| 6. Iteration | the author | fixes, one variable at a time, with a changelog | reviewer signs; if three rounds fail, escalate to the orchestrator with the disagreement written down |

## Brief template (the five pillars, mandatory in every agent prompt)

1. **Goals**: the finish line, in one paragraph, and the definition of done as a checklist.
2. **Constraints**: what not to touch, use or do (files, services, data classes, spending, sending).
3. **Format**: the exact files to produce, their structure, and the validator or test that proves them.
4. **Failure**: what to do when stuck: two attempts per source then log and move on; take the best defensible guess, write the assumption down; never ask a human mid-task; stop and report if a constraint cannot be honoured.
5. **Memory**: keep `CLAUDE.md` in the working directory updated as you go (rules confirmed, what worked, what failed, mistakes, assumptions, advice to the next agent).

## Standing rules

- No private individuals' data anywhere (same rule as phase 3). Organisations, business routes, public registers only.
- No secrets in the repo. Env names only; values live in Vercel and in this session's environment.
- Nothing is sent, posted, signed up or purchased by an agent. Drafts and configurations only; the founder flips the switches.
- Sources are opened, not remembered. A rate, a rule, a fee or a claim without a fetched URL and a date does not ship.
- Every regulatory value carries `source_url`, `last_verified`, `verified_by` (two agent ids) and a `confidence`.
- Reviewers never edit; authors never review their own work.
- Each fleet writes into its own directory; the orchestrator merges, validates and commits.
