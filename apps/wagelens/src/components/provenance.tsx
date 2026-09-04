/**
 * THE COMPONENT THAT RENDERS A RATE IS THE COMPONENT THAT RENDERS ITS SOURCE.
 *
 * That sentence is gate **G8** (KNOWLEDGE_BASE §7), and it is the difference
 * between "every rate carries its source" being an enforceable property and
 * being a line in a marketing page. There is no other path to a currency figure
 * derived from a determination in this codebase: `<Rate>` stamps
 * `data-wd-number`, `data-modification` and `data-published` onto the element
 * that carries the number, and `tests/gates.test.ts` plus the Playwright spec
 * assert it on rendered pages.
 *
 * **Failing closed is the whole point.** A rate whose provenance is missing is
 * NOT rendered: the row says "source unavailable — open the determination" and
 * links out (WL-11 Errors). Showing the number without the source is the one
 * outcome this component exists to prevent.
 *
 * Every colour comes from the semantic `--wl-*` tokens through the classes in
 * `design-system.css` (`.wl-prov`, `.wl-source`, `.wl-disclaimer`). No hex
 * appears in this file, and none may: this app's palette is pinned by
 * `IDENTITY_ARBITRATION.md`, so a component that reached for a hex would be a
 * component the fleet cannot re-theme.
 */

import type { ReactNode } from 'react';

import { publicDeterminationUrl } from '@/lib/kb';

export type Provenance = {
  wdNumber: string;
  modificationNumber: number;
  /** ISO day, as stored. */
  publicationDate: string;
  lastVerified?: Date | string | null;
  publicUrl?: string;
  /** Present when the determination shown has been superseded — including the
   *  deliberate 29 CFR 1.6 case, where the contract's own modification governs
   *  and we say so permanently instead of moving the pin. */
  newerModification?: { modificationNumber: number; publicationDate: string } | null;
  /** Corpus older than gate G6's 35 days. Rendered in amber, never hidden. */
  stale?: boolean;
};

export function formatDay(value: string | Date | null | undefined): string {
  if (!value) return 'unknown';
  const date = typeof value === 'string' ? new Date(`${value.slice(0, 10)}T00:00:00Z`) : value;
  if (Number.isNaN(date.valueOf())) return String(value);
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatMoney(value: string | number): string {
  const amount = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(amount)) return '—';
  return `$${amount.toFixed(2)}`;
}

function sourceUrlOf(p: Provenance): string {
  return p.publicUrl ?? publicDeterminationUrl(p.wdNumber, p.modificationNumber);
}

/** The chip form: `⧉ TX20260253 · Mod 1`. Links to the official determination. */
export function SourceChip({ provenance, label }: { provenance: Provenance; label?: string }) {
  const classes = ['wl-source'];
  if (provenance.stale) classes.push('wl-source--stale');
  if (provenance.newerModification) classes.push('wl-source--moved');
  return (
    <a
      className={classes.join(' ')}
      href={sourceUrlOf(provenance)}
      target="_blank"
      rel="noreferrer noopener"
      data-testid="source-chip"
      data-wd-number={provenance.wdNumber}
      data-modification={provenance.modificationNumber}
    >
      ⧉ {label ?? `${provenance.wdNumber} · Mod ${provenance.modificationNumber}`}
    </a>
  );
}

/**
 * The one-line provenance statement, verbatim from KNOWLEDGE_BASE §9.1:
 * *"Rate from {wd}, modification {mod}, published {date}. [View the official
 * determination on SAM.gov ↗] · verified {last_verified}"*.
 */
export function ProvenanceLine({ provenance }: { provenance: Provenance }) {
  return (
    <span
      className="wl-2xs wl-muted"
      data-testid="provenance-line"
      data-wd-number={provenance.wdNumber}
      data-modification={provenance.modificationNumber}
      data-published={provenance.publicationDate}
    >
      Rate from wage determination <span className="wl-mono">{provenance.wdNumber}</span>,
      modification <span className="wl-mono">{provenance.modificationNumber}</span>, published{' '}
      {formatDay(provenance.publicationDate)}.{' '}
      <a className="wl-source" href={sourceUrlOf(provenance)} target="_blank" rel="noreferrer noopener">
        View the official determination on SAM.gov ↗
      </a>
      {provenance.lastVerified ? <> · verified {formatDay(provenance.lastVerified)}</> : null}
      {provenance.newerModification ? (
        <>
          {' '}
          · <SupersededNotice provenance={provenance} />
        </>
      ) : null}
    </span>
  );
}

