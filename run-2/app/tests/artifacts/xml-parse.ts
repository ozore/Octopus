/**
 * A MINIMAL XML READER, FOR TESTS ONLY.
 *
 * The writer validates the tree it built. That is the right place for the gate —
 * nothing can be emitted that was not validated — but it leaves one question open
 * that only a round trip answers: does the SERIALIZED FILE, read back as a
 * document, still satisfy the schema? An escaping bug, a stray attribute or a
 * mis-nested element would pass a tree check and fail DIR's parser.
 *
 * So the golden and validity tests parse the emitted string back and re-run
 * `validateEcpr` on the result. This reader handles exactly what the writer emits —
 * a declaration, comments, elements, attributes and escaped text — and throws on
 * anything else, which is itself the assertion that the writer emits nothing else.
 */

import type { XmlElement } from '@/artifacts';

function unescape(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#10;/g, '\n')
    .replace(/&amp;/g, '&');
}

interface Frame {
  name: string;
  attributes: Record<string, string>;
  children: XmlElement[];
  text: string;
}

export function parseXml(source: string): XmlElement {
  const stack: Frame[] = [];
  let root: XmlElement | undefined;
  let index = 0;

  while (index < source.length) {
    const open = source.indexOf('<', index);
    if (open === -1) break;

    if (open > index) {
      const between = source.slice(index, open);
      const frame = stack[stack.length - 1];
      if (frame !== undefined && between.trim() !== '') frame.text += between;
    }

    if (source.startsWith('<?', open)) {
      index = source.indexOf('?>', open) + 2;
      continue;
    }
    if (source.startsWith('<!--', open)) {
      index = source.indexOf('-->', open) + 3;
      continue;
    }

    const close = source.indexOf('>', open);
    if (close === -1) throw new Error('unterminated tag');
    const raw = source.slice(open + 1, close);

    if (raw.startsWith('/')) {
      const frame = stack.pop();
      if (frame === undefined) throw new Error(`unbalanced close tag ${raw}`);
      if (frame.name !== raw.slice(1)) throw new Error(`mismatched close tag ${raw} for ${frame.name}`);
      const node: XmlElement =
        frame.children.length > 0
          ? { name: frame.name, attributes: frame.attributes, children: frame.children }
          : { name: frame.name, attributes: frame.attributes, text: unescape(frame.text) };
      const parent = stack[stack.length - 1];
      if (parent === undefined) root = node;
      else parent.children.push(node);
      index = close + 1;
      continue;
    }

    if (raw.endsWith('/')) {
      throw new Error(
        `self-closing element <${raw}> — the writer never emits one, because a ` +
          'fixed-empty element written in shorthand is read as absent by some consumers',
      );
    }

    const nameMatch = /^([\w:.-]+)/.exec(raw);
    const name = nameMatch?.[1];
    if (name === undefined) throw new Error(`unparseable tag <${raw}>`);
    const attributes: Record<string, string> = {};
    for (const attribute of raw.slice(name.length).matchAll(/([\w:.-]+)="([^"]*)"/g)) {
      attributes[attribute[1] ?? ''] = unescape(attribute[2] ?? '');
    }
    stack.push({ name, attributes, children: [], text: '' });
    index = close + 1;
  }

  if (stack.length > 0) throw new Error(`unclosed element ${stack[stack.length - 1]?.name}`);
  if (root === undefined) throw new Error('no root element');
  return root;
}
