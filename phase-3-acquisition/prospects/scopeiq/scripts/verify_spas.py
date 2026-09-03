#!/usr/bin/env python3
"""Confirm yellowpages med spa candidates by opening their own homepage and looking for
aesthetic-medicine keywords; harvest the procedure list and a business contact route.
Usage: verify_spas.py <selected.json> <sites_dir> <out.json>"""
import json,re,os,html,sys,collections
PROC = {
 'botox':'Botox','dysport':'Dysport','jeuveau':'Jeuveau','xeomin':'Xeomin','daxxify':'Daxxify',
 'filler':'dermal fillers','juvederm':'Juvederm','restylane':'Restylane','sculptra':'Sculptra',
 'kybella':'Kybella','microneedling':'microneedling','morpheus8':'Morpheus8','coolsculpt':'CoolSculpting',
 'laser hair removal':'laser hair removal','ipl':'IPL','hydrafacial':'HydraFacial','prp':'PRP',
 'semaglutide':'semaglutide (GLP-1)','tirzepatide':'tirzepatide (GLP-1)','glp-1':'GLP-1',
 'weight loss':'medical weight loss','iv therapy':'IV therapy','iv hydration':'IV hydration',
 'iv drip':'IV drip','testosterone':'hormone therapy','hormone':'hormone therapy',
 'chemical peel':'chemical peels','emsculpt':'Emsculpt','ultherapy':'Ultherapy','sofwave':'Sofwave',
 'prf':'PRF','thread lift':'thread lifts','sclerotherapy':'sclerotherapy','laser resurfacing':'laser resurfacing',
}
KEY = re.compile(r'(botox|dysport|jeuveau|xeomin|daxxify|dermal filler|juvederm|restylane|sculptra|kybella|microneedling|morpheus8|coolsculpt|laser hair removal|hydrafacial|semaglutide|tirzepatide|glp-1|iv therapy|iv hydration|med spa|medspa|medical spa|injectable|aesthetic)', re.I)
CONTACT = re.compile(r'href="([^"]*(?:contact|contact-us|book|appointment)[^"]*)"', re.I)
MAIL = re.compile(r'(?:mailto:)?\b((?:info|hello|contact|office|frontdesk|admin|appointments|clientcare|team|sales|support|inquiries|reception)@[A-Za-z0-9.-]+\.[A-Za-z]{2,})', re.I)
BAD_MAIL=re.compile(r'@(gmail|yahoo|hotmail|outlook|icloud|proton|aol)\.',re.I)
def main(selpath, sitedir, outpath):
    sel=json.load(open(selpath))
    status={}
    for line in open(os.path.join(sitedir,'_status.tsv')):
        c,u,p=line.rstrip('\n').split('\t'); status[u]=(c,p)
    out=[]; fails=collections.Counter()
    for r in sel:
        st=status.get(r['website'])
        if not st: fails['nostatus']+=1; continue
        code,path=st
        if not os.path.exists(path): fails[code]+=1; continue
        h=open(path,encoding='utf-8',errors='ignore').read()
        if len(h)<1500: fails['tiny']+=1; continue
        text=re.sub(r'<script.*?</script>','',h,flags=re.S|re.I)
        text=re.sub(r'<style.*?</style>','',text,flags=re.S|re.I)
        plain=html.unescape(re.sub(r'<[^>]+>',' ',text)).lower()
        if not KEY.search(plain): fails['nokeyword']+=1; continue
        procs=[]
        for k,v in PROC.items():
            if k in plain and v not in procs: procs.append(v)
        base=re.sub(r'/$','',r['website']); croute=''
        host=re.match(r'https?://([^/]+)',base).group(1).lower().replace('www.','')
        # BRIEF 2.2: the contact route must live on the organisation's OWN site.
        # Third-party booking widgets and social-network pages are rejected.
        for m in CONTACT.finditer(text):
            u=html.unescape(m.group(1)).strip()
            if len(u) > 160 or u.startswith('data:') or ' ' in u: continue
            if u.startswith('http'):
                h=re.match(r'https?://([^/]+)',u).group(1).lower().replace('www.','')
                if h != host: continue
                croute=u
            elif u.startswith('/'): croute=re.match(r'(https?://[^/]+)',base).group(1)+u
            else: continue
            break
        mails=[x for x in MAIL.findall(plain) if not BAD_MAIL.search('@'+x.split('@')[1])]
        r['procedures']=procs[:8]; r['contact_route']=croute; r['mail']=mails[0] if mails else ''
        out.append(r)
    json.dump(out,open(outpath,'w'),indent=1)
    print('verified',len(out),'fails',fails.most_common())
if __name__=='__main__':
    main(*sys.argv[1:4])
