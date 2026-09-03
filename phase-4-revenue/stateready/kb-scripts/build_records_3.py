"""Records 6-8: Florida HVAC, Florida plumbing, Florida electrical."""
from build_records import sv, provenance                                   # noqa: F401

FL_JURISDICTION = (
    "Two tiers. A CERTIFIED contractor (occupation code beginning C) may contract anywhere in Florida "
    "without meeting local competency requirements. A REGISTERED contractor (code beginning R) may "
    "contract only in the cities and counties their registration names. Same trade, same board, "
    "completely different geographic scope and a different renewal year."
)

fl_common_ce_note = (
    "Florida's 14 hours are six separate mandates, not a total. A licence holder who takes 14 hours of "
    "general construction CE has still failed to renew. The rules engine must therefore track CE by "
    "SUBJECT, not by an hours counter."
)

# ------------------------------------------------------------------------ FLORIDA · HVAC
fl_hvac = {
    "record_id": "fl.hvac", "schema_version": "1.0.0", "state": "FL", "state_name": "Florida",
    "trade": "hvac",
    "jurisdiction_model": {
        "level": "state_and_local",
        "summary": sv(FL_JURISDICTION, "fl.dbpr.construction",
                      "Registered contractors may contract only in such jurisdictions."),
        "local_layer_note": "A registered contractor entering a new Florida county is doing a licensing "
                            "project, not a paperwork update. This is the single most common Florida "
                            "surprise for an out-of-state buyer, and it is why the Florida playbook opens "
                            "with the certified-versus-registered decision rather than with fees."
    },
    "boards": [{
        "board_id": "fl.cilb", "name": "Florida Department of Business and Professional Regulation — "
        "Construction Industry Licensing Board",
        "url": "https://www2.myfloridalicense.com/construction-industry/",
        "scope": "Air conditioning (Class A/B/C), mechanical, plumbing, roofing, sheet metal, general, "
                 "building, residential, pool and specialty contractors",
        "phone": "850.487.1395"
    }],
    "licence_types": [
        {
            "licence_type_id": "fl.hvac.certified_class_a_ac",
            "name": "Certified Class A Air-Conditioning Contractor (CA)", "level": "contractor",
            "issuer_level": "state", "board_id": "fl.cilb",
            "who_must_hold": sv("A contractor installing, maintaining, repairing, fabricating, altering, "
                                "extending or designing central air-conditioning, refrigeration, heating "
                                "and ventilating systems anywhere in Florida.", "fl.dbpr.construction",
                                "a contractor whose services are unlimited in the execution of contracts "
                                "requiring the experience, knowledge, and skill to install"),
            "scope_note": sv("Unlimited as to system size. May not do LP or natural gas fuel lines inside "
                             "buildings, potable water lines or connections, sanitary sewer lines, pool "
                             "piping and filters, or electrical power wiring.", "fl.dbpr.construction",
                             "shall not perform any work such as liquefied petroleum or natural gas fuel "
                             "lines within buildings"),
            "exam": {
                "required": sv(True, "fl.dbpr.cilb_ac_checklist",
                               "must first take and pass a state certification examination"),
                "fee": sv(None, note="The examination fee is not printed on the DBPR checklist page; it is "
                          "set in the application and by the exam vendor. Not guessed.")
            },
            "experience": {
                "requirement": sv("Four years of experience, or a combination of college and experience.",
                                  "fl.dbpr.cilb_ac_checklist",
                                  "Applicants are required to have four years of experience or a "
                                  "combination of college and experience.",
                                  note="The checklist states expressly that this is not the complete list; "
                                       "the application instruction pages govern. Confidence high on the "
                                       "four years, low on completeness."),
                "alternatives": sv("Military experience may be counted, with a Military Service "
                                   "Verification Form.", "fl.dbpr.cilb_ac_checklist",
                                   "Experience gained in the military may be used toward the requirements "
                                   "for licensure.")
            },
            "application_fee": sv(None, "fl.dbpr.cilb_ac_checklist",
                                  note="DBPR's checklist says only 'Pay the required fee as provided in "
                                       "the application'. The CILB 5-G/5-H PDF is an image form with no "
                                       "extractable fee text, and rule 61G4-12.011 turned out to be "
                                       "Definitions rather than Fees. Two attempts, then stopped. Left "
                                       "empty rather than carrying over a third-party guide's number."),
            "renewal": {
                "cycle": sv(24, "fl.dbpr.construction", "Licenses expire August 31st every even year.",
                            unit="months"),
                "fee": sv(205, "fl.dbpr.construction", "$205 (+$50 per qualified business)", unit="USD",
                          note="The +$50 per qualified business is not optional for a roll-up: a qualifier "
                               "who qualifies six acquired entities pays $205 + 6 x $50."),
                "expiry_rule": sv("fixed_date_parity:08-31:even", "fl.dbpr.construction",
                                  "Licenses expire August 31st every even year.",
                                  note="Certified licences expire 31 August of EVEN years; registered "
                                       "licences 31 August of ODD years. Two contractors in the same "
                                       "Florida branch, same trade, can be a year apart. The engine needs "
                                       "a parity parameter, not just a month and day."),
                "grace_period": sv(None, note="Not stated on the DBPR page; delinquent and null-and-void "
                                   "paths exist but were not read in this pass.")
            },
            "continuing_education": {
                "required": sv(True, "fl.dbpr.construction",
                               "Complete the continuing education requirement"),
                "hours": sv(14, "fl.dbpr.construction", "14 hours of CE", unit="hours"),
                "period": sv(24, "fl.dbpr.construction", "Licenses expire August 31st every even year.",
                             unit="months"),
                "subject_breakdown": sv([
                    {"hours": 1, "subject": "specialized or advanced module"},
                    {"hours": 1, "subject": "workplace safety"},
                    {"hours": 1, "subject": "business practices"},
                    {"hours": 1, "subject": "workers' compensation"},
                    {"hours": 1, "subject": "laws and rules"},
                    {"hours": 9, "subject": "any board-approved construction-related instruction"}
                ], "fl.dbpr.construction",
                    "minimum of 1 hour specialized or advanced module, 1 hour workplace safety, 1 hour "
                    "business practices, 1 hour workers' compensation, 1 hour laws and rules",
                    note=fl_common_ce_note),
                "approved_provider_rule": sv("The Board must approve the provider before it may offer "
                                             "courses, and must separately approve every course before it "
                                             "is advertised for credit.", "fl.dbpr.construction",
                                             "The Board must approve the provider before they can begin "
                                             "offering courses for continuing education credit")
            },
            "bond": {
                "required": sv(None, "fl.dbpr.fin_resp",
                               note="The CILB's current Financial Responsibility and Stability sheet sets "
                                    "out a credit-score test and a 14-hour course, and names no bond. "
                                    "Recorded as not established rather than not required, because bond "
                                    "requirements have existed in this programme historically."),
                "amount": sv(None, note="see bond.required")
            },
            "insurance": {
                "general_liability": sv(100000, "fl.far.61g4_15_003",
                                        "Air Conditioning 100,000 25,000", unit="USD",
                                        note="Rule 61G4-15.003 F.A.C., aggregate public liability for an "
                                             "Air Conditioning Contractor. Read from the adopted rule "
                                             "text, not from the board's guidance, so this is a Tier-B "
                                             "source; the board's own pages state only 'amounts "
                                             "determined by Board rule'."),
                "property_damage": sv(25000, "fl.far.61g4_15_003", "Air Conditioning 100,000 25,000",
                                      unit="USD"),
                "workers_compensation": sv("Coverage or an exemption must be obtained within 30 days of "
                                           "licence issuance.", "fl.dbpr.cilb_ac_checklist",
                                           "obtain an exemption from workers compensation insurance within "
                                           "30 days of issuance of their license",
                                           note="A 30-day post-issuance deadline, i.e. another event-"
                                                "triggered clock the alert engine must own."),
                "financial_responsibility": sv("FICO-derived credit score of 660 or higher, no unsatisfied "
                                               "liens and no unsatisfied judgments against the applicant "
                                               "or the company; below 660 a board-approved 14-hour "
                                               "Financial Responsibility course is required. A personal "
                                               "AND a business credit report must be filed.",
                                               "fl.dbpr.fin_resp",
                                               "If applicant's credit score is under 660 then the "
                                               "applicant must take a board approved 14-hour Financial "
                                               "Responsibility Course")
            }
        },
        {
            "licence_type_id": "fl.hvac.certified_class_b_ac",
            "name": "Certified Class B Air-Conditioning Contractor (CA)", "level": "contractor",
            "issuer_level": "state", "board_id": "fl.cilb",
            "who_must_hold": sv("As Class A, within the size limit.", "fl.dbpr.construction",
                                "a contractor whose services are limited to 25 tons of cooling and 500,000 "
                                "BTU of heating in any one system"),
            "scope_note": sv("25 tons of cooling and 500,000 BTU of heating in any one system.",
                             "fl.dbpr.construction",
                             "limited to 25 tons of cooling and 500,000 BTU of heating in any one system",
                             note="Note the divergence from Texas, where the Class B ceiling is 25 tons "
                                  "and 1.5 million BTU/h. Same words, different numbers: exactly the kind "
                                  "of thing a multi-state operations manager assumes transfers."),
            "exam": {"required": sv(True, "fl.dbpr.cilb_ac_checklist",
                                    "must first take and pass a state certification examination")},
            "experience": {"requirement": sv("Four years of experience, or a combination of college and "
                                             "experience.", "fl.dbpr.cilb_ac_checklist",
                                             "Applicants are required to have four years of experience")},
            "application_fee": sv(None, note="see Class A: not published on the checklist page."),
            "renewal": {
                "cycle": sv(24, "fl.dbpr.construction", "Licenses expire August 31st every even year.",
                            unit="months"),
                "fee": sv(205, "fl.dbpr.construction", "$205 (+$50 per qualified business)", unit="USD"),
                "expiry_rule": sv("fixed_date_parity:08-31:even", "fl.dbpr.construction",
                                  "Licenses expire August 31st every even year.")
            },
            "continuing_education": {
                "required": sv(True, "fl.dbpr.construction", "Complete the continuing education requirement"),
                "hours": sv(14, "fl.dbpr.construction", "14 hours of CE", unit="hours"),
                "period": sv(24, "fl.dbpr.construction", "Licenses expire August 31st every even year.",
                             unit="months"),
                "approved_provider_rule": sv("Board-approved provider and board-approved course.",
                                             "fl.dbpr.construction",
                                             "the Board must approve all courses before those courses can "
                                             "be advertised/offered for continuing education credit")
            },
            "bond": {"required": sv(None, note="see Class A"), "amount": sv(None, note="see bond.required")},
            "insurance": {
                "general_liability": sv(100000, "fl.far.61g4_15_003", "Air Conditioning 100,000 25,000",
                                        unit="USD"),
                "property_damage": sv(25000, "fl.far.61g4_15_003", "Air Conditioning 100,000 25,000",
                                      unit="USD")
            }
        },
        {
            "licence_type_id": "fl.hvac.registered_ac",
            "name": "Registered Air Conditioning Contractor (RA)", "level": "contractor",
            "issuer_level": "local", "board_id": "fl.cilb",
            "who_must_hold": sv("A contractor who has met a local jurisdiction's competency requirements "
                                "and registered with the department for that jurisdiction only.",
                                "fl.dbpr.construction",
                                "any contractor who has registered with the department pursuant to "
                                "fulfilling the competency requirements in the jurisdiction for which the "
                                "registration is issued"),
            "scope_note": sv("Only in the jurisdictions the registration names.", "fl.dbpr.construction",
                             "Registered contractors may contract only in such jurisdictions."),
            "exam": {"required": sv(None, note="Competency is established locally, so the exam question "
                                    "belongs to the city or county, not to DBPR. Not modelled.")},
            "experience": {"requirement": sv(None, note="Set by the local jurisdiction.")},
            "application_fee": sv(None, note="Not published on the checklist page."),
            "renewal": {
                "cycle": sv(24, "fl.dbpr.construction", "Licenses expire August 31st every odd year.",
                            unit="months"),
                "fee": sv(205, "fl.dbpr.construction", "$205 (+$50 per qualified business)", unit="USD"),
                "expiry_rule": sv("fixed_date_parity:08-31:odd", "fl.dbpr.construction",
                                  "Licenses expire August 31st every odd year.",
                                  note="ODD years, one year offset from certified licences.")
            },
            "continuing_education": {
                "required": sv(True, "fl.dbpr.construction", "Complete the continuing education requirement"),
                "hours": sv(14, "fl.dbpr.construction", "14 hours of CE", unit="hours"),
                "period": sv(24, "fl.dbpr.construction", "Licenses expire August 31st every odd year.",
                             unit="months"),
                "approved_provider_rule": sv("Board-approved provider and course.", "fl.dbpr.construction",
                                             "The Board must approve the provider before they can begin "
                                             "offering courses for continuing education credit")
            },
            "bond": {"required": sv(None, note="Local jurisdictions commonly impose their own bond; not "
                                    "modelled at state level."),
                     "amount": sv(None, note="see bond.required")},
            "insurance": {
                "general_liability": sv(100000, "fl.far.61g4_15_003", "Air Conditioning 100,000 25,000",
                                        unit="USD",
                                        note="Rule 61G4-15.003 applies to certificates AND registrations.")
            }
        }
    ],
    "reciprocity": [],
    "reciprocity_statement": sv(None, "fl.dbpr.construction",
                                note="The CILB page carries two links, 'Reciprocity and Substantially "
                                     "Equivalent Exams' and 'Endorsement and Substantially Equivalent "
                                     "Exams', which were not fetched in this pass. Recording an empty "
                                     "reciprocity list as if it meant 'no agreements' would be a lie; the "
                                     "field is explicitly unknown and the playbook says the two documents "
                                     "must be read before an expansion into Florida is quoted."),
    "business_entity": {
        "qualifying_individual_rule": sv("An individual licence may qualify a business; additional "
                                         "businesses are qualified through separate CILB 7 or CILB 9 "
                                         "applications, and each qualified business adds $50 to the "
                                         "renewal.", "fl.dbpr.construction",
                                         "$205 (+$50 per qualified business)", confidence="medium",
                                         note="Inferred from the renewal fee structure plus the existence "
                                              "of the 'Qualifying an Additional Business' application "
                                              "family. Medium confidence."),
        "entity_registration": sv(None, note="Florida Division of Corporations registration was not read."),
        "per_location_rule": sv(None, note="Not stated; Florida's geography constraint is on the "
                                "registration, not on locations."),
        "change_notification_deadline": sv(None, note="Not read in this pass.")
    },
    "typical_timeline": sv(None, "fl.dbpr.cilb_ac_checklist",
                           note="DBPR publishes no processing time. The only published duration is that "
                                "fingerprint results may take up to five days to reach the department "
                                "after submission to FDLE."),
    "coverage_notes": [
        "Class C air-conditioning contractor is closed to new entrants (nobody not already registered or "
        "certified on 1 October 1988 may hold one) and is not modelled.",
        "Mechanical Contractor (CM/RM) overlaps the HVAC scope and is a real alternative route in Florida; "
        "it is described on the same source page but is not modelled as a separate licence type here.",
        "The registered (R) tier is modelled only at state level. The actual competency requirements sit "
        "with each city and county and are out of launch scope."
    ],
    "disclaimer_profile": "local_layer_warning",
    "provenance": provenance(["fl.dbpr.construction", "fl.dbpr.cilb_ac_checklist", "fl.dbpr.fin_resp",
                              "fl.far.61g4_15_003"])
}

