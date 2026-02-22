'use client';

import { useEffect, useState } from 'react';

import { useTranslations } from 'next-intl';

import { NavItem } from '@/frontend/components/nav-item';
import { useCurrentUser } from '@/frontend/context/UserContext';

export default function CharacterNavSection({
  characterId,
}: {
  characterId: string;
}) {
  const { currentUser } = useCurrentUser();
  const tDash = useTranslations('dashboard');
  const [characterName, setCharacterName] = useState<string>('');

  useEffect(() => {
    if (!characterId || !currentUser) return;
    let active = true;

    Promise.resolve().then(() => {
      if (active) setCharacterName('');
    });

    fetch(`/api/characters/${characterId}`)
      .then((res) => res.json())
      .then((data) => {
        if (active && !data.error && data.name) {
          setCharacterName(data.name);
        }
      })
      .catch((err) => console.error('Failed to fetch character name', err));

    return () => {
      active = false;
    };
  }, [characterId, currentUser]);

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
          href={`/characters/${characterId}`}
          label={tDash('attributes')}
          isSubItem
        />
        <NavItem
          href={`/characters/${characterId}/spells`}
          label={tDash('spells')}
          isSubItem
        />
      </div>
    </section>
  );
}
