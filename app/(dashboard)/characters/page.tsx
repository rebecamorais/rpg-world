import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { getApi } from '@api';

import CharacterList from '@frontend/components/character/CharacterList';
import { SeededQuery } from '@frontend/components/providers/SeededQuery';
import { PageContainer } from '@frontend/components/shared/PageContainer';
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
  const [t, characters] = await Promise.all([getTranslations('characters'), loadCharacters()]);

  return (
    <PageContainer title={t('title')} description={t('subtitle')}>
      <SeededQuery queryKey={CHARACTERS_QUERY_KEY} data={characters}>
        <CharactersProvider>
          <CharacterList />
        </CharactersProvider>
      </SeededQuery>
    </PageContainer>
  );
}
