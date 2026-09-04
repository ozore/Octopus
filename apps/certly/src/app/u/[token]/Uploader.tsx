'use client';

/**
 * THE ONE CONTROL ON THE PAGE — `specs/08` §3, `UX.md` §5 S20.
 *
 * Mobile-first, because the agent or the vendor is very likely on a phone and
 * `capture` lets them photograph the certificate they are holding. Progress is
 * stated IN WORDS rather than as a bar: "Sending 2 of 3" survives a screen
 * reader, a slow connection and a greyscale screenshot.
 *
 * THE SEQUENCE IS THE PRODUCT'S REAL ONE and it is worth reading once:
 *
 *   1. hash the bytes in the browser (`crypto.subtle`), so the object is
 *      content-addressed before it moves;
 *   2. ask the server for a short-lived, key-scoped upload token;
 *   3. **PUT the bytes straight to storage** — they never pass through a route
 *      handler, because a function's request body caps far below 20 MB;
 *   4. tell the server the key; the server re-reads size and type from the
 *      object itself and never trusts anything in steps 1-3.
 */

import { useRef, useState } from 'react';

type Phase = 'idle' | 'hashing' | 'sending' | 'done' | 'error';

async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function Uploader({ token, orgName }: { token: string; orgName: string }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [message, setMessage] = useState<string>('');
  const [received, setReceived] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);

  async function sendOne(file: File): Promise<void> {
    const buffer = await file.arrayBuffer();
    setPhase('hashing');
    const sha256 = await sha256Hex(buffer);

    setPhase('sending');
    const issued = await fetch(`/u/${encodeURIComponent(token)}/upload-token`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ filename: file.name, mime: file.type, bytes: file.size, sha256 }),
    });
    if (!issued.ok) {
      const detail = (await issued.json().catch(() => null)) as { error?: string } | null;
      throw new Error(detail?.error ?? 'We could not accept that file.');
    }
    const { uploadUrl, token: storeToken, key } = (await issued.json()) as {
      uploadUrl: string;
      token: string;
      key: string;
    };

    const put = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'content-type': file.type || 'application/pdf', authorization: `Bearer ${storeToken}` },
      body: buffer,
    });
    if (!put.ok) throw new Error('The upload did not finish. Please try again.');

    const done = await fetch(`/u/${encodeURIComponent(token)}/complete`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ key, filename: file.name }),
    });
    if (!done.ok) {
      const detail = (await done.json().catch(() => null)) as { error?: string } | null;
      throw new Error(detail?.error ?? 'We could not read that file.');
    }
    setReceived((current) => [...current, file.name]);
  }

  async function onFiles(files: FileList | null): Promise<void> {
    if (!files || files.length === 0) return;
    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files.item(index);
        if (!file) continue;
        setMessage(`Sending ${index + 1} of ${files.length}…`);
        await sendOne(file);
      }
      setPhase('done');
      setMessage('');
    } catch (error) {
      setPhase('error');
      setMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    }
  }

  if (phase === 'done') {
    return (
      <section className="c-card" data-testid="upload-received">
        <h2 className="c-card__title">Received. Thank you.</h2>
        <p>
          {orgName} has {received.length === 1 ? 'the certificate' : `the ${received.length} files`} you
          sent. We are reading {received.length === 1 ? 'it' : 'them'} now — you do not need to wait, and
          you will not be charged for any of this.
        </p>
        <ul className="c-list-reset c-small c-muted">
          {received.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
        <button
          className="c-btn c-btn--quiet"
          type="button"
          onClick={() => {
            setPhase('idle');
            setMessage('');
          }}
        >
          Send another file
        </button>
      </section>
    );
  }

  return (
    <section>
      <label className="c-drop" data-state={phase === 'sending' ? 'over' : undefined} data-testid="drop-zone">
        <strong>Upload the certificate</strong>
        <span className="c-drop__hint">PDF or a photo. Up to 20 MB each.</span>
        <input
          ref={input}
          className="c-visually-hidden"
          type="file"
          name="certificate"
          multiple
          accept="application/pdf,image/jpeg,image/png,image/heic"
          data-testid="upload-input"
          onChange={(event) => void onFiles(event.target.files)}
        />
        <span className="c-btn c-btn--primary" role="presentation">
          Choose a file
        </span>
      </label>
      {message ? (
        <p className={phase === 'error' ? 'notice error' : 'notice'} data-testid="upload-message">
          {message}
        </p>
      ) : null}
    </section>
  );
}
