# research/raw — the cached source pages

Every page the nine launch records were read from, exactly as fetched on 2026-09-03, gzipped.
Kept so that a reviewer can check a reading without re-fetching, and so that the *first* version of a
page is still available when the drift cron says it changed.

- Filenames are the URL with `/ . ? = % &` replaced by `_`.
- The authoritative list of sources, with content hashes, is `../kb-data/_sources.json`;
  the catalogue with titles and kinds is `../kb-scripts/sources.json`.
- To re-fetch and re-hash everything: `python3 ../kb-scripts/refresh_sources.py --write-baseline`.
- To read one: `zcat <file> | python3 -c "import sys;sys.path.insert(0,'../kb-scripts');import lib_kb;print(lib_kb.html_to_text(sys.stdin.read()))"`

These are third-party pages cached for verification. Nothing here is republished: the knowledge base
stores our own structured reading plus quotations of 25 words or fewer (gate G4).
