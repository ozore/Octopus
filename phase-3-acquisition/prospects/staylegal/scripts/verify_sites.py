#!/usr/bin/env python3
"""Open a list of candidate organisation homepages and record what the page
itself says: <title>, a contact/partner page URL, a generic business mailbox,
and any self-stated size signal ("we manage 2,300 properties").

Nothing is inferred: a URL that does not return a usable page is written back
with status 'dead' so the row can be left without a website.

Usage: python3 scripts/verify_sites.py <urls.txt> <out.json>
  urls.txt: one URL per line (blank lines and # comments ignored)
Run from the repo root. With no arguments it uses its default paths.
"""
import json, os, re, subprocess, sys, html as ihtml

# Run from the repo root with no arguments and it regenerates its own output.
BASE = os.path.join("phase-3-acquisition", "prospects", "staylegal")
if not os.path.isdir(BASE):
    BASE = "."
DEFAULT_ARGS = [os.path.join(BASE, 'raw/known_urls.txt'), os.path.join(BASE, 'raw/known_verified.json')]
if len(sys.argv) == 1:
    sys.argv += DEFAULT_ARGS


UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")

GEN = ('info','hello','contact','support','sales','partners','partnerships','admin',
       'bookings','reservations','team','help','office','press','media','owners','service')

SIZE = re.compile(
  r'(?:manage[sd]?|managing|serving|serves|powers?|supports?|trusted by|over|more than)\s+'
  r'(?:more than\s+|over\s+|nearly\s+)?([0-9][0-9,\.]{1,7})\s*\+?\s*'
  r'(properties|homes|vacation rentals|short-term rentals|short term rentals|units|cabins|'
  r'listings|customers|hosts|property managers|cities|jurisdictions|markets|members|destinations)',
  re.I)

def get(u):
    try:
        r = subprocess.run(["curl","-s","-A",UA,"-m","30","-L","--max-filesize","5000000",
                            "-w","\n@@@%{http_code}@@@%{url_effective}", u],
                           capture_output=True, text=True, timeout=55)
        out = r.stdout
        m = out.rsplit("\n@@@",1)
        body = m[0] if len(m)>1 else out
        tail = m[1] if len(m)>1 else ""
        code, eff = (tail.split("@@@")+["",""])[:2]
        return body, code, eff
    except Exception:
        return "", "000", u

def main():
    urls=[l.strip() for l in open(sys.argv[1]) if l.strip() and not l.startswith('#')]
    outp=sys.argv[2]
    res=json.load(open(outp)) if os.path.exists(outp) else {}
    for u in urls:
        if u in res: continue
        body, code, eff = get(u)
        rec={"http": code, "final": eff}
        if body and len(body)>500:
            t=re.findall(r'<title[^>]*>(.*?)</title>', body, flags=re.S)
            rec["title"]=re.sub(r'\s+',' ',ihtml.unescape(re.sub(r'<[^>]+>','',t[0]))).strip()[:180] if t else ""
            d=re.findall(r'<meta[^>]+name="description"[^>]+content="([^"]{0,300})"', body, re.I)
            rec["desc"]=ihtml.unescape(d[0]).strip() if d else ""
            links=re.findall(r'href="([^"#]{2,200})"', body)
            def pick(pat):
                for h in links:
                    if re.search(pat, h, re.I):
                        return h if h.startswith('http') else u.rstrip('/')+'/'+h.lstrip('/')
                return ""
            rec["contact"]=pick(r'/(contact|contact-us|get-in-touch|talk-to)')
            rec["partner"]=pick(r'(partner|partners|affiliate|integrations|marketplace|referral)')
            mails=re.findall(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', body)
            g=[m for m in mails if m.split('@')[0].lower() in GEN
               and not re.search(r'@(gmail|yahoo|hotmail|outlook|icloud|proton|aol)\.', m.lower())]
            rec["email"]=g[0] if g else ""
            low=re.sub(r'<[^>]+>',' ', body)
            low=re.sub(r'\s+',' ', ihtml.unescape(low))
            s=SIZE.search(low)
            rec["size"]=s.group(0).strip()[:110] if s else ""
        res[u]=rec
        json.dump(res, open(outp,'w'), indent=1)
        print(code, u, '|', rec.get("title","")[:70], '|', rec.get("size",""), flush=True)

if __name__=="__main__":
    main()
