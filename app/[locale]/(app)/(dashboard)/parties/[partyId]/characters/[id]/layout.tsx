import { ReactNode, Suspense, cache } from 'react';

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getApi } from '@api';

import { CharacterSheetShell } from '@frontend/components/character/sheet/CharacterSheetShell';
import { PartySheetUnavailable } from '@frontend/components/party/PartySheetUnavailable';
import { CharacterProvider } from '@frontend/context/CharacterContext';

import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import CharacterLoading from '../../../../system/[system_name]/character/[id]/loading';
import { loadParty } from '../../load-party';

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

  if (!character) {
    // The API still answers "not found" (it reveals nothing); someone at this table already knows
    // it, so they are told why instead. Strangers keep the generic "not found" below.
    const party = await loadParty(partyId);
    // Their own character, through the party: its own sheet, where they can edit it
    if (party?.myCharacterIds.includes(id)) redirect(`/system/DnD_5e/character/${id}`);
    // A player hears a sheet is private only for a character at this table; anything else (and
    // anything for the GM, who reads every sheet there) isn't at the table
    const atTable = party?.roster.some((entry) => entry.characterId === id);
    if (party) {
      const reason = party.role !== 'gm' && atTable ? 'private' : 'missing';
      return <PartySheetUnavailable partyId={partyId} reason={reason} />;
    }
  }

  return (
    <CharacterProvider initialCharacter={(character ?? undefined) as DnD5eCharacter | undefined}>
      <CharacterSheetShell>{children}</CharacterSheetShell>
    </CharacterProvider>
  );
}
