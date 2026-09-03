#!/usr/bin/env python3
"""Validate kb-data/ against ontology/ and against the house rules that a schema cannot express.

Exit code 0 = every record is structurally sound and every gate passes. Non-zero = the build must
not ship. This is the "structural guarantees over procedural ones" discipline borrowed from
CORPUS_DESIGN.md §7: any rule that CAN be a test IS one, and it fails the build rather than warning.

    python3 kb-scripts/validate.py            # all records
    python3 kb-scripts/validate.py -v         # list every gate result
    python3 kb-scripts/validate.py tx.hvac    # one record

A deliberately dependency-free JSON Schema subset validator is included (no jsonschema package in
CI or in the Vercel build image). It implements exactly the keywords our two schemas use, and it
fails loudly on any keyword it does not know rather than silently passing.
"""
from __future__ import annotations

import datetime as dt
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_kb import KB_DATA, ONTOLOGY, load_records, walk_sourced_values      # noqa: E402

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
URI_RE = re.compile(r"^https?://\S+$")
KNOWN = {"$schema", "$id", "title", "description", "type", "properties", "required",
         "additionalProperties", "items", "enum", "const", "pattern", "minItems", "maxItems",
         "maxLength", "format", "$ref", "allOf", "if", "then", "propertyNames", "minimum"}

_SCHEMA_CACHE: dict[str, dict] = {}


def load_schema(name: str) -> dict:
    if name not in _SCHEMA_CACHE:
        _SCHEMA_CACHE[name] = json.loads((ONTOLOGY / name).read_text())
    return _SCHEMA_CACHE[name]


def _type_ok(value, expected) -> bool:
    types = expected if isinstance(expected, list) else [expected]
    for t in types:
        if t == "object" and isinstance(value, dict):
            return True
        if t == "array" and isinstance(value, list):
            return True
        if t == "string" and isinstance(value, str):
            return True
        if t == "number" and isinstance(value, (int, float)) and not isinstance(value, bool):
            return True
        if t == "integer" and isinstance(value, int) and not isinstance(value, bool):
            return True
        if t == "boolean" and isinstance(value, bool):
            return True
        if t == "null" and value is None:
            return True
    return False


def validate_node(value, schema: dict, path: str, errors: list[str], base: str) -> None:
    unknown = set(schema) - KNOWN
    if unknown:
        errors.append(f"{path}: schema uses unsupported keyword(s) {sorted(unknown)} — extend validate.py")

    if "$ref" in schema:
        ref = schema["$ref"]
        target = f"schema.{ref.split('/')[-1]}" if ref.endswith(".json") and "/" not in ref else ref
        if ref.endswith(".json"):
            target = "schema." + ref.rsplit("/", 1)[-1] if not ref.startswith("schema.") else ref
        validate_node(value, load_schema(target), path, errors, base)
        rest = {k: v for k, v in schema.items() if k != "$ref"}
        if rest:
            validate_node(value, rest, path, errors, base)
        return

    if "type" in schema and not _type_ok(value, schema["type"]):
        errors.append(f"{path}: expected type {schema['type']}, got {type(value).__name__}")
        return
    if "enum" in schema and value not in schema["enum"]:
        errors.append(f"{path}: {value!r} not in enum {schema['enum']}")
    if "const" in schema and value != schema["const"]:
        errors.append(f"{path}: expected const {schema['const']!r}, got {value!r}")

    if isinstance(value, str):
        if "pattern" in schema and not re.search(schema["pattern"], value):
            errors.append(f"{path}: {value!r} does not match {schema['pattern']}")
        if "maxLength" in schema and len(value) > schema["maxLength"]:
            errors.append(f"{path}: string longer than maxLength {schema['maxLength']}")
        fmt = schema.get("format")
        if fmt == "date" and not DATE_RE.match(value):
            errors.append(f"{path}: {value!r} is not an ISO date")
        if fmt == "uri" and not URI_RE.match(value):
            errors.append(f"{path}: {value!r} is not an http(s) URI")

    if isinstance(value, list):
        if "minItems" in schema and len(value) < schema["minItems"]:
            errors.append(f"{path}: {len(value)} items, minItems {schema['minItems']}")
        if "items" in schema:
            for i, item in enumerate(value):
                validate_node(item, schema["items"], f"{path}[{i}]", errors, base)

    if isinstance(value, dict):
        props = schema.get("properties", {})
        for req in schema.get("required", []):
            if req not in value:
                errors.append(f"{path}: missing required property '{req}'")
        if schema.get("additionalProperties") is False:
            for key in value:
                if key not in props and not key.startswith("_"):
                    errors.append(f"{path}: unexpected property '{key}'")
        for key, child in value.items():
            if key in props:
                validate_node(child, props[key], f"{path}.{key}", errors, base)

    for sub in schema.get("allOf", []):
        if "if" in sub:
            probe: list[str] = []
            validate_node(value, sub["if"], path, probe, base)
            if not probe and "then" in sub:
                validate_node(value, sub["then"], path, errors, base)
        else:
            validate_node(value, sub, path, errors, base)


