import type { Metadata } from 'next';

import type { LocaleParams } from '@/i18n/routing';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import {
  LegalDocument,
  LegalList,
  LegalParagraph,
  type LegalSection,
} from '@frontend/components/legal/LegalDocument';
import { richLinks } from '@frontend/components/shared/rich-links';
import { publicPageMetadata } from '@frontend/lib/public-metadata';

// Links inside the game content credits, one per tag in the messages
const CREDIT_HREFS = {
  srd: 'https://dnd.wizards.com/resources/systems-reference-document',
  srd52: 'https://www.dndbeyond.com/srd',
  ccby: 'https://creativecommons.org/licenses/by/4.0/legalcode',
  // The attribution text keeps the address Wizards asks for, which now redirects to the
  // dungeonsanddragons.com home; the link goes to the official Spanish SRD 5.1 itself
  srdEs: 'https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1_ES.pdf',
  ccbyEs: 'https://creativecommons.org/licenses/by/4.0/legalcode.es',
  api: 'https://www.dnd5eapi.co',
  database: 'https://github.com/5e-bits/5e-database',
  fivetools: 'https://github.com/5etools-mirror-3/5etools-src',
  foundry: 'https://gitlab.com/fvtt-brasil/dnd5e',
  foundryEs: 'https://github.com/foundryvtt-sinregistrar/translate-dnd5e-sdr2-es',
  notice: 'https://github.com/rebecamorais/rpg-world/blob/main/NOTICE.md',
};

const CREDIT_LINKS = richLinks(CREDIT_HREFS);

// The sections with a single paragraph, in order between "conduct" and "gameContent"
const PLAIN_SECTIONS = ['content', 'donations', 'liability', 'age', 'updates', 'law'] as const;

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'terms' });
  return publicPageMetadata({
    locale,
    path: '/terms',
    title: t('title'),
    description: t('metaDescription'),
  });
}

export default async function TermsPage({ params }: LocaleParams) {
  setRequestLocale((await params).locale);
  const t = await getTranslations('terms');
  const commonT = await getTranslations('common');
  // Every item of a list in the messages, so none is left out when one is added
  const items = (list: string) =>
    (t.raw(list) as unknown[]).map((_, index) => t.rich(`${list}.${index}`, CREDIT_LINKS));

  const sections: LegalSection[] = [
    {
      id: 'acceptance',
      title: t('sections.acceptance.title'),
      body: <LegalParagraph>{t('sections.acceptance.content')}</LegalParagraph>,
    },
    {
      id: 'conduct',
      title: t('sections.conduct.title'),
      body: (
        <>
          <LegalParagraph>{t('sections.conduct.content')}</LegalParagraph>
          <LegalList items={items('sections.conduct.items')} />
        </>
      ),
    },
    ...PLAIN_SECTIONS.map((id) => ({
      id,
      title: t(`sections.${id}.title`),
      body: <LegalParagraph>{t(`sections.${id}.content`)}</LegalParagraph>,
    })),
    {
      id: 'game-content',
      title: t('sections.gameContent.title'),
      body: (
        <>
          <LegalParagraph>{t('sections.gameContent.content')}</LegalParagraph>
          <div className="break-words">
            <LegalList items={items('sections.gameContent.items')} />
          </div>
        </>
      ),
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
