import { ReactNode } from 'react';

import type { Metadata } from 'next';

import { getApi } from '@api';

import { CharacterSheetShell } from '@frontend/components/character/sheet/CharacterSheetShell';
import { CharacterProvider } from '@frontend/context/CharacterContext';

/** Tabs are titled "Lore · Arani · RPG World", so several open sheets can be told apart. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { authApi, charactersApi } = await getApi();
  const user = await authApi.getSessionUser();
  if (!user) return {};

  try {
    const character = await charactersApi.getById(id, user.id);
    const name = String(character.name);
    return { title: { template: `%s · ${name} · RPG World`, default: name } };
  } catch {
    // Not found or someone else's: the sheet shows the error, the title stays generic
    return {};
  }
}

export default function CharacterLayout({ children }: { children: ReactNode }) {
  return (
    <CharacterProvider>
      <CharacterSheetShell>{children}</CharacterSheetShell>
    </CharacterProvider>
  );
}
