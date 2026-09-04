# Identifier grammar

Identifiers in this knowledge base are load-bearing in the same way Clausewright's clause ids are
(`phase-2-build/architecture/CORPUS_DESIGN.md` §2.3): a citation printed on a customer's $1,500
expansion playbook in March must still resolve in December, and a licence row in a customer's
database references a `licence_type_id` for as long as that technician works there.

| entity | grammar | example | rule |
|---|---|---|---|
| State × trade record | `{state_lower}.{trade}` | `tx.plumbing` | Append-only. A record is never renamed or reused. |
| Board | `{state_lower}.{agency_shortname}` | `tx.tsbpe`, `nc.ncbeec` | One per **agency**, not per URL. An agency that moves domain keeps its `board_id`. |
| Licence type | `{record_id}.{slug}` | `tx.plumbing.responsible_master_plumber` | Slug derived from the board's own name for the licence, hand-stabilised. **Never** derived from a position in a list. |
| Source | `{board_id}.{page_slug}` | `tx.tdlr.acr_apply` | One per document. |

## Versioning

A regulatory value that changes does **not** overwrite the old one in place. The old `SourcedValue`
is retained in `kb-data/_history/{record_id}.jsonl` with the date the change was detected, and the
new one carries a fresh `last_verified`.

**Who writes that file** — because at wave 1 nothing did, and an unimplemented promise inside the
ontology is worse than no promise (wave-1b **M17**): `kb-scripts/accept_drift.py` appends one JSONL
line per record every time a source-hash drift is accepted, carrying the previous hash, the new hash,
the date, who accepted it, the note and the json paths of the values that cite the page. A `corrected`
resolution — where a value genuinely moved — appends the superseded `SourcedValue` itself through the
same file, from the `build_records` edit. `kb-scripts/test_accept_drift.py` asserts the line is
written and that no value, status, confidence or `last_verified` is touched by an acceptance.

Two reasons the file exists:

1. A customer who renewed in March under a $65 fee and is billed $80 in April will ask us why. We
   have to be able to answer with a date and a source, not a shrug.
2. The drift cron's job is to detect change. A store that overwrites cannot tell "changed" from
   "was always this".

## Trade codes

`hvac`, `plumbing`, `electrical` only, at launch (PLAN.md A11). The obvious next codes are
`roofing`, `fire_protection`, `low_voltage` — chosen because the phase-3 prospect file's
highest-fit accounts (Vertex, Tecta, Pye-Barker, BluSky) live there. They are **not** in the launch
enum, and the schema will reject them, deliberately: a half-populated trade is worse than a missing
one, because the customer cannot tell the difference.
