import type { Metadata } from 'next';
import Link from 'next/link';

import { getTranslations } from 'next-intl/server';

import NewCharacterForm from '@frontend/components/character/NewCharacterForm';
import { PageContainer } from '@frontend/components/shared/PageContainer';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/** `?kind=npc` creates one of the GM's enemy sheets instead of a playable character. */
const kindOf = async (searchParams: SearchParams) =>
  (await searchParams).kind === 'npc' ? 'npc' : 'pc';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  if ((await kindOf(searchParams)) === 'npc') {
    return { title: (await getTranslations('enemies'))('newTitle') };
  }
  return { title: (await getTranslations('characterCreation'))('title') };
}

export default async function NewCharacterPage({ searchParams }: { searchParams: SearchParams }) {
  const kind = await kindOf(searchParams);
  const t = await getTranslations('characterCreation');
  const tEnemies = await getTranslations('enemies');
  const tCommon = await getTranslations('common');

  return (
    <PageContainer
      title={kind === 'npc' ? tEnemies('newTitle') : t('title')}
      description={kind === 'npc' ? tEnemies('newDescription') : t('description')}
      eyebrow={
        <Link
          href={kind === 'npc' ? '/enemies' : '/characters'}
          className="hover:text-foreground focus-ring rounded-sm"
        >
          {tCommon('back')}
        </Link>
      }
    >
      <NewCharacterForm kind={kind} />
    </PageContainer>
  );
}
