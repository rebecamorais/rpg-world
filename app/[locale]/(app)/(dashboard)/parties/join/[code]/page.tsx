import { cache } from 'react';

import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getTranslations } from 'next-intl/server';

import { getApi } from '@api';

import { JoinPartyCard } from '@frontend/components/party/JoinPartyCard';
import { PageContainer } from '@frontend/components/shared/PageContainer';
import { Button } from '@frontend/components/ui/button';
import { Card, CardContent } from '@frontend/components/ui/card';
import { EmptyState } from '@frontend/components/ui/empty-state';

type Params = Promise<{ code: string }>;

/** Name and picture of the party, signed in or not (null for a code that doesn't exist). */
const loadCard = cache(async (code: string) => {
  const { partiesApi } = await getApi();
  return partiesApi.getInviteCard(code).catch(() => null);
});

/**
 * The link preview (Discord, WhatsApp...): the party's name and picture. Next merges metadata one
 * key deep, so openGraph and twitter repeat what the root layout sets.
 */
export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { code } = await params;
  const [t, tSeo, card] = await Promise.all([
    getTranslations('parties.join'),
    getTranslations('seo'),
    loadCard(code),
  ]);
  if (!card) return { title: t('title') };

  const title = t('ogTitle', { name: card.name });
  const description = t('ogDescription', { name: card.name });
  const image = card.imageUrl
    ? { url: card.imageUrl, width: 1200, height: 630, alt: card.name }
    : { url: '/og-image.jpg', width: 1200, height: 630, alt: tSeo('ogImageAlt') };

  return {
    title,
    description,
    openGraph: { type: 'website', siteName: 'RPG World', title, description, images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image.url] },
  };
}

async function loadInvite(code: string) {
  const { partiesApi } = await getApi();
  return partiesApi.getInvite(code).catch(() => null);
}

/**
 * The invite link. Signed out (the dashboard layout lets this page through), it shows the party's
 * name and picture and a way to sign in and come back here.
 */
export default async function JoinPartyPage({ params }: { params: Params }) {
  const { code } = await params;
  const { authApi } = await getApi();
  const [t, user, card] = await Promise.all([
    getTranslations('parties.join'),
    authApi.getSessionUser(),
    loadCard(code),
  ]);

  const picture = card?.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- served by our image proxy as is
    <img
      src={card.imageUrl}
      alt={card.name}
      width={1200}
      height={630}
      className="border-border aspect-[1200/630] w-full max-w-lg rounded-md border object-cover"
    />
  ) : null;

  if (!user) {
    return (
      <PageContainer title={t('title')}>
        <div className="flex flex-col gap-4">
          {picture}
          {card ? (
            <Card className="w-full max-w-lg">
              <CardContent className="flex flex-col gap-4 p-6">
                <p className="text-heading">{card.name}</p>
                <p className="text-muted-foreground">{t('signInHint')}</p>
                <Button asChild className="self-start">
                  <Link href={`/login?next=${encodeURIComponent(`/parties/join/${code}`)}`}>
                    {t('signIn')}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              icon="Mailbox"
              title={t('invalidTitle')}
              description={t('invalidDescription')}
              className="w-full max-w-lg"
            />
          )}
        </div>
      </PageContainer>
    );
  }

  const invite = await loadInvite(code);
  // Already in (or the GM): straight to the party
  if (invite?.myStatus === 'active' || invite?.myStatus === 'gm') {
    redirect(`/parties/${invite.partyId}`);
  }

  return (
    <PageContainer title={t('title')}>
      <div className="flex flex-col gap-4">
        {invite && picture}
        <JoinPartyCard code={code} invite={invite} />
      </div>
    </PageContainer>
  );
}
