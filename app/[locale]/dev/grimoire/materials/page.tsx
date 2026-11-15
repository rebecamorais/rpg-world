import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { type LocaleParams } from '@/i18n/routing';
import { setRequestLocale } from 'next-intl/server';

import { groupOf } from '@frontend/components/character/inventory/item-visuals';
import { MaterialsLab } from '@frontend/dev/grimoire/MaterialsLab';
import { isGrimoireLabEnabled } from '@frontend/dev/grimoire/lab-access';
import { parseLabParams } from '@frontend/dev/grimoire/lab-params';

import { getItemCatalog } from '@backend/contexts/items/infrastructure/srd-items';
import { getSpellCatalog } from '@backend/contexts/spells/infrastructure/srd-spells';

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Internal lab for the Grimoire material surfaces. Not part of the product. */
export default async function GrimoireMaterialsPage({
  params,
  searchParams,
}: LocaleParams & { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!isGrimoireLabEnabled()) notFound();
  const { locale } = await params;
  setRequestLocale(locale);

  // Real SRD spells from the project's own catalog: no copied content
  const { data: spells } = await getSpellCatalog().findAll({ locale, limit: 100 });
  // A few real items of each backpack group, for the item tiles
  const perGroup = new Map<string, number>();
  const items = getItemCatalog()
    .list(locale)
    .filter((item) => {
      const group = groupOf(item.category);
      const seen = perGroup.get(group) ?? 0;
      perGroup.set(group, seen + 1);
      return seen < 4;
    });

  return <MaterialsLab spells={spells} items={items} {...parseLabParams(await searchParams)} />;
}
