import { Lore } from './Lore';

export interface LoreContext {
  getByCharacterId(characterId: string, requesterId: string): Promise<Lore | null>;
  save(characterId: string, requesterId: string, lore: Lore): Promise<void>;
  delete(characterId: string, requesterId: string): Promise<void>;
  /** Read only, for the GM of a party the character was brought to. */
  getForPartyGm(partyId: string, characterId: string, gmId: string): Promise<Lore | null>;
}
