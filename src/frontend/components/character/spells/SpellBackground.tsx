import { DAMAGE_THEMES } from '@frontend/constants/damage-themes';
import { SPELL_BACKGROUNDS } from '@frontend/constants/spell-vfx';
import type { CharacterSpell } from '@frontend/hooks/useCharacterSpells';

interface SpellBackgroundProps {
  spell: CharacterSpell;
}

export function SpellBackground({ spell }: SpellBackgroundProps) {
  // Use fallback if style doesn't exist
  const renderBg = SPELL_BACKGROUNDS[spell.bgStyleId || ''] || SPELL_BACKGROUNDS['void-dots'];

  const damageKey = spell.damageType?.toLowerCase() || 'force';

  const theme = DAMAGE_THEMES[damageKey] || DAMAGE_THEMES.force;
  const themeColor = theme.hex;

  return renderBg(themeColor);
}
