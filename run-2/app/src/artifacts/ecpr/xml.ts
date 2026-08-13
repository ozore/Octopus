/**
 * A DETERMINISTIC XML TREE AND SERIALIZER.
 *
 * AUTHORITY: `ARCHITECTURE.md` §3.5 (the CA eCPR XML is "validated against the
 * pinned XSD before the download link exists"), ADR-009.
 *
 * ===========================================================================
 * WHY A TREE AND NOT A TEMPLATE STRING
 *
 * The validator has to walk the DOCUMENT, not a string, or it becomes a second
 * parser with its own bugs — and the one thing worse than an unvalidated file is a
 * file that passed our validator and fails DIR's. So the writer builds a tree, the
 * validator checks the tree against the constraints extracted from the shipped
 * schema, and serialization happens last and cannot change what was validated.
 *
 * Serialization is byte-stable: children in insertion order, attributes in
 * insertion order, two-space indentation, `\n` endings, no self-closing shorthand
 * for elements that carry a fixed empty value. `payrollNum` and `amendmentNum` are
 * declared `fixed=""` in the schema and MUST be emitted as `<payrollNum></payrollNum>`
 * — DIR auto-increments them, and an element written as `<payrollNum/>` is a
 * different serialization of the same infoset that some consumers treat as absent
 * rather than empty. On a file we cannot observe the acceptance of (G2), the safe
 * form is the explicit one.
 */

export interface XmlElement {
  readonly name: string;
  readonly attributes?: Readonly<Record<string, string>>;
  readonly children?: readonly XmlElement[];
  /** Text content. Mutually exclusive with `children` in practice; when both are
   *  present the children win and the text is ignored, which the writer never does. */
  readonly text?: string;
}

export function element(
  name: string,
  text: string,
  attributes?: Readonly<Record<string, string>>,
): XmlElement {
  return attributes === undefined ? { name, text } : { name, text, attributes };
}

export function parent(
  name: string,
  children: readonly XmlElement[],
  attributes?: Readonly<Record<string, string>>,
): XmlElement {
  return attributes === undefined ? { name, children } : { name, children, attributes };
}

export function escapeXmlText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function escapeXmlAttribute(value: string): string {
  return escapeXmlText(value).replace(/"/g, '&quot;').replace(/\r?\n/g, '&#10;');
}

function serializeElement(node: XmlElement, depth: number, out: string[]): void {
  const indent = '  '.repeat(depth);
  const attributes = Object.entries(node.attributes ?? {})
    .map(([key, value]) => ` ${key}="${escapeXmlAttribute(value)}"`)
    .join('');

  if (node.children && node.children.length > 0) {
    out.push(`${indent}<${node.name}${attributes}>`);
    for (const child of node.children) serializeElement(child, depth + 1, out);
    out.push(`${indent}</${node.name}>`);
    return;
  }

  const text = node.text ?? '';
  out.push(`${indent}<${node.name}${attributes}>${escapeXmlText(text)}</${node.name}>`);
}

export interface SerializeOptions {
  /** Comment lines placed between the declaration and the root element. The
   *  provenance footer travels here, so the file explains itself in a text editor
   *  eighteen months later without our database (I6). */
  readonly comments?: readonly string[];
}

export function serializeXml(root: XmlElement, options: SerializeOptions = {}): string {
  const out: string[] = ['<?xml version="1.0" encoding="UTF-8"?>'];
  for (const comment of options.comments ?? []) {
    // `--` cannot appear inside an XML comment; the footer's em dashes are fine but
    // a doubled hyphen from customer text would produce a malformed document.
    out.push(`<!-- ${comment.replace(/--+/g, '—')} -->`);
  }
  serializeElement(root, 0, out);
  return `${out.join('\n')}\n`;
}

// ===========================================================================
// Tree access, for the validator
// ===========================================================================

export function childrenNamed(node: XmlElement, name: string): readonly XmlElement[] {
  return (node.children ?? []).filter((child) => child.name === name);
}

export function firstChild(node: XmlElement, name: string): XmlElement | undefined {
  return (node.children ?? []).find((child) => child.name === name);
}

/** Depth-first walk, parents before children. */
export function walk(node: XmlElement, visit: (node: XmlElement, path: string) => void, path = ''): void {
  const here = path === '' ? node.name : `${path}/${node.name}`;
  visit(node, here);
  for (const child of node.children ?? []) walk(child, visit, here);
}
