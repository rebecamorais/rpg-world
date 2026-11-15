'use client';

import { useTranslations } from 'next-intl';

import { AppIcon } from '@frontend/components/ui/icon';
import { WEBLATE_PROJECT } from '@frontend/constants/site';
import { cn } from '@frontend/lib/utils';

/** Tells the reader the text below is still in English, with a link to help translate it. `compact` is for popovers. */
export function UntranslatedNotice({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('characters');

  return (
    <p
      role="note"
      className={cn(
        'bg-info-surface border-info-muted text-info-flare flex items-center gap-1.5 rounded-md border',
        // A sentence, so normal case even in the compact popover version
        compact ? 'text-caption px-2 py-1' : 'px-3 py-2 text-sm',
      )}
    >
      <AppIcon name="Info" size="xs" aria-hidden="true" className="shrink-0" />
      <span>{t('untranslatedNotice')}</span>
      <a
        href={WEBLATE_PROJECT}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium underline underline-offset-2"
      >
        {t('untranslatedHelp')}
      </a>
    </p>
  );
}
