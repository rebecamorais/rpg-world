import type { GmRow } from '@backend/contexts/combat/domain/Encounter';

/** A GM row for component tests. */
export const gmRow = (overrides: Partial<GmRow> = {}): GmRow => ({
  participantId: 'p-hero',
  characterId: 'hero',
  side: 'player',
  name: 'Arani',
  initiative: 12,
  hp: { current: 12, max: 20, temp: 0 },
  deathSaves: null,
  ac: 15,
  passivePerception: 13,
  spellSlots: [{ level: 1, max: 4, used: 1 }],
  spellPoints: null,
  isCurrent: false,
  ...overrides,
});
