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
      <SelectTrigger className="bg-background h-9 w-[130px] text-sm">
        <SelectValue placeholder={t('loading')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">{t('en')}</SelectItem>
        <SelectItem value="pt">{t('pt')}</SelectItem>
      </SelectContent>
    </Select>
  );
}
