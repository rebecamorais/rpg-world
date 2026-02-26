'use client';

import { useRouter } from 'next/navigation';

import { useTranslations } from 'next-intl';

import { Button } from '@/frontend/components/ui/button';

export default function HeroCTA() {
  const tLanding = useTranslations('landing');
  const router = useRouter();

  return (
    <>
      <h2 className="mb-6 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
        {tLanding('heroTitle')}
      </h2>
      <p className="text-muted-foreground mb-10 max-w-xl text-lg sm:text-xl">
        {tLanding('heroSubtitle')}
      </p>
      <Button
        size="lg"
        onClick={() => router.push('/login')}
        className="px-8 py-6 text-lg font-semibold"
      >
        {tLanding('ctaStart')}
      </Button>
    </>
  );
}
