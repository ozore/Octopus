# scripts/ — reproducing the pulls

Run in this order from anywhere (each script resolves paths relative to itself):

```
python3 scripts/pull_bulk_registers.py     # FL DBPR CSV, OR CCB JSON, WA L&I JSON  -> raw/
python3 scripts/pull_cslb.py               # CA CSLB class-B lists, 11 counties     -> raw/
python3 scripts/pull_nc_nclbgc.py          # NC NCLBGC "Building" licences          -> raw/
python3 scripts/pull_assoc_directories.py  # AGC chapter member directories         -> raw/
python3 scripts/pull_nasbp.py              # NASBP surety bond producers            -> raw/
python3 scripts/verify_sites.py            # opens the association company sites    -> raw/site_checks.csv
python3 scripts/verify_sites.py raw/curated_candidates.csv raw/curated_checks.csv
python3 scripts/check_coi_features.py      # does a software partner bundle COI?    -> raw/coi_feature_check.csv
python3 scripts/build_candidates.py        # company-only filter over FL + CA        -> raw/candidates_*.csv
python3 scripts/make_prospects.py          # ICP ranking + per-metro quotas          -> raw/rows_endcustomers.csv
python3 scripts/assemble.py                # merge + dedupe                          -> prospects.csv
```

`raw/curated_candidates.csv` is hand-written (the partner / channel / competitor shortlist) and is
the only input that is not machine-generated. The bulk downloads themselves are not committed —
they are ~100 MB and the scripts above re-fetch them.
