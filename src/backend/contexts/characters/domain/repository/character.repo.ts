import { Character, CharacterKind } from '../entity/Character';

export interface CharacterRepo {
  findById(id: string): Promise<Character | null>;
  /** Only who owns it, for ownership checks that don't need the character itself. */
  findOwnerId(id: string): Promise<string | null>;
  /** The owner's characters of one kind (pc by default), newest first. */
  findByOwner(ownerUsername: string, kind?: CharacterKind): Promise<Character[]>;
  save(character: Character): Promise<void>;
  /**
   * Writes the character only if its row is still at `character.rowVersion` (what was read). On
   * success sets the new `revision` and `rowVersion` on it and answers true; false when someone
   * wrote in between (or the character is gone).
   */
  saveIfUnchanged(character: Character): Promise<boolean>;
  delete(id: string): Promise<boolean>;
  /** Copies the owner's character (sheet, lore, spells; no avatar). Returns the copy's id. */
  duplicate(id: string, name: string): Promise<string>;
}
