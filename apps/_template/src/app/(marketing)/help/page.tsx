import { getEnv } from '@/env';

export default function HelpPage() {
  const env = getEnv();
  return (
    <main className="narrow">
      <h1>Help</h1>
      <p>
        A person reads every message sent to <a href={`mailto:${env.SUPPORT_EMAIL}`}>{env.SUPPORT_EMAIL}</a>.
        Expect a reply within one business day.
      </p>

      <h2>Signing in</h2>
      <p>
        There is no password. Enter your email address and we send a link that works once and
        expires in {env.LOGIN_TOKEN_TTL_MINUTES} minutes. If it does not arrive, check spam, then
        ask for another.
      </p>

      <h2>Billing</h2>
      <p>
        Cards, invoices, plan changes and cancellation all live in the billing portal, under
        Settings → Billing. Receipts come from Stripe.
      </p>

      <h2>Your data</h2>
      <p>
        Export or deletion: email support and we action it within 30 days. See the{' '}
        <a href="/legal/privacy">privacy policy</a> for the full list of what we hold and why.
      </p>

      <h2>Something looks wrong</h2>
      <p>
        Tell us what you were doing and what you saw. If it is a regulatory value, include the
        source link we showed next to it — that is the fastest possible fix.
      </p>
    </main>
  );
}
