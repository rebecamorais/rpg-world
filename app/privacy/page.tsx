import type { Metadata } from 'next';
import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import { richLinks } from '@frontend/components/shared/rich-links';

// Links inside the privacy texts, one per tag in the messages
const PRIVACY_LINKS = richLinks({
  email: 'mailto:contato@rebs.com.br',
  lgpd: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm',
  supabase: 'https://supabase.com/privacy',
  google: 'https://policies.google.com/privacy',
  vercel: 'https://vercel.com/legal/privacy-policy',
  resend: 'https://resend.com/legal/privacy-policy',
  cloudflare: 'https://www.cloudflare.com/privacypolicy/',
  discord: 'https://discord.com/privacy',
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('privacy');
  return { title: t('title') };
}

export default async function PrivacyPage() {
  const t = await getTranslations('privacy');
  const commonT = await getTranslations('common');

  return (
    <div className="container mx-auto max-w-4xl flex-1 px-4 py-20">
      <div className="mb-8">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          {commonT('back')}
        </Link>
      </div>

      <h1 className="mb-2 text-4xl font-bold tracking-tight">{t('title')}</h1>
      <p className="text-muted-foreground mb-8 text-sm italic">{t('lastUpdated')}</p>

      <div className="space-y-8">
        <section>
          <h2 className="mb-4 text-2xl font-semibold">{t('sections.data.title')}</h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">{t('sections.data.content')}</p>
          <ul className="text-muted-foreground list-inside list-disc space-y-2 leading-relaxed">
            {['0', '1', '2', '3'].map((key) => (
              <li key={key}>{t.rich(`sections.data.items.${key}`, PRIVACY_LINKS)}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">{t('sections.usage.title')}</h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            {t('sections.usage.content')}
          </p>
          <ul className="text-muted-foreground list-inside list-disc space-y-2 leading-relaxed">
            {['0', '1', '2'].map((key) => (
              <li key={key}>{t.rich(`sections.usage.items.${key}`, PRIVACY_LINKS)}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">{t('sections.sharing.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t.rich('sections.sharing.content', PRIVACY_LINKS)}
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">{t('sections.rights.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t.rich('sections.rights.content', PRIVACY_LINKS)}
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">{t('sections.cookies.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t.rich('sections.cookies.content', PRIVACY_LINKS)}
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">{t('sections.transfer.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t.rich('sections.transfer.content', PRIVACY_LINKS)}
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">{t('sections.retention.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('sections.retention.content')}</p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">{t('sections.contact.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t.rich('sections.contact.content', PRIVACY_LINKS)}
          </p>
        </section>
      </div>
    </div>
  );
}
