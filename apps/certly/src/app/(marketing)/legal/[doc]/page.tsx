import { notFound } from 'next/navigation';

import { getEnv } from '@/env';
import { disclaimerContent, privacyContent, termsContent } from '@octopus/platform/legal';

const DOCS = ['terms', 'privacy', 'disclaimer'] as const;
type DocSlug = (typeof DOCS)[number];

export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  if (!DOCS.includes(doc as DocSlug)) notFound();

  const env = getEnv();
  const placeholders = {
    appName: env.APP_NAME,
    companyName: env.COMPANY_NAME,
    address: env.COMPANY_ADDRESS,
    supportEmail: env.SUPPORT_EMAIL,
  };

  const content =
    doc === 'terms'
      ? termsContent(placeholders)
      : doc === 'privacy'
        ? privacyContent(placeholders)
        : disclaimerContent(placeholders);

  return (
    <main className="narrow">
      <h1>{content.title}</h1>
      <p className="muted small">Last updated {content.effectiveDate}</p>
      <p>{content.intro}</p>
      {content.sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </section>
      ))}
    </main>
  );
}
