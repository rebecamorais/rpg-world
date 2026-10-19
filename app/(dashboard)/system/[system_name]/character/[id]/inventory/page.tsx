import type { Metadata } from 'next';

import { Plus } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { SheetPage } from '@frontend/components/character/sheet/SheetPage';
import { Button } from '@frontend/components/ui/button';
import { EmptyState } from '@frontend/components/ui/empty-state';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('characters.tabs');
  return { title: t('inventory') };
}

export default async function CharacterInventoryPage() {
  const t = await getTranslations('characters');

  // Items are not implemented yet: the button stays visible but disabled
  const actions = (
    <Button variant="outline" size="sm" disabled className="text-label h-8 px-3">
      <Plus aria-hidden="true" />
      {t('addItem')}
    </Button>
  );

  return (
    <SheetPage icon="Backpack" tab={t('tabs.inventory')} actions={actions}>
      <EmptyState icon="Backpack" title={t('emptyStates.inventory')} className="h-[50vh]" />
    </SheetPage>
  );
}
