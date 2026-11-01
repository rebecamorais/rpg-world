'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import { ConditionBadge } from '@frontend/components/content/ConditionBadge';
import { RulesText } from '@frontend/components/content/RulesText';
import { AppIcon } from '@frontend/components/ui/icon';
import { Spell } from '@frontend/types/spells';

import { parseContentKey } from '@shared/content/content-key';

interface SpellDetailsProps {
  spell: Spell;
  /** "1 Reaction": what the trigger, when the spell has one, completes. */
  castingTime: string;
}

/** Rules text of the open card. The card animates the opening; this only lays out the text. */
export const SpellDetails = React.memo(({ spell, castingTime }: SpellDetailsProps) => {
  const tCharacters = useTranslations('characters');
  const tConditions = useTranslations('conditions');
  // A tag in the text points to a condition of the spell's own book
  const source = parseContentKey(spell.id)?.source ?? '';

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
        {spell.trigger && (
          <p>
            <strong className="text-foreground">{castingTime}</strong>,{' '}
            <RulesText text={spell.trigger} source={source} />
          </p>
        )}
        {spell.conditions && spell.conditions.length > 0 && (
          <ul aria-label={tConditions('title')} className="flex flex-wrap gap-2">
            {spell.conditions.map((key) => (
              <li key={key}>
                <ConditionBadge conditionKey={key} defaultEdition={spell.edition} />
              </li>
            ))}
          </ul>
        )}
        <p className="whitespace-pre-wrap">
          <RulesText text={spell.description ?? ''} source={source} />
        </p>
        {spell.higherLevel && (
          <div className="border-border bg-muted rounded-lg border p-4 text-xs">
            {/* A cantrip gets stronger with the character's level, not with the spell slot */}
            <strong className="text-foreground">
              {tCharacters(spell.level === 0 ? 'cantripUpgrade' : 'atHigherLevels')}:
            </strong>{' '}
            <RulesText text={spell.higherLevel} source={source} />
          </div>
        )}
      </div>
    </section>
  );
});

SpellDetails.displayName = 'SpellDetails';
