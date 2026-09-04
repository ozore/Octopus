#!/usr/bin/env python3
"""Third pass: drop any accepted domain whose second-level label does not carry the
organisation's leading distinctive word. Catches cases where a member practice or a
same-industry neighbour answered instead of the parent (Heartland Dental ->
leavenworthfamilydental.com)."""
import re, sys, glob, os
STOP={'the','inc','llc','corp','corporation','co','ltd','company','companies','group','holdings',
      'enterprises','enterprise','management','partners','and','of','national','american','us','usa'}
def norm(s):
    s=s.replace('’',"'").replace('&','and')
    return re.sub(r'\s+',' ',re.sub(r"[^A-Za-z0-9 ]",' ',s)).strip().lower()
def ok(name,site):
    if not site: return False
    host=site.split('//')[-1].split('/')[0].lower()
    host=re.sub(r'^www\.','',host)
    host=re.sub(r'\.(com|net|org|co|us|io|health|care|group)$','',host)
    lab=re.sub(r'[^a-z0-9]','',host)
    n=norm(name); full=n.replace(' ','')
    if full and full in lab: return True
    core=[w for w in n.split() if w not in STOP] or n.split()
    if not core: return False
    first=core[0]
    key=first[:6] if len(first)>=6 else first
    if key in lab: return True
    # initials fallback e.g. "KBP Brands" -> kbpbrands (covered), "MB2 Dental" -> mb2dental
    ini=''.join(w[0] for w in core)
    return len(ini)>=2 and ini in lab
for p in sys.argv[1:]:
    kept=drop=0
    outl=[]
    for line in open(p,encoding='utf-8'):
        c=line.rstrip('\n').split('\t')
        while len(c)<5: c.append('')
        if c[4]=='ok' and not ok(c[0],c[1]):
            print('DROP\t%s\t%s'%(c[0],c[1]),file=sys.stderr); drop+=1
            c[1]=c[2]=''; c[4]='domain-mismatch'
        elif c[4]=='ok': kept+=1
        outl.append('\t'.join(c))
    open(p.replace('_final.tsv','_clean.tsv').replace('_retry_out.tsv','_retryclean.tsv'),'w',encoding='utf-8').write('\n'.join(outl)+'\n')
    print('%s kept=%d dropped=%d'%(os.path.basename(p),kept,drop))
