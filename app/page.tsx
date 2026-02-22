'use client';

import { useRouter } from 'next/navigation';

import { Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/frontend/components/ui/button';
import { useCurrentUser } from '@/frontend/context/UserContext';

export default function Home() {
  const { currentUser, logout } = useCurrentUser();
  const tLanding = useTranslations('landing');
  const tHome = useTranslations('home');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const handleCtaClick = () => {
    if (currentUser) {
      router.push('/characters');
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <header className="border-border bg-card flex items-center justify-between border-b px-4 py-3">
        <h1 className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles className="text-primary h-5 w-5" />
          {tHome('title')}
        </h1>
        {currentUser && (
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground hidden text-sm sm:inline-block">
              {currentUser.displayName || currentUser.username}{' '}
              <span className="opacity-70">(@{currentUser.username})</span>
            </span>
            <button
              type="button"
              onClick={logout}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              {tCommon('logout')}
            </button>
          </div>
        )}
      </header>
      <main className="flex flex-1 flex-col items-center justify-center p-4 text-center">
        <h2 className="mb-6 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          {tLanding('heroTitle')}
        </h2>
        <p className="text-muted-foreground mb-10 max-w-xl text-lg sm:text-xl">
          {tLanding('heroSubtitle')}
        </p>
        <Button
          size="lg"
          onClick={handleCtaClick}
          className="px-8 py-6 text-lg font-semibold"
        >
          {currentUser ? tLanding('ctaDashboard') : tLanding('ctaStart')}
        </Button>
      </main>
    </div>
  );
}
