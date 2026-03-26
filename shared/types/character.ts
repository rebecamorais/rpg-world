export type GameSystem = 'DnD_5e';

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

export interface CharacterSummary {
  id: string;
  name: string;
  level: number;
  class?: string;
  system: GameSystem;
}
