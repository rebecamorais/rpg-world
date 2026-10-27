import type { Metadata, ResolvingMetadata } from 'next';

import { getTranslations } from 'next-intl/server';

import StatusView from '@frontend/components/character/StatusView';
import { SaveCharacterButton } from '@frontend/components/character/sheet/SaveControls';
import { SheetPage } from '@frontend/components/character/sheet/SheetPage';

/**
 * The layout's title template doesn't reach a page in its own segment, so this tab builds
 * "Status · <name> · RPG World" from the title the layout resolved, without loading it again.
 */
export async function generateMetadata(
  _props: unknown,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const t = await getTranslations('characters.tabs');
  const inherited = (await parent).title?.absolute;
  return { title: inherited ? { absolute: `${t('status')} · ${inherited}` } : t('status') };
}

export default async function CharacterStatusPage() {
  const t = await getTranslations('characters.tabs');

  return (
    <SheetPage icon="Shield" tab={t('status')} actions={<SaveCharacterButton />}>
      <StatusView />
    </SheetPage>
  );
}
