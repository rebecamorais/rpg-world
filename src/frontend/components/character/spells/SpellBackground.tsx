import { CATEGORY_THEMES, DAMAGE_THEMES, DEFAULT_THEME } from '@frontend/constants/damage-themes';
import { SPELL_BACKGROUNDS } from '@frontend/constants/spell-vfx';
import type { CharacterSpell } from '@frontend/hooks/useCharacterSpells';

interface SpellBackgroundProps {
  spell: CharacterSpell;
}

export function SpellBackground({ spell }: SpellBackgroundProps) {
  // 1. Resolve Theme (Priority: Damage > Category > Default)
  const damageKey = spell.damageType?.toLowerCase();
  const categoryKey = spell.spellCategory?.toLowerCase();

  const theme =
    (damageKey && DAMAGE_THEMES[damageKey]) ||
    (categoryKey && CATEGORY_THEMES[categoryKey]) ||
    DEFAULT_THEME;

  const themeColor = theme.hex;

  // 2. Resolve Background Style (Override with theme VFX for Force damage)
  const vfxKey = damageKey === 'force' ? theme.vfx : spell.bgStyleId || theme.vfx;
  const renderBg = SPELL_BACKGROUNDS[vfxKey] || SPELL_BACKGROUNDS['dots-space'];

  return (
    <div
      className={`absolute inset-0 -z-10 transition-opacity duration-500 ${
        theme.distortion || 'opacity-100'
      }`}
    >
      {renderBg(themeColor)}
    </div>
  );
}
