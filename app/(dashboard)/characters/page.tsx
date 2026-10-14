import { getTranslations } from 'next-intl/server';

import CharacterList from '@frontend/components/character/CharacterList';
import { PageContainer } from '@frontend/components/shared/PageContainer';
import { CharactersProvider } from '@frontend/context/CharactersContext';

export default async function CharactersPage() {
  const t = await getTranslations('characters');

  return (
    <PageContainer title={t('title')} description={t('subtitle')}>
      <CharactersProvider>
        <CharacterList />
      </CharactersProvider>
    </PageContainer>
  );
}
