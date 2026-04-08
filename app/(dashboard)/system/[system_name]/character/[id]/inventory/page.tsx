'use client';

import { useTranslations } from 'next-intl';

import { AppIcon } from '@frontend/components/ui/icon';
import { useCharacterContext } from '@frontend/context/CharacterContext';

export default function CharacterInventoryPage() {
  const { character } = useCharacterContext();
  const t = useTranslations('characters');

  if (!character) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
        <AppIcon
          name="Backpack"
          size={14}
          style={{ color: 'var(--character-color, var(--primary-flare))' }}
        />
        <h2 className="text-xs font-bold tracking-widest uppercase opacity-70">
          {t('tabs.inventory')}
        </h2>
      </div>
      <div className="text-muted-foreground bg-muted/20 flex h-[50vh] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <p>{t('emptyStates.inventory')}</p>
      </div>
    </div>
  );
}
