import { SPELL_BACKGROUNDS } from '@frontend/constants/spell-vfx';
import type { Spell } from '@frontend/types/spells';

interface SpellBackgroundProps {
  spell: Spell;
  /** The theme's background, already resolved by the card (force damage always uses it). */
  themeVfx: string;
}

export function SpellBackground({ spell, themeVfx }: SpellBackgroundProps) {
  const isForce = spell.damageType?.toLowerCase() === 'force';
  const vfxKey = isForce ? themeVfx : spell.bgStyleId || themeVfx;
  const renderBg = SPELL_BACKGROUNDS[vfxKey] || SPELL_BACKGROUNDS['dots-space'];

  return <div className="absolute inset-0">{renderBg()}</div>;
}
