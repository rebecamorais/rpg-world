'use client';

import React from 'react';

import { useTranslations } from 'next-intl';

import { cn } from '@frontend/lib/utils';
import { Spell } from '@frontend/types/spells';

interface SpellDetailsProps {
  spell: Spell;
  isExpanded: boolean;
}

export const SpellDetails = React.memo(({ spell, isExpanded }: SpellDetailsProps) => {
  const tCharacters = useTranslations('characters');

  return (
    <div
      id={`spell-details-${spell.id}`}
      className={cn(
        'grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-500 ease-in-out',
        isExpanded ? 'mt-5 mb-6 grid-rows-[1fr] opacity-100' : 'mb-0 grid-rows-[0fr] opacity-0',
      )}
      aria-hidden={!isExpanded}
    >
      <div className="overflow-hidden">
        <section className="font-body pt-2 text-sm leading-relaxed text-slate-300 transition-colors group-hover:text-gray-100">
          <div className="space-y-4">
            <p className="whitespace-pre-wrap">{spell.description}</p>
            {spell.higherLevel && (
              <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4 text-xs shadow-inner">
                <strong className="text-white">{tCharacters('atHigherLevels')}:</strong>{' '}
                {spell.higherLevel}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
});

SpellDetails.displayName = 'SpellDetails';
