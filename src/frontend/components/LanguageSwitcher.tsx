'use client';

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

/** `signedIn`: whoever switches language is invited to help translate. */
export default function LanguageSwitcher({ signedIn = false }: { signedIn?: boolean }) {
  const locale = useLocale();
  const inviteToTranslate = useTranslationInvite(signedIn);

  const handleValueChange = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
    inviteToTranslate();
    // A full load, not router.refresh(): pages the router already prefetched (prebuilt, in the
    // old language) would otherwise still open in it
    window.location.reload();
  };

  const t = useTranslations('common');

  return (
    <Select value={locale} onValueChange={handleValueChange}>
      <SelectTrigger
        aria-label={t('language')}
        className="text-muted-foreground hover:text-foreground hover:bg-muted h-9 w-auto gap-1.5 border-transparent bg-transparent px-2.5 py-0 font-medium shadow-none backdrop-blur-none"
      >
        <AppIcon name="Languages" size={16} aria-hidden="true" />
        {/* Language code on phones, full name from sm up */}
        <SelectValue placeholder={t('loading')}>
          <span className="uppercase sm:hidden">{locale}</span>
          <span className="hidden sm:inline">{t(locale as 'en' | 'pt')}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">{t('en')}</SelectItem>
        <SelectItem value="pt">{t('pt')}</SelectItem>
      </SelectContent>
    </Select>
  );
}
