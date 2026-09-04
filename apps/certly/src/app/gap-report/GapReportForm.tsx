'use client';

/**
 * THE FREE GAP REPORT FORM — `specs/15` §2, §3.
 *
 * **NO ACCOUNT UI ANYWHERE.** No "create a password", no nav bar, no plan
 * comparison. One CTA, and it sits below the finding, after the value has been
 * delivered — not here.
 *
 * The retention terms are rendered by the SERVER component around this one, as
 * body text adjacent to the drop zone, before a file is chosen (A7c). They are
 * deliberately not in this client component: a condition that only appears once
 * JavaScript has run is a condition behind a curtain.
 */

import { useState } from 'react';

import { AUDIENCE_LABEL, MAX_DOCUMENTS_PER_SESSION } from '@/lib/gap-report';

type Audience = keyof typeof AUDIENCE_LABEL;
type Phase = 'choose' | 'files' | 'email' | 'sending' | 'done' | 'error';

async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function GapReportForm() {
  const [audience, setAudience] = useState<Audience>('pm');
  const [phase, setPhase] = useState<Phase>('choose');
  const [token, setToken] = useState<string | null>(null);
  const [added, setAdded] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  async function start(): Promise<void> {
    const response = await fetch('/api/gap-report/session', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ audience }),
    });
    if (!response.ok) {
      const detail = (await response.json().catch(() => null)) as { error?: string } | null;
      setPhase('error');
      setMessage(detail?.error ?? 'We could not start a report just now.');
      return;
    }
    const body = (await response.json()) as { token: string };
    setToken(body.token);
    setPhase('files');
  }

  async function addFiles(files: FileList | null): Promise<void> {
    if (!files || !token) return;
    for (let index = 0; index < files.length; index += 1) {
      const file = files.item(index);
      if (!file) continue;
      if (added.length + index >= MAX_DOCUMENTS_PER_SESSION) {
        setMessage(`The free report covers ${MAX_DOCUMENTS_PER_SESSION} — start a trial to track more.`);
        break;
      }
      try {
        const buffer = await file.arrayBuffer();
        const sha256 = await sha256Hex(buffer);
        const issued = await fetch(`/api/gap-report/${token}/upload-token`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ filename: file.name, mime: file.type, bytes: file.size, sha256 }),
        });
        if (!issued.ok) throw new Error(((await issued.json().catch(() => null)) as { error?: string } | null)?.error ?? 'refused');
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
        if (!put.ok) throw new Error('the upload did not finish');
        const recorded = await fetch(`/api/gap-report/${token}/documents`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ key, originalFilename: file.name }),
        });
        if (!recorded.ok) throw new Error(((await recorded.json().catch(() => null)) as { error?: string } | null)?.error ?? 'refused');
        setAdded((current) => [...current, file.name]);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'We could not take that file.');
      }
    }
  }

  async function submitEmail(formData: FormData): Promise<void> {
    if (!token) return;
    setPhase('sending');
    const response = await fetch(`/api/gap-report/${token}/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: String(formData.get('email') ?? '') }),
    });
    if (!response.ok) {
      setPhase('email');
      setMessage(((await response.json().catch(() => null)) as { error?: string } | null)?.error ?? 'Try again.');
      return;
    }
    window.location.href = `/gap-report/${token}`;
  }

  return (
    <div data-testid="gap-report-form">
      {phase === 'choose' || phase === 'error' ? (
        <section className="c-card">
          <div className="c-card__head">
            <h2 className="c-card__title">Who are you?</h2>
          </div>
          <p className="c-small c-muted">This picks the starting requirements. You can change them later.</p>
          <div className="c-remind__schedule">
            {(Object.keys(AUDIENCE_LABEL) as Audience[]).map((key) => (
              <button
                className="c-remind__offset"
                key={key}
                type="button"
                aria-pressed={audience === key}
                onClick={() => setAudience(key)}
              >
                {AUDIENCE_LABEL[key]}
              </button>
            ))}
          </div>
          <p>
            <button className="c-btn c-btn--primary" type="button" onClick={() => void start()}>
              Continue
            </button>
          </p>
          {message ? (
            <p className="notice error" data-testid="gap-report-error">
              {message}
            </p>
          ) : null}
        </section>
      ) : null}

      {phase === 'files' ? (
        <section className="c-card">
          <label className="c-drop" data-testid="gap-drop-zone">
            <strong>Drop up to {MAX_DOCUMENTS_PER_SESSION} certificates</strong>
            <span className="c-drop__hint">PDF or a photo. Up to 20 MB each, 50 MB in total.</span>
            <input
              className="c-visually-hidden"
              type="file"
              multiple
              accept="application/pdf,image/jpeg,image/png,image/heic"
              data-testid="gap-file-input"
              onChange={(event) => void addFiles(event.target.files)}
            />
            <span className="c-btn c-btn--primary" role="presentation">
              Choose files
            </span>
          </label>
          {added.length > 0 ? (
            <>
              <p className="c-small" data-testid="gap-file-count">
                {added.length} added.
              </p>
              <ul className="c-list-reset c-small c-muted">
                {added.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
              <button className="c-btn c-btn--primary" type="button" onClick={() => setPhase('email')}>
                Build my report
              </button>
            </>
          ) : null}
          {message ? <p className="notice warn">{message}</p> : null}
        </section>
      ) : null}

      {phase === 'email' || phase === 'sending' ? (
        <section className="c-card">
          <div className="c-card__head">
            <h2 className="c-card__title">Where should we send it?</h2>
          </div>
          <form action={(formData) => void submitEmail(formData)}>
            <label className="c-field">
              <span className="c-field__label">Your email</span>
              <span className="c-field__hint">
                So you keep the report. No password, no card, and we add you to no list.
              </span>
              <input className="c-input" name="email" type="email" required data-testid="gap-email" />
            </label>
            <button className="c-btn c-btn--primary" type="submit" disabled={phase === 'sending'}>
              {phase === 'sending' ? 'Building…' : 'Get my report'}
            </button>
          </form>
          {message ? <p className="notice error">{message}</p> : null}
        </section>
      ) : null}
    </div>
  );
}
