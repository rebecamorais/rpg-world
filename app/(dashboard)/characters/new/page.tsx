import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import NewCharacterForm from '@frontend/components/character/NewCharacterForm';
import { PageContainer } from '@frontend/components/shared/PageContainer';

export default async function NewCharacterPage() {
  const t = await getTranslations('characterCreation');
  const tCommon = await getTranslations('common');

  return (
    <PageContainer
      title={t('title')}
      description={t('description')}
      eyebrow={
        <Link href="/characters" className="hover:text-foreground focus-ring rounded-sm">
          {tCommon('back')}
        </Link>
      }
    >
      <NewCharacterForm />
    </PageContainer>
  );
}
