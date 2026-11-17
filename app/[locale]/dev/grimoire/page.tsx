import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { type LocaleParams } from '@/i18n/routing';
import { setRequestLocale } from 'next-intl/server';

import { GrimoireLab } from '@frontend/dev/grimoire/GrimoireLab';
import { isGrimoireLabEnabled } from '@frontend/dev/grimoire/lab-access';
import { parseLabParams } from '@frontend/dev/grimoire/lab-params';

import { getSpellCatalog } from '@backend/contexts/spells/infrastructure/srd-spells';

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Internal lab for the Grimoire library (open-card effects). Not part of the product. */
export default async function GrimoireLabPage({
  params,
  searchParams,
}: LocaleParams & { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!isGrimoireLabEnabled()) notFound();
  const { locale } = await params;
  setRequestLocale(locale);

  // Real SRD spells from the project's own catalog: no copied content
  const { data: spells } = await getSpellCatalog().findAll({ locale, limit: 100 });
  return <GrimoireLab spells={spells} {...parseLabParams(await searchParams)} />;
}
