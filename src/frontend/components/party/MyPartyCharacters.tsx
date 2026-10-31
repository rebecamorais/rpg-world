'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';

import type { CharacterSummary } from '@shared/types/character';

type Option = Pick<CharacterSummary, 'id' | 'name' | 'level' | 'class'>;

/** Which of their characters a player brings to the party. */
export function MyPartyCharacters({
  characters,
  selected,
  onSave,
  isSaving,
}: {
  characters: Option[];
  selected: string[];
  onSave: (characterIds: string[]) => Promise<void>;
  isSaving: boolean;
}) {
  const t = useTranslations('parties.mine');
  const tPage = useTranslations('parties.page');
  const [picked, setPicked] = useState(() => new Set(selected));

  if (characters.length === 0) return <p className="text-muted-foreground">{t('none')}</p>;

  const changed = picked.size !== selected.length || selected.some((id) => !picked.has(id));
  const toggle = (id: string) =>
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {characters.map((character) => (
          <li key={character.id}>
            <label className="border-border hover:bg-muted/40 flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2">
              <input
                type="checkbox"
                checked={picked.has(character.id)}
                onChange={() => toggle(character.id)}
                className="accent-primary h-4 w-4"
              />
              <span className="font-medium">{character.name}</span>
              <span className="text-label text-muted-foreground">
                {[character.class, tPage('level', { level: character.level })]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <Button
        onClick={() => onSave([...picked])}
        disabled={!changed}
        loading={isSaving}
        className="self-start"
      >
        {t('save')}
      </Button>
    </div>
  );
}
