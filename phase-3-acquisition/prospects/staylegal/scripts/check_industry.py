#!/usr/bin/env python3
"""Quality gate: a domain built from a company's name can land on an unrelated
business that happens to share the name (a "Park Place" car dealership, a
"Mynd" video agency). Re-open every confirmed site and keep the website only if
the page actually reads as a rental / property-management business.

Usage: python3 scripts/check_industry.py <sites.json> <out.json> [workers]
Run from the repo root. With no arguments it uses its default paths.
"""
import json, os, re, subprocess, sys, html as ihtml
from concurrent.futures import ThreadPoolExecutor

# Run from the repo root with no arguments and it regenerates its own output.
BASE = os.path.join("phase-3-acquisition", "prospects", "staylegal")
if not os.path.isdir(BASE):
    BASE = "."
DEFAULT_ARGS = [os.path.join(BASE, 'raw/sites_for_ind.json'), os.path.join(BASE, 'raw/industry.json')]
DEFAULT_ARGS.append('16')
if len(sys.argv) == 1:
    sys.argv += DEFAULT_ARGS


UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")
SIG = ("property management", "vacation rental", "short-term rental",
       "short term rental", "airbnb", "vrbo", "co-host", "cohost", "rental management",
       "manage your property", "manage your home", "for owners", "owner portal",
       "homes for rent", "rental property", "guest", "book your stay", "nightly rate",
       "property manager", "we manage", "list your property", "list with us",
       "rentals", "lodging", "hospitality")


def work(item):
    name, site = item
    try:
        p = subprocess.run(["curl", "-s", "-A", UA, "-m", "18", "-L",
                            "--max-filesize", "3000000", site],
                           capture_output=True, text=True, timeout=30).stdout
    except Exception:
        return name, {"ok": None, "why": "fetch failed"}
    if len(p) < 700:
        return name, {"ok": None, "why": "no page"}
    txt = re.sub(r"<script.*?</script>", " ", p, flags=re.S)
    txt = re.sub(r"\s+", " ", ihtml.unescape(re.sub(r"<[^>]+>", " ", txt))).lower()
    hits = [s for s in SIG if s in txt]
    return name, {"ok": len(hits) >= 2, "why": ", ".join(hits[:4])}


def main():
    sites = json.load(open(sys.argv[1]))
    outp = sys.argv[2]
    w = int(sys.argv[3]) if len(sys.argv) > 3 else 16
    done = json.load(open(outp)) if os.path.exists(outp) else {}
    todo = [(k, v) for k, v in sites.items() if k not in done]
    with ThreadPoolExecutor(max_workers=w) as ex:
        for i, (n, rec) in enumerate(ex.map(work, todo), 1):
            done[n] = rec
            if i % 50 == 0:
                json.dump(done, open(outp, "w"), indent=1)
                print(i, "of", len(todo), flush=True)
    json.dump(done, open(outp, "w"), indent=1)
    bad = [k for k, v in done.items() if v["ok"] is False]
    print("rejected", len(bad), "of", len(done), ":", bad[:40])


if __name__ == "__main__":
    main()
