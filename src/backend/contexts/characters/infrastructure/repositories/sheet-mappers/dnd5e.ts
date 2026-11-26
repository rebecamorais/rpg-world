import type { ClassChoiceSelections } from '@shared/systems/dnd5e/class-choices';
import type { ResourceState } from '@shared/systems/dnd5e/class-resources';
import type { Edition } from '@shared/systems/dnd5e/content/editions';
import { type HitDice, type LegacyHitDice, readHitDice } from '@shared/systems/dnd5e/hit-dice';
import type { SavedProficiencies } from '@shared/systems/dnd5e/proficiencies';

import type { CharacterKind } from '../../../domain/entity/Character';
import {
  AttributeKey,
  CharacterSkill,
  DnD5eCharacter,
  SkillKey,
} from '../../../domain/entity/DnD5eCharacter';
import type { SheetMapper } from './types';

export const dnd5eSheetMapper: SheetMapper = {
  fromRow(row, { attributes, hp, lore }) {
    const dndData = (row.system_data as Record<string, unknown>) || {};
    return new DnD5eCharacter({
      id: row.id,
      name: row.name,
      ownerUsername: row.owner_id,
      attributes,
      hp,
      level: row.level,
      classStr: (dndData.class as string) || '',
      race: (dndData.race as string) || '',
      ac: (dndData.ac as number) || 10,
      // A sheet saved without a speed keeps the old default: only new sheets start at 9 m
      speed: (dndData.speed as number) || 30,
      initiative: (dndData.initiative as number) || 0,
      skills: (dndData.skills as Partial<Record<SkillKey, CharacterSkill>>) || {},
      savingThrowProficiencies:
        (dndData.savingThrowProficiencies as Partial<Record<AttributeKey, boolean>>) || {},
      passivePerception: (dndData.passivePerception as number) || 10,
      proficiencies: dndData.proficiencies as SavedProficiencies | undefined,
      subclass: dndData.subclass as string | undefined,
      background: dndData.background as string | undefined,
      alignment: dndData.alignment as string | undefined,
      xp: dndData.xp as number | undefined,
      // A sheet last saved before 2026-11 still has the dice left: read as what was spent
      hitDice: dndData.hitDice
        ? readHitDice(dndData.hitDice as HitDice | LegacyHitDice, row.level)
        : undefined,
      deathSaves: dndData.deathSaves as { successes: number; failures: number } | undefined,
      spellcastingSystem: dndData.spellcastingSystem as 'slots' | 'points' | undefined,
      spellcastingAbility: dndData.spellcastingAbility as AttributeKey | undefined,
      spellSaveDc: dndData.spellSaveDc as number | undefined,
      spellAttackBonus: dndData.spellAttackBonus as number | undefined,
      spellSlots: dndData.spellSlots as Record<string, { max: number; used: number }> | undefined,
      spellPoints: dndData.spellPoints as { max: number; current: number } | undefined,
      edition: dndData.edition as Edition | undefined,
      resources: dndData.resources as Record<string, ResourceState> | undefined,
      classChoices: dndData.classChoices as ClassChoiceSelections | undefined,
      dismissedChoices: dndData.dismissedChoices as string[] | undefined,
      hpTemp: (dndData.hpTemp as number) || 0,
      lore,
      accentColor: (row.theme_color as string) ?? undefined,
      avatarUrl: row.avatar_url ?? undefined,
      sheetBackgroundUrl: row.sheet_background_url ?? undefined,
      kind: row.kind as CharacterKind,
    });
  },
};
