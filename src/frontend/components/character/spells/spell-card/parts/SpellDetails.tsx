'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import { AppIcon } from '@frontend/components/ui/icon';
import { Spell } from '@frontend/types/spells';

/** Rules text of the open card. The card animates the opening; this only lays out the text. */
export const SpellDetails = React.memo(({ spell }: { spell: Spell }) => {
  const tCharacters = useTranslations('characters');

  return (
    <section
      id={`spell-details-${spell.id}`}
      className="text-foreground/90 text-sm leading-relaxed"
    >
      <div className="space-y-4">
        {/* No translation yet: the text shows in English, and translating is open to anyone */}
        {spell.untranslated && (
          <p className="text-muted-foreground text-label flex items-center gap-1.5">
            <AppIcon name="Languages" size="xs" aria-hidden="true" />
            <span className="text-foreground font-medium">{tCharacters('untranslatedBadge')}</span>
            <span>{tCharacters('untranslatedHint')}</span>
          </p>
        )}
        <p className="whitespace-pre-wrap">{spell.description}</p>
        {spell.higherLevel && (
          <div className="border-border bg-muted rounded-lg border p-4 text-xs">
            <strong className="text-foreground">{tCharacters('atHigherLevels')}:</strong>{' '}
            {spell.higherLevel}
          </div>
        )}
      </div>
    </section>
  );
});

SpellDetails.displayName = 'SpellDetails';
