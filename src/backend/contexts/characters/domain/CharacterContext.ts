import { Character } from './entity/Character';
import { DnD5eCharacter } from './entity/DnD5eCharacter';

export type CreateCharacterInput = {
  id?: string;
  name: string;
  ownerUsername: string;
  system?: string;
  class?: string;
  race?: string;
  level?: number;
};

export type CharacterUpdates = Record<string, unknown>;

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

  // Spells
  getSpells(
    id: string,
    locale?: string,
  ): Promise<
    Array<{ spellId: string; name: string; level: number; school: string; isPrepared: boolean }>
  >;
  toggleSpell(
    id: string,
    spellId: string,
    action: 'learn' | 'forget' | 'prepare' | 'unprepare',
  ): Promise<void>;
}
