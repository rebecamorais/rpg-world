import { getTranslations } from 'next-intl/server';

import StatusView from '@frontend/components/character/StatusView';
import { SaveCharacterButton } from '@frontend/components/character/sheet/SaveControls';
import { SheetPage } from '@frontend/components/character/sheet/SheetPage';

export default async function CharacterStatusPage() {
  const t = await getTranslations('characters.tabs');

  return (
    <SheetPage icon="Shield" tab={t('status')} actions={<SaveCharacterButton />}>
      <StatusView />
    </SheetPage>
  );
}
