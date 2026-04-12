import { useMemo } from 'react';

import { useTranslations } from 'next-intl';

import {
  CATEGORY_THEMES,
  COMPONENT_METADATA,
  DAMAGE_THEMES,
  DEFAULT_THEME,
  MECHANIC_ICONS,
  SCHOOL_THEMES,
} from '@frontend/constants/damage-themes';
import { DAMAGE_TYPE_ICONS, SPELL_SCHOOL_ICONS } from '@frontend/constants/spells';
import type { Spell } from '@frontend/types/spells';

export interface SpellComponentDisplay {
  letter: string;
  label: string;
  icon: string;
  color: string;
}

export interface SpellDisplayValues {
  name: string;
  school: string;
  damage: string | null;
  castingTime: string;
  compactCastingTime: string;
  range: string;
  duration: string;
  ritualLabel: string;
  concentrationLabel: string;
  forgetLabel: string;
  learnLabel: string;
  prepareLabel: string;
  unprepareLabel: string;
  expandLabel: string;
  collapseLabel: string;
  allDamageLabel: string;
  castingTimePrefix: string;
  rangePrefix: string;
  durationPrefix: string;
  schoolPrefix: string;
  components: SpellComponentDisplay[];
}

/**
 * Hook to resolve all display-related information for a spell,
 * including themes, icons, colors, and all localized strings.
 */
export function useSpellDisplay(spell: Spell) {
  const tData = useTranslations('spellsData');
  const tCharacters = useTranslations('characters');

  return useMemo(() => {
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

    // 4. Resolve Display Values (Translations)
    const translatedDamageType = damageKey
      ? tData(`damageTypes.${damageKey}` as Parameters<typeof tData>[0])
      : null;
    const translatedSchool = schoolKey
      ? tData(`schools.${schoolKey}` as Parameters<typeof tData>[0])
      : spell.school;

    const castingTimeLabel = tData(
      `castingTimes.${spell.castingTime}` as Parameters<typeof tData>[0],
      {
        value: spell.castingValue || 1,
      },
    );

    const compactCastingTime =
      spell.castingTime &&
      tData.has(`castingTimesBrief.${spell.castingTime}` as Parameters<typeof tData>[0])
        ? tData(`castingTimesBrief.${spell.castingTime}` as Parameters<typeof tData>[0])
        : castingTimeLabel;

    const components: SpellComponentDisplay[] = (spell.components || []).map((comp) => {
      const meta = COMPONENT_METADATA[comp as keyof typeof COMPONENT_METADATA];
      return {
        letter: comp,
        label: tData(`components.${comp}` as Parameters<typeof tData>[0]),
        icon: meta?.icon || 'help-circle',
        color: meta?.color || 'text-gray-400',
      };
    });

    const displayValues: SpellDisplayValues = {
      name: spell.name,
      school: translatedSchool,
      damage: translatedDamageType,
      castingTime: castingTimeLabel,
      compactCastingTime,
      range:
        spell.rangeUnit && tData.has(`ranges.${spell.rangeUnit}` as Parameters<typeof tData>[0])
          ? tData(`ranges.${spell.rangeUnit}` as Parameters<typeof tData>[0], {
              feet: spell.rangeValue || 0,
              meters: Math.round(((spell.rangeValue || 0) / 5) * 1.5 * 10) / 10,
              miles: spell.rangeValue || 0,
              km: Math.round((spell.rangeValue || 0) * 1.6 * 10) / 10,
            })
          : [spell.rangeValue, spell.rangeUnit].filter(Boolean).join(' '),
      duration:
        spell.durationUnit &&
        tData.has(`durations.${spell.durationUnit}` as Parameters<typeof tData>[0])
          ? tData(`durations.${spell.durationUnit}` as Parameters<typeof tData>[0], {
              value: spell.durationValue || 1,
            })
          : [spell.durationValue, spell.durationUnit].filter(Boolean).join(' '),
      ritualLabel: tCharacters('ritual'),
      concentrationLabel: tCharacters('concentration'),
      forgetLabel: tCharacters('forgetSpell'),
      learnLabel: tCharacters('learn'),
      prepareLabel: tCharacters('prepareSpell'),
      unprepareLabel: tCharacters('unprepareSpell'),
      expandLabel: tCharacters('expand'),
      collapseLabel: tCharacters('collapse'),
      allDamageLabel: tCharacters('allDamage'),
      castingTimePrefix: tCharacters('castingTime'),
      rangePrefix: tCharacters('range'),
      durationPrefix: tCharacters('duration'),
      schoolPrefix: tCharacters('school'),
      components,
    };

    return {
      theme,
      mainIcon,
      schoolIcon,
      displayValues,
    };
  }, [spell, tData, tCharacters]);
}
