import { calculatePassivePerception } from '@shared/systems/dnd5e/calculations';

import { GmRow } from './Encounter';
import { CombatSheet, ParticipantRecord } from './repository/combat.repo';

/**
 * A participant's row for the GM. A player's HP is the one on their sheet (the GM doesn't change
 * it); an enemy's is the participant's own, so three goblins share one sheet.
 */
export function toGmRow(
  participant: ParticipantRecord,
  sheet: CombatSheet,
  currentParticipantId: string | null,
): GmRow {
  const isPlayer = participant.side === 'player';
  const hp = isPlayer
    ? { current: sheet.hpCurrent, max: sheet.hpMax, temp: sheet.hpTemp }
    : { current: participant.hpCurrent ?? 0, max: sheet.hpMax, temp: participant.hpTemp ?? 0 };
  const perception = sheet.skills.PERCEPTION ?? {};
  const usesPoints = sheet.spellcastingSystem === 'points';

  return {
    participantId: participant.id,
    characterId: participant.characterId,
    side: participant.side,
    name: participant.label ?? sheet.name,
    initiative: participant.initiative,
    hp,
    deathSaves:
      isPlayer && hp.current === 0 ? (sheet.deathSaves ?? { successes: 0, failures: 0 }) : null,
    ac: sheet.ac,
    passivePerception: calculatePassivePerception(
      sheet.attributes.WIS ?? 10,
      sheet.level,
      perception.isProficient ?? false,
      perception.expertise ?? false,
    ),
    spellSlots: usesPoints
      ? []
      : Object.entries(sheet.spellSlots)
          .map(([level, slot]) => ({ level: Number(level), max: slot.max, used: slot.used }))
          .filter((slot) => slot.max > 0)
          .sort((a, b) => a.level - b.level),
    spellPoints: usesPoints ? sheet.spellPoints : null,
    isCurrent: participant.id === currentParticipantId,
  };
}
