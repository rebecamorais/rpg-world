import { Lore } from './Lore';

export interface LoreContext {
  getByCharacterId(characterId: string): Promise<Lore | null>;
  save(id: string, lore: Lore): Promise<void>;
  delete(id: string): Promise<void>;
}
