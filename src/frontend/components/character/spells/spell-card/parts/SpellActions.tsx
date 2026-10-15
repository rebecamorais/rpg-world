'use client';

import React from 'react';

import { AppIcon } from '@frontend/components/ui/icon';
import { Spell } from '@frontend/types/spells';

import { SpellDisplayValues } from '../hooks/useSpellDisplay';

interface SpellActionsProps {
  spell: Spell;
  onForgetSpell?: (id: string) => void;
  displayValues: SpellDisplayValues;
}

/** Spellbook actions that only make sense with the spell open. Preparing lives on the header. */
export const SpellActions = React.memo(
  ({ spell, onForgetSpell, displayValues }: SpellActionsProps) => (
    <div className="border-border flex items-center justify-end border-t pt-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onForgetSpell?.(spell.id);
        }}
        className="focus-ring text-muted-foreground hover:bg-danger-surface hover:text-danger-flare flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all"
      >
        <AppIcon name="Trash2" size={18} aria-hidden="true" />
        {displayValues.forgetLabel}
      </button>
    </div>
  ),
);

SpellActions.displayName = 'SpellActions';
