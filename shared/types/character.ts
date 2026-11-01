type GameSystem = 'DnD_5e';

export interface CharacterBase {
  id: string;
  ownerUsername: string;
  system: GameSystem;
  name: string;
  level: number;
  avatarUrl?: string;

  // Lore & Identity (Common to all systems)
  age?: string;
  height?: string;
  weight?: string;
  eyes?: string;
  skin?: string;
  hair?: string;
  backstory?: string;
  accentColor?: string;
}

/** A playable character (pc) or one of the GM's enemy sheets (npc). */
export type CharacterKind = 'pc' | 'npc';

export interface CharacterSummary {
  id: string;
  name: string;
  level: number;
  class?: string;
  system: GameSystem;
  accentColor?: string;
  avatarUrl?: string;
}
