/**
 * THE STATUS CHIP — a word, a glyph, a border style, and only then a hue.
 *
 * AUTHORITY: `DESIGN_SYSTEM.md` R3 and §8.7 (four independent channels, because
 * these documents are printed on monochrome laser printers, faxed and photocopied),
 * `USER_JOURNEY.md` §7.2 (the three statuses), `ARCHITECTURE.md` §6.3.
 *
 * The chip is a pure function of `ArtifactStatus`, which `deriveStatus` is the only
 * constructor of. There is no `variant` prop, no `tone`, and no way for a caller to
 * render a status the gate did not produce — which is the point: a screen that could
 * choose its own chip would be a second status machine.
 *
 * THERE IS NO SUCCESS CHIP. `DESIGN_SYSTEM.md` §4.1: "a design system that ships an
 * `alert--success` component is a system in which somebody will eventually write
 * 'Your filing is compliant.'" CERTIFIABLE is a status, not a congratulation.
 */

import type { ArtifactStatus } from '@/lib/types';

const CHIP: Readonly<
  Record<ArtifactStatus, { readonly word: string; readonly glyph: string; readonly modifier: string }>
> = {
  CERTIFIABLE: { word: 'Certifiable', glyph: '✓', modifier: 'rp-status--certifiable' },
  CERTIFIABLE_DATED: { word: 'Certifiable (dated)', glyph: '!', modifier: 'rp-status--dated' },
  DRAFT_NOT_CERTIFIABLE: {
    word: 'Draft — not certifiable',
    glyph: '✕',
    modifier: 'rp-status--draft',
  },
};

export function StatusChip({
  status,
  large,
}: {
  readonly status: ArtifactStatus;
  readonly large?: boolean;
}): React.ReactElement {
  const chip = CHIP[status];
  return (
    <span className={`rp-status ${chip.modifier}${large === true ? ' rp-status--lg' : ''}`}>
      <span className="rp-status__glyph" aria-hidden="true">
        {chip.glyph}
      </span>
      {chip.word}
    </span>
  );
}

/**
 * The second chip — the California artifact's own status (§10.2).
 *
 * It takes a boolean and a label rather than an `ArtifactStatus`, because the XML's
 * states are not the PDF's: a file that cannot be emitted is BLOCKED, which is not
 * one of the three statuses the WH-347 gate produces. Two chips, never one; a single
 * blended status would have to lie about one of them.
 */
export function ArtifactChip({
  blocked,
  label,
}: {
  readonly blocked: boolean;
  readonly label: string;
}): React.ReactElement {
  return (
    <span className={`rp-status ${blocked ? 'rp-status--draft' : 'rp-status--dated'}`}>
      <span className="rp-status__glyph" aria-hidden="true">
        {blocked ? '✕' : '!'}
      </span>
      {label}
    </span>
  );
}