# ---------------------------------------------------------------- gates the schema cannot express
def gates(rid: str, rec: dict) -> list[tuple[str, str, str]]:
    """Returns a list of (gate_id, severity, message). severity 'fail' blocks the build."""
    out: list[tuple[str, str, str]] = []
    svs = list(walk_sourced_values(rec))

    # G1  every verified value carries a URL, an evidence fragment, a date and two verifiers
    for jp, v in svs:
        if v["status"] == "verified":
            missing = [k for k in ("source_url", "evidence", "last_verified", "verified_by")
                       if not v.get(k)]
            if missing:
                out.append(("G1", "fail", f"{jp}: status verified but missing {missing}"))
            elif len(set(v["verified_by"])) < 2:
                out.append(("G1", "fail", f"{jp}: status verified with fewer than two distinct verifiers"))

    # G2  a null value is 'unknown' and carries a note explaining what was read
    for jp, v in svs:
        if v["value"] is None:
            if v["status"] != "unknown":
                out.append(("G2", "fail", f"{jp}: null value must have status 'unknown'"))
            if not v.get("note"):
                out.append(("G2", "fail", f"{jp}: null value must carry a note"))

    # G3  no estimated money or hours. A numeric value must be 'verified' or carry a note.
    for jp, v in svs:
        if isinstance(v["value"], (int, float)) and not isinstance(v["value"], bool):
            if v["status"] != "verified" and not v.get("note"):
                out.append(("G3", "fail", f"{jp}: numeric value {v['value']} is not verified and has no note"))

    # G4  copyright: an evidence fragment is a short quotation, never bulk source text
    for jp, v in svs:
        ev = v.get("evidence")
        if ev and len(ev.split()) > 25:
            out.append(("G4", "fail", f"{jp}: evidence is {len(ev.split())} words, limit is 25"))

    # G5  only board and government sources; no third-party guides in kb-data
    allowed_kinds = {"board_page", "board_pdf", "statute", "administrative_rule", "federal_statistics"}
    for jp, v in svs:
        if v.get("source_kind") and v["source_kind"] not in allowed_kinds:
            out.append(("G5", "fail", f"{jp}: source_kind {v['source_kind']} not allowed"))
    official = json.loads((ONTOLOGY / "official-hosts.json").read_text())["hosts"]
    for s in rec["provenance"]["sources"]:
        host = re.sub(r"^https?://([^/]+).*$", r"\1", s["url"]).lower()
        if host not in official:
            out.append(("G5", "fail", f"provenance source {s['source_id']} host {host} is not on the "
                                      f"ontology/official-hosts.json allowlist"))

    # G6  referential integrity: every licence_type points at a board declared in this record
    board_ids = {b["board_id"] for b in rec["boards"]}
    for lt in rec["licence_types"]:
        if lt["board_id"] not in board_ids:
            out.append(("G6", "fail", f"{lt['licence_type_id']}: board_id {lt['board_id']} not declared"))
        if not lt["licence_type_id"].startswith(rec["record_id"] + "."):
            out.append(("G6", "fail", f"{lt['licence_type_id']}: id does not start with {rec['record_id']}."))

    # G7  an empty reciprocity list is only publishable with a reciprocity_statement that says so
    if not rec["reciprocity"]:
        stmt = rec.get("reciprocity_statement") or {}
        if stmt.get("value") is None:
            out.append(("G7", "warn", "no reciprocity entries and no reciprocity_statement value: the "
                                      "product must render 'not established', never 'none'"))

    # G8  every expiry_rule is a token the deadline engine implements — and every board-announced
    #     override of that rule is a real date, inside the cycle year it claims, on a page two passes
    #     read (wave-1b M13; specs/05 "Board-announced date rolls"). An override is the one thing in
    #     the record that can move a deadline WITHOUT a SourcedValue wrapper, so the checks G1/G3/G4
    #     do for values are done here for overrides.
    known_rules = ("anniversary", "fixed_date:", "fixed_date_parity:")
    today = dt.date.today()
    for lt in rec["licence_types"]:
        rule = lt["renewal"]["expiry_rule"]["value"]
        rule_known = rule is not None and str(rule).startswith(known_rules)
        if rule is not None and not rule_known:
            out.append(("G8", "fail", f"{lt['licence_type_id']}: unknown expiry_rule {rule!r}"))

        overrides = lt.get("expiry_overrides") or []
        if overrides and not rule_known:
            out.append(("G8", "fail", f"{lt['licence_type_id']}: expiry_overrides on a licence type "
                                      f"whose expiry_rule {rule!r} the engine does not implement — an "
                                      f"override may only correct a rule we can derive"))
        seen_years: set = set()
        for i, ov in enumerate(overrides):
            jp = f"{lt['licence_type_id']}.expiry_overrides[{i}]"
            year = ov.get("cycle_year")
            try:
                day = dt.date.fromisoformat(str(ov.get("date")))
            except ValueError:
                out.append(("G8", "fail", f"{jp}: date {ov.get('date')!r} is not a real date"))
                day = None
            if day is not None and day.year != year:
                out.append(("G8", "fail", f"{jp}: date {day} is not inside cycle_year {year} — an "
                                          f"override never applies outside its own cycle"))
            if year in seen_years:
                out.append(("G8", "fail", f"{jp}: a second override for cycle_year {year}; the engine "
                                          f"takes exactly one per cycle"))
            seen_years.add(year)
            if len(set(ov.get("verified_by") or [])) < 2:
                out.append(("G8", "fail", f"{jp}: fewer than two distinct verifiers"))
            ev = ov.get("evidence") or ""
            if len(ev.split()) > 25:
                out.append(("G8", "fail", f"{jp}: evidence is {len(ev.split())} words, limit is 25"))
            lv = ov.get("last_verified")
            if lv and DATE_RE.match(str(lv)) and dt.date.fromisoformat(lv) > today:
                out.append(("G8", "fail", f"{jp}: last_verified {lv} is in the future"))
            host = re.sub(r"^https?://([^/]+).*$", r"\1", str(ov.get("source_url", ""))).lower()
            if host not in json.loads((ONTOLOGY / "official-hosts.json").read_text())["hosts"]:
                out.append(("G8", "fail", f"{jp}: source host {host} is not on the "
                                          f"ontology/official-hosts.json allowlist"))

    # G9  a record with any low-confidence or unverified value must not claim the standard disclaimer
    weak = [jp for jp, v in svs if v["value"] is not None
            and (v["confidence"] == "low" or v["status"] == "unverified")]
    if weak and rec.get("disclaimer_profile") == "standard":
        out.append(("G9", "warn", f"{len(weak)} weak values but disclaimer_profile is 'standard'"))

    # G10 provenance hashes must match kb-data/_sources.json (a record cannot claim a hash the
    #     drift baseline never measured) — SCOPED to sources the record actually hangs a value on.
    #
    #     Wave-1b B11: the coupling that matters is between a hash and the values that cite it. A
    #     record may list a page it read during authoring and hang no customer-facing value on it
    #     (a board index, a background page). When such a page changes, nothing we show a customer
    #     moved with it, and failing the whole build on it is how accept_drift.py's two writes get
    #     un-coupled by whoever is trying to ship. A mismatch with no citing value is a WARNING,
    #     named and visible in the queue; a mismatch on a cited page is unchanged and unforgiving.
    baseline = json.loads((KB_DATA / "_sources.json").read_text())["sources"]
    cited_urls = {v["source_url"] for _, v in svs if v.get("source_url")}
    for s in rec["provenance"]["sources"]:
        b = baseline.get(s["source_id"])
        is_cited = s["url"] in cited_urls
        if b is None:
            out.append(("G10", "fail", f"provenance source {s['source_id']} absent from _sources.json"))
        elif b.get("content_sha256") != s.get("content_sha256"):
            if is_cited:
                n = sum(1 for _, v in svs if v.get("source_url") == s["url"])
                out.append(("G10", "fail", f"provenance source {s['source_id']} hash differs from "
                                           f"baseline and {n} value(s) cite it"))
            else:
                out.append(("G10", "warn", f"provenance source {s['source_id']} hash differs from "
                                           f"baseline; no value cites it, so nothing we show a "
                                           f"customer changed. Accept it with "
                                           f"kb-scripts/accept_drift.py --source-id "
                                           f"{s['source_id']}"))

    # G11 publishable is a computed flag, never hand-set: it requires zero pass-B disagreements
    pb = rec["provenance"]["pass_b"]
    if rec["provenance"].get("publishable") and pb.get("disagreements", 0) > 0:
        out.append(("G11", "fail", "publishable true with pass-B disagreements recorded"))

    # G12 every record declares what it does not cover
    if not rec.get("coverage_notes"):
        out.append(("G12", "warn", "no coverage_notes: a gap the customer cannot see becomes a refund"))

    # G13 dates are not in the future and not absurdly old
    today = dt.date.today()
    for jp, v in svs:
        lv = v.get("last_verified")
        if lv:
            d = dt.date.fromisoformat(lv)
            if d > today:
                out.append(("G13", "fail", f"{jp}: last_verified {lv} is in the future"))
            elif (today - d).days > 400:
                out.append(("G13", "warn", f"{jp}: last_verified {lv} is over 400 days old"))
    return out


