import { Lore } from '../Lore';

export interface LoreRepository {
  findByCharacterId(id: string): Promise<Lore | null>;
  save(id: string, lore: Lore): Promise<void>;
  delete(id: string): Promise<void>;
}
