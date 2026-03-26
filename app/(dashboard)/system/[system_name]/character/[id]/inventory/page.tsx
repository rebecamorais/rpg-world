'use client';

import { useTranslations } from 'next-intl';

import { useCharacterContext } from '@frontend/context/CharacterContext';

export default function CharacterInventoryPage() {
  const { character } = useCharacterContext();
  const t = useTranslations('characters');

  if (!character) return null;

  return (
    <div className="text-muted-foreground bg-muted/20 flex h-[50vh] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
      <p>{t('emptyStates.inventory')}</p>
    </div>
  );
}