def main() -> int:
    only = {a for a in sys.argv[1:] if not a.startswith("-")}
    verbose = "-v" in sys.argv or "--verbose" in sys.argv
    schema = load_schema("schema.state_trade_record.json")

    records = [(p, r) for p, r in load_records() if not only or r["record_id"] in only]
    if not records:
        print("no records found", file=sys.stderr)
        return 2

    total_fail = total_warn = 0
    for path, rec in records:
        errors: list[str] = []
        validate_node(rec, schema, rec.get("record_id", path.stem), errors, str(ONTOLOGY))
        results = gates(rec["record_id"], rec)
        fails = [r for r in results if r[1] == "fail"]
        warns = [r for r in results if r[1] == "warn"]
        n_sv = len(list(walk_sourced_values(rec)))
        n_ver = sum(1 for _, v in walk_sourced_values(rec) if v["status"] == "verified")
        n_unk = sum(1 for _, v in walk_sourced_values(rec) if v["status"] == "unknown")

        status = "FAIL" if (errors or fails) else ("ok  " if not warns else "warn")
        print(f"{status} {rec['record_id']:<16} {n_sv:>3} values  {n_ver:>3} verified  "
              f"{n_unk:>3} unknown  {len(rec['licence_types'])} licence types  "
              f"{len(rec['reciprocity'])} reciprocity")
        for e in errors:
            print(f"       SCHEMA {e}")
        for gid, sev, msg in results:
            if sev == "fail" or verbose:
                print(f"       {gid} {sev.upper()} {msg}")
        total_fail += len(errors) + len(fails)
        total_warn += len(warns)

    print(f"\n{len(records)} record(s): {total_fail} failure(s), {total_warn} warning(s)")
    return 1 if total_fail else 0


if __name__ == "__main__":
    raise SystemExit(main())
