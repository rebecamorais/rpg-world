'use client';
import { useTranslations } from 'next-intl';

import { NavItem } from '@/frontend/components/ui/nav-item';
import { useCharacter } from '@/frontend/hooks/useCharacter';

export default function CharacterNavSection({
  characterId,
}: {
  characterId: string;
}) {
  const tDash = useTranslations('dashboard');

  const { character } = useCharacter(characterId);

  const characterName = character?.name;

  if (!characterName) return null;

  return (
    <section className="animate-in fade-in slide-in-from-left-2 duration-300">
      <p
        className="text-primary mb-2 truncate px-3 text-[10px] font-bold tracking-widest uppercase"
        title={characterName}
      >
        {characterName}
      </p>
      <div className="flex flex-col gap-1">
        <NavItem
          href={`/system/${character.system}/character/${characterId}`}
          label={tDash('attributes')}
          isSubItem
        />
        <NavItem
          href={`/system/${character.system}/character/${characterId}/spells`}
          label={tDash('spells')}
          isSubItem
        />
      </div>
    </section>
  );
}
