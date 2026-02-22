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
    <div className="fixed right-4 bottom-4 z-50">
      <Select value={locale} onValueChange={handleValueChange}>
        <SelectTrigger className="bg-background w-[140px] shadow-md">
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="pt">Português</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
