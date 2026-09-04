/**
 * §5.1 — **PRODUCER PERSONAL DATA IS NEVER STORED ON THE ANONYMOUS PATH.**
 * `specs/15` §5.1, REVIEW.md B-07 §2.6.
 *
 * `KNOWLEDGE_BASE.md` §A.3 annotates `producer.contact_name` as *"often a real
 * individual"*, and the schema also carries the producer's phone, fax and
 * e-mail. **The free report never chases anyone, so it never needs any of
 * them.** The extraction call itself is unchanged — the schema is one file and
 * does not fork, which is what keeps ONE eval pipeline — so the difference is a
 * strip step that runs between the model response and the database, in the
 * same job, on this path and only on this path.
 *
 * THE PRODUCER'S AGENCY NAME SURVIVES. It is an organisation, not a person, and
 * the report has to be able to say which agency issued the certificate. That
 * distinction is the whole of §5.1: we drop the human and keep the company.
 *
 * The nulled shape is a full value object with every key present and a
 * confidence of 0, not an absent key — `coi.v1`'s rule is that optionality is a
 * NULL VALUE — so a stripped payload still validates and still renders.
 */

import type { CoiExtraction, StringField } from '../engine';

/** The four paths, named once. The test asserts against THIS list. */
export const STRIPPED_PRODUCER_PATHS = [
  '/producer/contact_name',
  '/producer/phone',
  '/producer/fax',
  '/producer/email',
] as const;

export const STRIPPED_PRODUCER_KEYS = ['contact_name', 'phone', 'fax', 'email'] as const;
export type StrippedProducerKey = (typeof STRIPPED_PRODUCER_KEYS)[number];

/** `{value:null, raw:null, page:null, source_text:null, confidence:0}`. */
export function nullField(): StringField {
  return { value: null, raw: null, page: null, source_text: null, confidence: 0 };
}

/**
 * Returns a NEW payload with the four producer contact fields nulled. It does
 * not mutate its argument: the caller may still be holding the model's own
 * response for a cost or latency measurement, and a strip step that reaches
 * back into it is a strip step that is hard to reason about at 2 a.m.
 */
export function stripProducerContact(payload: CoiExtraction): CoiExtraction {
  return {
    ...payload,
    producer: {
      ...payload.producer,
      // The AGENCY NAME and its ADDRESS survive: an organisation, not a person.
      name: payload.producer.name,
      address: payload.producer.address,
      contact_name: nullField(),
      phone: nullField(),
      fax: nullField(),
      email: nullField(),
    },
  };
}

/**
 * True when a payload still carries any of the four. Used by the test that
 * proves nothing is stored, and by `writeGapExtraction`, which refuses to
 * persist a payload that has not been through the strip — a belt for the day
 * somebody adds a second write path.
 */
export function carriesProducerContact(payload: CoiExtraction | null | undefined): boolean {
  if (!payload?.producer) return false;
  return STRIPPED_PRODUCER_KEYS.some((key) => {
    const field = payload.producer[key];
    return Boolean(field && (field.value !== null || field.raw !== null || field.source_text !== null));
  });
}
