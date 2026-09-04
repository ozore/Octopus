#!/usr/bin/env python3
"""Fetch BNBCalc's per-jurisdiction STR regulation guides and pull out only the
facts the guide itself states: the regime summary, the permit/registration fee,
the renewal cadence, and the official city/county ordinance URL the guide links
to. Nothing is inferred - a fee that is not stated on the page is left empty,
per the brief's "never estimate a fee" rule.

Usage: python3 scripts/fetch_city_rules.py <urls.txt> <out.json> [workers]
Run from the repo root. urls.txt holds site-relative paths, one per line.
"""
import json, re, os, sys, subprocess, html as ihtml
from concurrent.futures import ThreadPoolExecutor

# Run from the repo root with no arguments and it regenerates its own output.
BASE = os.path.join("phase-3-acquisition", "prospects", "staylegal")
if not os.path.isdir(BASE):
    BASE = "."
DEFAULT_ARGS = [os.path.join(BASE, 'raw/reg_fetch.txt'), os.path.join(BASE, 'raw/city_rules.json')]
DEFAULT_ARGS.append('10')
if len(sys.argv) == 1:
    sys.argv += DEFAULT_ARGS


UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
BASE = "https://www.bnbcalc.com"

FEE = re.compile(
  r"(?:\$[\d,]+(?:\.\d\d)?)\s*(?:per year|a year|annually|annual|one-time|"
  r"per permit|per property|per unit|application fee|registration fee|permit fee)", re.I)
FEE2 = re.compile(
  r"(?:permit|licen[cs]e|registration|application)[^.$]{0,60}?(\$[\d,]+(?:\.\d\d)?)", re.I)
REN = re.compile(r"(annual(?:ly)?|every year|yearly|biennial|every two years|"
                 r"every 2 years|two-year|three-year|four-year|per year|renew(?:ed|s|al)?\s+"
                 r"(?:each|every)\s+\w+)", re.I)

def get(u):
    try:
        return subprocess.run(["curl","-s","-A",UA,"-m","30","-L",u],
                              capture_output=True, text=True, timeout=50).stdout
    except Exception:
        return ""

def work(path):
    h = get(BASE + path)
    if len(h) < 20000:
        return path, None
    t = re.sub(r"<script.*?</script>", " ", h, flags=re.S)
    t = re.sub(r"<style.*?</style>", " ", t, flags=re.S)
    txt = re.sub(r"\s+", " ", ihtml.unescape(re.sub(r"<[^>]+>", " ", t)))
    h1 = re.findall(r"<h1[^>]*>(.*?)</h1>", h, flags=re.S)
    title = ihtml.unescape(re.sub(r"<[^>]+>", "", h1[0])).strip() if h1 else ""
    m = re.search(r"Quick answer:(.{0,900}?)(?:Free instant analysis|Reveal Airbnb)", txt)
    quick = m.group(1).strip() if m else ""
    if not quick:
        m = re.search(r"Quick answer:(.{0,900})", txt)
        quick = m.group(1).strip() if m else ""
    desc = re.findall(r'<meta name="description" content="([^"]{0,400})"', h)
    gov = [u for u in re.findall(r'href="(https?://[^"]+)"', h)
           if re.search(r"\.gov|\.us/|municode|amlegal|codepublishing|ecode360|"
                        r"library\.municode|legistar", u)]
    fee = ""
    m = FEE.search(quick) or FEE.search(txt[:9000])
    if m:
        fee = m.group(0).strip()
    else:
        m = FEE2.search(quick) or FEE2.search(txt[:9000])
        if m:
            fee = m.group(1).strip()
    ren = ""
    m = REN.search(quick) or REN.search(txt[:9000])
    if m:
        ren = m.group(0).strip()
    return path, {"title": title, "quick": quick[:700],
                  "desc": ihtml.unescape(desc[0]) if desc else "",
                  "fee": fee, "renewal": ren,
                  "gov": sorted(set(gov))[:4]}

def main():
    urls = [l.strip() for l in open(sys.argv[1]) if l.strip()]
    outp = sys.argv[2]
    w = int(sys.argv[3]) if len(sys.argv) > 3 else 14
    done = json.load(open(outp)) if os.path.exists(outp) else {}
    todo = [u for u in urls if u not in done]
    with ThreadPoolExecutor(max_workers=w) as ex:
        for i, (p, rec) in enumerate(ex.map(work, todo), 1):
            done[p] = rec
            if i % 25 == 0:
                json.dump(done, open(outp, "w"), indent=1)
                print(i, "of", len(todo), flush=True)
    json.dump(done, open(outp, "w"), indent=1)
    print("done", len(done))

if __name__ == "__main__":
    main()
