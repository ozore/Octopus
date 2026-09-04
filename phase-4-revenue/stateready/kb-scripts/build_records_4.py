"""Records 9 and the three North Carolina records: FL electrical, NC HVAC, NC plumbing, NC electrical."""
from build_records import sv, provenance                                   # noqa: F401

# ------------------------------------------------------------------ FLORIDA · ELECTRICAL
fl_electrical = {
    "record_id": "fl.electrical", "schema_version": "1.0.0", "state": "FL", "state_name": "Florida",
    "trade": "electrical",
    "jurisdiction_model": {
        "level": "state_and_local",
        "summary": sv("Certified (EC) contractors work statewide and may contract for all alarm systems "
                      "and specialty categories. Registered (ER) contractors work only in the cities and "
                      "counties their registration names AND may not contract for any alarm system at all.",
                      "fl.dbpr.electrical",
                      "MAY NOT contract for any alarm system"),
        "local_layer_note": "The alarm-work restriction on registered contractors is a scope cliff, not a "
                            "geography one, and it catches low-voltage work that a mechanical or "
                            "electrical roll-up often assumes is included."
    },
    "boards": [{
        "board_id": "fl.eclb", "name": "Florida Department of Business and Professional Regulation — "
        "Electrical Contractors' Licensing Board",
        "url": "https://www2.myfloridalicense.com/electrical-contractors/",
        "scope": "Electrical contractors, alarm system contractors I and II, electrical and alarm "
                 "specialty contractors",
        "phone": "850.487.1395"
    }],
    "licence_types": [
        {
            "licence_type_id": "fl.electrical.certified_electrical_contractor",
            "name": "Certified Electrical Contractor (EC)", "level": "contractor", "issuer_level": "state",
            "board_id": "fl.eclb",
            "who_must_hold": sv("A person conducting business in the electrical trade who installs, "
                                "repairs, alters, adds to or designs electrical wiring, fixtures, "
                                "appliances, apparatus, raceways and conduit, including plant and "
                                "substation installations, all alarm systems and specialty categories.",
                                "fl.dbpr.electrical",
                                "a person who conducts business in the electrical trade field and who has "
                                "the experience and knowledge install, repair, alter"),
            "scope_note": sv("Statewide, including ALL alarm systems and specialty categories.",
                             "fl.dbpr.electrical",
                             "including the electrical installations and systems within plants and "
                             "substations and ALL alarm systems and specialty categories"),
            "exam": {
                "required": sv(True, "fl.dbpr.eclb_initial",
                               "You must have passed both parts of the State of Florida Electrical "
                               "Contractors exam"),
                "note": "Exam scores expire: they may not be more than three years old on the date of the "
                        "licence application. A contractor who passed the exam and then delayed the "
                        "expansion can be forced to re-sit."
            },
            "experience": {
                "requirement": sv("At least 40% of the qualifying work must be in three-phase services; "
                                  "the applicant must meet one of the experience routes set out in the "
                                  "application instructions.", "fl.dbpr.eclb_initial",
                                  "The required experience must include at least 40% of work that is in "
                                  "3-phase services.",
                                  note="The 40% three-phase test is the field most often missed by "
                                       "residential-heavy applicants. It is a composition test, not a "
                                       "duration test.")
            },
            "application_fee": sv(None, "fl.dbpr.eclb_initial",
                                  note="'Pay the required fee as provided in the application'; the amount "
                                       "is not on the checklist page."),
            "renewal": {
                "cycle": sv(24, "fl.dbpr.electrical", "Licenses expire August 31st every even year.",
                            unit="months"),
                "fee": sv(296, "fl.dbpr.electrical", "| $296", unit="USD",
                          note="From the ECLB renewal-requirements table, Certified Electrical Contractor "
                               "row. Note it is $91 higher than the CILB's $205 for HVAC and plumbing: "
                               "electrical and mechanical licences in the same Florida branch do not cost "
                               "the same to renew."),
                "expiry_rule": sv("fixed_date_parity:08-31:even", "fl.dbpr.electrical",
                                  "Licenses expire August 31st every even year.")
            },
            "continuing_education": {
                "required": sv(True, "fl.dbpr.electrical", "Complete the continuing education requirement"),
                "hours": sv(11, "fl.dbpr.electrical", "11 hours of Continuing Education must include",
                            unit="hours",
                            note="Eleven, not fourteen. An operations manager who standardises on "
                                 "'Florida needs 14 hours' will over-buy for electricians and, worse, "
                                 "will miss the two extra false-alarm hours that apply to alarm work."),
                "period": sv(24, "fl.dbpr.electrical", "Licenses expire August 31st every even year.",
                             unit="months"),
                "subject_breakdown": sv([
                    {"hours": 1, "subject": "workers' compensation"},
                    {"hours": 1, "subject": "workplace safety"},
                    {"hours": 1, "subject": "business practices"},
                    {"hours": 1, "subject": "Florida laws and rules"},
                    {"hours": 1, "subject": "Florida Building Code advanced module"},
                    {"hours": 6, "subject": "technical"},
                    {"hours": 2, "subject": "false alarm prevention — additional, required only for "
                                            "certified electrical contractors who perform alarm work"}
                ], "fl.dbpr.electrical",
                    "Additionally, 2 hours false alarm prevention is required for all certified electrical "
                    "contractors who perform alarm work",
                    note="The false-alarm hours are conditional on the work performed, not on the licence "
                         "class. The rules engine needs a conditional CE rule keyed to a company "
                         "attribute, which is why 'does this company do alarm work' is an onboarding "
                         "question and not a nice-to-have."),
                "approved_provider_rule": sv("Board-approved providers and courses; the ECLB runs its own "
                                             "provider and course approval applications (ECLB 11, ECLB 12).",
                                             "fl.dbpr.electrical",
                                             "Continuing Education Provider Approval (ECLB 11)")
            },
            "bond": {"required": sv(None, "fl.dbpr.eclb_initial",
                                    note="No bond in the ECLB 1 checklist; the financial test is a net "
                                         "worth figure plus credit reports."),
                     "amount": sv(None, note="see bond.required")},
            "insurance": {
                "general_liability": sv(None, "fl.dbpr.eclb_initial",
                                        note="The ECLB 1 checklist does not state liability limits, and "
                                             "rule 61G4-15.003 is a CILB rule that does not list "
                                             "electrical contractors. The ECLB's own insurance rule "
                                             "(chapter 61G6) was not read. Left empty."),
                "financial_responsibility": sv("A personal credit report, plus a business credit report "
                                               "and a business financial statement showing a net worth of "
                                               "at least $10,000.", "fl.dbpr.eclb_initial",
                                               "Business Financial Statement showing a net worth of at "
                                               "least $10,000",
                                               note="A different test from the CILB's FICO 660 rule. Two "
                                                    "Florida boards, two financial gates, one company.")
            }
        },
        {
            "licence_type_id": "fl.electrical.registered_electrical_contractor",
            "name": "Registered Electrical Contractor (ER)", "level": "contractor", "issuer_level": "local",
            "board_id": "fl.eclb",
            "who_must_hold": sv("An electrical contractor who met a local jurisdiction's competency "
                                "requirements and registered for that jurisdiction.", "fl.dbpr.electrical",
                                "an electrical contractor who has registered with the department pursuant "
                                "to fulfilling the competency requirements in the jurisdiction for which "
                                "the registration is issued"),
            "scope_note": sv("Only in the named cities and counties, and no alarm systems at all.",
                             "fl.dbpr.electrical",
                             "MAY NOT contract for any alarm system"),
            "exam": {"required": sv(None, note="Local competency requirement, not a state exam.")},
            "experience": {"requirement": sv(None, note="Set by the local jurisdiction.")},
            "application_fee": sv(None, note="Not published on the checklist page."),
            "renewal": {
                "cycle": sv(24, "fl.dbpr.electrical", "Licenses expire August 31st every even year.",
                            unit="months", confidence="low",
                            note="The ECLB renewal table read in this pass lists expiry for the CERTIFIED "
                                 "classes. Whether Florida registered electrical contractors follow the "
                                 "CILB's odd-year pattern was not confirmed on an ECLB page. LOW "
                                 "confidence and flagged; do not derive an alert from it without a human "
                                 "check."),
                "fee": sv(None, note="Not listed for the registered class in the table read."),
                "expiry_rule": sv(None, note="see renewal.cycle: unresolved for the registered class.")
            },
            "continuing_education": {
                "required": sv(True, "fl.dbpr.electrical", "Complete the continuing education requirement",
                               confidence="medium"),
                "hours": sv(None, note="The renewal table read lists hours by CERTIFIED class. The "
                            "registered-class row was not captured. Left empty rather than assumed equal."),
                "period": sv(None, note="see hours"),
                "approved_provider_rule": sv("Board-approved providers and courses.", "fl.dbpr.electrical",
                                             "Continuing Education Provider Approval (ECLB 11)")
            },
            "bond": {"required": sv(None, note="Local jurisdictions may impose one."),
                     "amount": sv(None, note="see bond.required")},
            "insurance": {"general_liability": sv(None, note="See the certified class: not established.")}
        }
    ],
    "reciprocity": [],
    "reciprocity_statement": sv(None, "fl.dbpr.electrical",
                                note="No reciprocity page was read on the ECLB site in this pass. Note "
                                     "however that North Carolina's electrical board publishes a formal "
                                     "reciprocity agreement WITH Florida, so at least one direction "
                                     "exists; see nc.electrical.reciprocity. Asymmetry like this is "
                                     "exactly why direction is a required field."),
    "business_entity": {
        "qualifying_individual_rule": sv("The certified contractor qualifies the business; additional "
                                         "business entities are qualified on an ECLB 4 application.",
                                         "fl.dbpr.electrical",
                                         "Qualifying an Additional Business Entity (ECLB 4)", confidence="medium"),
        "entity_registration": sv(None, note="Not read in this pass."),
        "per_location_rule": sv(None, note="Not stated."),
        "change_notification_deadline": sv(None, note="Not read in this pass.")
    },
    "typical_timeline": sv(None, "fl.dbpr.eclb_initial",
                           note="Not published. The only time constraint stated is that exam scores may "
                                "not be more than three years old at application."),
    "coverage_notes": [
        "Alarm System Contractor I and II and the registered specialty categories (elevator, utility line, "
        "low voltage, residential, fixtures, signs) are named on the source page and not modelled.",
        "The registered (ER) class carries three low-confidence or empty renewal fields. Any Florida "
        "playbook that touches an ER licence must show the needs-human-check banner."
    ],
    "disclaimer_profile": "unverified_fields_present",
    "provenance": provenance(["fl.dbpr.electrical", "fl.dbpr.eclb_initial", "fl.dbpr.eclb_exam"])
}

