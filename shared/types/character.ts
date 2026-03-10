export type GameSystem = 'DnD_5e';

export interface CharacterBase {
  id: string;
  ownerUsername: string;
  system: GameSystem;
  name: string;
  level: number;
}

export interface CharacterSummary {
  id: string;
  name: string;
  level: number;
  class?: string;
  system: GameSystem;
}
