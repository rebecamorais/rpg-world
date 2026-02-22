'use client';

import { useLocale } from 'next-intl';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/frontend/components/ui/select';

export default function LanguageSwitcher() {
  const locale = useLocale();

  const handleValueChange = (newLocale: string) => {
    if (typeof window !== 'undefined') {
      (
        window as unknown as { __changeLocale: (v: string) => void }
      ).__changeLocale?.(newLocale);
    }
  };

  // We only render English and Portuguese
  return (
    <Select value={locale} onValueChange={handleValueChange}>
      <SelectTrigger className="bg-background h-9 w-[130px] text-sm">
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="pt">Português</SelectItem>
      </SelectContent>
    </Select>
  );
}
