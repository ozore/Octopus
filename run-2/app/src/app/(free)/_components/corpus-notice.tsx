/**
 * THE CORPUS NOTICE AND THE SNAPSHOT LINE — on every anonymous page.
 *
 * AUTHORITY: `USER_JOURNEY.md` §2.3 ("Corpus at L1 or L2 → the page's 'as of' line
 * narrows … Same sentence the artifact footer uses — one source, three surfaces"),
 * §1.4 (MED-10: an anonymous visitor never sees an in-product banner, because there
 * is no in-product — so the honesty has to be on the page and on the paper),
 * `CORPUS_DESIGN.md` §6.4 (the lookup page keeps rendering, never blank, never
 * silently stale), `DESIGN_SYSTEM.md` §8.9.
 *
 * ONE SOURCE. The sentence comes from `corpusBanner()` in `src/corpus/ladder.ts` —
 * the same function the paid banner uses, with `paying: false`, which is the only
 * difference between the two: a free visitor gets the identical sentence and the
 * identical timestamp and no credit, because they paid nothing. That symmetry is
 * the point. The honesty is a property of the corpus state, not of the price.
 */

import { corpusBanner } from '@/corpus';

import type { CorpusState } from '../_data/mirror';
import { stamp } from '../_lib/format';
import { RefusalView } from './refusal';

export function CorpusNotice({ corpus }: { readonly corpus: CorpusState }): React.ReactElement | null {
  const banner = corpusBanner({ ...corpus.ladder, paying: false });
  if (banner === null) return null;
  return <RefusalView refusal={banner} />;
}

/**
 * The snapshot line — the corpus snapshot date on every page, which is the
 * programmatic set's own provenance footer.
 *
 * It prints the promoted snapshot's reference and the moment it was promoted, not
 * "today". `corpusVerifiedAt` is the last time a snapshot passed every gate; a job
 * that runs every night and is held every night advances nothing, and this line has
 * to say so or the freshness guarantee is a lie.
 */
export function SnapshotLine({ corpus }: { readonly corpus: CorpusState }): React.ReactElement {
  return (
    <p className="rp-prov rp-prov--chip rp-num">
      {corpus.snapshotRef === null
        ? 'No corpus snapshot has been promoted yet. Nothing on this page is verified against the source.'
        : `Corpus snapshot ${corpus.snapshotRef} · promoted ${stamp(corpus.verifiedAt)} · this page is rendered from that snapshot and changes only when a new one is promoted.`}
    </p>
  );
}
