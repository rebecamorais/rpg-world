'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { PageHeader } from '@frontend/components/shared/PageHeader';
import { Button } from '@frontend/components/ui/button';
import { useCharacterContext } from '@frontend/context/CharacterContext';

export default function CharacterInventoryPage() {
  const { character } = useCharacterContext();
  const t = useTranslations('characters.tabs');
  const tChar = useTranslations('characters');

  if (!character) return null;

  const actions = (
    <Button
      variant="outline"
      size="sm"
      onClick={() => {}} // TODO: Implement Add Item logic when available
      className="h-8 border-white/10 px-3 text-xs font-bold tracking-wider uppercase transition-all hover:bg-white/5"
    >
      <Plus className="mr-2 size-3" />
      {tChar('addItem')}
    </Button>
  );

  return (
    <>
      <PageHeader icon="Backpack" title={t('inventory')} actions={actions} />
      <div className="flex flex-col gap-6">
        <div className="text-muted-foreground bg-muted/20 flex h-[50vh] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <p>{tChar('emptyStates.inventory')}</p>
        </div>
      </div>
    </>
  );
}
