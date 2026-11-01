import {
  calculatePassiveInsight,
  calculatePassivePerception,
} from '@shared/systems/dnd5e/calculations';

import { RolePlayCard, RosterCharacter } from './PartyView';

export interface RolePlaySheet {
  attributes: Record<string, number>;
  level: number;
  skills: Record<string, { isProficient?: boolean; expertise?: boolean } | undefined>;
  /** Saved on old sheets and stale (defaults to 10): never used, the passives are computed. */
  storedPassivePerception?: number;
}

export interface RolePlayLore {
  personalityTraits?: string | null;
  ideals?: string | null;
  bonds?: string | null;
  flaws?: string | null;
}

const text = (value: string | null | undefined) => value?.trim() || null;

export function toRolePlayCard(
  character: RosterCharacter,
  sheet: RolePlaySheet,
  lore: RolePlayLore | null,
  ownerUsername: string | null,
): RolePlayCard {
  const wisdom = sheet.attributes.WIS ?? 10;
  const skill = (key: string) => sheet.skills[key] ?? {};

  return {
    ...character,
    ownerUsername,
    personalityTraits: text(lore?.personalityTraits),
    ideals: text(lore?.ideals),
    bonds: text(lore?.bonds),
    flaws: text(lore?.flaws),
    passivePerception: calculatePassivePerception(
      wisdom,
      sheet.level,
      skill('PERCEPTION').isProficient ?? false,
      skill('PERCEPTION').expertise ?? false,
    ),
    passiveInsight: calculatePassiveInsight(
      wisdom,
      sheet.level,
      skill('INSIGHT').isProficient ?? false,
      skill('INSIGHT').expertise ?? false,
    ),
  };
}
