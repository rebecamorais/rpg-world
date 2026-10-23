import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { getApi } from '@api';

import CharacterList from '@frontend/components/character/CharacterList';
import { SeededQuery } from '@frontend/components/providers/SeededQuery';
import { PageContainer } from '@frontend/components/shared/PageContainer';
import { CharactersProvider } from '@frontend/context/CharactersContext';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('characters');
  return { title: t('title') };
}

/** The list comes with the page (no spinner, then GET /api/characters after hydration). */
export default async function CharactersPage() {
  const t = await getTranslations('characters');
  const { authApi, charactersApi } = await getApi();
  const user = await authApi.getSessionUser();
  const characters = user ? await charactersApi.getByOwner(user.id).catch(() => null) : null;

  return (
    <PageContainer title={t('title')} description={t('subtitle')}>
      <SeededQuery queryKey={['characters']} data={characters}>
        <CharactersProvider>
          <CharacterList />
        </CharactersProvider>
      </SeededQuery>
    </PageContainer>
  );
}