# ------------------------------------------------------------- NORTH CAROLINA · shared bits
NC_RENEWAL_EVIDENCE = ("All licenses shall expire on the last day of December in each year "
                       "following their issuance or renewal.")
NC_RENEWAL_EVIDENCE_BOARD = ("All licenses expire on the last day of December in each year following "
                             "their issuance or renewal.")
NC_NO_GRACE = ("Contrary to popular belief, there is NO GRACE PERIOD following the expiration of a "
               "license")

def nc_phfs_licence(lic_id, name, group_note, scope_evidence):
    return {
        "licence_type_id": lic_id, "name": name, "level": "contractor", "issuer_level": "state",
        "board_id": "nc.phfs",
        "who_must_hold": sv(group_note, "nc.phfs.applicant", scope_evidence),
        "exam": {
            "required": sv(True, "nc.phfs.applicant",
                           "All persons desiring to obtain licensure with this Board must meet the "
                           "requirements listed herein and satisfactorily complete the applicable "
                           "examination(s)."),
            "fee": sv(150, "nc.phfs.faq", "The examination application fee is $150.00 and is "
                      "non-refundable.", unit="USD"),
            "note": "The exam must be taken within 90 days of the eligibility notice; a failing candidate "
                    "waits 90 days before retesting; a passing candidate has 45 days to file the License "
                    "Activation Form or must retest. Three separate clocks, all of them alertable."
        },
        "experience": {
            "requirement": sv("2 years (4,000 hours) of on-site full-time experience in the installation, "
                              "maintenance, service or repair of plumbing or heating systems in the "
                              "category sought, whether or not a licence was required for the work.",
                              "nc.phfs.applicant",
                              "an applicant must have 2 years (4,000 hours) on-site full-time experience"),
            "alternatives": sv("Up to one-half (2,000 hours, or 45 quarter / 30 semester hours) may be "
                               "academic or technical training in the same field. Military experience "
                               "counts with a DD214 and supervisor statements. Code-enforcement "
                               "experience does NOT count.", "nc.phfs.applicant",
                               "Certified Code Enforcement Official experience does not meet the "
                               "experience requirements for licensure.")
        },
        "application_fee": sv(150, "nc.phfs.faq", "The examination application fee is $150.00", unit="USD",
                              confidence="medium",
                              note="This is the examination application fee. The separate licence "
                                   "activation fee is not published on the board's site."),
        "renewal": {
            "cycle": sv(12, "nc.gs.87_22", NC_RENEWAL_EVIDENCE, unit="months"),
            "fee": sv(None, "nc.gs.87_22",
                      note="G.S. 87-22 sets a CEILING of $150 for the annual plumbing or heating licence "
                           "fee, not the fee itself, and the board publishes the actual amount only on the "
                           "renewal invoice it mails each September. A ceiling is not a price and is not "
                           "recorded as one."),
            "expiry_rule": sv("fixed_date:12-31", "nc.phfs.renewal", NC_RENEWAL_EVIDENCE_BOARD,
                              note="Every licence in the state expires on the same day. For a contractor "
                                   "with 30 North Carolina licences that is not 30 deadlines, it is one "
                                   "December wall — which changes what a good alert looks like: a single "
                                   "batch task in October, not thirty reminders."),
            "grace_period": sv(0, "nc.phfs.renewal", NC_NO_GRACE, unit="days",
                               note="An explicit zero, stated by the board in capitals, and all licensed "
                                    "activity (bidding, contracting, supervising, installing) must cease "
                                    "on 1 January until renewal."),
            "late_fee": sv(25, "nc.gs.87_22", "the Board shall increase the license fee by twenty", unit="USD",
                           note="Applies on failure to renew during January. A licence unrenewed for three "
                                "years requires re-examination.")
        },
        "continuing_education": {
            "required": sv(False, "nc.phfs.education",
                           "Mandatory Continuing Education was eliminated by the Board in 2012, and is no "
                           "longer required in order to renew licenses annually"),
            "hours": sv(0, "nc.phfs.education",
                        "Mandatory Continuing Education was eliminated by the Board in 2012", unit="hours",
                        note="A positive finding, not a gap. Two North Carolina boards, opposite rules: "
                             "the plumbing/heating board requires none, the electrical board requires "
                             "eight hours a year with half in a classroom. A single 'North Carolina CE' "
                             "rule in a customer's spreadsheet is wrong for one of the two trades."),
            "period": sv(None, note="not applicable"),
            "approved_provider_rule": sv("None: the Board does not approve providers or courses and no "
                                         "hours are reported to it.", "nc.phfs.education",
                                         "The Board does not approve providers or courses and there is no "
                                         "need to report CE hours to the Board.")
        },
        "bond": {"required": sv(None, "nc.phfs.applicant",
                                note="No bond appears on the applicant-information, renewal, education or "
                                     "FAQ pages read."),
                 "amount": sv(None, note="see bond.required")},
        "insurance": {"general_liability": sv(None, "nc.phfs.applicant",
                                              note="No liability-insurance minimum appears on the board "
                                                   "pages read. G.S. ch. 87 art. 2 was read only at "
                                                   "s. 87-22 (fees and renewal); the rest of the article "
                                                   "is in the wave-2 queue.")}
    }

