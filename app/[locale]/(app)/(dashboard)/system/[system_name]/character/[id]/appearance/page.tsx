import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { AppearanceTab } from '@frontend/components/character/appearance/AppearanceTab';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('characterAppearance');
  return { title: t('title') };
}

export default function CharacterAppearancePage() {
  return <AppearanceTab />;
}
