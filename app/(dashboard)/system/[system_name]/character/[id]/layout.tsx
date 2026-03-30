'use client';

import { ReactNode } from 'react';

import Link from 'next/link';

import { useTranslations } from 'next-intl';

import SpellsDrawer from '@frontend/components/character/spells/SpellsDrawer';
import { CharacterProvider, useCharacterContext } from '@frontend/context/CharacterContext';
import { useCurrentUser } from '@frontend/context/UserContext';

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
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <p className="text-muted-foreground">{t('requireLogin')}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <p className="text-muted-foreground">{tCommon('loading')}</p>
      </div>
    );
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

  return (
    <div className="mx-auto w-full max-w-5xl p-4 md:min-w-[1024px]">
      {children}

      <SpellsDrawer
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
