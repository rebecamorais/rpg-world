'use client';

import { withoutLocale } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';

import { AppIcon } from '@frontend/components/ui/icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@frontend/components/ui/select';
import { useTranslationInvite } from '@frontend/hooks/useTranslationInvite';

/**
 * Each language named in itself, the same in every interface language: whoever can't read the
 * current one still finds theirs.
 */
const LANGUAGE_NAMES = { en: 'English', pt: 'Português' } as const;
type Language = keyof typeof LANGUAGE_NAMES;

/**
 * The current page in `locale`. The proxy (next-intl) answers a path prefixed with the language
 * by saving it in the NEXT_LOCALE cookie: an app page then redirects to the plain path, a public
 * page stays at (or goes to) its address in that language. So the choice is only saved if the page
 * is really left: cancelling "leave with unsaved changes?" keeps the old one. A public page may
 * already carry its language (/pt/features), which is swapped, not stacked.
 */
function localeSwitchUrl(locale: string, { pathname, search, hash }: Location): string {
  const path = withoutLocale(pathname);
  return `/${locale}${path === '/' ? '' : path}${search}${hash}`;
}

/** `signedIn`: whoever switches language is invited to help translate. */
export default function LanguageSwitcher({ signedIn = false }: { signedIn?: boolean }) {
  const locale = useLocale();
  const inviteToTranslate = useTranslationInvite(signedIn);

  const handleValueChange = (newLocale: string) => {
    inviteToTranslate(newLocale);
    // A full load, not router.refresh(): pages the router already prefetched (prebuilt, in the
    // old language) would otherwise still open in it. Replace: the same page, no extra Back step
    window.location.replace(localeSwitchUrl(newLocale, window.location));
  };

  const t = useTranslations('common');

  return (
    <Select value={locale} onValueChange={handleValueChange}>
      <SelectTrigger
        aria-label={t('language')}
        // touch-target: the header's buttons get it from Button; the trigger is 36px tall
        className="touch-target text-muted-foreground hover:text-foreground hover:bg-muted h-9 w-auto gap-1.5 border-transparent bg-transparent px-2.5 py-0 font-medium shadow-none backdrop-blur-none"
      >
        <AppIcon name="Languages" size={16} aria-hidden="true" />
        {/* Language code on phones, full name from sm up */}
        <SelectValue placeholder={t('loading')}>
          <span className="uppercase sm:hidden">{locale}</span>
          <span className="hidden sm:inline">{LANGUAGE_NAMES[locale as Language]}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(LANGUAGE_NAMES) as Language[]).map((code) => (
          <SelectItem key={code} value={code} lang={code}>
            {LANGUAGE_NAMES[code]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