NC_PHFS_BOARD = {
    "board_id": "nc.phfs", "name": "North Carolina State Board of Examiners of Plumbing, Heating and Fire "
    "Sprinkler Contractors", "url": "https://nclicensing.org/",
    "scope": "Plumbing, Heating Groups 1-3, fuel piping and fire sprinkler contractor and technician "
             "licences — 31 licence qualifications in total",
    "phone": "919-875-3612"
}

NC_PHFS_RECIPROCITY_STATEMENT = sv(
    "None. The board states in terms that it has no reciprocity agreement with any state. Two narrower "
    "routes exist: a Technical Examination Waiver Agreement with South Carolina, under which the NC "
    "business law exam must still be passed; and the Neighbor State License Recognition Act for people "
    "who are permanent NC residents AND hold a licence in Georgia, South Carolina, Tennessee, Virginia or "
    "West Virginia.", "nc.phfs.applicant",
    "There are no license reciprocity agreements with any other state.",
    note="Note the residency condition on the Neighbor State route: it is a rule about the PERSON, not "
         "about the company. A Virginia-licensed qualifier who does not move to North Carolina cannot use "
         "it.")

NC_PHFS_BUSINESS = {
    "qualifying_individual_rule": sv(None, "nc.phfs.applicant",
                                     note="The board's licence structure distinguishes licensees from "
                                          "sub-licensees (there is an address-change form for both), but "
                                          "the qualifying-individual rule for a company was not "
                                          "established from the pages read."),
    "entity_registration": sv(None, note="Not read in this pass."),
    "per_location_rule": sv(None, note="Not stated on the pages read."),
    "change_notification_deadline": sv(None, note="Not stated on the pages read.")
}

