"""Records 2-5: Texas electrical, Texas plumbing, Florida HVAC, Florida plumbing.
Split out of build_records.py purely so each file stays readable; the envelope helpers are shared."""
from build_records import sv, provenance                                   # noqa: F401

# --------------------------------------------------------------------- TEXAS · ELECTRICAL
tx_electrical = {
    "record_id": "tx.electrical", "schema_version": "1.0.0", "state": "TX", "state_name": "Texas",
    "trade": "electrical",
    "jurisdiction_model": {
        "level": "state_only",
        "summary": sv("Anyone performing electrical work in Texas must hold a TDLR licence, with stated "
                      "exemptions. Municipal master-electrician licences exist historically and TDLR "
                      "recognises them for experience credit.", "tx.tdlr.elec_master_apply",
                      "anyone who performs electrical work in the state of Texas must be licensed"),
        "local_layer_note": "TDLR accepts self-verified on-the-job training for years in which the "
                            "applicant held a municipal or regional master electrician licence, which is "
                            "direct evidence that a municipal licensing layer exists in Texas even though "
                            "the operative contractor licence is the state one."
    },
    "boards": [{
        "board_id": "tx.tdlr", "name": "Texas Department of Licensing and Regulation — Electricians",
        "url": "https://www.tdlr.texas.gov/electricians/",
        "scope": "Electrical contractor, master, journeyman, wireman, apprentice and sign licences, statewide"
    }],
    "licence_types": [
        {
            "licence_type_id": "tx.electrical.electrical_contractor",
            "name": "Electrical Contractor", "level": "contractor", "issuer_level": "state",
            "board_id": "tx.tdlr",
            "who_must_hold": sv("The business that contracts to design, install, erect, repair or alter "
                                "electrical wiring.", "tx.tdlr.elec_contractor_apply",
                                "Electrical contractors are licensed to engage in the business of "
                                "designing, installing, erecting, repairing, or altering electrical wires"),
            "scope_note": sv("Includes ducts, raceways and conduit, and electrical machinery, apparatus or "
                             "systems for light, heat, power or signalling.", "tx.tdlr.elec_contractor_apply",
                             "the installation or repair of ducts, raceways, or conduits"),
            "exam": {"required": sv(False, "tx.tdlr.elec_contractor_apply",
                                    "You must employ a licensed Master Electrician to apply for an "
                                    "Electrical Contractor license.", confidence="medium",
                                    note="The contractor licence itself has no exam; the exam burden sits "
                                         "on the Master Electrician of record. Inferred from the absence "
                                         "of any exam step in the application page, which lists every "
                                         "other step explicitly.")},
            "experience": {"requirement": sv("None on the business licence; the Master Electrician of "
                                             "record carries the experience.", "tx.tdlr.elec_contractor_apply",
                                             "You must employ a licensed Master Electrician",
                                             confidence="medium")},
            "application_fee": sv(110, "tx.tdlr.elec_contractor_apply",
                                  "with the non-refundable $110 application fee", unit="USD"),
            "renewal": {
                "cycle": sv(12, "tx.tdlr.elec_contractor_apply",
                            "Electrician licenses are valid for one year from the date of issuance",
                            unit="months"),
                "fee": sv(110, "tx.tdlr.elec_contractor_renew",
                          "include the non-refundable $110 renewal fee", unit="USD"),
                "expiry_rule": sv("anniversary", "tx.tdlr.elec_contractor_apply",
                                  "valid for one year from the date of issuance")
            },
            "continuing_education": {
                "required": sv(False, "tx.tdlr.elec_ce",
                               "Contractors and Residential Appliance Installers are not required to "
                               "complete continuing education."),
                "hours": sv(0, "tx.tdlr.elec_ce",
                            "Contractors and Residential Appliance Installers are not required to "
                            "complete continuing education.", unit="hours",
                            note="A zero that is a positive finding, not a gap: the board says so in "
                                 "terms. The contractor's Master Electrician of record still owes 4 hours, "
                                 "which is exactly the trap this record exists to catch."),
                "period": sv(None, note="not applicable, CE not required for this licence type"),
                "approved_provider_rule": sv("not applicable", "tx.tdlr.elec_ce",
                                             "Contractors and Residential Appliance Installers are not "
                                             "required to complete continuing education.")
            },
            "bond": {"required": sv(None, "tx.tdlr.elec_contractor_apply",
                                    note="No bond appears on the TDLR electrical contractor apply or renew "
                                         "pages, both read in full. Not established, not 'not required'."),
                     "amount": sv(None, note="see bond.required")},
            "insurance": {
                "general_liability": sv(300000, "tx.tdlr.elec_contractor_apply",
                                        "Minimum $300,000 per occurrence", unit="per_occurrence_usd"),
                "aggregate": sv(600000, "tx.tdlr.elec_contractor_apply", "Minimum $600,000 aggregate",
                                unit="USD"),
                "property_damage": sv(300000, "tx.tdlr.elec_contractor_apply",
                                      "Minimum $300,000 aggregate for products and completed operation",
                                      unit="USD"),
                "workers_compensation": sv("Proof of coverage, a certificate of authority to self-insure, "
                                           "or a statement of election not to obtain coverage under Labor "
                                           "Code ch. 406 subch. A; electing out requires an online notice "
                                           "to the Texas Department of Insurance.",
                                           "tx.tdlr.elec_contractor_apply",
                                           "Proof of having obtained workers' compensation insurance")
            }
        },
        {
            "licence_type_id": "tx.electrical.master_electrician",
            "name": "Master Electrician", "level": "master", "issuer_level": "state", "board_id": "tx.tdlr",
            "who_must_hold": sv("The individual who supervises electrical work and who an Electrical "
                                "Contractor must employ as its Master Electrician of record.",
                                "tx.tdlr.elec_contractor_apply",
                                "You must employ a licensed Master Electrician to apply for an Electrical "
                                "Contractor license."),
            "exam": {"required": sv(True, "tx.tdlr.elec_master_apply",
                                    "you will receive notification that you are approved to take the "
                                    "licensing exam")},
            "experience": {
                "requirement": sv("Journeyman Electrician licence held at least two years, plus 12,000 "
                                  "hours of on-the-job training under a Texas-licensed Master Electrician.",
                                  "tx.tdlr.elec_master_apply",
                                  "you must have held Journeyman Electrician license for at least two years"),
                "alternatives": sv("Journeyman Industrial Electrician experience may NOT be used. A holder "
                                   "of a municipal or regional master licence may self-verify the on-the-"
                                   "job training for the years the licence was held.",
                                   "tx.tdlr.elec_master_apply",
                                   "Journeyman Industrial Electrician experience may not be used to "
                                   "qualify for a Master Electrician license.")
            },
            "application_fee": sv(45, "tx.tdlr.elec_master_apply",
                                  "with the non-refundable $45 application fee", unit="USD"),
            "renewal": {
                "cycle": sv(12, "tx.tdlr.elec_master_renew",
                            "Master Electrician licenses are valid for one year from the date of issuance",
                            unit="months"),
                "fee": sv(45, "tx.tdlr.elec_master_renew", "include the non-refundable $45 renewal fee",
                          unit="USD"),
                "expiry_rule": sv("anniversary", "tx.tdlr.elec_master_renew",
                                  "valid for one year from the date of issuance"),
                "late_fee": sv("$67.50 if expired 90 days or less; $90 from 91 days to 36 months; not "
                               "renewable after 36 months.", "tx.tdlr.elec_master_renew",
                               "90 days or less | $67.50")
            },
            "continuing_education": {
                "required": sv(True, "tx.tdlr.elec_ce",
                               "required to complete 4 hours of continuing education prior to each license "
                               "renewal"),
                "hours": sv(4, "tx.tdlr.elec_ce",
                            "required to complete 4 hours of continuing education prior to each license "
                            "renewal", unit="hours"),
                "period": sv(12, "tx.tdlr.elec_ce",
                             "Continuing education courses must be completed within the term of the "
                             "license being renewed.", unit="months"),
                "approved_provider_rule": sv("TDLR-registered providers only; one CE hour equals 50 "
                                             "minutes of instruction.", "tx.tdlr.elec_ce",
                                             "Courses must be from a registered TDLR provider."),
                "carryover": sv("Holding several electrician licence types still requires only four hours "
                                "in total.", "tx.tdlr.elec_ce",
                                "you will only be required to complete a total of four hours of continuing "
                                "education")
            },
            "bond": {"required": sv(None, note="No bond on the master electrician pages read."),
                     "amount": sv(None, note="see bond.required")},
            "insurance": {"general_liability": sv(None, note="Insurance sits on the Electrical Contractor "
                                                  "business licence, not on the individual master licence.")}
        },
        {
            "licence_type_id": "tx.electrical.journeyman_electrician",
            "name": "Journeyman Electrician", "level": "journeyman", "issuer_level": "state",
            "board_id": "tx.tdlr",
            "who_must_hold": sv("An individual performing electrical work under the general supervision of "
                                "a Master Electrician.", "tx.tdlr.elec_journeyman_apply",
                                "A Journeyman Electrician is licensed to perform electrical work under the "
                                "general supervision of a Master Electrician."),
            "exam": {"required": sv(True, "tx.tdlr.elec_journeyman_apply",
                                    "you will receive notification that you are approved to take the "
                                    "licensing exam")},
            "experience": {
                "requirement": sv("8,000 hours of on-the-job training under a Texas-licensed Master "
                                  "Electrician for licensure; 7,000 hours allows the exam to be taken "
                                  "early.", "tx.tdlr.elec_journeyman_apply",
                                  "before reaching the full 8,000 hours required for licensure")
            },
            "application_fee": sv(30, "tx.tdlr.elec_journeyman_apply",
                                  "with the non-refundable $30 application fee", unit="USD"),
            "renewal": {
                "cycle": sv(12, "tx.tdlr.elec_journeyman_apply",
                            "Electrician licenses are valid for one year from the date of issuance",
                            unit="months"),
                "fee": sv(None, note="The journeyman renewal page was not read in this pass; the "
                          "journeyman apply page states the term but not the renewal fee. Recorded as "
                          "unknown rather than assumed equal to the $30 application fee."),
                "expiry_rule": sv("anniversary", "tx.tdlr.elec_journeyman_apply",
                                  "valid for one year from the date of issuance")
            },
            "continuing_education": {
                "required": sv(True, "tx.tdlr.elec_ce",
                               "required to complete 4 hours of continuing education prior to each license "
                               "renewal"),
                "hours": sv(4, "tx.tdlr.elec_ce", "required to complete 4 hours of continuing education "
                            "prior to each license renewal", unit="hours"),
                "period": sv(12, "tx.tdlr.elec_ce", "Continuing education courses must be completed within "
                             "the term of the license being renewed.", unit="months"),
                "approved_provider_rule": sv("TDLR-registered providers only.", "tx.tdlr.elec_ce",
                                             "Courses must be from a registered TDLR provider.")
            },
            "bond": {"required": sv(None, note="No bond on the journeyman pages read."),
                     "amount": sv(None, note="see bond.required")},
            "insurance": {"general_liability": sv(None, note="Not applicable to the individual licence.")}
        }
    ],
    "reciprocity": [
        {"with_state": s, "direction": "inbound",
         "grants": sv("Texas Master Electrician", "tx.tdlr.elec_out_of_state",
                      "Master Electrician - Alabama, Arkansas (master electrician), Iowa (Class A master "
                      "electrician), Louisiana (state contractor"),
         "requires_from": "that state's master electrician licence (Iowa: Class A only; Louisiana: state "
                          "contractor's licence; North Carolina: master electrician or unlimited "
                          "electrical contractor)",
         "conditions": sv("Passed the reciprocal statewide examination; held the reciprocal licence at "
                          "least one year; 12,000 hours under a master electrician; journeyman licence "
                          "held two years (one year for Alabama, Iowa, Nebraska and Ohio); letter of good "
                          "standing; $45 fee.", "tx.tdlr.elec_out_of_state",
                          "Held the reciprocal license for at least one year"),
         "waives_exam": sv(True, "tx.tdlr.elec_out_of_state",
                           "Texas has reciprocal licensing agreements with the states listed below", confidence="low",
                           note="The page is headed 'reciprocal licensing agreements' and lists a "
                                "reciprocity application form rather than an exam step, but does not say "
                                "'exam waived' in terms. Low confidence: the playbook flags it.")}
        for s in ["AL", "AR", "IA", "LA", "NE", "NC", "OH"]
    ] + [
        {"with_state": s, "direction": "inbound",
         "grants": sv("Texas Journeyman Electrician", "tx.tdlr.elec_out_of_state",
                      "Journeyman Electrician - Alabama, Alaska, Arkansas, Idaho, Iowa, Nebraska, New "
                      "Mexico, Oklahoma, South Dakota and Wyoming"),
         "requires_from": "that state's journeyman electrician licence",
         "conditions": sv("Passed the reciprocal state's examination; held the reciprocal licence at least "
                          "one year; 8,000 hours under a master electrician.", "tx.tdlr.elec_out_of_state",
                          "Have at least 8,000 hours under the supervision of a master electrician."),
         "waives_exam": sv(True, "tx.tdlr.elec_out_of_state", "Taken and passed the reciprocal state's "
                           "examination", confidence="low")}
        for s in ["AL", "AK", "AR", "ID", "IA", "NE", "NM", "OK", "SD", "WY"]
    ],
    "reciprocity_statement": sv("Master and journeyman only. No reciprocity exists for any other Texas "
                                "electrical licence type, including the Electrical Contractor business "
                                "licence.", "tx.tdlr.elec_out_of_state",
                                "Other License Types - Currently there are no reciprocal licensing "
                                "agreements for any other license types."),
    "business_entity": {
        "qualifying_individual_rule": sv("An Electrical Contractor must employ a licensed Master "
                                         "Electrician, or the owner must hold that licence. A Master "
                                         "Electrician may be assigned to only one Electrical Contractor "
                                         "unless they own more than 50% of the business.",
                                         "tx.tdlr.elec_contractor_apply",
                                         "A Master Electrician may only be assigned to a single Electrical "
                                         "Contractor, unless the Master Electrician owns more than 50 "
                                         "percent"),
        "change_notification_deadline": sv(30, "tx.tdlr.elec_contractor_apply",
                                           "designate a new Master Electrician of record within thirty "
                                           "business days from the date of separation", unit="business_days",
                                           note="This is a deadline with a start event that is not a "
                                                "renewal date. The alert engine must be able to open a "
                                                "30-business-day clock on 'qualifier departed', which is "
                                                "why deadlines are modelled as events, not as licence "
                                                "expiry dates."),
        "entity_registration": sv(None, note="Not read in this pass."),
        "per_location_rule": sv(None, note="No per-location rule stated for Texas electrical, unlike Texas "
                                "HVAC. Absence of a statement.")
    },
    "typical_timeline": sv(None, "tx.tdlr.elec_contractor_apply",
                           note="TDLR publishes no processing time for an electrical contractor licence. "
                                "The only published duration is the criminal-history review, 'one to six "
                                "weeks'."),
    "coverage_notes": [
        "Residential wireman, maintenance electrician, journeyman lineman, journeyman industrial, "
        "apprentice and all sign-electrician licences exist and are not modelled here. An apprentice-heavy "
        "Texas roster is only partly covered.",
        "The out-of-state page carries per-state document lists (which form, which proof) that are not "
        "captured field-by-field; the expansion playbook reproduces the conditions text and links out."
    ],
    "disclaimer_profile": "unverified_fields_present",
    "provenance": provenance(["tx.tdlr.elec_contractor_apply", "tx.tdlr.elec_contractor_renew",
                              "tx.tdlr.elec_master_apply", "tx.tdlr.elec_master_renew",
                              "tx.tdlr.elec_journeyman_apply", "tx.tdlr.elec_ce",
                              "tx.tdlr.elec_out_of_state"])
}

