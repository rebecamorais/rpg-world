'use client';

import React from 'react';

import { AppIcon } from '@frontend/components/ui/icon';
import { Spell } from '@frontend/types/spells';

import { SpellDisplayValues } from '../hooks/useSpellDisplay';

interface SpellActionsProps {
  spell: Spell;
  onForgetSpell?: (id: string) => void;
  /** The spell is being saved: forgetting waits for it. */
  pending?: boolean;
  displayValues: SpellDisplayValues;
}

/** Spellbook actions that only make sense with the spell open. Preparing lives on the header. */
export const SpellActions = React.memo(
  ({ spell, onForgetSpell, pending = false, displayValues }: SpellActionsProps) => (
    <div className="border-border flex items-center justify-end border-t pt-2">
      <button
        type="button"
        disabled={pending}
        aria-busy={pending || undefined}
        onClick={(e) => {
          e.stopPropagation();
          onForgetSpell?.(spell.id);
        }}
        className="focus-ring text-danger-flare hover:bg-danger-surface flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-70"
      >
        <AppIcon name="Trash2" size={18} aria-hidden="true" />
        {displayValues.forgetLabel}
      </button>
    </div>
  ),
);

SpellActions.displayName = 'SpellActions';