NC_PHFS_TIMELINE = sv("Renewals are processed within 2-3 business days of receipt, with 3-5 further days "
                      "for the printed licence to arrive.", "nc.phfs.renewal",
                      "Renewals are currently being processed within 2-3 business days of receipt",
                      confidence="medium",
                      note="This is the RENEWAL turnaround, the only duration the board publishes. It is "
                           "not the new-licence timeline, and the playbook must not present it as one.")

NC_PHFS_SOURCES = ["nc.phfs.applicant", "nc.phfs.renewal", "nc.phfs.education", "nc.phfs.faq",
                   "nc.gs.87_22"]

nc_hvac = {
    "record_id": "nc.hvac", "schema_version": "1.0.0", "state": "NC", "state_name": "North Carolina",
    "trade": "hvac",
    "jurisdiction_model": {
        "level": "state_only",
        "summary": sv("HVAC is licensed in North Carolina as 'heating', in three groups, by the same board "
                      "that licenses plumbing. There is no separate HVAC board.", "nc.phfs.applicant",
                      "the Plumbing, Heating Group No. 1, Heating Group No. 2 and/or Heating Group No. 3 "
                      "Contractor examination"),
        "local_layer_note": "Note the cross-board overlap: North Carolina's ELECTRICAL board issues a "
                            "Special Restricted 'Plumbing, Heating and Air Conditioning' licence (SP-PH) "
                            "for the electrical work inside that scope. A North Carolina HVAC company can "
                            "therefore need a licence from each of two boards."
    },
    "boards": [NC_PHFS_BOARD],
    "licence_types": [
        nc_phfs_licence("nc.hvac.heating_group_1", "Heating Contractor — Group No. 1 (H-1)",
                        "A contractor installing, maintaining, servicing or repairing heating systems in "
                        "the Group 1 category.",
                        "an applicant must have 2 years (4,000 hours) on-site full-time experience"),
        nc_phfs_licence("nc.hvac.heating_group_3", "Heating Contractor — Group No. 3 (H-3)",
                        "A contractor in the Group 3 heating category.",
                        "Heating Group No. 2 and/or Heating Group No. 3 Contractor examination")
    ],
    "reciprocity": [
        {"with_state": "SC", "direction": "inbound",
         "grants": sv("A waiver of the NC technical examination only.", "nc.phfs.applicant",
                      "North Carolina does have an Technical Examination Waiver Agreement with South "
                      "Carolina for plumbing and HVAC contractors"),
         "requires_from": "South Carolina plumbing or HVAC contractor licence",
         "conditions": sv("The North Carolina business law exam must still be passed.",
                          "nc.phfs.applicant",
                          "however, applicants must pass the North Carolina business law exam"),
         "waives_exam": sv("technical exam only", "nc.phfs.applicant",
                           "Technical Examination Waiver Agreement with South Carolina")},
    ] + [
        {"with_state": s, "direction": "inbound",
         "grants": sv("Possible eligibility for the equivalent North Carolina licence.",
                      "nc.phfs.applicant",
                      "may be eligible for equivalent licensure in North Carolina"),
         "requires_from": f"current {s} licence",
         "conditions": sv("The applicant must be a current PERMANENT RESIDENT of North Carolina as well as "
                          "holding the neighbouring state's licence.", "nc.phfs.applicant",
                          "Individuals who are currently permanent residents of North Carolina and also "
                          "currently hold licensure in the neighboring states"),
         "waives_exam": sv(None, note="The Act's text was not read; the board page describes eligibility, "
                           "not the exam consequence.")}
        for s in ["GA", "SC", "TN", "VA", "WV"]
    ],
    "reciprocity_statement": NC_PHFS_RECIPROCITY_STATEMENT,
    "business_entity": NC_PHFS_BUSINESS,
    "typical_timeline": NC_PHFS_TIMELINE,
    "coverage_notes": [
        "The board offers 31 licence qualifications. Two heating contractor groups are modelled; Group 2, "
        "the Class I/II technician licences, the state-and-local-government and private-educational "
        "technician licences and fuel piping are not.",
        "Heating Group definitions (what distinguishes Group 1 from 2 from 3) are behind the board's "
        "'Contractor License Definitions' link, which was not fetched. The playbook must not tell a "
        "customer which group they need."
    ],
    "disclaimer_profile": "unverified_fields_present",
    "provenance": provenance(NC_PHFS_SOURCES)
}

