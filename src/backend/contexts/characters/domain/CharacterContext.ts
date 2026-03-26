import { CreateCharacterInput } from '../application/create-character/create-character.use-case';
import { CharacterUpdates } from '../application/update-character/update-character.use-case';
import { Character } from './entity/Character';
import { DnD5eCharacter } from './entity/DnD5eCharacter';

export interface CharacterContext {
  getById(id: string): Promise<Character>;
  getByOwner(ownerUsername: string): Promise<Character[]>;
  create(data: CreateCharacterInput): Promise<DnD5eCharacter>;
  update({
    id,
    ownerUsername,
    updates,
  }: {
    id: string;
    ownerUsername: string;
    updates: CharacterUpdates;
  }): Promise<DnD5eCharacter>;
  delete(id: string, ownerUsername: string): Promise<boolean>;
  uploadAvatar(id: string, userId: string, file: Blob): Promise<string>;
}
