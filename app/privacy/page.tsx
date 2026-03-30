import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import Footer from '@frontend/components/layout/Footer';

export default async function PrivacyPage() {
  const t = await getTranslations('privacy');
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
            <h2 className="mb-4 text-2xl font-semibold">{t('sections.data.title')}</h2>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              {t('sections.data.content')}
            </p>
            <ul className="text-muted-foreground list-inside list-disc space-y-2 leading-relaxed">
              {['0', '1', '2'].map((key) => (
                <li key={key}>{t(`sections.data.items.${key}`)}</li>
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
                <li key={key}>{t(`sections.usage.items.${key}`)}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">{t('sections.sharing.title')}</h2>
            <p className="text-muted-foreground leading-relaxed">{t('sections.sharing.content')}</p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">{t('sections.rights.title')}</h2>
            <p className="text-muted-foreground leading-relaxed">{t('sections.rights.content')}</p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">{t('sections.cookies.title')}</h2>
            <p className="text-muted-foreground leading-relaxed">{t('sections.cookies.content')}</p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">{t('sections.transfer.title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('sections.transfer.content')}
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">{t('sections.retention.title')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('sections.retention.content')}
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-semibold">{t('sections.contact.title')}</h2>
            <p className="text-muted-foreground leading-relaxed">{t('sections.contact.content')}</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