nc_plumbing = {
    "record_id": "nc.plumbing", "schema_version": "1.0.0", "state": "NC", "state_name": "North Carolina",
    "trade": "plumbing",
    "jurisdiction_model": {
        "level": "state_only",
        "summary": sv("One state board licenses plumbing contractors; the same board licenses heating and "
                      "fire sprinkler.", "nc.phfs.applicant",
                      "To be eligible to take the Plumbing, Heating Group No. 1, Heating Group No. 2 "
                      "and/or Heating Group No. 3 Contractor examination"),
        "local_layer_note": "Permits and inspections remain municipal; the licence is state-issued."
    },
    "boards": [NC_PHFS_BOARD],
    "licence_types": [
        nc_phfs_licence("nc.plumbing.plumbing_contractor", "Plumbing Contractor",
                        "A contractor installing, maintaining, servicing or repairing plumbing systems.",
                        "Plumbing and/or Heating Contractor License"),
        nc_phfs_licence("nc.plumbing.restricted_limited_plumbing", "Restricted Limited Plumbing Contractor",
                        "A contractor whose plumbing scope is restricted and limited.",
                        "To be eligible to take the Restricted Limited Plumbing Contractor examination")
    ],
    "reciprocity": [
        {"with_state": "SC", "direction": "inbound",
         "grants": sv("A waiver of the NC technical examination only.", "nc.phfs.applicant",
                      "North Carolina does have an Technical Examination Waiver Agreement with South "
                      "Carolina for plumbing and HVAC contractors"),
         "requires_from": "South Carolina plumbing contractor licence",
         "conditions": sv("The North Carolina business law exam must still be passed.", "nc.phfs.applicant",
                          "however, applicants must pass the North Carolina business law exam"),
         "waives_exam": sv("technical exam only", "nc.phfs.applicant",
                           "Technical Examination Waiver Agreement with South Carolina")}
    ] + [
        {"with_state": s, "direction": "inbound",
         "grants": sv("Possible eligibility for the equivalent North Carolina licence.",
                      "nc.phfs.applicant", "may be eligible for equivalent licensure in North Carolina"),
         "requires_from": f"current {s} licence",
         "conditions": sv("Permanent North Carolina residency is required as well as the neighbouring "
                          "state's licence.", "nc.phfs.applicant",
                          "Individuals who are currently permanent residents of North Carolina and also "
                          "currently hold licensure in the neighboring states"),
         "waives_exam": sv(None, note="Act text not read.")}
        for s in ["GA", "SC", "TN", "VA", "WV"]
    ],
    "reciprocity_statement": NC_PHFS_RECIPROCITY_STATEMENT,
    "business_entity": NC_PHFS_BUSINESS,
    "typical_timeline": NC_PHFS_TIMELINE,
    "coverage_notes": [
        "Two of the board's 31 qualifications are modelled. The Plumbing, Heating and Fuel Piping "
        "TECHNICIAN licences — Class I at 18 months / 3,000 hours and Class II at 15 months / 2,500 hours "
        "— are named on the source page but not modelled, and they are what much of a North Carolina "
        "roster holds.",
        "The Residential Fire Sprinkler Installation licence requires an active NC Plumbing Contractor "
        "licence held for two years plus a 16-hour course; that dependency between two licences is real "
        "and is not yet expressed in the schema."
    ],
    "disclaimer_profile": "unverified_fields_present",
    "provenance": provenance(NC_PHFS_SOURCES)
}

