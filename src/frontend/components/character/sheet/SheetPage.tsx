'use client';

import { ComponentProps } from 'react';

import { PageContainer } from '@frontend/components/shared/PageContainer';
import { useLoadedCharacter } from '@frontend/context/CharacterContext';

type SheetPageProps = Omit<ComponentProps<typeof PageContainer>, 'title' | 'eyebrow'> & {
  /** The tab's name, shown above the character's name. */
  tab: string;
};

/**
 * A tab of the character sheet: same page frame as the rest of the dashboard, with the
 * character's name as the page's h1 and the tab as the eyebrow.
 */
export function SheetPage({ tab, ...props }: SheetPageProps) {
  const { name } = useLoadedCharacter();

  return (
    <PageContainer title={name} eyebrow={tab} titleClassName="text-character-flare" {...props} />
  );
}
