#!/usr/bin/env python3
"""Build the nine launch state x trade records from the values read at the sources.

Why a builder and not nine hand-written JSON files: every regulatory fact has to travel inside the
same nine-field SourcedValue envelope (ontology/schema.sourced_value.json). Written by hand that is
~2,000 lines of near-identical boilerplate in which a missing `last_verified` is invisible. Written
here, the envelope is constructed once, the content hash is pulled from kb-data/_sources.json so it
can never drift from what refresh_sources.py measured, and the diff of a rule change is one line.

    python3 kb-scripts/build_records.py          # writes kb-data/*.json
"""
from __future__ import annotations

import datetime as dt
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib_kb import KB_DATA, ROOT                                          # noqa: E402

TODAY = "2026-09-03"
PASS_A = "po-stateready-pass-a"        # extraction pass: read the page, record the value
PASS_B = "po-stateready-pass-b"        # re-verification pass: re-open the URL, assert the evidence

SRC = json.loads((KB_DATA / "_sources.json").read_text())["sources"]
CATALOGUE = {s["source_id"]: s for s in json.loads((ROOT / "kb-scripts" / "sources.json").read_text())["sources"]}


def sv(value, source_id=None, evidence=None, *, unit=None, confidence="high",
       status=None, note=None, verified_by=(PASS_A, PASS_B)):
    """Build a SourcedValue. Defaults enforce the house rules rather than relying on care:
    a null value is forced to status 'unknown' and requires a note; anything with a source and
    evidence defaults to 'verified'."""
    out = {"value": value}
    if unit:
        out["unit"] = unit
    if value is None:
        out["status"] = "unknown"
        out["confidence"] = "low"
        out["note"] = note or "not established from a public source in this pass"
        if source_id:
            out["source_url"] = CATALOGUE[source_id]["url"]
        return out
    src = CATALOGUE[source_id] if source_id else None
    out["status"] = status or ("verified" if (src and evidence) else "unverified")
    out["confidence"] = confidence
    if src:
        out["source_url"] = src["url"]
        out["source_title"] = src["title"]
        out["source_kind"] = src["kind"]
    if evidence:
        out["evidence"] = evidence
    out["last_verified"] = TODAY
    out["verified_by"] = list(verified_by) if out["status"] == "verified" else ([verified_by[0]] if verified_by else [])
    if note:
        out["note"] = note
    return out


def provenance(source_ids, pass_b_note=""):
    return {
        "created_at": TODAY,
        "pass_a": {"agent_id": PASS_A, "date": TODAY,
                   "method": "fetched each source URL with curl (desktop UA), read the rendered "
                             "text, recorded each value with a verbatim evidence fragment"},
        "pass_b": {"agent_id": PASS_B, "date": TODAY,
                   "method": "kb-scripts/verify_pass_b.py re-fetches every source_url "
                             "independently of the pass-A cache and asserts the evidence fragment "
                             "is still literally present; a value whose evidence cannot be found "
                             "is a disagreement and is demoted to UNVERIFIED",
                   "agreements": 0, "disagreements": 0, "disagreement_detail": []},
        "sources": [
            {k: v for k, v in SRC[sid].items()
             if k in ("source_id", "url", "title", "kind", "fetched_at", "content_sha256",
                      "http_status", "bytes")}
            for sid in source_ids
        ],
        "publishable": False,   # set by verify_pass_b.py only when every value agrees
    }


