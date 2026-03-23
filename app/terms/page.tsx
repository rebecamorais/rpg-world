import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import Footer from '@frontend/components/Footer';

export default async function TermsPage() {
  const t = await getTranslations('terms');
  const commonT = await getTranslations('common');

  return (
    <div className="flex flex-1 flex-col">
      <main className="container mx-auto max-w-4xl flex-1 px-4 py-12">
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
            <p className="text-muted-foreground leading-relaxed">
              {t('sections.donations.content')}
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">{t('sections.liability.title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('sections.liability.content')}
            </p>
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
        </div>
      </main>
      <Footer />
    </div>
  );
}
