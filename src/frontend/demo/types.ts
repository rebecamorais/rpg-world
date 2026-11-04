import type { LoreData } from '@frontend/hooks/useCharacterLore';

import type { InventoryDto } from '@backend/contexts/characters/domain/repository/inventory.repo';
import type { MyParties } from '@backend/contexts/parties/domain/Party';
import type { PartyView } from '@backend/contexts/parties/domain/PartyView';

import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';
import type { CharacterSummary } from '@shared/types/character';

/** Documented facts about the real person behind a character; never mixed with the fiction. */
export interface Inspiration {
  realName: string;
  period: string;
  contribution: string;
  sources: { label: string; url: string }[];
}

export interface DemoData {
  party: PartyView;
  parties: MyParties;
  characters: Record<string, DnD5eCharacter>;
  lore: Record<string, LoreData>;
  /** Spells each character knows, resolved from `content/` (the character spells endpoint shape). */
  spells: Record<string, unknown>;
  inventories: Record<string, InventoryDto>;
  chest: InventoryDto;
  npcs: CharacterSummary[];
  inspirations: Record<string, Inspiration>;
}

export type DemoLocale = 'en' | 'pt';
