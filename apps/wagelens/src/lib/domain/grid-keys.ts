/**
 * THE KEYBOARD MAP. One table, in one place (WL-05 "Keyboard model", finding M5).
 *
 * `UX.md` §7 used to carry a second, different map for the same screen — they
 * disagreed about what `Ctrl/⌘+D` fills, what `Ctrl/⌘+→` fills and how the week
 * saves — so the spec's version won (it is the one with test cases attached),
 * `UX.md` now points here, and two of UX's shortcuts were better and were
 * adopted: `Esc` reverts a cell, and `S` splits a day into a second
 * classification row.
 *
 * **THE ENUMERATION IS THE CONTRACT.** `hours_keyboard_shortcut_used
 * {shortcut}` carries exactly these values and nothing else: a shortcut that is
 * not in this table does not exist. `tests/hours-grid.test.ts` asserts the two
 * lists are equal in both directions, which is the guard against the two maps
 * drifting apart again.
 *
 * This module is deliberately free of React, the database and the request: the
 * grid component and the test both read the same table.
 */

export const KEYBOARD_SHORTCUTS = [
  'tab',
  'arrow',
  'enter',
  'esc',
  'type_through',
  'default_day',
  'zero',
  'fill_down',
  'fill_week',
  'save',
  'split',
  'palette',
  'overlay',
  'goto',
  'paste',
] as const;

export type KeyboardShortcut = (typeof KEYBOARD_SHORTCUTS)[number];

const SHORTCUTS = new Set<string>(KEYBOARD_SHORTCUTS);

export function isKeyboardShortcut(value: string): value is KeyboardShortcut {
  return SHORTCUTS.has(value);
}

/** What the shortcut overlay (`?`) prints, in the spec's order. */
export const SHORTCUT_HELP: Array<{ keys: string; shortcut: KeyboardShortcut; what: string }> = [
  { keys: 'Tab / Shift-Tab', shortcut: 'tab', what: 'Next or previous cell, across the row then down. Computed cells are skipped.' },
  { keys: '↑ ↓ ← →', shortcut: 'arrow', what: 'Move a cell at a time, wrapping at the row ends.' },
  { keys: 'Enter', shortcut: 'enter', what: 'Down one row, same column.' },
  { keys: 'Esc', shortcut: 'esc', what: 'Put the cell back to its last saved value and leave edit mode.' },
  { keys: '0–9 and .', shortcut: 'type_through', what: 'Start typing straight into a numeric cell. No Enter first.' },
  { keys: '. or Space on an empty day', shortcut: 'default_day', what: 'Fill the default daily hours for this organisation.' },
  { keys: '- or 0', shortcut: 'zero', what: 'Zero, and move on.' },
  { keys: 'Ctrl/⌘ + D', shortcut: 'fill_down', what: 'Copy the cell above. One cell, not the column.' },
  { keys: 'Ctrl/⌘ + →', shortcut: 'fill_week', what: 'Fill the rest of the workweek with this cell’s value.' },
  { keys: 'Ctrl/⌘ + S', shortcut: 'save', what: 'Save the draft now.' },
  { keys: 'S on a day cell', shortcut: 'split', what: 'Split this day: a second line for the same worker under another classification.' },
  { keys: 'Ctrl/⌘ + K', shortcut: 'palette', what: 'Rate lookup.' },
  { keys: 'Ctrl/⌘ + / or ?', shortcut: 'overlay', what: 'This list.' },
  { keys: 'G then W / P / F', shortcut: 'goto', what: 'Go to the week, the project, or the flags.' },
  { keys: 'Paste', shortcut: 'paste', what: 'A rectangular tab- or comma-separated block, previewed before it commits.' },
];

/** The shape of a key event, without importing React's synthetic one. */
export type KeyLike = {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
};

/**
 * Which shortcut a key press is, or `null` for an ordinary character.
 *
 * `cellIsEmpty` matters because `.` and `Space` mean "the default daily hours"
 * only on an EMPTY day cell; on a cell with a value they are ordinary typing.
 */
export function resolveShortcut(
  event: KeyLike,
  context: { cellIsEmpty?: boolean; gotoPending?: boolean } = {},
): KeyboardShortcut | null {
  const modified = Boolean(event.ctrlKey || event.metaKey);
  if (modified) {
    switch (event.key.toLowerCase()) {
      case 'd':
        return 'fill_down';
      case 'arrowright':
        return 'fill_week';
      case 's':
        return 'save';
      case 'k':
        return 'palette';
      case '/':
        return 'overlay';
      default:
        return null;
    }
  }
  if (context.gotoPending && ['w', 'p', 'f'].includes(event.key.toLowerCase())) return 'goto';
  switch (event.key) {
    case 'Tab':
      return 'tab';
    case 'Enter':
      return 'enter';
    case 'Escape':
      return 'esc';
    case 'ArrowUp':
    case 'ArrowDown':
    case 'ArrowLeft':
    case 'ArrowRight':
      return 'arrow';
    case '?':
      return 'overlay';
    case '-':
    case '0':
      return 'zero';
    case 'g':
    case 'G':
      return 'goto';
    case 's':
    case 'S':
      return 'split';
    default:
      break;
  }
  if ((event.key === '.' || event.key === ' ') && context.cellIsEmpty) return 'default_day';
  if (/^[0-9.]$/.test(event.key)) return 'type_through';
  return null;
}

/**
 * A pasted rectangular block, tab- or comma-separated, as a grid of cells.
 * Returned for a PREVIEW; nothing commits until the user says so (UX §5.3).
 */
export function parsePastedBlock(text: string): string[][] {
  const rows = text.replace(/\r\n?/g, '\n').split('\n').filter((row) => row.trim() !== '');
  const cells = rows.map((row) => (row.includes('\t') ? row.split('\t') : row.split(',')));
  const width = Math.max(0, ...cells.map((row) => row.length));
  // Rectangular by construction: a ragged paste is padded rather than refused,
  // because the common ragged paste is a trailing empty column.
  return cells.map((row) => {
    const padded = [...row];
    while (padded.length < width) padded.push('');
    return padded.map((cell) => cell.trim());
  });
}
