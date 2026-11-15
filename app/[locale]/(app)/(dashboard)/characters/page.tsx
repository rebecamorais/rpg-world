import type { Metadata } from 'next';
import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import { getApi } from '@api';

import { CharacterKindTabs } from '@frontend/components/character/CharacterKindTabs';
import CharacterList from '@frontend/components/character/CharacterList';
import { SeededQuery } from '@frontend/components/providers/SeededQuery';
import { PageContainer } from '@frontend/components/shared/PageContainer';
import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import { CharactersProvider } from '@frontend/context/CharactersContext';
import { CHARACTERS_QUERY_KEY } from '@frontend/lib/query-keys';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('characters');
  return { title: t('title') };
}

async function loadCharacters() {
  const { authApi, charactersApi } = await getApi();
  const user = await authApi.getSessionUser();
  return user ? charactersApi.getByOwner(user.id).catch(() => null) : null;
}

/** The list comes with the page (no spinner, then GET /api/characters after hydration). */
export default async function CharactersPage() {
  const [t, tDashboard, characters] = await Promise.all([
    getTranslations('characters'),
    getTranslations('dashboard'),
    loadCharacters(),
  ]);

  return (
    <PageContainer
      title={t('title')}
      description={t('subtitle')}
      // The page's main action in its header, like the NPCs tab: on a phone the sidebar's
      // "New character" is behind the menu
      actions={
        <Button asChild>
          <Link href="/characters/new">
            <AppIcon name="Plus" size={18} aria-hidden="true" />
            {tDashboard('newCharacter')}
          </Link>
        </Button>
      }
    >
      <CharacterKindTabs current="pc" />
      <SeededQuery queryKey={CHARACTERS_QUERY_KEY} data={characters}>
        <CharactersProvider>
          <CharacterList />
        </CharactersProvider>
      </SeededQuery>
    </PageContainer>
  );
}
