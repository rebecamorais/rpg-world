import { useEffect } from 'react';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { CROWDIN_PROJECT } from '@frontend/constants/site';

const INVITE_DURATION_MS = 10_000;
// Survives the reload that switching language does (see LanguageSwitcher)
const PENDING_KEY = 'rpg-world:translation-invite';

/** Storage can be blocked (private mode, site data off): the invite just doesn't show then. */
function takePending(): boolean {
  try {
    const pending = sessionStorage.getItem(PENDING_KEY) === '1';
    sessionStorage.removeItem(PENDING_KEY);
    return pending;
  } catch {
    return false;
  }
}

/**
 * Invites whoever switches language to help translate. Returns what to call when they pick a
 * language; the page then reloads in it, and the invite shows there, in the language they chose.
 */
export function useTranslationInvite(enabled: boolean) {
  const t = useTranslations('translationInvite');

  useEffect(() => {
    if (!takePending()) return;
    toast(t('title'), {
      description: t('description'),
      duration: INVITE_DURATION_MS,
      action: {
        label: t('action'),
        onClick: () => window.open(CROWDIN_PROJECT, '_blank', 'noopener,noreferrer'),
      },
    });
  }, [t]);

  return () => {
    if (!enabled) return;
    try {
      sessionStorage.setItem(PENDING_KEY, '1');
    } catch {
      // No invite this time
    }
  };
}
