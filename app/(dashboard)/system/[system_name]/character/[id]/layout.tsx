'use client';

import { ReactNode } from 'react';

import Link from 'next/link';
import { redirect } from 'next/navigation';

import { useTranslations } from 'next-intl';

import SpellSearchDialog from '@frontend/components/character/spells/SpellSearchDialog';
import { LoadingState } from '@frontend/components/shared/LoadingState';
import { CharacterProvider, useCharacterContext } from '@frontend/context/CharacterContext';
import { useCurrentUser } from '@frontend/context/UserContext';
import { characterTheme } from '@frontend/lib/color-utils';
import { cn } from '@frontend/lib/utils';

function CharacterLayoutContent({ children }: { children: ReactNode }) {
  const { currentUser } = useCurrentUser();

  const {
    character,
    isLoading,
    isSpellsOpen,
    setIsSpellsOpen,
    handleLearnSpell,
    handleForgetSpell,
    spellsKnown,
  } = useCharacterContext();

  const t = useTranslations('characters');
  const tCommon = useTranslations('common');

  if (!currentUser) {
    redirect('/login');
  }

  if (isLoading) {
    return <LoadingState thematic />;
  }

  if (!character || character.ownerUsername !== currentUser.id) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-4">
        <p className="text-muted-foreground">{t('notFoundOrNoPermission')}</p>
        <Link href="/characters" className="mt-2 text-sm underline">
          {tCommon('back')}
        </Link>
      </div>
    );
  }

  const theme = characterTheme(character.accentColor);

  return (
    <div className={cn(theme.className, 'mx-auto w-full max-w-5xl p-4')} style={theme.style}>
      {/* Page content handles its own PageContainer */}
      {children}

      <SpellSearchDialog
        isOpen={isSpellsOpen}
        onClose={() => setIsSpellsOpen(false)}
        learnedSpells={spellsKnown}
        onLearnSpell={handleLearnSpell}
        onForgetSpell={handleForgetSpell}
      />
    </div>
  );
}

export default function CharacterLayout({ children }: { children: ReactNode }) {
  return (
    <CharacterProvider>
      <CharacterLayoutContent>{children}</CharacterLayoutContent>
    </CharacterProvider>
  );
}
