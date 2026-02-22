import { Character } from '../entity/Character';

export interface CharacterRepo {
  findById(id: string): Promise<Character | null>;
  findByOwner(ownerUsername: string): Promise<Character[]>;
  save(character: Character): Promise<void>;
  delete(id: string): Promise<boolean>;
}
