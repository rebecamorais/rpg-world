import { getTranslations } from 'next-intl/server';

import CharacterList from '@frontend/components/character/CharacterList';
import { PageContainer } from '@frontend/components/shared/PageContainer';
import { CharactersProvider } from '@frontend/context/CharactersContext';

export default async function DemoNpcsRoute() {
  const [tDemo, tEnemies] = await Promise.all([
    getTranslations('demo'),
    getTranslations('enemies'),
  ]);
  return (
    <PageContainer title={tDemo('nav.npcs')} description={tEnemies('subtitle')}>
      <CharactersProvider kind="npc">
        <CharacterList />
      </CharactersProvider>
    </PageContainer>
  );
}
