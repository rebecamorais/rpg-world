import { SPELL_BACKGROUNDS } from '@frontend/constants/spell-vfx';
import { useSpellDisplay } from '@frontend/hooks/useSpellDisplay';
import type { Spell } from '@frontend/types/spells';

interface SpellBackgroundProps {
  spell: Spell;
}

export function SpellBackground({ spell }: SpellBackgroundProps) {
  const { theme } = useSpellDisplay(spell);
  const themeColor = theme.hex;

  // 2. Resolve Background Style (Override with theme VFX for Force damage)
  const damageKey = spell.damageType?.toLowerCase();
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
