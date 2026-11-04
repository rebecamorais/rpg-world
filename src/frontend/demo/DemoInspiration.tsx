import { useTranslations } from 'next-intl';

import type { Inspiration } from './types';

/** The documented facts about the real person behind a character, the sources, and the collection's notice. */
export function DemoInspiration({ inspiration }: { inspiration: Inspiration }) {
  const t = useTranslations('demo');

  return (
    <section
      aria-labelledby="demo-inspiration"
      className="border-border bg-card mt-6 flex flex-col gap-3 rounded-xl border p-4"
    >
      <h2 id="demo-inspiration" className="font-display text-lg font-bold">
        {t('inspiration.title')}
      </h2>
      <dl className="flex flex-col gap-2 text-sm">
        <div>
          <dt className="text-label text-muted-foreground">{t('inspiration.realName')}</dt>
          <dd>{inspiration.realName}</dd>
        </div>
        <div>
          <dt className="text-label text-muted-foreground">{t('inspiration.period')}</dt>
          <dd>{inspiration.period}</dd>
        </div>
        <div>
          <dt className="text-label text-muted-foreground">{t('inspiration.contribution')}</dt>
          <dd>{inspiration.contribution}</dd>
        </div>
      </dl>
      <div>
        <h3 className="text-label text-muted-foreground">{t('inspiration.sources')}</h3>
        <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {inspiration.sources.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-flare focus-ring rounded-sm underline underline-offset-2"
              >
                {source.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-muted-foreground border-border border-t pt-3 text-sm">{t('notice')}</p>
    </section>
  );
}
