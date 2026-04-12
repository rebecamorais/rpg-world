'use client';

import React from 'react';

import { AppIcon } from '@frontend/components/ui/icon';
import { cn } from '@frontend/lib/utils';
import { Spell } from '@frontend/types/spells';

import { SpellDisplayValues } from '../hooks/useSpellDisplay';

interface SpellActionsProps {
  spell: Spell;
  onForgetSpell?: (id: string) => void;
  onTogglePrepared?: (id: string, isPrepared: boolean) => void;
  onLearnSpell?: (id: string) => void;
  isLearned?: boolean;
  displayValues: SpellDisplayValues;
}

export const SpellActions = React.memo(
  ({
    spell,
    onForgetSpell,
    onTogglePrepared,
    onLearnSpell,
    isLearned,
    displayValues,
  }: SpellActionsProps) => (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-4">
      {onLearnSpell ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (isLearned) {
              onForgetSpell?.(spell.id);
            } else {
              onLearnSpell?.(spell.id);
            }
          }}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all',
            isLearned
              ? 'border border-red-500/30 bg-red-500/10 text-red-400 hover:border-red-500/60 hover:bg-red-500/20'
              : 'bg-character text-slate-950 shadow-md hover:opacity-90',
          )}
        >
          <AppIcon name={isLearned ? 'Trash2' : 'Plus'} size={18} />
          {isLearned ? displayValues.forgetLabel : displayValues.learnLabel}
        </button>
      ) : (
        <>
          {spell.level > 0 ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePrepared?.(spell.id, !spell.isPrepared);
              }}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all',
                spell.isPrepared
                  ? 'border border-amber-500/30 bg-amber-500/10 text-amber-500 hover:border-amber-500/60 hover:bg-amber-500/20'
                  : 'border border-amber-500 bg-amber-500 text-amber-950 shadow-md hover:bg-amber-400 hover:shadow-amber-500/20',
              )}
            >
              <AppIcon
                name="Bookmark"
                size={18}
                className={spell.isPrepared ? 'fill-amber-500/50 text-amber-500' : 'text-amber-950'}
              />
              {spell.isPrepared ? displayValues.unprepareLabel : displayValues.prepareLabel}
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onForgetSpell?.(spell.id);
            }}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-red-100/60 transition-all hover:bg-red-500/10 hover:text-red-400"
          >
            <AppIcon name="Trash2" size={18} aria-hidden="true" />
            {displayValues.forgetLabel}
          </button>
        </>
      )}
    </div>
  ),
);

SpellActions.displayName = 'SpellActions';
