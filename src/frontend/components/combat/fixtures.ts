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
  avatarUrl: null,
  accentColor: '#1d4ed8',
  race: 'Elfa',
  class: 'Maga',
  level: 5,
  ac: 15,
  passivePerception: 13,
  speed: 9,
  attributes: { STR: 8, DEX: 14, CON: 13, INT: 18, WIS: 12, CHA: 10 },
  conditions: [],
  isCurrent: false,
  ...overrides,
});
