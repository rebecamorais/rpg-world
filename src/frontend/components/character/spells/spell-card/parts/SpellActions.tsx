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
  displayValues: SpellDisplayValues;
}

export const SpellActions = React.memo(
  ({ spell, onForgetSpell, onTogglePrepared, displayValues }: SpellActionsProps) => (
    <div className="border-border mt-6 flex flex-wrap items-center justify-between gap-4 border-t pt-4">
      {spell.level > 0 ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onTogglePrepared?.(spell.id, !spell.isPrepared);
          }}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-all',
            spell.isPrepared
              ? 'border-warning-muted bg-warning-surface text-warning-flare hover:border-warning hover:bg-warning-muted border'
              : 'border-warning bg-warning text-background hover:bg-warning/90 border shadow-md',
          )}
        >
          <AppIcon
            name="Bookmark"
            size={18}
            className={
              spell.isPrepared ? 'fill-warning-muted text-warning-flare' : 'text-background'
            }
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
        className="text-muted-foreground hover:bg-danger-surface hover:text-danger-flare flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all"
      >
        <AppIcon name="Trash2" size={18} aria-hidden="true" />
        {displayValues.forgetLabel}
      </button>
    </div>
  ),
);

SpellActions.displayName = 'SpellActions';
