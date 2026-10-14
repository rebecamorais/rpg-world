import { getTranslations } from 'next-intl/server';

import StatusView from '@frontend/components/character/StatusView';
import { SaveCharacterButton } from '@frontend/components/character/sheet/SaveButton';
import { PageContainer } from '@frontend/components/shared/PageContainer';

export default async function CharacterStatusPage() {
  const t = await getTranslations('characters.tabs');

  return (
    <PageContainer icon="Shield" title={t('status')} actions={<SaveCharacterButton />}>
      <StatusView />
    </PageContainer>
  );
}
