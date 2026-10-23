import { useEffect, useRef } from 'react';

import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { CROWDIN_PROJECT } from '@frontend/constants/site';

const INVITE_DURATION_MS = 10_000;

/**
 * Invites whoever switches language to help translate. Returns what to call when they pick a
 * language; the invite shows once the page is in it, so it reads in the language they chose.
 */
export function useTranslationInvite(enabled: boolean) {
  const locale = useLocale();
  const t = useTranslations('translationInvite');
  const switched = useRef(false);

  useEffect(() => {
    if (!switched.current) return;
    switched.current = false;
    toast(t('title'), {
      description: t('description'),
      duration: INVITE_DURATION_MS,
      action: {
        label: t('action'),
        onClick: () => window.open(CROWDIN_PROJECT, '_blank', 'noopener,noreferrer'),
      },
    });
  }, [locale, t]);

  return () => {
    if (enabled) switched.current = true;
  };
}
