#!/usr/bin/env python3
"""Mine the public NCBFAA membership directory (company name, city, state, website,
services). No login used; the directory search form is public. Personal contact
names present on the pages are deliberately discarded (BRIEF s2.1)."""
import re,html,json,os,subprocess,sys,time
from concurrent.futures import ThreadPoolExecutor
HERE=os.path.dirname(os.path.abspath(__file__)); RAW=os.path.join(HERE,'..','raw')
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
JAR=os.path.join(RAW,'ncbfaa_jar.txt')
def curl(url,post=None,timeout=60):
    cmd=['curl','-s','-A',UA,'-m',str(timeout),'-L','--compressed','-b',JAR,'-c',JAR,url]
    if post:
        for k,v in post: cmd+= ['--data-urlencode',f'{k}={v}']
        cmd+=['-X','POST']
    return subprocess.run(cmd,capture_output=True).stdout.decode('utf-8','replace')
STATES=['AL','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','PR']
def main():
    os.makedirs(RAW,exist_ok=True)
    idx=curl('https://members.ncbfaa.org/Scripts/4Disapi.dll/4DCGI/directory/Member/index.html?MenuKey=members')
    action=html.unescape(re.search(r'<form[^>]*action="([^"]+)"',idx).group(1))
    seen={}
    for st in STATES:
        h=curl(action,post=[('DirectoryType','CompanyMembers'),('Web_SelMethod','Random'),
              ('Company Name',''),('Main City',''),('Main State',st),('sort','1'),('submitButtonName','Search')])
        n=0
        for tr in re.findall(r'<tr[^>]*>(.*?)</tr>',h,flags=re.S|re.I):
            m=re.search(r'<td[^>]*><a href="([^"]+)"[^>]*>(.*?)</a></td>',tr,flags=re.S)
            if not m: continue
            tds=re.findall(r'<td[^>]*>(.*?)</td>',tr,flags=re.S)
            if len(tds)<4: continue
            name=re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>','',m.group(2)))).strip()
            city=re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>','',tds[2]))).strip()
            state=re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>','',tds[3]))).strip()
            key=name.lower()
            if key and key not in seen:
                seen[key]={'name':name,'city':city,'state':state,'detail':html.unescape(m.group(1))}
                n+=1
        print(st,n,len(seen),flush=True)
    json.dump(list(seen.values()),open(os.path.join(RAW,'ncbfaa_companies.json'),'w'),indent=1)
    print('unique companies',len(seen))
if __name__=='__main__': main()