# ---------------------------------------------------------- NORTH CAROLINA · ELECTRICAL
def ncbeec_licence(lic_id, name, fee, scope_evidence, scope_text, ce_hours, ce_evidence,
                   bond_required, bond_evidence, fee_evidence):
    return {
        "licence_type_id": lic_id, "name": name, "level": "contractor", "issuer_level": "state",
        "board_id": "nc.ncbeec",
        "who_must_hold": sv("The electrical contracting business, through a listed qualified individual "
                            "who passed the board's examination.", "nc.ncbeec.licensing",
                            "will be the qualified person holding the electrical license"),
        "scope_note": sv(scope_text, "nc.ncbeec.licensing", scope_evidence),
        "exam": {
            "required": sv(True, "nc.ncbeec.licensing",
                           "Apply for and pass the required electrical contracting examination."),
            "fee": sv(125, "nc.ncbeec.fees", "Application & Exam Fee (all classifications)", unit="USD",
                      note="One fee for all classifications; a failed-exam review costs a further $25.")
        },
        "experience": {
            "requirement": sv(None, "nc.ncbeec.examinations",
                              note="The board's examinations page states that experience requirements "
                                   "exist per classification ('only if you meet the experience "
                                   "requirements for the classification') but the numeric requirements "
                                   "are in the Exam Application packet, which was not fetched. Left empty "
                                   "rather than borrowed from a third-party guide.")
        },
        "application_fee": sv(fee, "nc.ncbeec.licensing", fee_evidence, unit="USD",
                              confidence="medium",
                              note="The board publishes one figure per classification and describes it as "
                                   "a per-year licence fee, so the same number is recorded as the "
                                   "application fee and the renewal fee."),
        "renewal": {
            "cycle": sv(12, "nc.ncbeec.licensing",
                        "All licenses issued by the Board will expire one (1) year after the date of "
                        "issuance.", unit="months"),
            "fee": sv(fee, "nc.ncbeec.licensing", fee_evidence, unit="USD", confidence="medium"),
            "expiry_rule": sv("anniversary", "nc.ncbeec.licensing",
                              "All licenses issued by the Board will expire one (1) year after the date of "
                              "issuance.",
                              note="ANNIVERSARY, unlike the NC plumbing/heating board's fixed 31 December. "
                                   "The same company, same state, two boards, two different expiry "
                                   "algorithms. This is the clearest single illustration of why the "
                                   "deadline rule has to be data and not code."),
            "late_fee": sv(25, "nc.ncbeec.licensing",
                           "An administrative fee of $25.00 shall be imposed on all renewals received "
                           "after the license expiration date.", unit="USD")
        },
        "continuing_education": {
            "required": sv(True, "nc.ncbeec.ce",
                           "shall complete continuing education for each annual license period to renew "
                           "the license"),
            "hours": sv(ce_hours, "nc.ncbeec.ce", ce_evidence, unit="hours"),
            "period": sv(12, "nc.ncbeec.ce", "for each annual license period", unit="months",
                         note="The CE licence period runs 1 July to 30 June, which is NOT the licence's "
                              "own anniversary year. Two different twelve-month windows per licence."),
            "approved_provider_rule": sv("Board-approved sponsors and instructors only; sponsors must "
                                         "apply by 1 March of the year before the July-June licence "
                                         "period in which the course runs.", "nc.ncbeec.ce",
                                         "Interested parties must submit applications to the Board by "
                                         "March 1 of the year prior to the license period"),
            "carryover": sv("Hours in excess of the requirement may be carried forward into the following "
                            "one or two licence periods.", "nc.ncbeec.ce",
                            "the extra hours may be carried forward in multiples as specified in .1104(a)"),
            "delivery_constraint": sv("At least half the hours must be earned by in-person classroom or "
                                      "seminar attendance.", "nc.ncbeec.ce",
                                      "a minimum of one-half the continuing education hours for each "
                                      "annual license period were obtained by in-person classroom",
                                      note="A live-attendance floor. Any product that only tracks an "
                                           "hours total will report a compliant technician who is not.")
        },
        "bond": {
            "required": sv(bond_required, "nc.ncbeec.licensing", bond_evidence),
            "amount": sv(None, "nc.ncbeec.licensing",
                         note="What the board requires is a STATEMENT OF BONDING ABILITY, not a bond in a "
                              "stated amount. Recording a dollar figure here would be a fabrication."),
            "alternative": sv(None, note="Not stated.")
        },
        "insurance": {"general_liability": sv(None, "nc.ncbeec.licensing",
                                              note="No liability-insurance minimum appears on the "
                                                   "licensing or fees pages read.")}
    }

