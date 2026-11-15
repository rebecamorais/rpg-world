import { useEffect } from 'react';

import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { WEBLATE_PROJECT } from '@frontend/constants/site';

const INVITE_DURATION_MS = 10_000;
// The language asked for; survives the page load that switching language does (LanguageSwitcher)
const PENDING_KEY = 'rpg-world:translation-invite';
// Once seen, the invite doesn't come back: at every switch it covered the page for 10s
const SEEN_KEY = 'rpg-world:translation-invite-seen';

/** Storage can be blocked (private mode, site data off): the invite just doesn't show then. */
function takePending(): string | null {
  try {
    const pending = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    return pending;
  } catch {
    return null;
  }
}

function seen(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return true;
  }
}

function markSeen() {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    // It may show again next time
  }
}

/**
 * Invites whoever switches language to help translate, once. Returns what to call with the
 * language they pick; the page then loads in it, and the invite shows there, in that language.
 * If the load doesn't happen (they cancelled leaving a page with unsaved edits), the next page
 * is still in the old language and the invite waits for a real switch.
 */
export function useTranslationInvite(enabled: boolean) {
  const t = useTranslations('translationInvite');
  const locale = useLocale();

  useEffect(() => {
    if (takePending() !== locale || seen()) return;
    markSeen();
    toast(t('title'), {
      description: t('description'),
      duration: INVITE_DURATION_MS,
      action: {
        label: t('action'),
        onClick: () => window.open(WEBLATE_PROJECT, '_blank', 'noopener,noreferrer'),
      },
    });
  }, [t, locale]);

  return (newLocale: string) => {
    if (!enabled || seen()) return;
    try {
      sessionStorage.setItem(PENDING_KEY, newLocale);
    } catch {
      // No invite this time
    }
  };
}
