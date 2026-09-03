#!/usr/bin/env python3
"""Find and CONFIRM an organisation's own website without a search engine.

Bing is unusable from this environment (it returns cached results for other
queries), so instead we construct a small set of candidate domains from the
organisation's own name, fetch each one, and keep it only when the page that
comes back identifies itself as that organisation (its <title>/og:site_name
contains every distinctive token of the name). A candidate that does not
confirm is discarded, so `website` is either opened-and-checked or empty.

Usage: python3 scripts/find_domains.py <names.json> <out.json> [workers]
  names.json: [{"name": "...", "market": "..."}, ...]
Run from the repo root. With no arguments it uses its default paths.
"""
import json, re, sys, os, subprocess, html as ihtml
from concurrent.futures import ThreadPoolExecutor

# Run from the repo root with no arguments and it regenerates its own output.
BASE = os.path.join("phase-3-acquisition", "prospects", "staylegal")
if not os.path.isdir(BASE):
    BASE = "."
DEFAULT_ARGS = [os.path.join(BASE, 'raw/names_all.json'), os.path.join(BASE, 'raw/domains.json')]
DEFAULT_ARGS.append('14')
if len(sys.argv) == 1:
    sys.argv += DEFAULT_ARGS


UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")
STOP = {"the", "and", "of", "llc", "inc", "llp", "co", "a"}
GEN = ('info','hello','contact','support','sales','partners','partnerships','admin',
       'bookings','reservations','team','help','office','owners','stay','rentals','service')

def toks(name):
    n = re.sub(r"[^a-z0-9 ]", " ", name.lower())
    return [w for w in n.split() if w and w not in STOP]

def candidates(name):
    t = toks(name)
    if not t:
        return []
    j = "".join(t)
    outs = [j]
    # drop a trailing generic word ("... Property Management" -> "...")
    for k in (1, 2):
        if len(t) > k and t[-k:][0] in ("management","managements","properties","property",
                                        "rentals","rental","vacation","group","company",
                                        "homes","stays","hospitality","realty","services"):
            outs.append("".join(t[:-k]))
    outs.append("-".join(t))
    seen, urls = set(), []
    for base in outs:
        if not (2 < len(base) < 40) or base in seen:
            continue
        seen.add(base)
        for tld in (".com", ".net"):
            urls.append("https://www." + base + tld)
    return urls[:6]

def get(u):
    try:
        r = subprocess.run(["curl", "-s", "-A", UA, "-m", "12", "-L",
                            "--max-filesize", "3000000", u],
                           capture_output=True, text=True, timeout=25)
        return r.stdout
    except Exception:
        return ""

def ident(p):
    m = re.search(r'<meta[^>]+property="og:site_name"[^>]+content="([^"]+)"', p, re.I)
    s = ihtml.unescape(m.group(1)) if m else ""
    m = re.findall(r"<title[^>]*>(.*?)</title>", p, flags=re.S)
    t = ihtml.unescape(re.sub(r"<[^>]+>", "", m[0])) if m else ""
    return s, re.sub(r"\s+", " ", t).strip()

def work(it):
    name = it["name"]
    want = toks(name)
    for u in candidates(name):
        p = get(u)
        if len(p) < 700:
            continue
        site, title = ident(p)
        blob = re.sub(r"[^a-z0-9 ]", " ", (site + " " + title).lower())
        if not all(w in blob for w in want):
            continue
        rec = {"name": name, "website": u, "title": title[:150]}
        low = re.sub(r"<[^>]+>", " ", p)
        low = re.sub(r"\s+", " ", ihtml.unescape(low))
        mails = re.findall(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", p)
        g = [m for m in mails if m.split("@")[0].lower() in GEN
             and not re.search(r"@(gmail|yahoo|hotmail|outlook|icloud|proton|aol)\.", m.lower())]
        rec["email"] = g[0] if g else ""
        links = re.findall(r'href="([^"#]{2,200})"', p)
        for h in links:
            if re.search(r"/(contact|contact-us|get-in-touch)", h, re.I):
                rec["contact"] = h if h.startswith("http") else u.rstrip("/") + "/" + h.lstrip("/")
                break
        s = re.search(r"(?:manage[sd]?|managing|portfolio of|over|more than)\s+"
                      r"(?:more than\s+|over\s+)?([0-9][0-9,]{1,6})\s*\+?\s*"
                      r"(properties|homes|vacation rentals|units|cabins|listings|rentals)",
                      low, re.I)
        rec["size"] = s.group(0).strip()[:100] if s else ""
        return rec
    return {"name": name, "website": "", "title": "", "email": "", "size": ""}

def main():
    items = json.load(open(sys.argv[1]))
    outp = sys.argv[2]
    workers = int(sys.argv[3]) if len(sys.argv) > 3 else 12
    done = json.load(open(outp)) if os.path.exists(outp) else {}
    todo = [i for i in items if i["name"] not in done]
    with ThreadPoolExecutor(max_workers=workers) as ex:
        for i, rec in enumerate(ex.map(work, todo), 1):
            done[rec["name"]] = rec
            if i % 25 == 0:
                json.dump(done, open(outp, "w"), indent=1)
                print(i, "of", len(todo), flush=True)
    json.dump(done, open(outp, "w"), indent=1)
    hit = sum(1 for v in done.values() if v["website"])
    print("confirmed", hit, "of", len(done))

if __name__ == "__main__":
    main()
