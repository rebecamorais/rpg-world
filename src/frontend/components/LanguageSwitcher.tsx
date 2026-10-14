'use client';

import { useRouter } from 'next/navigation';

import { useLocale, useTranslations } from 'next-intl';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@frontend/components/ui/select';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  const handleValueChange = (newLocale: string) => {
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
    router.refresh();
  };

  const t = useTranslations('common');

  return (
    <Select value={locale} onValueChange={handleValueChange}>
      <SelectTrigger aria-label={t('language')} className="bg-background h-9 w-auto gap-2 text-sm">
        {/* Language code on phones, full name from sm up */}
        <SelectValue placeholder={t('loading')}>
          <span className="font-mono uppercase sm:hidden">{locale}</span>
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
