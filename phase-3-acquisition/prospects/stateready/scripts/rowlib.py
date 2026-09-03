import json,os,sys
BASE=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STORE=os.path.join(BASE,'data','rows.jsonl')
COLS=['app','prospect_type','segment','name','website','location','size_signal',
      'fit_rationale','contact_route','decision_maker_role','source_url','source_type',
      'confidence','collected_on','notes']
def add(rows):
    os.makedirs(os.path.dirname(STORE),exist_ok=True)
    with open(STORE,'a',encoding='utf-8') as f:
        for r in rows:
            d={c:'' for c in COLS}
            d['app']='stateready'; d['collected_on']='2026-09-03'
            d.update(r)
            for c in d:
                if c not in COLS: raise SystemExit('bad col '+c)
            f.write(json.dumps(d,ensure_ascii=False)+'\n')
    return len(rows)
