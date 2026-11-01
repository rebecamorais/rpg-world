import { Character } from '../domain/entity/Character';
import { DnD5eCharacter } from '../domain/entity/DnD5eCharacter';
import { CharacterSpellRelation } from '../domain/repository/character-spell.repo';
import { CreateCharacterInput } from './create-character/create-character.use-case';
import { ToggleSpellAction } from './spells/toggle-character-spell.use-case';
import { CharacterUpdates } from './update-character/update-character.use-case';

export type { CharacterUpdates, CreateCharacterInput };

/** Operations the characters context exposes to the interface layer. */
export interface CharacterContext {
  getById(id: string, requesterId: string): Promise<Character>;
  getByOwner(ownerUsername: string): Promise<Character[]>;
  create(data: CreateCharacterInput): Promise<DnD5eCharacter>;
  update(input: {
    id: string;
    ownerUsername: string;
    updates: CharacterUpdates;
  }): Promise<DnD5eCharacter>;
  delete(id: string, ownerUsername: string): Promise<boolean>;
  uploadAvatar(id: string, userId: string, file: Blob): Promise<string>;
  isOwner(id: string, userId: string): Promise<boolean>;

  // Spells
  getSpells(id: string, requesterId: string, locale?: string): Promise<CharacterSpellRelation[]>;
  toggleSpell(
    id: string,
    requesterId: string,
    spellId: string,
    action: ToggleSpellAction,
    locale?: string,
  ): Promise<CharacterSpellRelation | null>;

  // Read only, for the GM of a party the character was brought to
  getForPartyGm(partyId: string, id: string, gmId: string): Promise<Character>;
  getSpellsForPartyGm(
    partyId: string,
    id: string,
    gmId: string,
    locale?: string,
  ): Promise<CharacterSpellRelation[]>;
}
