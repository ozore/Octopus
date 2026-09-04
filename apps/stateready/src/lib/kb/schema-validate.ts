/**
 * A JSON Schema *subset* validator, ported line for line from
 * `kb-scripts/validate.py`'s `validate_node`.
 *
 * WHY A PORT AND NOT A LIBRARY. Three reasons, in the order that decided it:
 *
 *  1. The Python gate is what the knowledge base is authored against and what
 *     CI runs on the source tree. If this file implemented a *different* subset,
 *     the app could accept a record the authoring pipeline rejects, or refuse
 *     one it blessed — and the failure would appear as a boot crash on a deploy
 *     nobody could explain. Same subset, same keywords, same error strings.
 *  2. `PLAN.md`'s vendor list is closed and a schema library is a dependency
 *     with a CVE surface, for ~120 lines of work.
 *  3. `validate.py` carries a trap `product/CLAUDE.md` records explicitly: an
 *     unsupported keyword inside an `allOf`/`if` probe silently disables the
 *     branch. It is reproduced here as an ERROR on the unknown keyword, exactly
 *     as the Python does, so a schema edit that outgrows this file fails loudly
 *     in both places rather than passing quietly in one.
 *
 * `$ref` resolution is limited to the two sibling ontology files, which is all
 * the ontology uses.
 */

const KNOWN = new Set([
  '$schema',
  '$id',
  '$ref',
  '$comment',
  'title',
  'description',
  'type',
  'enum',
  'const',
  'properties',
  'required',
  'additionalProperties',
  'items',
  'minItems',
  'maxItems',
  'maxLength',
  'minLength',
  'minimum',
  'maximum',
  'pattern',
  'propertyNames',
  'format',
  'allOf',
  'if',
  'then',
  'else',
  'default',
  'examples',
]);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const URI_RE = /^https?:\/\/\S+$/;

export type SchemaResolver = (ref: string) => Record<string, unknown> | undefined;

function typeOk(value: unknown, expected: unknown): boolean {
  const types = Array.isArray(expected) ? expected : [expected];
  for (const t of types) {
    if (t === 'object' && value !== null && typeof value === 'object' && !Array.isArray(value)) return true;
    if (t === 'array' && Array.isArray(value)) return true;
    if (t === 'string' && typeof value === 'string') return true;
    if (t === 'number' && typeof value === 'number' && Number.isFinite(value)) return true;
    if (t === 'integer' && typeof value === 'number' && Number.isInteger(value)) return true;
    if (t === 'boolean' && typeof value === 'boolean') return true;
    if (t === 'null' && value === null) return true;
  }
  return false;
}

function typeName(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

export function validateNode(
  value: unknown,
  schema: Record<string, unknown>,
  path: string,
  errors: string[],
  resolve: SchemaResolver,
): void {
  const unknown = Object.keys(schema).filter((k) => !KNOWN.has(k));
  if (unknown.length > 0) {
    errors.push(`${path}: schema uses unsupported keyword(s) ${JSON.stringify(unknown.sort())} — extend schema-validate.ts`);
  }

  if (typeof schema['$ref'] === 'string') {
    const target = resolve(schema['$ref'] as string);
    if (!target) {
      errors.push(`${path}: cannot resolve $ref ${String(schema['$ref'])}`);
      return;
    }
    validateNode(value, target, path, errors, resolve);
    const rest = Object.fromEntries(Object.entries(schema).filter(([k]) => k !== '$ref'));
    if (Object.keys(rest).length > 0) validateNode(value, rest, path, errors, resolve);
    return;
  }

  if ('type' in schema && !typeOk(value, schema['type'])) {
    errors.push(`${path}: expected type ${JSON.stringify(schema['type'])}, got ${typeName(value)}`);
    return;
  }
  if (Array.isArray(schema['enum']) && !(schema['enum'] as unknown[]).some((e) => e === value)) {
    errors.push(`${path}: ${JSON.stringify(value)} not in enum ${JSON.stringify(schema['enum'])}`);
  }
  if ('const' in schema && value !== schema['const']) {
    errors.push(`${path}: expected const ${JSON.stringify(schema['const'])}, got ${JSON.stringify(value)}`);
  }

  if (typeof value === 'number') {
    if (typeof schema['minimum'] === 'number' && value < (schema['minimum'] as number)) {
      errors.push(`${path}: ${value} is below minimum ${String(schema['minimum'])}`);
    }
    if (typeof schema['maximum'] === 'number' && value > (schema['maximum'] as number)) {
      errors.push(`${path}: ${value} is above maximum ${String(schema['maximum'])}`);
    }
  }

  if (typeof value === 'string') {
    if (typeof schema['pattern'] === 'string' && !new RegExp(schema['pattern'] as string).test(value)) {
      errors.push(`${path}: ${JSON.stringify(value)} does not match ${String(schema['pattern'])}`);
    }
    if (typeof schema['maxLength'] === 'number' && value.length > (schema['maxLength'] as number)) {
      errors.push(`${path}: string longer than maxLength ${String(schema['maxLength'])}`);
    }
    const fmt = schema['format'];
    if (fmt === 'date' && !DATE_RE.test(value)) errors.push(`${path}: ${JSON.stringify(value)} is not an ISO date`);
    if (fmt === 'uri' && !URI_RE.test(value)) errors.push(`${path}: ${JSON.stringify(value)} is not an http(s) URI`);
  }

  if (Array.isArray(value)) {
    if (typeof schema['minItems'] === 'number' && value.length < (schema['minItems'] as number)) {
      errors.push(`${path}: ${value.length} items, minItems ${String(schema['minItems'])}`);
    }
    const items = schema['items'];
    if (items && typeof items === 'object') {
      value.forEach((item, i) =>
        validateNode(item, items as Record<string, unknown>, `${path}[${i}]`, errors, resolve),
      );
    }
  }

  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const props = (schema['properties'] as Record<string, Record<string, unknown>> | undefined) ?? {};
    for (const req of (schema['required'] as string[] | undefined) ?? []) {
      if (!(req in obj)) errors.push(`${path}: missing required property '${req}'`);
    }
    if (schema['additionalProperties'] === false) {
      for (const key of Object.keys(obj)) {
        if (!(key in props) && !key.startsWith('_')) errors.push(`${path}: unexpected property '${key}'`);
      }
    }
    const propertyNames = schema['propertyNames'];
    if (propertyNames && typeof propertyNames === 'object') {
      for (const key of Object.keys(obj)) {
        validateNode(key, propertyNames as Record<string, unknown>, `${path}.<key '${key}'>`, errors, resolve);
      }
    }
    for (const [key, child] of Object.entries(obj)) {
      const childSchema = props[key];
      if (childSchema) validateNode(child, childSchema, `${path}.${key}`, errors, resolve);
    }
  }

  for (const sub of (schema['allOf'] as Record<string, unknown>[] | undefined) ?? []) {
    if ('if' in sub) {
      const probe: string[] = [];
      validateNode(value, sub['if'] as Record<string, unknown>, path, probe, resolve);
      if (probe.length === 0 && 'then' in sub) {
        validateNode(value, sub['then'] as Record<string, unknown>, path, errors, resolve);
      }
    } else {
      validateNode(value, sub, path, errors, resolve);
    }
  }
}