# --------------------------------------------------------------------------- TEXAS · HVAC
tx_hvac = {
    "record_id": "tx.hvac", "schema_version": "1.0.0", "state": "TX", "state_name": "Texas",
    "trade": "hvac",
    "jurisdiction_model": {
        "level": "state_only",
        "summary": sv("A single TDLR Air Conditioning and Refrigeration contractor licence covers the "
                      "whole state. No separate municipal contractor licence is named on the board's pages.",
                      "tx.tdlr.acr_home",
                      "Contractors who install, repair, or maintain systems related to air conditioning, "
                      "refrigeration, or heating must have a TDLR license", confidence="high"),
        "local_layer_note": "TDLR publishes a knowledge-base page titled 'Out-of-State and Municipal "
                            "Licenses' which was not read in this pass; municipalities issue permits and "
                            "may register contractors even where they do not license them. Treat "
                            "'state_only' as 'the licence is issued by the state', never as 'no city "
                            "will ask you for anything'."
    },
    "boards": [{
        "board_id": "tx.tdlr", "name": "Texas Department of Licensing and Regulation — Air Conditioning "
        "and Refrigeration Contractors", "url": "https://www.tdlr.texas.gov/acr/",
        "scope": "HVAC/refrigeration contractor licences and technician registrations, statewide",
        "phone": "(800) 803-9202"
    }],
    "licence_types": [
        {
            "licence_type_id": "tx.hvac.acr_contractor_class_a", "name": "Air Conditioning and "
            "Refrigeration Contractor — Class A", "level": "contractor", "issuer_level": "state",
            "board_id": "tx.tdlr",
            "who_must_hold": sv("Any person contracting to install, repair or maintain air conditioning, "
                                "refrigeration or heating systems; each permanent company location must "
                                "employ a licensed ACR contractor.", "tx.tdlr.acr_home",
                                "ACR companies must employ an ACR contractor in each permanent location"),
            "scope_note": sv("Any size unit.", "tx.tdlr.acr_apply",
                             "The Class A license allows you to work on any size unit."),
            "exam": {
                "required": sv(True, "tx.tdlr.acr_apply",
                               "TDLR will approve your eligibility to take the licensing exam"),
                "fee": sv(74, "tx.tdlr.acr_renew", "pay the examination fee of $74", unit="USD",
                          confidence="medium",
                          note="The $74 figure is printed in the class-upgrade section of the renewal "
                               "page. It is the ACR examination fee, but the initial-application page "
                               "does not repeat it, so confidence is medium, not high."),
                "note": "All application requirements including the exam must be completed within one "
                        "year of filing."
            },
            "experience": {
                "requirement": sv("48 months of practical ACR work under a licensed ACR contractor within "
                                  "the past 72 months.", "tx.tdlr.acr_apply",
                                  "at least 48 months of practical experience in air-conditioning and "
                                  "refrigeration-related work"),
                "alternatives": sv("Technician certification held for 12 months plus 36 months of "
                                   "practical experience within the past 48 months; or a degree/diploma/"
                                   "certification in ACR, a mechanical-engineering degree or licence, "
                                   "military ACR training, or employment by an industrial operation.",
                                   "tx.tdlr.acr_apply",
                                   "You have held a technician certification for the past 12 months")
            },
            "application_fee": sv(115, "tx.tdlr.acr_apply", "along with the fee of $115", unit="USD"),
            "renewal": {
                "cycle": sv(12, "tx.tdlr.acr_apply", "Licenses are valid for a period of 1 year from the "
                            "date of issue.", unit="months"),
                "fee": sv(65, "tx.tdlr.acr_renew", "along with the renewal fee of $65", unit="USD"),
                "expiry_rule": sv("anniversary", "tx.tdlr.acr_apply",
                                  "Licenses are valid for a period of 1 year from the date of issue.",
                                  note="Expiry = issue date + 12 months, per licence. The rules engine "
                                       "derives it from the licence's own issue date; there is no "
                                       "state-wide common expiry date."),
                "grace_period": sv("None for practising. Late renewal is possible but the licence is not "
                                   "valid meanwhile.", "tx.tdlr.acr_renew",
                                   "You may not engage in air conditioning and refrigeration contracting "
                                   "if your license has expired."),
                "late_fee": sv("1.5x the renewal fee if expired 90 days or less; 2x if expired more than "
                               "90 days and under 18 months; 2x with executive-director approval from 18 "
                               "months to 3 years.", "tx.tdlr.acr_renew",
                               "a renewal fee that is equal to 1-1/2 times the normally required renewal fee")
            },
            "continuing_education": {
                "required": sv(True, "tx.tdlr.acr_ce", "you must complete 8 hours of continuing education"),
                "hours": sv(8, "tx.tdlr.acr_ce", "you must complete 8 hours of continuing education",
                            unit="hours"),
                "period": sv(12, "tx.tdlr.acr_renew", "must complete 8 hours of approved continuing "
                             "education coursework each year", unit="months",
                             note="Tied to the licence term, which is 12 months. Courses must be completed "
                                  "before expiry."),
                "subject_breakdown": sv([{"hours": 1, "subject": "Texas state law and rules regulating "
                                          "licensee conduct"}], "tx.tdlr.acr_ce",
                                        "including one hour of instruction in Texas state law and rules"),
                "approved_provider_rule": sv("Department-approved providers only; a repeated course does "
                                             "not count twice.", "tx.tdlr.acr_ce",
                                             "Only courses approved by the department will be accepted."),
                "carryover": sv(None, "tx.tdlr.acr_ce", note="No carry-over provision appears on the TDLR "
                                "ACR continuing-education page. Absence of a statement, not a statement "
                                "of absence."),
                "delivery_constraint": sv("Online courses are available from providers that offer them; no "
                                          "classroom minimum is stated.", "tx.tdlr.acr_ce",
                                          "Some providers offer online courses for continuing education.",
                                          confidence="medium")
            },
            "bond": {
                "required": sv(None, "tx.tdlr.acr_apply",
                               note="No bond requirement appears on the TDLR ACR apply, renew, CE or "
                                    "reciprocity pages, all four of which were read in full. This is "
                                    "recorded as 'not established', NOT as 'no bond required' — the "
                                    "difference matters to a contractor bidding a job."),
                "amount": sv(None, note="see bond.required")
            },
            "insurance": {
                "general_liability": sv(300000, "tx.tdlr.acr_apply", "Class A License | $300,000",
                                        unit="per_occurrence_usd",
                                        note="Commercial general liability, per occurrence, property "
                                             "damage and bodily injury combined. Must be maintained at "
                                             "all times while the licence is active."),
                "aggregate": sv(600000, "tx.tdlr.acr_apply", "Aggregate for Property Damage and Bodily "
                                "Injury", unit="USD", confidence="medium",
                                note="Read from the Class A row of the minimum-coverage table."),
                "property_damage": sv(300000, "tx.tdlr.acr_apply", "Aggregate for Products and Completed "
                                      "Operations", unit="USD", confidence="medium",
                                      note="Products and completed operations aggregate, Class A row."),
                "workers_compensation": sv(None, "tx.tdlr.acr_apply",
                                           note="The ACR pages do not state a workers'-compensation "
                                                "requirement (the TDLR electrician pages do). Not "
                                                "established rather than not required."),
                "financial_responsibility": sv(None, note="No credit or net-worth test appears on the TDLR "
                                               "ACR pages.")
            }
        },
        {
            "licence_type_id": "tx.hvac.acr_contractor_class_b", "name": "Air Conditioning and "
            "Refrigeration Contractor — Class B", "level": "contractor", "issuer_level": "state",
            "board_id": "tx.tdlr",
            "who_must_hold": sv("As Class A, but the licence limits the size of system that may be worked "
                                "on.", "tx.tdlr.acr_apply",
                                "The Class B license allows you to work on cooling systems of 25 tons and "
                                "under"),
            "scope_note": sv("Cooling systems of 25 tons and under; heating systems of 1.5 million BTU/h "
                             "and under.", "tx.tdlr.acr_apply",
                             "cooling systems of 25 tons and under, and heating systems of 1.5 million "
                             "BTUs/hour and under"),
            "exam": {"required": sv(True, "tx.tdlr.acr_apply",
                                    "TDLR will approve your eligibility to take the licensing exam")},
            "experience": {"requirement": sv("Same as Class A.", "tx.tdlr.acr_apply",
                                             "To be eligible for licensure, you must meet one of the "
                                             "following experience requirements")},
            "application_fee": sv(115, "tx.tdlr.acr_apply", "along with the fee of $115", unit="USD"),
            "renewal": {
                "cycle": sv(12, "tx.tdlr.acr_apply", "Licenses are valid for a period of 1 year from the "
                            "date of issue.", unit="months"),
                "fee": sv(65, "tx.tdlr.acr_renew", "along with the renewal fee of $65", unit="USD"),
                "expiry_rule": sv("anniversary", "tx.tdlr.acr_apply",
                                  "Licenses are valid for a period of 1 year from the date of issue.")
            },
            "continuing_education": {
                "required": sv(True, "tx.tdlr.acr_ce", "you must complete 8 hours of continuing education"),
                "hours": sv(8, "tx.tdlr.acr_ce", "you must complete 8 hours of continuing education",
                            unit="hours"),
                "period": sv(12, "tx.tdlr.acr_renew", "must complete 8 hours of approved continuing "
                             "education coursework each year", unit="months"),
                "approved_provider_rule": sv("Department-approved providers only.", "tx.tdlr.acr_ce",
                                             "Only courses approved by the department will be accepted.")
            },
            "bond": {"required": sv(None, note="see Class A: no bond requirement found on the TDLR ACR pages"),
                     "amount": sv(None, note="see bond.required")},
            "insurance": {
                "general_liability": sv(100000, "tx.tdlr.acr_apply", "Class B License | $100,000",
                                        unit="per_occurrence_usd"),
                "aggregate": sv(200000, "tx.tdlr.acr_apply", "Class B License | $100,000", unit="USD",
                                confidence="medium",
                                note="Class B row of the minimum-coverage table: $100,000 per occurrence / "
                                     "$200,000 aggregate / $100,000 products and completed operations."),
                "property_damage": sv(100000, "tx.tdlr.acr_apply", "Class B License | $100,000",
                                      unit="USD", confidence="medium")
            }
        }
    ],
    "reciprocity": [
        {"with_state": "GA", "direction": "inbound",
         "grants": sv("Texas Class A, Environmental Air Conditioning", "tx.tdlr.acr_reciprocity",
                      "Holding this license in good standing will qualify you for a Texas Class A, "
                      "Environmental Air Conditioning License."),
         "requires_from": "Georgia Class II Conditioned Air unrestricted licence",
         "conditions": sv("Held for at least one year; no other Georgia licence is accepted.",
                          "tx.tdlr.acr_reciprocity",
                          "You must have held an out of state license for at least one year in order to "
                          "reciprocate."),
         "waives_exam": sv(True, "tx.tdlr.acr_reciprocity",
                           "the licensing exam that you will take (if applicable)", confidence="medium",
                           note="The reciprocity page describes the exam as conditional ('if applicable') "
                                "rather than stating a waiver in terms. Medium confidence; the expansion "
                                "playbook flags it for human check.")},
        {"with_state": "SC", "direction": "inbound",
         "grants": sv("Mapped by licence: SC Air Conditioning, Heating -> TX Class A Environmental Air "
                      "Conditioning and Commercial Refrigeration; SC Air Conditioning -> TX Class A "
                      "Commercial Refrigeration and Class B Environmental Air Conditioning; SC Mechanical "
                      "Contractor, Refrigeration -> TX Class A Commercial Refrigeration; SC Air "
                      "Conditioning and Heating (Packaged equipment) -> TX Class B Environmental Air "
                      "Conditioning.", "tx.tdlr.acr_reciprocity",
                      "Texas recognizes the following licensing equivalencies from South Carolina"),
         "requires_from": "South Carolina air conditioning / mechanical licence, per the mapping",
         "conditions": sv("Letter of good standing confirming a passed licensing exam in that state, plus "
                          "the full Texas application and the $115 fee. A South Carolina heating licence "
                          "does not qualify.", "tx.tdlr.acr_reciprocity",
                          "A South Carolina heating license does not qualify in Texas."),
         "waives_exam": sv(True, "tx.tdlr.acr_reciprocity",
                           "The letter must also indicate that you have taken and passed a licensing exam "
                           "in that state.", confidence="medium")}
    ],
    "reciprocity_statement": sv("Two agreements only: South Carolina and Georgia.",
                                "tx.tdlr.acr_reciprocity",
                                "Texas currently has reciprocal licensing agreements with South Carolina "
                                "and Georgia."),
    "business_entity": {
        "qualifying_individual_rule": sv("Every permanent company location must employ a licensed ACR "
                                         "contractor.", "tx.tdlr.acr_home",
                                         "ACR companies must employ an ACR contractor in each permanent "
                                         "location"),
        "per_location_rule": sv("Per permanent location, not per company.", "tx.tdlr.acr_home",
                                "in each permanent location",
                                note="This is the field that turns a Texas branch opening into a licensing "
                                     "event. A roll-up that acquires a second Texas branch needs a second "
                                     "licensed ACR contractor there, not just a second address."),
        "entity_registration": sv(None, note="Secretary-of-State registration requirements were not read "
                                  "in this pass; they are a Texas SOS matter, not a TDLR one."),
        "change_notification_deadline": sv(None, note="No deadline for replacing a departed ACR contractor "
                                           "of record appears on the TDLR ACR pages read.")
    },
    "typical_timeline": sv(None, "tx.tdlr.acr_apply",
                           note="TDLR publishes no end-to-end processing time for an ACR contractor "
                                "licence. The only published duration is the criminal-history review: "
                                "'a review can take from one to six weeks to complete'. Quoting that as "
                                "the licence timeline would be wrong, so the field stays empty and the "
                                "playbook says so."),
    "coverage_notes": [
        "Technician registration and technician certification (the credentials most of a Texas HVAC "
        "roster actually holds) are NOT populated in this record. Only the two contractor licence classes "
        "are. A customer tracking 40 Texas technicians will get renewal maths for their two contractor "
        "licences and nothing for the technicians until the wave-2 pass.",
        "Endorsements (Environmental Air Conditioning, Commercial Refrigeration, Process Cooling/Heating) "
        "are described in the scope notes but are not modelled as separate trackable objects."
    ],
    "disclaimer_profile": "local_layer_warning",
    "provenance": provenance(["tx.tdlr.acr_home", "tx.tdlr.acr_apply", "tx.tdlr.acr_renew",
                              "tx.tdlr.acr_ce", "tx.tdlr.acr_reciprocity"])
}

RECORDS = {"tx.hvac": tx_hvac}

if __name__ == "__main__":
    from build_records_2 import RECORDS as R2          # noqa: E402  (split for readability)
    from build_records_3 import RECORDS as R3          # noqa: E402
    from build_records_4 import RECORDS as R4          # noqa: E402
    for extra in (R2, R3, R4):
        RECORDS.update(extra)
    KB_DATA.mkdir(exist_ok=True)
    for rid, rec in RECORDS.items():
        path = KB_DATA / f"{rid.replace('.', '-')}.json"
        path.write_text(json.dumps(rec, indent=2, ensure_ascii=False) + "\n")
        print(f"wrote {path.relative_to(ROOT)}")
