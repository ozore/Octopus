#!/usr/bin/env python3
"""Fetch the three registers that need no form handling:

  FL DBPR CILB licensee extract  -> raw/fl_construction_license.csv   (~45 MB)
  Oregon CCB active licences     -> raw/or_ccb_commercial_gc.json     (Socrata SODA)
  Washington L&I contractor list -> raw/wa_lni_general.json           (Socrata SODA)

Run from anywhere:  python3 .../scripts/pull_bulk_registers.py
"""
import os, subprocess, urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, '..', 'raw')
UA = 'Mozilla/5.0'

FL = 'https://www2.myfloridalicense.com/sto/file_download/extracts//CONSTRUCTIONLICENSE_1.csv'

OR_WHERE = ("endorsement_text like 'Commercial General Contractor%' "
            "AND exempt_text='Nonexempt'")
OR_URL = ('https://data.oregon.gov/resource/g77e-6bhs.json?'
          + urllib.parse.urlencode({'$where': OR_WHERE, '$limit': 8000}))

WA_CITIES = ['SEATTLE', 'BELLEVUE', 'TACOMA', 'KENT', 'EVERETT', 'SPOKANE', 'VANCOUVER',
             'RENTON', 'KIRKLAND', 'REDMOND', 'BOTHELL', 'LYNNWOOD', 'AUBURN',
             'FEDERAL WAY', 'OLYMPIA', 'BELLINGHAM', 'ISSAQUAH', 'WOODINVILLE',
             'PUYALLUP', 'MOUNT VERNON', 'MUKILTEO', 'SEATAC', 'TUKWILA',
             'MERCER ISLAND', 'SPOKANE VALLEY']
WA_WHERE = ("contractorlicensestatus='ACTIVE' AND specialtycode1desc='GENERAL' AND state='WA' "
            "AND businesstypecodedesc in ('Corporation','Limited Liability Company','Partnership') "
            "AND city in (%s)" % ','.join("'%s'" % c for c in WA_CITIES))
WA_URL = ('https://data.wa.gov/resource/m8qx-ubtq.json?'
          + urllib.parse.urlencode({'$where': WA_WHERE, '$limit': 30000}))

def get(url, name):
    out = os.path.join(RAW, name)
    subprocess.run(['curl', '-s', '--retry', '3', '--retry-all-errors', '--max-time', '900',
                    '-A', UA, '-L', url, '-o', out], check=True)
    print(name, os.path.getsize(out), 'bytes')

if __name__ == '__main__':
    os.makedirs(RAW, exist_ok=True)
    get(FL, 'fl_construction_license.csv')
    get(OR_URL, 'or_ccb_commercial_gc.json')
    get(WA_URL, 'wa_lni_general.json')
