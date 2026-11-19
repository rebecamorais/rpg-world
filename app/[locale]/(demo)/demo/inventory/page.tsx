import type { Metadata } from 'next';

import { type LocaleParams } from '@/i18n/routing';
import { getTranslations } from 'next-intl/server';

import { PartyChestPage } from '@frontend/components/party/PartyChestPage';
import { DEMO_PARTY_ID } from '@frontend/demo/ids';

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'demo' });
  return { title: t('nav.chest') };
}

export default function DemoChestRoute() {
  return <PartyChestPage partyId={DEMO_PARTY_ID} />;
}
