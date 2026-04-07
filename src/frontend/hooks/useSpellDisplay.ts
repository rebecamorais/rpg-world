import { useTranslations } from 'next-intl';

import {
  CATEGORY_THEMES,
  DAMAGE_THEMES,
  DEFAULT_THEME,
  MECHANIC_ICONS,
  SCHOOL_THEMES,
} from '@frontend/constants/damage-themes';
import { DAMAGE_TYPE_ICONS, SPELL_SCHOOL_ICONS } from '@frontend/constants/spells';
import type { Spell } from '@frontend/types/spells';

/**
 * Hook to resolve all display-related information for a spell,
 * including themes, icons, colors.
 */
export function useSpellDisplay(spell: Spell) {
  const tData = useTranslations('spellsData');

  const damageKey = spell.damageType?.toLowerCase();
  const categoryKey = spell.spellCategory?.toLowerCase();
  const schoolKey = spell.school?.toLowerCase();

  // 1. Resolve Theme Priority: Damage > Category > School > Default
  const theme =
    (damageKey && DAMAGE_THEMES[damageKey]) ||
    (categoryKey && CATEGORY_THEMES[categoryKey]) ||
    (schoolKey && SCHOOL_THEMES[schoolKey]) ||
    DEFAULT_THEME;

  // 2. Resolve Main Icon Priority: Damage > Category > Default
  const damageIcon = damageKey && DAMAGE_TYPE_ICONS[damageKey as keyof typeof DAMAGE_TYPE_ICONS];
  const categoryIcon = categoryKey && CATEGORY_THEMES[categoryKey]?.icon;

  // 3. Resolve Registry School Icon (Secondary now)
  const resolvedSchoolKey = schoolKey as keyof typeof SPELL_SCHOOL_ICONS;
  const schoolIcon = SPELL_SCHOOL_ICONS[resolvedSchoolKey] || MECHANIC_ICONS.default;

  const mainIcon = damageIcon || categoryIcon || schoolIcon || MECHANIC_ICONS.default;

  return {
    theme,
    mainIcon,
    schoolIcon,
    damageKey,
    categoryKey,
    schoolKey,
    tData,
  };
}