# ----------------------------------------------------------------------- TEXAS · PLUMBING
tx_plumbing = {
    "record_id": "tx.plumbing", "schema_version": "1.0.0", "state": "TX", "state_name": "Texas",
    "trade": "plumbing",
    "jurisdiction_model": {
        "level": "state_only",
        "summary": sv("Texas plumbing is licensed by the Texas State Board of Plumbing Examiners, a "
                      "separate agency from TDLR. Contracting is done under a Responsible Master Plumber "
                      "designation held by an individual.", "tx.tsbpe.rmp",
                      "a RMP is responsible for the general supervision and management of plumbing work "
                      "performed under contracts secured under his or her license"),
        "local_layer_note": "The RMP must obtain all permits and request all inspections required by the "
                            "applicable plumbing or building code, i.e. the municipal layer is permitting, "
                            "not licensing."
    },
    "boards": [{
        "board_id": "tx.tsbpe", "name": "Texas State Board of Plumbing Examiners",
        "url": "https://www.tsbpe.texas.gov/",
        "scope": "All Texas plumbing licences, registrations and endorsements",
        "phone": "(512) 936-5200"
    }],
    "licence_types": [
        {
            "licence_type_id": "tx.plumbing.responsible_master_plumber",
            "name": "Responsible Master Plumber (RMP designation)", "level": "qualifying_individual",
            "issuer_level": "state", "board_id": "tx.tsbpe",
            "who_must_hold": sv("The individual under whose licence a plumbing company contracts. One RMP "
                                "may act for only one company at a time.", "tx.tsbpe.rmp",
                                "A RMP may act as the RMP of record for only one company at a time."),
            "scope_note": sv("General supervision and management of all plumbing work under the contract, "
                             "including permits, inspections, verifying every worker is licensed or "
                             "registered, ensuring a licensee directly supervises registrants on site, and "
                             "service-vehicle marking.", "tx.tsbpe.rmp",
                             "ensuring that all individuals performing plumbing work hold a current "
                             "license or registration"),
            "exam": {"required": sv(False, "tx.tsbpe.rmp",
                                    "You may apply for the Responsible Master Plumber (RMP) Designation if: "
                                    "you are currently licensed as a Master Plumber in Texas",
                                    confidence="medium",
                                    note="The RMP is a designation added to an existing Master Plumber "
                                         "licence; the exam was taken for that licence.")},
            "experience": {"requirement": sv("Current Texas Master Plumber licence in good standing.",
                                             "tx.tsbpe.rmp",
                                             "you are currently licensed as a Master Plumber in Texas")},
            "application_fee": sv(225, "tx.tsbpe.rmp", "Initial Application Fee: $225", unit="USD",
                                  note="Waived if the designation is added during the renewal window, "
                                       "which opens 90 days before expiry: then only the $300 renewal fee "
                                       "is due. That interaction is a real saving and belongs in the "
                                       "playbook."),
            "renewal": {
                "cycle": sv(12, "tx.tsbpe.training", "will satisfy the yearly CPE requirement",
                            unit="months", confidence="medium",
                            note="TSBPE's licence-type pages state fees and a 90-day renewal window but "
                                 "never the word 'annual'. The board's CPE page calls the requirement "
                                 "yearly, and the late-renewal bands are expressed in days from expiry. "
                                 "Recorded as 12 months at MEDIUM confidence; Texas Occupations Code "
                                 "ch. 1301 should be opened in the next pass to raise it."),
                "fee": sv(300, "tx.tsbpe.rmp", "Renewal Fee: $300", unit="USD"),
                "expiry_rule": sv("anniversary", "tx.tsbpe.rmp",
                                  "your renewal period, which opens 90 days before your expiration date",
                                  confidence="medium"),
                "late_fee": sv("$150 if expired less than 90 days; $300 if expired more than 90 days.",
                               "tx.tsbpe.rmp", "Late Renewal Fee (expired less than 90 days): $150")
            },
            "continuing_education": {
                "required": sv(True, "tx.tsbpe.training",
                               "you are required to complete 6 hours of CPE before you may renew your "
                               "license"),
                "hours": sv(6, "tx.tsbpe.training",
                            "required to complete 6 hours of CPE before you may renew your license",
                            unit="hours"),
                "period": sv(12, "tx.tsbpe.training", "will satisfy the yearly CPE requirement",
                             unit="months", confidence="medium"),
                "approved_provider_rule": sv("Board-approved providers only, and the Board must separately "
                                             "approve the instructor and the publisher of the course "
                                             "materials.", "tx.tsbpe.training",
                                             "The TSBPE will only award credit for a 6-hour CPE course "
                                             "offered by a provider approved by the Board",
                                             note="Stricter than most states: approval attaches to the "
                                                  "provider, the instructor AND the course publisher."),
                "carryover": sv(None, note="No carry-over provision on the TSBPE training page.")
            },
            "bond": {"required": sv(None, "tx.tsbpe.rmp",
                                    note="No bond appears on the TSBPE RMP page; the financial requirement "
                                         "is commercial general liability insurance."),
                     "amount": sv(None, note="see bond.required")},
            "insurance": {
                "general_liability": sv(300000, "tx.tsbpe.rmp",
                                        "you have obtained a minimum of $300,000 of commercial liability "
                                        "insurance coverage", unit="USD",
                                        note="Must be MAINTAINED, not merely obtained: the scope-of-work "
                                             "text makes maintaining $300,000 part of the RMP's ongoing "
                                             "supervision duty. A lapse is therefore a licence problem, "
                                             "not only an insurance problem."),
                "property_damage": sv(None, note="Not separately stated; the requirement is a single "
                                      "commercial general liability figure.")
            }
        },
        {
            "licence_type_id": "tx.plumbing.master_plumber", "name": "Master Plumber", "level": "master",
            "issuer_level": "state", "board_id": "tx.tsbpe",
            "who_must_hold": sv("An individual who installs, changes, repairs, services or renovates "
                                "plumbing under an RMP, and who may supervise apprentices and tradesmen.",
                                "tx.tsbpe.master",
                                "A Master Plumber may install, change, repair, service, or renovate "
                                "plumbing under the supervision of a Responsible Master Plumber."),
            "exam": {
                "required": sv(True, "tx.tsbpe.master", "You may take the Master Plumber Examination if"),
                "provider": sv("Pearson VUE", "tx.tsbpe.master",
                               "Exam Fee (payable to Pearson VUE on the day of the exam): $128.50"),
                "fee": sv(153.50, "tx.tsbpe.master",
                          "Exam Processing Fee (payable to the TSBPE): $25", unit="USD",
                          confidence="medium",
                          note="Two separate payments: $25 processing to TSBPE plus $128.50 to Pearson VUE "
                               "on the day. Recorded as the $153.50 total with the split in this note, "
                               "because a contractor budgeting a new licence needs the total.")
            },
            "experience": {
                "requirement": sv("Texas or out-of-state Journeyman Plumber licence held at least two "
                                  "years.", "tx.tsbpe.master",
                                  "a Journeyman Plumber in Texas or another state and have held your "
                                  "license for at least two years"),
                "alternatives": sv("One year if a US Department of Labor Office of Apprenticeship training "
                                   "programme has been completed; or a Master Plumber licence in another "
                                   "state with a prior journeyman licence held two years (one with the DOL "
                                   "programme).", "tx.tsbpe.master",
                                   "have successfully completed a training program approved by the United "
                                   "States Department of Labor Office of Apprenticeship")
            },
            "application_fee": sv(75, "tx.tsbpe.master", "Initial License Fee: $75", unit="USD"),
            "renewal": {
                "cycle": sv(12, "tx.tsbpe.training", "will satisfy the yearly CPE requirement",
                            unit="months", confidence="medium"),
                "fee": sv(75, "tx.tsbpe.master", "Renewal Fee: $75", unit="USD"),
                "expiry_rule": sv("anniversary", "tx.tsbpe.rmp",
                                  "your renewal period, which opens 90 days before your expiration date",
                                  confidence="medium"),
                "late_fee": sv("$37.50 if expired less than 90 days; $75 if more.", "tx.tsbpe.master",
                               "Late Renewal Fee (expired less than 90 days): $37.50")
            },
            "continuing_education": {
                "required": sv(True, "tx.tsbpe.training",
                               "you are required to complete 6 hours of CPE before you may renew your "
                               "license"),
                "hours": sv(6, "tx.tsbpe.training", "required to complete 6 hours of CPE before you may "
                            "renew your license", unit="hours"),
                "period": sv(12, "tx.tsbpe.training", "will satisfy the yearly CPE requirement",
                             unit="months", confidence="medium"),
                "approved_provider_rule": sv("Board-approved provider, instructor and course publisher.",
                                             "tx.tsbpe.training",
                                             "The TSBPE will only award credit for a 6-hour CPE course "
                                             "offered by a provider approved by the Board")
            },
            "bond": {"required": sv(None, note="No bond on the Master Plumber page."),
                     "amount": sv(None, note="see bond.required")},
            "insurance": {"general_liability": sv(None, note="Insurance attaches to the RMP designation, "
                                                  "not to the Master Plumber licence.")}
        },
        {
            "licence_type_id": "tx.plumbing.journeyman_plumber", "name": "Journeyman Plumber",
            "level": "journeyman", "issuer_level": "state", "board_id": "tx.tsbpe",
            "who_must_hold": sv("An individual performing plumbing under an RMP; may supervise apprentices "
                                "on all sites and tradesmen on non-residential sites.", "tx.tsbpe.journeyman",
                                "A Journeyman Plumber may install, change, repair, service, or renovate "
                                "plumbing under the supervision of a Responsible Master Plumber."),
            "exam": {"required": sv(True, "tx.tsbpe.journeyman",
                                    "You may take the Journeyman Plumber Examination if"),
                     "fee": sv(40, "tx.tsbpe.journeyman", "Exam Fee: $40", unit="USD")},
            "experience": {
                "requirement": sv("8,000 hours in the plumbing trade, plus a 48-hour TSBPE-approved "
                                  "training course, plus current registration as an apprentice or a "
                                  "Tradesman Plumber-Limited licence (or an out-of-state journeyman or "
                                  "master licence).", "tx.tsbpe.journeyman",
                                  "you have at least 8,000 hours of experience working in the plumbing "
                                  "trade"),
                "alternatives": sv("Enrolment in or completion of a US DOL Office of Apprenticeship "
                                   "programme replaces the 48-hour course; an out-of-state journeyman or "
                                   "master licence also removes it.", "tx.tsbpe.journeyman",
                                   "you do not have to complete the 48-hour training program")
            },
            "application_fee": sv(40, "tx.tsbpe.journeyman", "Initial License Fee: $40", unit="USD"),
            "renewal": {
                "cycle": sv(12, "tx.tsbpe.training", "will satisfy the yearly CPE requirement",
                            unit="months", confidence="medium"),
                "fee": sv(40, "tx.tsbpe.journeyman", "Renewal Fee: $40", unit="USD",
                          note="If the same person holds both a Journeyman and a Master licence, only the "
                               "Master renewal fee is due."),
                "expiry_rule": sv("anniversary", "tx.tsbpe.rmp",
                                  "your renewal period, which opens 90 days before your expiration date",
                                  confidence="medium"),
                "late_fee": sv("$20 if expired less than 90 days; $40 if more.", "tx.tsbpe.journeyman",
                               "Late Renewal Fee (expired less than 90 days): $20")
            },
            "continuing_education": {
                "required": sv(True, "tx.tsbpe.training", "you are required to complete 6 hours of CPE "
                               "before you may renew your license"),
                "hours": sv(6, "tx.tsbpe.training", "required to complete 6 hours of CPE before you may "
                            "renew your license", unit="hours"),
                "period": sv(12, "tx.tsbpe.training", "will satisfy the yearly CPE requirement",
                             unit="months", confidence="medium"),
                "approved_provider_rule": sv("Board-approved provider, instructor and course publisher.",
                                             "tx.tsbpe.training",
                                             "The TSBPE will only award credit for a 6-hour CPE course "
                                             "offered by a provider approved by the Board")
            },
            "bond": {"required": sv(None, note="No bond on the Journeyman page."),
                     "amount": sv(None, note="see bond.required")},
            "insurance": {"general_liability": sv(None, note="Not applicable to the individual licence.")}
        }
    ],
    "reciprocity": [],
    "reciprocity_statement": sv("No exam-waiver reciprocity was found. Out-of-state journeyman and master "
                                "plumbers are made ELIGIBLE TO SIT the Texas exam and are excused the "
                                "48-hour course, which is an endorsement-of-experience path, not "
                                "reciprocity. Anyone told 'Texas reciprocates' is being told something "
                                "the board's own licence pages do not say.", "tx.tsbpe.master",
                                "a Master Plumber in another state and previously held a Journeyman "
                                "Plumber License for at least two years",
                                status="unverified", confidence="medium",
                                note="This is an ABSENCE claim built from four TSBPE pages. It is marked "
                                     "unverified deliberately: proving a negative needs the board's "
                                     "reciprocity page if one exists, and none was found in the site's own "
                                     "navigation."),
    "business_entity": {
        "qualifying_individual_rule": sv("A company contracts under one Responsible Master Plumber, who "
                                         "may serve one company at a time and must maintain $300,000 "
                                         "commercial general liability cover.", "tx.tsbpe.rmp",
                                         "A RMP may act as the RMP of record for only one company at a "
                                         "time.",
                                         note="For a roll-up this is the binding constraint in Texas: "
                                              "acquiring a plumbing company does not transfer its RMP, and "
                                              "one RMP cannot cover two acquired entities."),
        "per_location_rule": sv("Every service vehicle must display the company name and the RMP's licence "
                                "number.", "tx.tsbpe.rmp",
                                "ensuring that all service vehicles display the company name and RMP2's "
                                "license number",
                                note="Quoted verbatim including the board page's own 'RMP2' typo."),
        "entity_registration": sv(None, note="Not read in this pass."),
        "change_notification_deadline": sv(None, note="Relinquishing the RMP designation needs a notarised "
                                           "form and a $10 fee, but no deadline is stated for a company "
                                           "that loses its RMP.")
    },
    "typical_timeline": sv(None, "tx.tsbpe.master",
                           note="No processing time published. The board notes only that online "
                                "applications 'are processed significantly faster' than mailed ones, and "
                                "that a missing fingerprint record leaves an application deficient."),
    "coverage_notes": [
        "Tradesman Plumber-Limited, Plumbing Inspector, Apprentice registration and the three endorsements "
        "(Medical Gas Piping, Multipurpose Residential Fire Sprinkler, Water Supply Protection) are named "
        "but not modelled. Medical Gas alone has its own cycle: 2 hours of CPE every three years.",
        "The renewal cycle is at medium confidence across every Texas plumbing licence type. That single "
        "uncertainty propagates to every derived deadline in the state, which is why it is the first item "
        "in the wave-2 verification queue."
    ],
    "disclaimer_profile": "unverified_fields_present",
    "provenance": provenance(["tx.tsbpe.rmp", "tx.tsbpe.master", "tx.tsbpe.journeyman",
                              "tx.tsbpe.training"])
}

RECORDS = {"tx.electrical": tx_electrical, "tx.plumbing": tx_plumbing}
