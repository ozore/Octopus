#!/usr/bin/env python3
"""Count states + location mentions on a fetched locations page."""
import sys,re,html,os
STATES={'AL':'Alabama','AK':'Alaska','AZ':'Arizona','AR':'Arkansas','CA':'California','CO':'Colorado',
'CT':'Connecticut','DE':'Delaware','FL':'Florida','GA':'Georgia','HI':'Hawaii','ID':'Idaho','IL':'Illinois',
'IN':'Indiana','IA':'Iowa','KS':'Kansas','KY':'Kentucky','LA':'Louisiana','ME':'Maine','MD':'Maryland',
'MA':'Massachusetts','MI':'Michigan','MN':'Minnesota','MS':'Mississippi','MO':'Missouri','MT':'Montana',
'NE':'Nebraska','NV':'Nevada','NH':'New Hampshire','NJ':'New Jersey','NM':'New Mexico','NY':'New York',
'NC':'North Carolina','ND':'North Dakota','OH':'Ohio','OK':'Oklahoma','OR':'Oregon','PA':'Pennsylvania',
'RI':'Rhode Island','SC':'South Carolina','SD':'South Dakota','TN':'Tennessee','TX':'Texas','UT':'Utah',
'VT':'Vermont','VA':'Virginia','WA':'Washington','WV':'West Virginia','WI':'Wisconsin','WY':'Wyoming','DC':'District of Columbia'}
def stats(path):
    h=open(path,encoding='utf-8',errors='ignore').read()
    h2=re.sub(r'<(script|style)[^>]*>.*?</\1>','',h,flags=re.S|re.I)
    t=html.unescape(re.sub(r'<[^>]+>',' ',h2))
    found=set()
    for ab in STATES:
        if re.search(r'(?:,\s*|\b)'+ab+r'\b\s*\d{5}',t) or re.search(r',\s*'+ab+r'\b',t): found.add(ab)
    for ab,nm in STATES.items():
        if re.search(r'\b'+re.escape(nm)+r'\b',t): found.add(ab)
    zips=len(set(re.findall(r'\b\d{5}(?:-\d{4})?\b',t)))
    return sorted(found), zips, len(t)
if __name__=='__main__':
    for p in sys.argv[1:]:
        s,z,n=stats(p); print(os.path.basename(p), len(s), ' '.join(s), 'zips=',z)
