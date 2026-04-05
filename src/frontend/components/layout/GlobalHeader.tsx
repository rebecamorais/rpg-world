import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import LanguageSwitcher from '@frontend/components/LanguageSwitcher';
import { AppIcon } from '@frontend/components/ui/icon';

export default async function GlobalHeader() {
  const tHome = await getTranslations('home');

  return (
    <header className="border-border bg-card flex shrink-0 items-center justify-between border-b px-4 py-3">
      <Link
        href="/"
        className="flex items-center gap-2 text-lg font-semibold transition-opacity hover:opacity-80"
      >
        <AppIcon name="Sparkles" size={20} className="text-primary" />
        {tHome('title')}
      </Link>

      <div className="flex items-center gap-4">
        <LanguageSwitcher />
      </div>
    </header>
  );
}
