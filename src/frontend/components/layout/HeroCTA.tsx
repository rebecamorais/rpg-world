import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';

interface HeroCTAProps {
  isAuthenticated: boolean;
}

/** A plain link (server-rendered, prefetched), not a client button that pushes the route. */
export default function HeroCTA({ isAuthenticated }: HeroCTAProps) {
  const tLanding = useTranslations('landing');

  return (
    <>
      <h1 className="text-display mb-6 max-w-2xl">{tLanding('heroTitle')}</h1>
      <p className="text-muted-foreground mb-10 max-w-xl text-lg sm:text-xl">
        {tLanding('heroSubtitle')}
      </p>
      <Button asChild size="lg" className="px-8 py-6 text-lg font-semibold">
        <Link href={isAuthenticated ? '/characters' : '/login'}>{tLanding('ctaStart')}</Link>
      </Button>
    </>
  );
}