nc_electrical = {
    "record_id": "nc.electrical", "schema_version": "1.0.0", "state": "NC",
    "state_name": "North Carolina", "trade": "electrical",
    "jurisdiction_model": {
        "level": "state_only",
        "summary": sv("A single state board licenses electrical contracting in ten classifications, three "
                      "by project value and seven special-restricted by type of work.",
                      "nc.ncbeec.licensing",
                      "There are 10 different classifications of electrical contracting licenses."),
        "local_layer_note": "The classification is bounded by PROJECT VALUE, not by geography: Limited is "
                            "capped at a single project of $60,000 and 600 volts, Intermediate at "
                            "$150,000, Unlimited is uncapped. A contractor can therefore be correctly "
                            "licensed and still be unable to bid the job in front of them — a licensing "
                            "constraint that behaves like a commercial one."
    },
    "boards": [{
        "board_id": "nc.ncbeec", "name": "North Carolina State Board of Examiners of Electrical Contractors",
        "url": "https://www.ncbeec.org/",
        "scope": "All electrical contracting licences in North Carolina, ten classifications",
        "phone": "(919) 733-9042"
    }],
    "licence_types": [
        ncbeec_licence("nc.electrical.unlimited", "Unlimited License (U)", 200,
                       "The Unlimited ( U ) license allows the licensee to engage in any electrical "
                       "contracting project regardless of value.",
                       "Any electrical contracting project regardless of value.", 8,
                       "8-hours CE Required", True,
                       "A statement of bonding ability is required to activate a license in both the "
                       "Intermediate and Unlimited classifications.",
                       "Unlimited License - $200/year"),
        ncbeec_licence("nc.electrical.intermediate", "Intermediate License (I)", 150,
                       "electrical contracting project of a value not in excess of one hundred fifty "
                       "thousand dollars ($150,000)",
                       "A single project not exceeding $150,000.", 8, "8-hours CE Required", True,
                       "A statement of bonding ability is required to activate a license in both the "
                       "Intermediate and Unlimited classifications.",
                       "Intermediate License - $150/year"),
        ncbeec_licence("nc.electrical.limited", "Limited License (L)", 100,
                       "contracting project of a value not in excess of sixty thousand dollars ($60,000)",
                       "A single project not exceeding $60,000, rated at not more than 600 volts.", 8,
                       "8-hours CE Required", None,
                       "A statement of bonding ability is required to activate a license in both the "
                       "Intermediate and Unlimited classifications.",
                       "Limited License - $100/year"),
        ncbeec_licence("nc.electrical.sp_ph", "Special Restricted — Plumbing, Heating and Air "
                       "Conditioning License (SP-PH)", 100,
                       "Plumbing, Heating and Air Conditioning License",
                       "The electrical work within plumbing, heating and air-conditioning scope only.", 4,
                       "4-hours CE Required", None,
                       "A statement of bonding ability is required to activate a license in both the "
                       "Intermediate and Unlimited classifications.",
                       "Special Restricted Licenses - $100/year")
    ],
    "reciprocity": [
        {"with_state": s, "direction": "inbound",
         "grants": sv("A North Carolina electrical contracting licence of the same or equivalent "
                      "classification, without written examination.", "nc.ncbeec.reciprocity",
                      "may obtain a North Carolina electrical contracting license without written "
                      "examinations"),
         "requires_from": f"a licence issued by the {s} contractor licensing board",
         "conditions": sv("Eligibility and the application packet are published per state on the board's "
                          "own per-state reciprocity pages, which were not individually fetched in this "
                          "pass.", "nc.ncbeec.reciprocity",
                          "Click on the state name for detailed information about eligibility and "
                          "application packets.", confidence="medium"),
         "waives_exam": sv(True, "nc.ncbeec.reciprocity",
                           "without written examinations")}
        for s in ["AL", "FL", "GA", "MS", "OH", "SC", "TN", "TX", "VA", "WV"]
    ],
    "reciprocity_statement": sv("Ten formal agreements — Alabama, Florida, Georgia, Mississippi, Ohio, "
                                "South Carolina, Tennessee, Texas, Virginia and West Virginia — made "
                                "under G.S. 87-50, plus a separate NASCLA-qualified route.",
                                "nc.ncbeec.reciprocity",
                                "The Board has entered into formal reciprocal licensing agreements with "
                                "contractor licensing boards of several states",
                                note="Compare tx.electrical: Texas lists North Carolina as an inbound "
                                     "master-electrician source, and North Carolina lists Texas. That "
                                     "pair happens to be mutual; most are not, which is the whole reason "
                                     "the expansion playbook is worth $750 to $1,500."),
    "business_entity": {
        "qualifying_individual_rule": sv("The licence is held in the business's name with a listed "
                                         "Qualified Individual; adding or removing one requires a "
                                         "Request to Add/Remove a Qualified Individual and produces a new "
                                         "certificate.", "nc.ncbeec.licensing",
                                         "To add or remove a qualified individual to your license, you "
                                         "must complete and submit a Request to Add/Remove a Qualified "
                                         "Individual form."),
        "entity_registration": sv("Incorporating requires filing articles of incorporation, articles of "
                                  "organization or a certificate of authority showing registration with "
                                  "the NC Secretary of State, and the licence is reissued.",
                                  "nc.ncbeec.licensing",
                                  "If you incorporate your business, you must submit a copy of your "
                                  "articles of incorporation"),
        "per_location_rule": sv(None, note="Not stated; the constraint is on the name and the qualified "
                                "individual, not on locations."),
        "change_notification_deadline": sv(30, "nc.ncbeec.licensing",
                                           "Notification of any change should be filed with the Board "
                                           "within 30-days.", unit="days",
                                           note="Applies to address and contact changes. A name change is "
                                                "worse than a notification: it reissues the licence and "
                                                "MOVES THE EXPIRATION DATE, so a post-acquisition rebrand "
                                                "silently resets every renewal deadline the customer has "
                                                "in their calendar.")
    },
    "typical_timeline": sv(None, "nc.ncbeec.examinations",
                           note="No end-to-end processing time is published. The board states only that a "
                                "failed candidate may reapply immediately in an alternate classification "
                                "if they meet its experience requirement."),
    "coverage_notes": [
        "Four of the ten classifications are modelled: Unlimited, Intermediate, Limited and the "
        "Special Restricted SP-PH. The other six special-restricted classes (SFD, FA/LV, SP, WP, ES, EL) "
        "share the $100 fee and the 4-hour CE rule but are not written out.",
        "Per-state reciprocity detail pages (ten of them) were not fetched; only the agreement's existence "
        "and the no-written-exam term are recorded. A playbook quoting a specific inbound route must open "
        "the relevant page.",
        "Numeric experience requirements per classification live in the Exam Application packet, which was "
        "not fetched. Every experience field in this record is empty on purpose."
    ],
    "disclaimer_profile": "unverified_fields_present",
    "provenance": provenance(["nc.ncbeec.licensing", "nc.ncbeec.fees", "nc.ncbeec.ce",
                              "nc.ncbeec.reciprocity", "nc.ncbeec.examinations"])
}

RECORDS = {"fl.electrical": fl_electrical, "nc.hvac": nc_hvac, "nc.plumbing": nc_plumbing,
           "nc.electrical": nc_electrical}
