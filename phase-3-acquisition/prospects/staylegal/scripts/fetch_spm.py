#!/usr/bin/env python3
"""Fill the resort/beach/mountain markets that BNBCalc does not cover by
reading STR Profit Map's per-jurisdiction regulation pages.

Only what the page states is kept: whether STRs are allowed, the registration
or permit fee sentence, and the renewal cadence. Anything the page does not
state stays empty.

Usage: python3 scripts/fetch_spm.py <urls.txt> <out.json> [workers]
Run from the repo root. With no arguments it uses its default paths.
"""
import json, os, re, subprocess, sys, html as ihtml
from concurrent.futures import ThreadPoolExecutor

# Run from the repo root with no arguments and it regenerates its own output.
BASE = os.path.join("phase-3-acquisition", "prospects", "staylegal")
if not os.path.isdir(BASE):
    BASE = "."
DEFAULT_ARGS = [os.path.join(BASE, 'raw/spm_sel.txt'), os.path.join(BASE, 'raw/spm.json')]
DEFAULT_ARGS.append('8')
if len(sys.argv) == 1:
    sys.argv += DEFAULT_ARGS


UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")
FEEWORD = re.compile(r"registration fee|permit fee|licen[cs]e fee|application fee|"
                     r"fee is|fees? (?:are|of|start|range)|costs?", re.I)
PERUNIT = re.compile(r"per (night|stay|guest)|nightly|tourist development tax|"
                     r"sales tax|lodging tax|occupancy tax", re.I)


def work(u):
    try:
        h = subprocess.run(["curl", "-s", "-A", UA, "-m", "30", "-L", u],
                           capture_output=True, text=True, timeout=50).stdout
    except Exception:
        return u, None
    if len(h) < 5000:
        return u, None
    t = re.sub(r"<script.*?</script>", " ", h, flags=re.S)
    t = re.sub(r"<style.*?</style>", " ", t, flags=re.S)
    txt = re.sub(r"\s+", " ", ihtml.unescape(re.sub(r"<[^>]+>", " ", t)))
    ttl = re.findall(r"<title[^>]*>(.*?)</title>", h, flags=re.S)
    ttl = ihtml.unescape(re.sub(r"<[^>]+>", "", ttl[0])).strip() if ttl else ""
    m = re.search(r"Overview: Short-Term Rental Allowances[^.]*\.(.{0,600})", txt)
    overview = (m.group(1) if m else txt[:500]).strip()
    fee = ""
    for sent in re.split(r"(?<=[.!?]) ", txt):
        if "$" not in sent or not FEEWORD.search(sent) or PERUNIT.search(sent):
            continue
        if not re.search(r"registration|permit|licen[cs]e", sent, re.I):
            continue
        fee = re.sub(r"\s+", " ", sent).strip()[:260]
        break
    ren = ""
    m = re.search(r"(annual(?:ly)?|each year|every year|yearly|biennial|"
                  r"two-year|three-year|every two years)", txt, re.I)
    if m:
        ren = m.group(0).lower()
    allowed = ""
    if re.search(r"ARE explicitly allowed|are allowed", txt, re.I):
        allowed = "allowed"
    if re.search(r"prohibited|are NOT allowed|banned", txt, re.I):
        allowed = (allowed + "; restricted/prohibited in part").strip("; ")
    return u, {"title": ttl, "overview": overview[:400], "fee": fee,
               "renewal": ren, "allowed": allowed}


def main():
    urls = [l.strip() for l in open(sys.argv[1]) if l.strip()]
    outp = sys.argv[2]
    w = int(sys.argv[3]) if len(sys.argv) > 3 else 8
    done = json.load(open(outp)) if os.path.exists(outp) else {}
    todo = [u for u in urls if u not in done]
    with ThreadPoolExecutor(max_workers=w) as ex:
        for i, (u, rec) in enumerate(ex.map(work, todo), 1):
            done[u] = rec
            print(i, u, "ok" if rec else "FAIL", flush=True)
    json.dump(done, open(outp, "w"), indent=1)


if __name__ == "__main__":
    main()
