import Link from 'next/link';

import { Sparkles } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import LanguageSwitcher from '@/frontend/components/LanguageSwitcher';
import UserMenu from '@/frontend/components/UserMenu';

export default async function GlobalHeader() {
  const tHome = await getTranslations('home');

  return (
    <header className="border-border bg-card flex shrink-0 items-center justify-between border-b px-4 py-3">
      <Link
        href="/"
        className="flex items-center gap-2 text-lg font-semibold transition-opacity hover:opacity-80"
      >
        <Sparkles className="text-primary h-5 w-5" />
        {tHome('title')}
      </Link>

      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <UserMenu />
      </div>
    </header>
  );
}
