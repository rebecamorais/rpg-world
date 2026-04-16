'use client';

import { useRouter } from 'next/navigation';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';

interface HeroCTAProps {
  isAuthenticated: boolean;
}

export default function HeroCTA({ isAuthenticated }: HeroCTAProps) {
  const tLanding = useTranslations('landing');
  const router = useRouter();

  const handleCTA = () => {
    if (isAuthenticated) {
      router.push('/characters');
    } else {
      router.push('/login');
    }
  };

  return (
    <>
      <h2 className="mb-6 max-w-2xl text-4xl font-extrabold tracking-tight">
        {tLanding('heroTitle')}
      </h2>
      <p className="text-muted-foreground mb-10 max-w-xl text-lg sm:text-xl">
        {tLanding('heroSubtitle')}
      </p>
      <Button size="lg" onClick={handleCTA} className="px-8 py-6 text-lg font-semibold">
        {tLanding('ctaStart')}
      </Button>
    </>
  );
}
