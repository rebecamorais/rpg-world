'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { PageContainer } from '@frontend/components/shared/PageContainer';
import { Button } from '@frontend/components/ui/button';
import { EmptyState } from '@frontend/components/ui/empty-state';
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
      className="text-label h-8 px-3"
    >
      <Plus aria-hidden="true" />
      {tChar('addItem')}
    </Button>
  );

  return (
    <PageContainer icon="Backpack" title={t('inventory')} actions={actions}>
      <EmptyState icon="Backpack" title={tChar('emptyStates.inventory')} className="h-[50vh]" />
    </PageContainer>
  );
}
