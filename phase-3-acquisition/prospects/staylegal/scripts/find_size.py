#!/usr/bin/env python3
"""For every organisation whose website was confirmed, look for a SELF-STATED
size signal - "we manage 240 homes", "over 1,000 vacation rentals", "350+
properties under management" - on its homepage and its about page.

Only a sentence the site itself prints is recorded; nothing is inferred and no
number is ever rounded or estimated (brief 2.3).

Usage: python3 scripts/find_size.py <sites.json> <out.json> [workers]
  sites.json: {"<org name>": "<https://site>", ...}
Run from the repo root. With no arguments it uses its default paths.
"""
import json, os, re, subprocess, sys, html as ihtml
from concurrent.futures import ThreadPoolExecutor

# Run from the repo root with no arguments and it regenerates its own output.
BASE = os.path.join("phase-3-acquisition", "prospects", "staylegal")
if not os.path.isdir(BASE):
    BASE = "."
DEFAULT_ARGS = [os.path.join(BASE, 'raw/sites_for_size.json'), os.path.join(BASE, 'raw/sizes.json')]
DEFAULT_ARGS.append('16')
if len(sys.argv) == 1:
    sys.argv += DEFAULT_ARGS


UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")

UNITS = (r"properties|homes|vacation rentals|short[- ]term rentals|rentals|units|"
         r"cabins|condos|listings|doors|villas|apartments")
PATS = [
    re.compile(r"(?:manage[sd]?|managing|oversee[s]?|operate[s]?|maintain[s]?|"
               r"portfolio of|represent[s]?)\s+(?:more than\s+|over\s+|nearly\s+|"
               r"upwards of\s+|about\s+|approximately\s+)?([0-9][0-9,]{1,6})\+?\s*"
               r"(?:" + UNITS + r")\b", re.I),
    re.compile(r"\b([0-9][0-9,]{1,6})\+?\s*(?:" + UNITS + r")\b\s*"
               r"(?:under management|in our portfolio|managed)", re.I),
    re.compile(r"\bover\s+([0-9][0-9,]{1,6})\s*(?:" + UNITS + r")\b", re.I),
    re.compile(r"\b([0-9][0-9,]{2,6})\+\s*(?:" + UNITS + r")\b", re.I),
]


def get(u):
    try:
        return subprocess.run(["curl", "-s", "-A", UA, "-m", "18", "-L",
                               "--max-filesize", "3000000", u],
                              capture_output=True, text=True, timeout=30).stdout
    except Exception:
        return ""


def scan(html_text):
    t = re.sub(r"<script.*?</script>", " ", html_text, flags=re.S)
    t = re.sub(r"<style.*?</style>", " ", t, flags=re.S)
    txt = re.sub(r"\s+", " ", ihtml.unescape(re.sub(r"<[^>]+>", " ", t)))
    for p in PATS:
        m = p.search(txt)
        if m:
            a, b = max(0, m.start() - 40), min(len(txt), m.end() + 20)
            return re.sub(r"\s+", " ", txt[a:b]).strip()[:140]
    return ""


def work(item):
    name, site = item
    for path in ("", "/about", "/about-us"):
        s = scan(get(site.rstrip("/") + path))
        if s:
            return name, {"size": s, "page": site.rstrip("/") + path}
    return name, {"size": "", "page": ""}


def main():
    sites = json.load(open(sys.argv[1]))
    outp = sys.argv[2]
    w = int(sys.argv[3]) if len(sys.argv) > 3 else 14
    done = json.load(open(outp)) if os.path.exists(outp) else {}
    todo = [(k, v) for k, v in sites.items() if k not in done]
    with ThreadPoolExecutor(max_workers=w) as ex:
        for i, (n, rec) in enumerate(ex.map(work, todo), 1):
            done[n] = rec
            if i % 50 == 0:
                json.dump(done, open(outp, "w"), indent=1)
                print(i, "of", len(todo), flush=True)
    json.dump(done, open(outp, "w"), indent=1)
    print("with a stated size:", sum(1 for v in done.values() if v["size"]))


if __name__ == "__main__":
    main()
