#!/usr/bin/env python3
"""Second pass over the jurisdiction guides selected for cities.csv.

Re-opens each guide and pulls only what the page states: the fee sentence for
the subject jurisdiction, the renewal cadence, any named enforcement/compliance
vendor, and the official program or ordinance URL. A fee is accepted only when
the same amount also appears in the page's own meta description, which keeps a
neighbouring city's fee (guides often compare suburbs) out of the fee column.

Usage: python3 scripts/city_rules_detail.py <paths.txt> <out.json> [workers]
Run from the repo root. With no arguments it uses its default paths.
"""
import json, re, os, sys, subprocess, html as ihtml
from concurrent.futures import ThreadPoolExecutor

# Run from the repo root with no arguments and it regenerates its own output.
BASE = os.path.join("phase-3-acquisition", "prospects", "staylegal")
if not os.path.isdir(BASE):
    BASE = "."
DEFAULT_ARGS = [os.path.join(BASE, 'raw/city_sel.txt'), os.path.join(BASE, 'raw/city_detail.json')]
DEFAULT_ARGS.append('12')
if len(sys.argv) == 1:
    sys.argv += DEFAULT_ARGS


UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
BASE = "https://www.bnbcalc.com"
VENDORS = ["Granicus", "Host Compliance", "Deckard", "Rentalscape", "LODGINGRevs",
           "MUNIRevs", "GovOS", "Avenu", "Harmari", "LTAS", "STR Helper",
           "Airbnb pass-through", "Avalara", "MyLodgeTax", "Rentalizer",
           "Symbium", "Bear Cognition", "Granicus Host Compliance"]

def get(u):
    try:
        return subprocess.run(["curl", "-s", "-A", UA, "-m", "30", "-L", u],
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
    desc = re.findall(r'<meta name="description" content="([^"]{0,400})"', h)
    desc = ihtml.unescape(desc[0]) if desc else ""
    m = re.search(r"Quick answer:(.{0,900}?)(?:Free instant analysis|Reveal Airbnb)", txt)
    quick = (m.group(1) if m else txt[:700]).strip()

    # fee: only an amount the page's own description repeats
    fee = ""
    amounts = re.findall(r"\$[\d,]+(?:\.\d\d)?", quick)
    for a in amounts:
        if a in desc:
            sent = ""
            for s in re.split(r"(?<=[.!?]) ", quick):
                if a in s:
                    sent = s.strip()
                    break
            fee = (a + (" | " + sent if sent else ""))[:200]
            break
    ren = ""
    m = re.search(r"(annual(?:ly)?|each year|every year|yearly|biennial|every two years|"
                  r"two-year|three-year|four-year|per year|every 12 months)", quick, re.I)
    if not m:
        m = re.search(r"(annual(?:ly)?|every year|biennial|two-year|three-year|four-year)",
                      txt[:12000], re.I)
    if m:
        ren = m.group(0).lower()
    vend = sorted({v for v in VENDORS if v.lower() in txt.lower()})
    gov = [u for u in re.findall(r'href="(https?://[^"]+)"', h)
           if re.search(r"\.gov(/|$)|\.us/|municode|amlegal|codepublishing|ecode360|legistar", u)]
    gov = [u for u in gov if "irs.gov" not in u and "usa.gov" not in u]
    return path, {"title": title, "desc": desc, "quick": quick[:600], "fee": fee,
                  "renewal": ren, "vendors": vend, "gov": sorted(set(gov))[:3]}

def main():
    paths = [l.strip() for l in open(sys.argv[1]) if l.strip()]
    outp = sys.argv[2]
    w = int(sys.argv[3]) if len(sys.argv) > 3 else 12
    done = json.load(open(outp)) if os.path.exists(outp) else {}
    todo = [p for p in paths if p not in done]
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
