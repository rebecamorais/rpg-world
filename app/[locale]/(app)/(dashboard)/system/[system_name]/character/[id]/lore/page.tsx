import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { LoreTab } from '@frontend/components/character/sheet/LoreTab';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('characters.tabs');
  return { title: t('lore') };
}

export default function CharacterLorePage() {
  return <LoreTab />;
}
