import { useTranslations } from 'next-intl';

import { PlayCta } from '@frontend/components/layout/PlayCta';

/**
 * The home's hero. "Start playing" creates the account (signed in, it opens the characters): the
 * phone header only has "Sign in", so this is the way to sign up from the first screen.
 */
export default function HeroCTA() {
  const tLanding = useTranslations('landing');

  return (
    <>
      <h1 className="text-display mb-6 max-w-2xl">{tLanding('heroTitle')}</h1>
      <p className="text-muted-foreground mb-10 max-w-xl text-lg sm:text-xl">
        {tLanding('heroSubtitle')}
      </p>
      <PlayCta startLabel={tLanding('ctaStart')} demoLabel={tLanding('ctaDemo')} />
    </>
  );
}
