import type { Metadata } from 'next';

import { type LocaleParams, localizedHref } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import {
  LegalDocument,
  LegalList,
  LegalParagraph,
  type LegalSection,
} from '@frontend/components/legal/LegalDocument';
import { richLinks } from '@frontend/components/shared/rich-links';
import { DISCORD_INVITE } from '@frontend/constants/site';
import { publicPageMetadata } from '@frontend/lib/public-metadata';

// Links inside the privacy texts, one per tag in the messages
const privacyLinks = (locale: string) =>
  richLinks({
    server: DISCORD_INVITE,
    lgpd: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm',
    supabase: 'https://supabase.com/privacy',
    google: 'https://policies.google.com/privacy',
    vercel: 'https://vercel.com/legal/privacy-policy',
    resend: 'https://resend.com/legal/privacy-policy',
    cloudflare: 'https://www.cloudflare.com/privacypolicy/',
    discord: 'https://discord.com/privacy',
    support: localizedHref('/support', locale),
  });

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'privacy' });
  return publicPageMetadata({
    locale,
    path: '/privacy',
    title: t('title'),
    description: t('metaDescription'),
  });
}

export default async function PrivacyPage({ params }: LocaleParams) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('privacy');
  const commonT = await getTranslations('common');
  const links = privacyLinks(locale);
  // Every item of a list in the messages, so none is left out when one is added
  const items = (list: string) =>
    (t.raw(list) as unknown[]).map((_, index) => t.rich(`${list}.${index}`, links));

  const sections: LegalSection[] = [
    {
      id: 'data',
      title: t('sections.data.title'),
      body: (
        <>
          <LegalParagraph>{t('sections.data.content')}</LegalParagraph>
          <LegalList items={items('sections.data.items')} />
        </>
      ),
    },
    {
      id: 'usage',
      title: t('sections.usage.title'),
      body: (
        <>
          <LegalParagraph>{t('sections.usage.content')}</LegalParagraph>
          <LegalList items={items('sections.usage.items')} />
        </>
      ),
    },
    {
      id: 'sharing',
      title: t('sections.sharing.title'),
      body: (
        <>
          <LegalParagraph>{t('sections.sharing.intro')}</LegalParagraph>
          <LegalList items={items('sections.sharing.services')} />
          <LegalParagraph>{t('sections.sharing.visibilityIntro')}</LegalParagraph>
          <LegalList items={items('sections.sharing.visibility')} />
        </>
      ),
    },
    {
      id: 'rights',
      title: t('sections.rights.title'),
      body: (
        <>
          <LegalParagraph>{t.rich('sections.rights.content', links)}</LegalParagraph>
          <LegalParagraph>{t('sections.rights.deletionIntro')}</LegalParagraph>
          <LegalList items={items('sections.rights.deletionItems')} />
        </>
      ),
    },
    {
      id: 'cookies',
      title: t('sections.cookies.title'),
      body: <LegalParagraph>{t.rich('sections.cookies.content', links)}</LegalParagraph>,
    },
    {
      id: 'transfer',
      title: t('sections.transfer.title'),
      body: <LegalParagraph>{t.rich('sections.transfer.content', links)}</LegalParagraph>,
    },
    {
      id: 'retention',
      title: t('sections.retention.title'),
      body: <LegalParagraph>{t('sections.retention.content')}</LegalParagraph>,
    },
    {
      id: 'contact',
      title: t('sections.contact.title'),
      body: <LegalParagraph>{t.rich('sections.contact.content', links)}</LegalParagraph>,
    },
  ];

  return (
    <LegalDocument
      title={t('title')}
      lastUpdated={t('lastUpdated')}
      tocLabel={commonT('onThisPage')}
      sections={sections}
    />
  );
}
