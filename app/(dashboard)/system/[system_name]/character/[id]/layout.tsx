import { ReactNode, Suspense, cache } from 'react';

import type { Metadata } from 'next';

import { getApi } from '@api';

import { CharacterSheetShell } from '@frontend/components/character/sheet/CharacterSheetShell';
import { CharacterProvider } from '@frontend/context/CharacterContext';

import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import CharacterLoading from './loading';

/**
 * The character for the title and the sheet, loaded once per request (React cache). Null when
 * signed out, not found or someone else's: the sheet then fetches it and shows the error.
 */
const loadCharacter = cache(async (id: string) => {
  const { authApi, charactersApi } = await getApi();
  const user = await authApi.getSessionUser();
  if (!user) return null;

  try {
    return await charactersApi.getById(id, user.id);
  } catch {
    return null;
  }
});

/** Tabs are titled "Lore · Arani · RPG World", so several open sheets can be told apart. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const character = await loadCharacter((await params).id);
  // Not found or someone else's: the sheet shows the error, the title stays generic
  if (!character) return {};

  const name = String(character.name);
  return { title: { template: `%s · ${name} · RPG World`, default: name } };
}

/**
 * The sheet opens with the character the server already loaded, without a second request. The
 * load waits inside Suspense: awaited in the layout itself, it would hold navigation back.
 */
export default function CharacterLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<CharacterLoading />}>
      <CharacterSheet params={params}>{children}</CharacterSheet>
    </Suspense>
  );
}

async function CharacterSheet({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const character = await loadCharacter((await params).id);

  return (
    <CharacterProvider initialCharacter={(character ?? undefined) as DnD5eCharacter | undefined}>
      <CharacterSheetShell>{children}</CharacterSheetShell>
    </CharacterProvider>
  );
}
