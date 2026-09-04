# Self-hosted webfonts — provenance and licence

Two files, both **SIL Open Font License 1.1** (full text in `OFL.txt`, copied from the
upstream repositories on 2026-09-03). Both are the **Latin subset, variable-weight** builds
Google Fonts serves; each carries its whole usable weight range in one file, which is why
there are two files and not five.

| file | family | axis | bytes | fetched from |
|---|---|---|---|---|
| `source-sans-3-latin.woff2` | Source Sans 3 (`--c-font-ui`) | `wght 200..900` | 28,792 | `https://fonts.gstatic.com/s/sourcesans3/v19/nwpStKy2OAdR1K-IwhWudF-R3w8aZejf5Hc.woff2` |
| `source-code-pro-latin.woff2` | Source Code Pro (`--c-font-num`) | `wght 200..900` | 21,968 | `https://fonts.gstatic.com/s/sourcecodepro/v31/HI_SiYsKILxRpg3hIP6sJ7fM7PqlPevWnsUnxg.woff2` |

Total **50.5 KB**, inside `LANDING_SPEC.md` §10's ≤ 60 KB font budget.

Copyright lines, reproduced because OFL 1.1 §2 requires the notice to travel with the files:

- *Copyright 2010-2020 Adobe (http://www.adobe.com/), with Reserved Font Name 'Source'.*
- *Copyright 2010, 2012 Adobe Systems Incorporated (http://www.adobe.com/), with Reserved Font Name 'Source'.*

**Reserved Font Name.** OFL 1.1 §3 forbids shipping a *modified* font under a name containing
"Source". These files are unmodified upstream subsets, served under their own names, so the
clause is satisfied by doing nothing. If a future subsetting pass re-generates them, rename the
family in the `@font-face` block first.

## Why self-hosted and not `next/font/google`

`LANDING_SPEC.md` §10 budgets **zero third-party requests on first view** and CI enforces it;
`IDENTITY.md` §7.1's "exactly one stylesheet link to `fonts.googleapis.com`" is the pre-arbitration
text that `REVIEW.md` R3 **I-5** rules against, and `LANDING_SPEC.md` §10 settles it: self-hosted at
build time. `next/font/google` self-hosts too — but it downloads from Google **during the build**,
which makes an offline or network-restricted build fail. These files are committed, so
`npm run build` needs no network at all. The `@font-face` declarations live in
`src/styles/fonts.css`, never in `design-system.css` (which is byte-identical to
`phase-4-revenue/certly/design-system.css` and must stay that way).
