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
import { charactersQueryKey } from '@frontend/lib/query-keys';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('characters.kinds');
  return { title: t('npc') };
}

async function loadNpcs() {
  const { authApi, charactersApi } = await getApi();
  const user = await authApi.getSessionUser();
  return user ? charactersApi.getByOwner(user.id, 'npc').catch(() => null) : null;
}

/** The NPCs tab: npc sheets (enemies in combat, and anyone else), same list and sheet as PCs. */
export default async function NpcsPage() {
  const [t, tCharacters, sheets] = await Promise.all([
    getTranslations('enemies'),
    getTranslations('characters'),
    loadNpcs(),
  ]);

  return (
    <PageContainer
      title={tCharacters('title')}
      description={t('subtitle')}
      actions={
        <Button asChild>
          <Link href="/characters/new?kind=npc">
            <AppIcon name="Plus" size={18} aria-hidden="true" />
            {t('new')}
          </Link>
        </Button>
      }
    >
      <CharacterKindTabs current="npc" />
      <SeededQuery queryKey={charactersQueryKey('npc')} data={sheets}>
        <CharactersProvider kind="npc">
          <CharacterList />
        </CharactersProvider>
      </SeededQuery>
    </PageContainer>
  );
}
