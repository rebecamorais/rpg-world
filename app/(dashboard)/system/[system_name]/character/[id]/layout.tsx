'use client';

import { ReactNode, useMemo } from 'react';

import Link from 'next/link';
import { redirect } from 'next/navigation';

import { useTranslations } from 'next-intl';

import SpellsDrawer from '@frontend/components/character/spells/SpellsDrawer';
import { LoadingState } from '@frontend/components/shared/LoadingState';
import { CharacterProvider, useCharacterContext } from '@frontend/context/CharacterContext';
import { useCurrentUser } from '@frontend/context/UserContext';
import { hexToHsl } from '@frontend/lib/color-utils';

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

  const themeHsl = useMemo(() => {
    const hex = character?.accentColor || '#663399';
    try {
      return hexToHsl(hex);
    } catch {
      return { h: 270, s: 50, l: 40 };
    }
  }, [character?.accentColor]);

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

  return (
    <div
      className="character-context mx-auto w-full max-w-5xl p-4 md:min-w-[1024px]"
      style={
        {
          '--character-color': character.accentColor || 'var(--primary)',
          '--p-hue': themeHsl.h,
          '--p-sat': `${themeHsl.s}%`,
          '--p-light': `${themeHsl.l}%`,
        } as React.CSSProperties
      }
    >
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
