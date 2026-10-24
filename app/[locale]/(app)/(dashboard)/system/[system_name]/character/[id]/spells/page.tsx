import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { SpellsTab } from '@frontend/components/character/sheet/SpellsTab';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('characters.tabs');
  return { title: t('spells') };
}

export default function CharacterSpellsPage() {
  return <SpellsTab />;
}
