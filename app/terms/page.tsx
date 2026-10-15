import type { Metadata } from 'next';
import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import { richLinks } from '@frontend/components/shared/rich-links';

// Links inside the game content credits, one per tag in the messages
const CREDIT_HREFS = {
  srd: 'https://dnd.wizards.com/resources/systems-reference-document',
  ccby: 'https://creativecommons.org/licenses/by/4.0/legalcode',
  api: 'https://www.dnd5eapi.co',
  database: 'https://github.com/5e-bits/5e-database',
  foundry: 'https://gitlab.com/fvtt-brasil/dnd5e',
  notice: 'https://github.com/rebecamorais/rpg-world/blob/main/NOTICE.md',
};

const CREDIT_LINKS = richLinks(CREDIT_HREFS);

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('terms');
  return { title: t('title') };
}

export default async function TermsPage() {
  const t = await getTranslations('terms');
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
          <h2 className="mb-4 text-2xl font-semibold">{t('sections.acceptance.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('sections.acceptance.content')}
          </p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">{t('sections.conduct.title')}</h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            {t('sections.conduct.content')}
          </p>
          <ul className="text-muted-foreground list-inside list-disc space-y-2 leading-relaxed">
            {['0', '1', '2'].map((key) => (
              <li key={key}>{t(`sections.conduct.items.${key}`)}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">{t('sections.content.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('sections.content.content')}</p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">{t('sections.donations.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('sections.donations.content')}</p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">{t('sections.liability.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('sections.liability.content')}</p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">{t('sections.age.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('sections.age.content')}</p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">{t('sections.updates.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('sections.updates.content')}</p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">{t('sections.law.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('sections.law.content')}</p>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-semibold">{t('sections.gameContent.title')}</h2>
          <p className="text-muted-foreground mb-4 leading-relaxed">
            {t('sections.gameContent.content')}
          </p>
          <ul className="text-muted-foreground list-inside list-disc space-y-2 leading-relaxed break-words">
            {['0', '1', '2', '3', '4'].map((key) => (
              <li key={key}>{t.rich(`sections.gameContent.items.${key}`, CREDIT_LINKS)}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
