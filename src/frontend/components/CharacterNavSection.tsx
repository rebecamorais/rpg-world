'use client';
import { useTranslations } from 'next-intl';

import { useCharacter } from '@frontend/hooks/useCharacter';

export default function CharacterNavSection({ characterId }: { characterId: string }) {
  const tDash = useTranslations('dashboard');

  const { character } = useCharacter(characterId);

  const characterName = character?.name;

  if (!characterName) return null;

  return (
    <section className="animate-in fade-in slide-in-from-left-2 duration-300">
      <p
        className="text-primary truncate px-3 text-[16px] font-bold tracking-widest uppercase"
        title={characterName}
      >
        {characterName}
      </p>
    </section>
  );
}