/**
 * The permanent, informational line for a determination the user is deliberately
 * reading (or pinned to) at an older modification.
 *
 * It is a STATEMENT OF FACT, never a warning to be cleared and never a block
 * (WL-02 V3b). 29 CFR 1.6 fixes the applicable determination at solicitation or
 * award: the contract governs, and nothing in this product moves a pin by
 * itself.
 */
export function SupersededNotice({ provenance }: { provenance: Provenance }) {
  if (!provenance.newerModification) return null;
  return (
    <span data-testid="superseded-notice">
      a newer modification ({provenance.newerModification.modificationNumber}) was published on{' '}
      {formatDay(provenance.newerModification.publicationDate)}
    </span>
  );
}

/**
 * A currency figure derived from a determination. There is no other way to put
 * one on a screen.
 */
export function Rate({
  base,
  fringe,
  provenance,
  label,
}: {
  base: string | number;
  fringe?: string | number | null;
  provenance: Provenance | null | undefined;
  label?: string;
}) {
  if (!provenance) {
    // Fail closed (WL-11 Errors). The number is withheld, not the explanation.
    return (
      <span className="wl-xs" data-testid="rate-source-unavailable">
        source unavailable — open the determination
      </span>
    );
  }
  return (
    <span
      className="wl-num"
      data-testid="rate"
      data-wd-number={provenance.wdNumber}
      data-modification={provenance.modificationNumber}
      data-published={provenance.publicationDate}
      title={`${provenance.wdNumber} mod ${provenance.modificationNumber}, published ${formatDay(provenance.publicationDate)}`}
    >
      {label ? <span className="wl-visually-hidden">{label}: </span> : null}
      {formatMoney(base)}
      {fringe !== undefined && fringe !== null ? (
        <>
          {' '}
          <span className="wl-muted">/</span> {formatMoney(fringe)}
        </>
      ) : null}
    </span>
  );
}

/**
 * The provenance card — the signature component from `identity/samples.html`
 * (`.wl-prov`). Everything a person needs in order to check us, in the order
 * the identity fleet specified: the determination, where and what it covers,
 * when it was published and when we read it, the rate, and the way out to the
 * source.
 */
export function ProvenanceCard({
  provenance,
  scope,
  classification,
  base,
  fringe,
  children,
}: {
  provenance: Provenance;
  /** "Harris County, TX · Building construction" */
  scope?: string;
  classification?: string;
  base?: string | number;
  fringe?: string | number | null;
  children?: ReactNode;
}) {
  return (
    <div
      className="wl-prov"
      data-testid="provenance-card"
      data-wd-number={provenance.wdNumber}
      data-modification={provenance.modificationNumber}
      data-published={provenance.publicationDate}
    >
      <span className="wl-prov__wd">
        General Decision {provenance.wdNumber} · Modification {provenance.modificationNumber}
      </span>
      {scope ? <span className="wl-prov__meta">{scope}</span> : null}
      <span className="wl-prov__meta">
        Published {formatDay(provenance.publicationDate)}
        {provenance.lastVerified ? <> · read {formatDay(provenance.lastVerified)}</> : null}
      </span>
      {provenance.newerModification ? (
        <span className="wl-prov__meta" data-testid="provenance-superseded">
          <SupersededNotice provenance={provenance} />. Your contract governs; we will not move this
          for you.
        </span>
      ) : null}
      {provenance.stale ? (
        <span className="wl-prov__meta" data-testid="provenance-stale">
          We last read this more than 35 days ago — verify against SAM.gov before you file.
        </span>
      ) : null}
      {base !== undefined ? (
        <span className="wl-prov__rate">
          <Rate base={base} fringe={fringe ?? null} provenance={provenance} />{' '}
          <small>base / fringe</small>
        </span>
      ) : null}
      <span className="wl-prov__foot">
        <span className="wl-2xs">{classification ?? 'Wage determination'}</span>
        <a
          className="wl-source"
          href={sourceUrlOf(provenance)}
          target="_blank"
          rel="noreferrer noopener"
        >
          ⧉ View the determination
        </a>
      </span>
      {children}
    </div>
  );
}
