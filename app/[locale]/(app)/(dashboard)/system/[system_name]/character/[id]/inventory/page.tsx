import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { Backpack } from '@frontend/components/character/inventory/Backpack';
import { CoinPouch } from '@frontend/components/character/inventory/CoinPouch';
import { SheetFieldset } from '@frontend/components/character/sheet/SheetFieldset';
import { SheetPage } from '@frontend/components/character/sheet/SheetPage';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('characters.tabs');
  return { title: t('inventory') };
}

export default async function CharacterInventoryPage() {
  const t = await getTranslations('characters');

  return (
    <SheetPage icon="Backpack" tab={t('tabs.inventory')}>
      <div className="flex flex-col gap-6">
        <SheetFieldset>
          <CoinPouch />
          <Backpack />
        </SheetFieldset>
      </div>
    </SheetPage>
  );
}
