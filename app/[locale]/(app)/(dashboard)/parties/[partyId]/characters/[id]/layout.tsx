import { ReactNode, Suspense, cache } from 'react';

import type { Metadata } from 'next';

import { getApi } from '@api';

import { CharacterSheetShell } from '@frontend/components/character/sheet/CharacterSheetShell';
import { CharacterProvider } from '@frontend/context/CharacterContext';

import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import CharacterLoading from '../../../../system/[system_name]/character/[id]/loading';

type Params = Promise<{ partyId: string; id: string }>;

/**
 * The GM's read-only view of a sheet brought to their party: the owner's sheet (same tabs and
 * components), loaded through the party. Null when it isn't theirs to read.
 */
const loadCharacter = cache(async (partyId: string, id: string) => {
  const { authApi, charactersApi } = await getApi();
  const user = await authApi.getSessionUser();
  if (!user) return null;

  try {
    return await charactersApi.getForPartyGm(partyId, id, user.id);
  } catch {
    return null;
  }
});

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { partyId, id } = await params;
  const character = await loadCharacter(partyId, id);
  if (!character) return {};

  const name = String(character.name);
  return { title: { template: `%s · ${name} · RPG World`, default: name } };
}

export default function PartyCharacterLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Params;
}) {
  return (
    <Suspense fallback={<CharacterLoading />}>
      <CharacterSheet params={params}>{children}</CharacterSheet>
    </Suspense>
  );
}

async function CharacterSheet({ children, params }: { children: ReactNode; params: Params }) {
  const { partyId, id } = await params;
  const character = await loadCharacter(partyId, id);

  return (
    <CharacterProvider initialCharacter={(character ?? undefined) as DnD5eCharacter | undefined}>
      <CharacterSheetShell>{children}</CharacterSheetShell>
    </CharacterProvider>
  );
}
