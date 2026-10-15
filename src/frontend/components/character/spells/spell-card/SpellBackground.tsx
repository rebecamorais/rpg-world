import { SPELL_BACKGROUNDS } from '@frontend/constants/spell-vfx';
import type { Spell } from '@frontend/types/spells';

/** The spell's background (bg_style_id); force damage always gets its shockwave. */
export function SpellBackground({ spell }: { spell: Spell }) {
  const isForce = spell.damageType?.toLowerCase() === 'force';
  const key = isForce ? 'force-shockwave' : spell.bgStyleId;
  const renderBg = (key && SPELL_BACKGROUNDS[key]) || SPELL_BACKGROUNDS['dots-space'];

  return <div className="absolute inset-0">{renderBg()}</div>;
}
