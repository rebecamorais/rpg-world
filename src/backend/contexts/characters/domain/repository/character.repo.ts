import { Character } from '../entity/Character';

export interface CharacterRepo {
  findById(id: string): Promise<Character | null>;
  /** Only who owns it, for ownership checks that don't need the character itself. */
  findOwnerId(id: string): Promise<string | null>;
  findByOwner(ownerUsername: string): Promise<Character[]>;
  save(character: Character): Promise<void>;
  delete(id: string): Promise<boolean>;
}