# -------------------------------------------------------------------- FLORIDA · PLUMBING
fl_plumbing = {
    "record_id": "fl.plumbing", "schema_version": "1.0.0", "state": "FL", "state_name": "Florida",
    "trade": "plumbing",
    "jurisdiction_model": {
        "level": "state_and_local",
        "summary": sv(FL_JURISDICTION, "fl.dbpr.construction",
                      "Registered contractors may contract only in such jurisdictions."),
        "local_layer_note": "Florida's plumbing scope is written to override local licensing for the named "
                            "work: a plumbing contractor may do sanitary and storm drainage, venting, "
                            "water supply, septic tanks and wells 'without obtaining any additional local "
                            "regulatory license, certificate, or registration'. That is a rare and "
                            "valuable pre-emption and belongs at the top of a Florida plumbing playbook."
    },
    "boards": [{
        "board_id": "fl.cilb", "name": "Florida Department of Business and Professional Regulation — "
        "Construction Industry Licensing Board",
        "url": "https://www2.myfloridalicense.com/construction-industry/",
        "scope": "Plumbing contractor (CF certified / RF registered) among other construction trades",
        "phone": "850.487.1395"
    }],
    "licence_types": [
        {
            "licence_type_id": "fl.plumbing.certified_plumbing_contractor",
            "name": "Certified Plumbing Contractor (CF)", "level": "contractor", "issuer_level": "state",
            "board_id": "fl.cilb",
            "who_must_hold": sv("A contractor installing, maintaining, repairing, altering, extending or "
                                "designing plumbing anywhere in Florida.", "fl.dbpr.construction",
                                "a contractor whose contracting business consists of the execution of "
                                "contracts requiring the experience, financial means, knowledge, and skill "
                                "to install, maintain, repair, alter, extend"),
            "scope_note": sv("Sanitary and storm drainage, venting systems, public or private water supply "
                             "systems, septic tanks, drainage and supply wells — without any additional "
                             "local licence, certificate or registration.", "fl.dbpr.construction",
                             "without obtaining any additional local regulatory license, certificate, or "
                             "registration"),
            "exam": {"required": sv(True, "fl.dbpr.cilb_plumb_checklist",
                                    "must first take and pass a state certification examination")},
            "experience": {
                "requirement": sv("Four years of experience, or a combination of college and experience.",
                                  "fl.dbpr.cilb_plumb_checklist",
                                  "Applicants are required to have four years of experience or a "
                                  "combination of college and experience."),
                "alternatives": sv("Military experience may be counted.", "fl.dbpr.cilb_plumb_checklist",
                                   "Experience gained in the military may be used toward the requirements "
                                   "for licensure.")
            },
            "application_fee": sv(None, "fl.dbpr.cilb_plumb_checklist",
                                  note="Not published on the checklist page; see fl.hvac for the two "
                                       "attempts made and abandoned."),
            "renewal": {
                "cycle": sv(24, "fl.dbpr.construction", "Licenses expire August 31st every even year.",
                            unit="months"),
                "fee": sv(205, "fl.dbpr.construction", "$205 (+$50 per qualified business)", unit="USD"),
                "expiry_rule": sv("fixed_date_parity:08-31:even", "fl.dbpr.construction",
                                  "Licenses expire August 31st every even year.")
            },
            "continuing_education": {
                "required": sv(True, "fl.dbpr.construction", "Complete the continuing education requirement"),
                "hours": sv(14, "fl.dbpr.construction", "14 hours of CE", unit="hours"),
                "period": sv(24, "fl.dbpr.construction", "Licenses expire August 31st every even year.",
                             unit="months"),
                "subject_breakdown": sv([
                    {"hours": 1, "subject": "specialized or advanced module"},
                    {"hours": 1, "subject": "workplace safety"},
                    {"hours": 1, "subject": "business practices"},
                    {"hours": 1, "subject": "workers' compensation"},
                    {"hours": 1, "subject": "laws and rules"},
                    {"hours": 9, "subject": "any board-approved construction-related instruction"}
                ], "fl.dbpr.construction",
                    "minimum of 1 hour specialized or advanced module, 1 hour workplace safety, 1 hour "
                    "business practices, 1 hour workers' compensation, 1 hour laws and rules",
                    note=fl_common_ce_note),
                "approved_provider_rule": sv("Board-approved provider and board-approved course.",
                                             "fl.dbpr.construction",
                                             "The Board must approve the provider before they can begin "
                                             "offering courses for continuing education credit")
            },
            "bond": {"required": sv(None, "fl.dbpr.fin_resp",
                                    note="No bond in the current CILB financial responsibility sheet."),
                     "amount": sv(None, note="see bond.required")},
            "insurance": {
                "general_liability": sv(100000, "fl.far.61g4_15_003", "Plumbing Contractor 100,000 25,000",
                                        unit="USD"),
                "property_damage": sv(25000, "fl.far.61g4_15_003", "Plumbing Contractor 100,000 25,000",
                                      unit="USD"),
                "workers_compensation": sv("Coverage or an exemption within 30 days of licence issuance.",
                                           "fl.dbpr.cilb_plumb_checklist",
                                           "obtain an exemption from workers compensation insurance within "
                                           "30 days of issuance of their license"),
                "financial_responsibility": sv("FICO 660 or higher, no unsatisfied liens or judgments; "
                                               "below 660, a 14-hour board-approved Financial "
                                               "Responsibility course.", "fl.dbpr.fin_resp",
                                               "Applicant has a 660 FICO derived credit score or higher")
            }
        },
        {
            "licence_type_id": "fl.plumbing.registered_plumbing_contractor",
            "name": "Registered Plumbing Contractor (RF)", "level": "contractor", "issuer_level": "local",
            "board_id": "fl.cilb",
            "who_must_hold": sv("A plumbing contractor who met a local jurisdiction's competency "
                                "requirements and registered for that jurisdiction only.",
                                "fl.dbpr.construction",
                                "Registered contractors may contract only in such jurisdictions."),
            "scope_note": sv("Plumbing scope, limited to the named jurisdictions.", "fl.dbpr.construction",
                             "Registered contractors are designated by an occupation code which begins "
                             "with the letter"),
            "exam": {"required": sv(None, note="Local competency; not a DBPR exam.")},
            "experience": {"requirement": sv(None, note="Set by the local jurisdiction.")},
            "application_fee": sv(None, note="Not published on the checklist page."),
            "renewal": {
                "cycle": sv(24, "fl.dbpr.construction", "Licenses expire August 31st every odd year.",
                            unit="months"),
                "fee": sv(205, "fl.dbpr.construction", "$205 (+$50 per qualified business)", unit="USD"),
                "expiry_rule": sv("fixed_date_parity:08-31:odd", "fl.dbpr.construction",
                                  "Licenses expire August 31st every odd year.")
            },
            "continuing_education": {
                "required": sv(True, "fl.dbpr.construction", "Complete the continuing education requirement"),
                "hours": sv(14, "fl.dbpr.construction", "14 hours of CE", unit="hours"),
                "period": sv(24, "fl.dbpr.construction", "Licenses expire August 31st every odd year.",
                             unit="months"),
                "approved_provider_rule": sv("Board-approved provider and course.", "fl.dbpr.construction",
                                             "The Board must approve the provider before they can begin "
                                             "offering courses for continuing education credit")
            },
            "bond": {"required": sv(None, note="Local jurisdictions may impose one."),
                     "amount": sv(None, note="see bond.required")},
            "insurance": {"general_liability": sv(100000, "fl.far.61g4_15_003",
                                                  "Plumbing Contractor 100,000 25,000", unit="USD")}
        }
    ],
    "reciprocity": [],
    "reciprocity_statement": sv(None, "fl.dbpr.construction",
                                note="Same gap as fl.hvac: the CILB's 'Reciprocity and Substantially "
                                     "Equivalent Exams' and 'Endorsement' documents were not fetched."),
    "business_entity": {
        "qualifying_individual_rule": sv("An individual licence qualifies a business; each additional "
                                         "qualified business costs $50 at renewal.", "fl.dbpr.construction",
                                         "$205 (+$50 per qualified business)", confidence="medium"),
        "entity_registration": sv(None, note="Not read in this pass."),
        "per_location_rule": sv(None, note="Not stated."),
        "change_notification_deadline": sv(None, note="Not read in this pass.")
    },
    "typical_timeline": sv(None, "fl.dbpr.cilb_plumb_checklist",
                           note="No processing time published; only the five-day FDLE fingerprint window."),
    "coverage_notes": [
        "Specialty plumbing categories and the Underground Utility and Excavation Contractor licence, "
        "which overlaps plumbing scope in Florida, are not modelled.",
        "The registered (R) tier is modelled at state level only; the local competency requirements are "
        "out of launch scope."
    ],
    "disclaimer_profile": "local_layer_warning",
    "provenance": provenance(["fl.dbpr.construction", "fl.dbpr.cilb_plumb_checklist", "fl.dbpr.fin_resp",
                              "fl.far.61g4_15_003"])
}

RECORDS = {"fl.hvac": fl_hvac, "fl.plumbing": fl_plumbing}
